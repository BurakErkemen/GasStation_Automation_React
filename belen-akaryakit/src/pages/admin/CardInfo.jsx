import { useEffect, useState } from "react";
import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { monthlyBankSummary } from "../../utils/cardSummary";

const empty = { bankName: "", company: "", agreement: "", commissionRate: "", settlementDays: "0", active: true };
const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";
function bankError(error) {
  const code = error?.code || "unknown";
  if (code === "permission-denied") return "Firebase banka anlaşmalarına erişimi reddetti (permission-denied). Firestore kurallarında cardAgreements koleksiyonuna yönetici okuma/yazma izni tanımlanmalı.";
  if (code === "unauthenticated") return "Oturum doğrulanamadı. Yeniden giriş yapın (unauthenticated).";
  if (code === "unavailable") return "Firebase bağlantısı kurulamadı. İnternet bağlantısını kontrol edip tekrar deneyin (unavailable).";
  return `Banka işlemi tamamlanamadı (${code}): ${error?.message || "Bilinmeyen hata"}`;
}

export default function CardInfo() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("summary");
  const [shifts, setShifts] = useState([]);
  const [month, setMonth] = useState(() => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" }).format(new Date()));
  useEffect(() => {
    Promise.all([getDocs(collection(db, "cardAgreements")), getDocs(collection(db, "shifts")), getDocs(collection(db, "marketShifts"))]).then(([banks, records, market]) => {
      setItems(banks.docs.map(d => ({ ...d.data(), id: d.id })));
      setShifts([...records.docs.map(d => ({ ...d.data(), id: d.id, source: "fuel" })), ...market.docs.map(d => ({ ...d.data(), id: d.id, source: "market" }))]);
    }).catch(err => { console.error("Banka işlemleri yükleme hatası:", err); setLoadError(bankError(err)); }).finally(() => setLoading(false));
  }, []);
  const field = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setError(""); setSuccess("");
    const commissionRate = Number(form.commissionRate);
    const settlementDays = Number(form.settlementDays);
    if (!form.bankName.trim() || form.commissionRate === "" || !Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100 || !Number.isInteger(settlementDays) || settlementDays < 0) {
      setError("Banka adı, 0–100 arasında komisyon oranı ve geçerli valör günü girin."); return;
    }
    setSaving(true);
    try {
      const payload = { bankName: form.bankName.trim(), company: form.company || "", agreement: form.agreement || "", active: Boolean(form.active), commissionRate, settlementDays, updatedAt: serverTimestamp() };
      let id = editId;
      if (id) await updateDoc(doc(db, "cardAgreements", id), payload);
      else id = (await addDoc(collection(db, "cardAgreements"), { ...payload, createdAt: serverTimestamp() })).id;
      setItems(prev => [...prev.filter(item => item.id !== id), { ...payload, id }]);
      setForm(empty); setEditId(null);
      setSuccess("Banka anlaşması kaydedildi.");
    } catch (err) { console.error("Banka anlaşması kaydetme hatası:", err); setError(bankError(err)); }
    finally { setSaving(false); }
  }
  return <div>
    <h1 className="font-condensed font-black text-3xl text-gray-800">Banka İşlemleri</h1>
    <p className="text-sm text-gray-500 mt-1 mb-6">Anlaşmalı bankalar, POS firmaları ve komisyon koşulları. Her anlaşma ayrı kaydedilebilir.</p>
    {error && <p role="alert" className="text-red-600 mb-4">{error}</p>}
    {loadError && <p role="alert" className="text-red-600 mb-4">{loadError}</p>}
    {success && <p role="status" className="text-green-600 mb-4">{success}</p>}
    <div className="flex gap-2 mb-6">{[["summary", "Aylık Gelir / Gider"], ["agreements", "Bankalar ve Anlaşmalar"]].map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-lg text-sm ${tab === key ? "bg-opblue text-white" : "bg-white border border-gray-200"}`}>{label}</button>)}</div>
    {tab === "summary" ? <BankDashboard shifts={shifts} items={items} month={month} setMonth={setMonth} loading={loading} error={loadError} /> : <>
    <form onSubmit={save} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid sm:grid-cols-2 gap-4">
      {[["bankName", "Banka adı", "text"], ["company", "Firma / POS sağlayıcısı", "text"], ["commissionRate", "Komisyon (%)", "number"], ["settlementDays", "Valör (gün)", "number"]].map(([key, label, type]) => <label key={key} className="text-sm text-gray-600">{label}<input className={inputClass} type={type} required={key !== "company"} min="0" max={key === "commissionRate" ? "100" : undefined} step={key === "commissionRate" ? "0.01" : "1"} value={form[key]} onChange={e => field(key, e.target.value)} /></label>)}
      <label className="sm:col-span-2 text-sm text-gray-600">Anlaşma koşulları / firma kampanyaları<textarea className={inputClass} value={form.agreement} onChange={e => field("agreement", e.target.value)} /></label>
      <label className="text-sm"><input type="checkbox" checked={form.active} onChange={e => field("active", e.target.checked)} /> Aktif anlaşma</label>
      <div className="flex gap-3 justify-end"><button type="button" onClick={() => { setForm(empty); setEditId(null); }} className="text-gray-500">Temizle</button><button disabled={saving} className="bg-opblue text-white px-4 py-2 rounded-lg">{saving ? "Kaydediliyor…" : editId ? "Güncelle" : "Anlaşma Ekle"}</button></div>
    </form>
    {loading ? <p>Yükleniyor…</p> : items.length === 0 ? <p className="text-gray-500">Henüz banka anlaşması yok.</p> : <div className="grid md:grid-cols-2 gap-4">{items.map(item => <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex justify-between"><h2 className="font-bold">{item.bankName}</h2><button className="text-opblue text-sm" onClick={() => { setForm({ ...empty, ...item }); setEditId(item.id); }}>Düzenle</button></div>
      <p className="text-sm text-gray-500">{item.company || "Firma belirtilmedi"} · {item.active ? "Aktif" : "Pasif"}</p>
      <p className="mt-2">Komisyon %{item.commissionRate} · Valör {item.settlementDays} gün</p>
      <p className="text-sm text-gray-500 whitespace-pre-wrap mt-2">{item.agreement}</p>
    </div>)}</div>}
    </>}
  </div>;
}

function BankDashboard({ shifts, items, month, setMonth, loading, error }) {
  const [source, setSource] = useState("all");
  const report = monthlyBankSummary(source === "all" ? shifts : shifts.filter(s => s.source === source), items, month);
  const fmt = value => Number(value || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <div>
    <label className="text-sm text-gray-600 block mb-4">Rapor ayı<input type="month" required className="block border border-gray-200 rounded-lg p-2 mt-1" value={month} onChange={e => { if (e.target.value) setMonth(e.target.value); }} /></label>
    <label className="text-sm text-gray-600 block mb-4">Satış kaynağı<select className="block border border-gray-200 rounded-lg p-2 mt-1" value={source} onChange={e => setSource(e.target.value)}><option value="all">Akaryakıt ve Market</option><option value="fuel">Akaryakıt</option><option value="market">Market</option></select></label>
    {loading ? <p>Yükleniyor…</p> : error ? <p className="text-gray-500">Banka raporu için veriler yüklenemedi.</p> : <>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">{[["POS Geliri (Brüt)", report.totals.gross, "text-opblue"], ["Komisyon Gideri", report.totals.fee, "text-red-500"], ["Net Gelir", report.totals.net, "text-green-600"]].map(([label, value, color]) => <div key={label} className="bg-white border border-gray-200 rounded-xl p-5"><p className="text-xs text-gray-500">{label}</p><p className={`text-2xl font-bold mt-2 ${color}`}>₺{fmt(value)}</p></div>)}</div>
      <p className="text-sm text-gray-500 mb-4">Gelir, vardiyalarda girilen POS gün sonu toplamıdır. Gider, vardiyada kayıtlı banka komisyon oranından hesaplanır.</p>
      {report.unassigned > 0 && <p className="text-sm text-orange mb-4">Banka seçilmeden kaydedilen eski POS tutarı: ₺{fmt(report.unassigned)}. Bu tutar banka özetlerine dahil edilmedi.</p>}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr>{["Banka / Firma", "Brüt Gelir", "Komisyon Gideri", "Net Gelir"].map(label => <th key={label} className="p-4">{label}</th>)}</tr></thead><tbody>{report.rows.map(row => <tr key={row.id} className="border-t border-gray-100"><td className="p-4"><p className="font-semibold">{row.name}</p><p className="text-xs text-gray-500">{row.company}{row.active ? "" : " · Pasif"}</p></td><td className="p-4">₺{fmt(row.gross)}</td><td className="p-4 text-red-500">₺{fmt(row.fee)}</td><td className="p-4 text-green-600">₺{fmt(row.net)}</td></tr>)}</tbody></table>{report.rows.length === 0 && <p className="p-5 text-gray-500">Henüz banka eklenmemiş. Bankalar ve Anlaşmalar sekmesinden ekleyebilirsiniz.</p>}</div>
    </>}
  </div>;
}
