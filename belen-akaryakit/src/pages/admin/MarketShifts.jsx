import { useEffect, useState } from "react";
import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { cardSummary } from "../../utils/cardSummary";

const periods = ["00-08", "08-16", "16-24"];
const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(new Date());
const freshForm = () => ({ date: today(), period: "08-16", status: "open", employees: [], sales: { cash: "", card: 0 }, cardPayments: [] });
const fmt = value => Number(value || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const input = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";
const failure = err => err.code === "permission-denied" ? "Market vardiyalarına erişim reddedildi. Firestore kurallarındaki marketShifts iznini yayınlayın." : `İşlem tamamlanamadı (${err.code || "unknown"}). Tekrar deneyin.`;

export default function MarketShifts() {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState(freshForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getDocs(collection(db, "marketShifts")), getDocs(collection(db, "employees")), getDocs(collection(db, "cardAgreements"))])
      .then(([records, people, agreements]) => {
        setShifts(records.docs.map(d => ({ ...d.data(), id: d.id })));
        setEmployees(people.docs.map(d => ({ ...d.data(), id: d.id })));
        setBanks(agreements.docs.map(d => ({ ...d.data(), id: d.id })));
      }).catch(err => setError(failure(err))).finally(() => setLoading(false));
  }, []);
  const cards = cardSummary(form);
  const cash = Number(form.sales.cash) || 0;
  const total = Math.round((cash + cards.gross) * 100) / 100;
  const month = today().slice(0, 7);
  const monthly = shifts.filter(s => s.date?.startsWith(month));
  function updateCard(index, values) {
    setForm(prev => ({ ...prev, cardPayments: prev.cardPayments.map((row, i) => i === index ? { ...row, ...values } : row) }));
  }
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    if (!form.date || !periods.includes(form.period) || !form.employees.length || !Number.isFinite(Number(form.sales.cash)) || Number(form.sales.cash) < 0 || form.sales.cash === "" || form.cardPayments.some(row => !row.agreementId || row.amount === "" || !Number.isFinite(Number(row.amount)) || Number(row.amount) < 0)) {
      setError("Tarih, çalışan, nakit tutarı ve banka satırlarını kontrol edin. Satış yoksa 0 girebilirsiniz."); return;
    }
    setSaving(true); setError("");
    try {
      const payload = { date: form.date, period: form.period, status: form.status, employees: form.employees, sales: { cash, card: cards.gross }, cardPayments: form.cardPayments, summary: { cashSales: cash, cardSales: cards.gross, totalSales: total, cardCommission: cards.fee, netBank: cards.net }, updatedAt: serverTimestamp() };
      let id = editing;
      if (id) await updateDoc(doc(db, "marketShifts", id), payload);
      else id = (await addDoc(collection(db, "marketShifts"), { ...payload, createdAt: serverTimestamp() })).id;
      setShifts(prev => [...prev.filter(s => s.id !== id), { ...payload, id }]);
      setShowForm(false); setEditing(null); setForm(freshForm());
    } catch (err) { setError(failure(err)); }
    finally { setSaving(false); }
  }
  return <div>
    <div className="flex justify-between flex-wrap gap-3 mb-6"><h1 className="font-condensed font-black text-3xl text-gray-800">Market Vardiyaları</h1><button disabled={loading || saving} className="bg-opblue text-white px-4 py-2 rounded-lg" onClick={() => { setForm(freshForm()); setEditing(null); setShowForm(true); }}>Yeni Market Vardiyası</button></div>
    {error && <p role="alert" className="text-red-600 mb-4">{error}</p>}
    {showForm ? <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <fieldset disabled={saving} className="space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="text-sm">Tarih<input className={input} type="date" required value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} /></label>
          <label className="text-sm">Vardiya<select className={input} value={form.period} onChange={e => setForm(prev => ({ ...prev, period: e.target.value }))}>{periods.map(p => <option key={p}>{p}</option>)}</select></label>
          <label className="text-sm">Durum<select className={input} value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}><option value="open">Açık</option><option value="closed">Kapalı</option></select></label>
        </div>
        <div><h2 className="font-bold mb-2">Vardiyadaki Çalışanlar</h2><div className="flex flex-wrap gap-3">{employees.map(person => <label key={person.id} className="text-sm"><input type="checkbox" checked={form.employees.includes(person.id)} onChange={e => setForm(prev => ({ ...prev, employees: e.target.checked ? [...prev.employees, person.id] : prev.employees.filter(id => id !== person.id) }))} /> {person.name}</label>)}</div>{employees.length === 0 && <p className="text-sm text-gray-500">Önce Çalışanlar ekranından çalışan ekleyin.</p>}</div>
        <label className="block text-sm">Nakit Satış (₺)<input className={input} type="number" min="0" step="0.01" required value={form.sales.cash} onChange={e => setForm(prev => ({ ...prev, sales: { ...prev.sales, cash: e.target.value } }))} /></label>
        <div><h2 className="font-bold mb-3">Kart / POS Gün Sonu</h2>{form.cardPayments.map((row, index) => <div key={index} className="grid sm:grid-cols-2 gap-3 mb-3 border border-gray-200 rounded-lg p-3">
          <label className="text-sm">Banka<select className={input} required value={row.agreementId} onChange={e => {
            const bank = banks.find(b => b.id === e.target.value);
            if (!bank) { updateCard(index, { agreementId: "", bankName: "", company: "", commissionRate: 0 }); return; }
            updateCard(index, { agreementId: bank.id, bankName: bank.bankName, company: bank.company || "", commissionRate: Number(bank.commissionRate) || 0, agreement: bank.agreement || "", settlementDays: Number(bank.settlementDays) || 0 });
          }}><option value="">Banka seçin</option>{row.agreementId && <option value={row.agreementId}>{row.bankName} · {row.company}</option>}{banks.filter(b => b.active && b.id !== row.agreementId).map(b => <option key={b.id} value={b.id}>{b.bankName} · {b.company}</option>)}</select></label>
          <label className="text-sm">POS Gün Sonu (₺)<div className="flex gap-2"><input className={input} type="number" min="0" step="0.01" required value={row.amount} onChange={e => updateCard(index, { amount: e.target.value })} /><button type="button" className="text-red-500" aria-label="Banka satırını kaldır" onClick={() => setForm(prev => ({ ...prev, cardPayments: prev.cardPayments.filter((_, i) => i !== index) }))}>Sil</button></div></label>
        </div>)}<button type="button" className="text-opblue text-sm" onClick={() => setForm(prev => ({ ...prev, cardPayments: [...prev.cardPayments, { agreementId: "", bankName: "", company: "", commissionRate: 0, amount: "" }] }))}>+ Banka / POS Ekle</button></div>
        <div className="bg-gray-50 rounded-lg p-4 text-sm">Nakit: ₺{fmt(cash)} · Kart: ₺{fmt(cards.gross)} · <strong>Toplam Satış: ₺{fmt(total)}</strong></div>
        <div className="flex justify-end gap-4"><button type="button" onClick={() => setShowForm(false)}>Vazgeç</button><button className="bg-opblue text-white rounded-lg px-4 py-2">{saving ? "Kaydediliyor…" : "Vardiyayı Kaydet"}</button></div>
      </fieldset>
    </form> : loading ? <p>Yükleniyor…</p> : <>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">{[["Bu Ay Nakit", monthly.reduce((s, row) => s + Number(row.sales?.cash || 0), 0)], ["Bu Ay Kart", monthly.reduce((s, row) => s + cardSummary(row).gross, 0)], ["Bu Ay Toplam Satış", monthly.reduce((s, row) => s + Number(row.sales?.cash || 0) + cardSummary(row).gross, 0)]].map(([label, value]) => <div key={label} className="bg-white border border-gray-200 rounded-xl p-5"><p className="text-sm text-gray-500">{label}</p><p className="font-bold text-2xl text-opblue">₺{fmt(value)}</p></div>)}</div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr>{["Tarih / Vardiya", "Çalışanlar", "Nakit", "Kart", "Toplam", "Durum", ""].map((label, i) => <th key={i} className="p-3">{label}</th>)}</tr></thead><tbody>{[...shifts].sort((a, b) => `${b.date} ${b.period}`.localeCompare(`${a.date} ${a.period}`)).map(shift => <tr key={shift.id} className="border-t border-gray-100"><td className="p-3">{shift.date} · {shift.period}</td><td className="p-3">{shift.employees.map(id => employees.find(e => e.id === id)?.name || id).join(", ")}</td><td className="p-3">₺{fmt(shift.sales?.cash)}</td><td className="p-3">₺{fmt(cardSummary(shift).gross)}</td><td className="p-3 font-bold">₺{fmt(Number(shift.sales?.cash || 0) + cardSummary(shift).gross)}</td><td className="p-3">{shift.status === "open" ? "Açık" : "Kapalı"}</td><td className="p-3"><button className="text-opblue" onClick={() => { setForm({ ...freshForm(), ...shift }); setEditing(shift.id); setShowForm(true); }}>Düzenle</button></td></tr>)}</tbody></table>{shifts.length === 0 && <p className="p-5 text-gray-500">Henüz market vardiyası yok.</p>}</div>
    </>}
  </div>;
}
