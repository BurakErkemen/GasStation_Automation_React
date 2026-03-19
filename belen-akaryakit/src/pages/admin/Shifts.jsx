import { useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, doc,
  updateDoc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { exportShiftToExcel } from "../../utils/shiftExport";
import { printShift } from "../../utils/shiftPrint";

const PERIODS = ["00-08", "08-16", "16-24"];
const FUELS = ["benzin", "dizel", "eurodiesel", "lpg"];
const FUEL_LABELS = {
  benzin: "Benzin",
  dizel: "Dizel",
  eurodiesel: "Eurodiesel",
  lpg: "LPG"
};

function calcSummary(shift) {
  const fuelTotal = FUELS.reduce(
    (s, f) => s + (Number(shift.fuelSales?.[f]?.amount) || 0),
    0
  );

  const fuelLiters = FUELS.reduce(
    (s, f) => s + (Number(shift.fuelSales?.[f]?.liters) || 0),
    0
  );

  const totalPosReport = Number(shift.sales?.card) || 0;

  const collectedCard = (shift.debtCollections || [])
    .filter(c => c.method === "card")
    .reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const collectedCash = (shift.debtCollections || [])
    .filter(c => c.method === "cash")
    .reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const fuelCardSales = totalPosReport - collectedCard;

  const otobilTotal = (shift.sales?.otobil || [])
    .reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const creditTotal = (shift.creditSales || [])
    .reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const calculatedCashSales = fuelTotal - (fuelCardSales + creditTotal + otobilTotal);

  const expenses = (shift.cash?.expenses || [])
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const opening = Number(shift.cash?.opening) || 0;
  const closing = Number(shift.cash?.closing) || 0;

  const expectedCash = opening + calculatedCashSales + collectedCash - expenses;
  const cashDiff = closing - expectedCash;

  const expectedBank = fuelCardSales + collectedCard;

  return {
    fuelTotal,
    fuelLiters,
    cashSales: calculatedCashSales,
    cardSales: totalPosReport,
    fuelCardSales,
    otobilTotal,
    creditTotal,
    expenses,
    collectedCash,
    collectedCard,
    opening,
    closing,
    expectedCash,
    cashDiff,
    expectedBank
  };
}

const emptyShift = {
  date: new Date().toISOString().split("T")[0],
  period: "08-16",
  status: "open",
  employees: [],
  fuelSales: {
    benzin: { liters: "", amount: "" },
    dizel: { liters: "", amount: "" },
    eurodiesel: { liters: "", amount: "" },
    lpg: { liters: "", amount: "" }
  },
  sales: { cash: "", card: "", otobil: [] },
  creditSales: [],
  debtCollections: [],
  cash: { opening: "", expenses: [], closing: "" }
};

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue transition-colors w-full"
    />
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-6">
      <div className="w-1 h-5 bg-opblue rounded" />
      <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wide">
        {children}
      </h3>
    </div>
  );
}

function AddRowBtn({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 text-xs font-semibold text-opblue border border-opblue/30 rounded-lg px-3 py-1.5 hover:bg-opblue/5 transition-colors w-full sm:w-auto"
    >
      + {label}
    </button>
  );
}

function RemoveBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-red-400 hover:text-red-600 px-2 py-2 rounded hover:bg-red-50 transition-colors flex-shrink-0"
    >
      ✕
    </button>
  );
}

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [view, setView] = useState("list");
  const [form, setForm] = useState(emptyShift);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { setSummary(calcSummary(form)); }, [form]);

  async function loadAll() {
    const [sSnap, eSnap, cSnap] = await Promise.all([
      getDocs(query(collection(db, "shifts"), orderBy("date", "desc"))),
      getDocs(collection(db, "employees")),
      getDocs(collection(db, "customers"))
    ]);
    setShifts(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setEmployees(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCustomers(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  function openNew() {
    setForm(emptyShift);
    setEditId(null);
    setView("new");
  }

  function openEdit(shift) {
    setForm({ ...shift });
    setEditId(shift.id);
    setView("edit");
  }

  async function handleSave() {
    if (form.employees.length === 0) {
      alert("Lütfen en az bir çalışan seçin.");
      return;
    }

    setSaving(true);
    const finalSummary = calcSummary(form);
    const payload = {
      ...form,
      summary: finalSummary,
      updatedAt: serverTimestamp()
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "shifts", editId), payload);
      } else {
        await addDoc(collection(db, "shifts"), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setView("list");
      await loadAll();
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      alert("Veritabanına kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  function sf(path, val) {
    setForm(prev => {
      const next = structuredClone(prev);
      path.reduce((o, k, i) => (i === path.length - 1 ? (o[k] = val) : o[k]), next);
      return next;
    });
  }

  function updateRow(arrPath, idx, key, val) {
    setForm(prev => {
      const next = structuredClone(prev);
      const arr = arrPath.reduce((o, k) => o[k], next);
      arr[idx][key] = val;
      return next;
    });
  }

  function addRow(arrPath, template) {
    setForm(prev => {
      const next = structuredClone(prev);
      const arr = arrPath.reduce((o, k) => o[k], next);
      arr.push({ ...template });
      return next;
    });
  }

  function removeRow(arrPath, idx) {
    setForm(prev => {
      const next = structuredClone(prev);
      const arr = arrPath.reduce((o, k) => o[k], next);
      arr.splice(idx, 1);
      return next;
    });
  }

  function toggleEmp(id) {
    setForm(prev => ({
      ...prev,
      employees: prev.employees.includes(id)
        ? prev.employees.filter(e => e !== id)
        : [...prev.employees, id]
    }));
  }

  if (view === "list") {
    return (
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
              Vardiyalar
            </h1>
            <p className="text-sm text-gray-500 mt-1">Tüm vardiya kayıtları</p>
          </div>
          <button
            onClick={openNew}
            className="bg-opblue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            + Yeni Vardiya
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Tarih</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Vardiya</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Çalışanlar</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Toplam Satış</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Kasa Farkı</th>
                  <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Durum</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {shifts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                      Henüz vardiya kaydı yok.
                    </td>
                  </tr>
                )}
                {shifts.map(s => {
                  const sum = s.summary || calcSummary(s);
                  const empNames = (s.employees || [])
                    .map(id => employees.find(e => e.id === id)?.name || id)
                    .join(", ");

                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{s.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-opblue/10 text-opblue text-xs font-bold px-2 py-1 rounded">
                          {s.period}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{empNames || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                        ₺{Number(sum.fuelTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                          sum.cashDiff > 0
                            ? "text-green-600"
                            : sum.cashDiff < 0
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        {sum.cashDiff > 0 ? "+" : ""}
                        {Number(sum.cashDiff || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded ${
                            s.status === "open"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {s.status === "open" ? "Açık" : "Kapalı"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                          <button
                            onClick={() => exportShiftToExcel(s, employees)}
                            className="text-xs text-green-600 font-semibold hover:underline text-left sm:text-right"
                          >
                            Excel
                          </button>
                          <button
                            onClick={() => printShift(s, employees, s.summary || calcSummary(s))}
                            className="text-xs text-gray-500 font-semibold hover:underline text-left sm:text-right"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            className="text-xs text-opblue font-semibold hover:underline text-left sm:text-right"
                          >
                            Düzenle
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
            {editId ? "Vardiya Düzenle" : "Yeni Vardiya"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {editId
              ? "Mevcut vardiya bilgilerini güncelleyin."
              : "Yeni vardiya kaydı oluşturun."}
          </p>
        </div>
        <button
          onClick={() => setView("list")}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          ← Geri
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <SectionTitle>Temel Bilgiler</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Tarih">
              <Input
                type="date"
                value={form.date}
                onChange={e => sf(["date"], e.target.value)}
              />
            </Field>
            <Field label="Vardiya">
              <select
                value={form.period}
                onChange={e => sf(["period"], e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full"
              >
                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Durum">
              <select
                value={form.status}
                onChange={e => sf(["status"], e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full"
              >
                <option value="open">Açık</option>
                <option value="closed">Kapalı</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <SectionTitle>Vardiyadaki Çalışanlar</SectionTitle>
          {employees.length === 0 ? (
            <p className="text-xs text-gray-400">Önce çalışan ekleyin.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {employees.map(e => {
                const active = form.employees.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleEmp(e.id)}
                    className={`text-sm px-4 py-2 rounded-lg border font-medium transition-colors w-full sm:w-auto ${
                      active
                        ? "bg-opblue text-white border-opblue"
                        : "border-gray-200 text-gray-600 hover:border-opblue/40"
                    }`}
                  >
                    {e.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <SectionTitle>Yakıt Satışları</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FUELS.map(f => (
              <div key={f} className="border border-gray-100 rounded-lg p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  {FUEL_LABELS[f]}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Litre">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={form.fuelSales[f].liters}
                      onChange={e => sf(["fuelSales", f, "liters"], e.target.value)}
                    />
                  </Field>
                  <Field label="Tutar (₺)">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={form.fuelSales[f].amount}
                      onChange={e => sf(["fuelSales", f, "amount"], e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <SectionTitle>Ödeme Kırılımı</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Hesaplanan Nakit Satış</p>
              <p className="text-lg font-bold text-gray-700">
                ₺{summary?.cashSales.toLocaleString("tr-TR")}
              </p>
              <p className="text-[9px] text-gray-400">Pompa - (Kart + Veresiye + Otobil)</p>
            </div>

            <Field label="Kredi Kartı Satış (₺)">
              <Input
                type="number"
                placeholder="Sadece Yakıt Slipleri"
                value={form.sales.card}
                onChange={e => sf(["sales", "card"], e.target.value)}
              />
            </Field>

            <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
              <p className="text-[10px] font-bold text-sky-600 uppercase">Beklenen Banka Toplamı</p>
              <p className="text-lg font-bold text-sky-700">
                ₺{summary?.expectedBank.toLocaleString("tr-TR")}
              </p>
              <p className="text-[9px] text-sky-500">Kartlı Satış + Kartlı Tahsilat</p>
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Otobil Satışları
          </p>
          {(form.sales.otobil || []).map((o, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 mb-3 items-end border border-gray-100 rounded-lg p-3"
            >
              <Field label="Fiş No">
                <Input
                  placeholder="Fiş no"
                  value={o.fisNo}
                  onChange={e => updateRow(["sales", "otobil"], i, "fisNo", e.target.value)}
                />
              </Field>
              <Field label="Plaka">
                <Input
                  placeholder="31 ABC 123"
                  value={o.plate || ""}
                  onChange={e => updateRow(["sales", "otobil"], i, "plate", e.target.value.toUpperCase())}
                />
              </Field>
              <Field label="Litre">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={o.liters}
                  onChange={e => updateRow(["sales", "otobil"], i, "liters", e.target.value)}
                />
              </Field>
              <Field label="Tutar (₺)">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={o.amount}
                  onChange={e => updateRow(["sales", "otobil"], i, "amount", e.target.value)}
                />
              </Field>
              <Field label="Not">
                <div className="flex gap-1">
                  <Input
                    placeholder="Not"
                    value={o.note}
                    onChange={e => updateRow(["sales", "otobil"], i, "note", e.target.value)}
                  />
                  <RemoveBtn onClick={() => removeRow(["sales", "otobil"], i)} />
                </div>
              </Field>
            </div>
          ))}
          <AddRowBtn
            onClick={() =>
              addRow(["sales", "otobil"], {
                fisNo: "",
                plate: "",
                liters: "",
                amount: "",
                note: ""
              })
            }
            label="Otobil Satış Ekle"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <SectionTitle>Veresiye Satışlar</SectionTitle>
          {(form.creditSales || []).map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-2 mb-3 items-end border border-gray-100 rounded-lg p-3"
            >
              <Field label="Müşteri">
                <select
                  value={c.customerId}
                  onChange={e => {
                    const cust = customers.find(x => x.id === e.target.value);
                    updateRow(["creditSales"], i, "customerId", e.target.value);
                    updateRow(["creditSales"], i, "customerName", cust?.name || "");
                    updateRow(["creditSales"], i, "plate", cust?.plate || "");
                  }}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full"
                >
                  <option value="">Seç</option>
                  {customers.map(cu => (
                    <option key={cu.id} value={cu.id}>
                      {cu.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Plaka">
                <Input
                  placeholder="31 ABC 123"
                  value={c.plate || ""}
                  onChange={e => updateRow(["creditSales"], i, "plate", e.target.value.toUpperCase())}
                />
              </Field>

              <Field label="Fiş No">
                <Input
                  placeholder="Fiş no"
                  value={c.fisNo}
                  onChange={e => updateRow(["creditSales"], i, "fisNo", e.target.value)}
                />
              </Field>

              <Field label="Litre">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={c.liters}
                  onChange={e => updateRow(["creditSales"], i, "liters", e.target.value)}
                />
              </Field>

              <Field label="Tutar (₺)">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={c.amount}
                  onChange={e => updateRow(["creditSales"], i, "amount", e.target.value)}
                />
              </Field>

              <Field label="Not">
                <Input
                  placeholder="Not"
                  value={c.note}
                  onChange={e => updateRow(["creditSales"], i, "note", e.target.value)}
                />
              </Field>

              <div className="flex items-end">
                <RemoveBtn onClick={() => removeRow(["creditSales"], i)} />
              </div>
            </div>
          ))}
          <AddRowBtn
            onClick={() =>
              addRow(["creditSales"], {
                customerId: "",
                customerName: "",
                plate: "",
                fisNo: "",
                liters: "",
                amount: "",
                note: ""
              })
            }
            label="Veresiye Ekle"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <SectionTitle>Veresiye Tahsilatlar</SectionTitle>
          {(form.debtCollections || []).map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 mb-3 items-end border border-gray-100 rounded-lg p-3"
            >
              <Field label="Müşteri">
                <select
                  value={c.customerId}
                  onChange={e => {
                    const cust = customers.find(x => x.id === e.target.value);
                    updateRow(["debtCollections"], i, "customerId", e.target.value);
                    updateRow(["debtCollections"], i, "customerName", cust?.name || "");
                  }}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full"
                >
                  <option value="">Seç</option>
                  {customers.map(cu => (
                    <option key={cu.id} value={cu.id}>
                      {cu.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fiş No">
                <Input
                  placeholder="Fiş no"
                  value={c.fisNo}
                  onChange={e => updateRow(["debtCollections"], i, "fisNo", e.target.value)}
                />
              </Field>

              <Field label="Tutar (₺)">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={c.amount}
                  onChange={e => updateRow(["debtCollections"], i, "amount", e.target.value)}
                />
              </Field>

              <Field label="Yöntem">
                <select
                  value={c.method}
                  onChange={e => updateRow(["debtCollections"], i, "method", e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full"
                >
                  <option value="cash">Nakit</option>
                  <option value="card">Kredi Kartı</option>
                </select>
              </Field>

              <Field label="Not">
                <div className="flex gap-1">
                  <Input
                    placeholder="Not"
                    value={c.note}
                    onChange={e => updateRow(["debtCollections"], i, "note", e.target.value)}
                  />
                  <RemoveBtn onClick={() => removeRow(["debtCollections"], i)} />
                </div>
              </Field>
            </div>
          ))}
          <AddRowBtn
            onClick={() =>
              addRow(["debtCollections"], {
                customerId: "",
                customerName: "",
                fisNo: "",
                amount: "",
                method: "cash",
                note: ""
              })
            }
            label="Tahsilat Ekle"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <SectionTitle>Kasa</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Vardiya Başı Nakit (₺)">
              <Input
                type="number"
                placeholder="0.00"
                value={form.cash.opening}
                onChange={e => sf(["cash", "opening"], e.target.value)}
              />
            </Field>
            <Field label="Vardiya Sonu Sayım (₺)">
              <Input
                type="number"
                placeholder="0.00"
                value={form.cash.closing}
                onChange={e => sf(["cash", "closing"], e.target.value)}
              />
            </Field>
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Ek Harcamalar
          </p>
          {(form.cash.expenses || []).map((e, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 items-end border border-gray-100 rounded-lg p-3"
            >
              <Field label="Açıklama">
                <Input
                  placeholder="Harcama açıklaması"
                  value={e.description}
                  onChange={ev => updateRow(["cash", "expenses"], i, "description", ev.target.value)}
                />
              </Field>
              <Field label="Tutar (₺)">
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={e.amount}
                    onChange={ev => updateRow(["cash", "expenses"], i, "amount", ev.target.value)}
                  />
                  <RemoveBtn onClick={() => removeRow(["cash", "expenses"], i)} />
                </div>
              </Field>
            </div>
          ))}
          <AddRowBtn
            onClick={() => addRow(["cash", "expenses"], { description: "", amount: "" })}
            label="Harcama Ekle"
          />
        </div>

        {summary && (
          <div className="bg-navy border border-white/5 rounded-xl p-4 sm:p-6">
            <SectionTitle>
              <span className="text-white">Gün Sonu Özeti (Otomatik)</span>
            </SectionTitle>

            {(() => {
              const breakdownTotal =
                summary.fuelCardSales +
                summary.creditTotal +
                summary.otobilTotal +
                summary.cashSales;

              const diff = summary.fuelTotal - breakdownTotal;

              if (Math.abs(diff) < 0.01) return null;

              return (
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg mb-4">
                  <p className="text-orange-700 text-xs font-bold uppercase tracking-tight">
                    ⚠️ Ödeme Kırılımları Kontrolü
                  </p>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 mt-1 text-sm text-orange-600">
                    <span>Pompa: ₺{summary.fuelTotal.toLocaleString()}</span>
                    <span>Kırılım: ₺{breakdownTotal.toLocaleString()}</span>
                    <span className="font-bold underline">Fark: ₺{diff.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-orange-500 mt-1 italic">
                    * Kredi kartı tahsilatları pompa toplamından otomatik düşülerek hesaplanmıştır.
                  </p>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: "Pompa Toplamı", value: summary.fuelTotal, color: "text-white", note: "Girilen toplam" },
                { label: "Nakit Satış", value: summary.cashSales, color: "text-green-400", note: "Kasaya girmeli" },
                { label: "Kredi Kartı", value: summary.cardSales, color: "text-sky-300", note: "Bankada" },
                { label: "Otobil", value: summary.otobilTotal, color: "text-purple-300", note: "Sistemde" },
                { label: "Veresiye", value: summary.creditTotal, color: "text-orange", note: "Müşteride" },
                { label: "Harcamalar", value: summary.expenses, color: "text-red-400", note: "Kasadan çıktı" },
                { label: "Tahsilat Nakit", value: summary.collectedCash, color: "text-green-300", note: "Kasaya eklendi" },
                { label: "Tahsilat Kart", value: summary.collectedCard, color: "text-sky-200", note: "Karta eklendi" },
                { label: "Vardiya Başı", value: summary.opening, color: "text-white/70", note: "Açılış kasası" },
                { label: "Vardiya Sonu", value: summary.closing, color: "text-white/70", note: "Sayılan" },
                { label: "Olması Gereken", value: summary.expectedCash, color: "text-white", note: "Hesaplanan" },
                {
                  label: "Kasa Farkı",
                  value: summary.cashDiff,
                  color:
                    summary.cashDiff === 0
                      ? "text-white/50"
                      : summary.cashDiff > 0
                      ? "text-yellow-400"
                      : "text-red-400",
                  note:
                    summary.cashDiff === 0
                      ? "Dengede"
                      : summary.cashDiff > 0
                      ? "Fazla"
                      : "Eksik"
                }
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                    {s.label}
                  </p>
                  <p className={`font-condensed font-black text-xl ${s.color} break-words`}>
                    {s.label === "Kasa Farkı" && s.value > 0 ? "+" : ""}
                    ₺{Number(s.value || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-white/30 mt-0.5">{s.note}</p>
                </div>
              ))}
            </div>

            {summary.cashDiff !== 0 && (
              <div
                className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
                  summary.cashDiff > 0
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {summary.cashDiff > 0
                  ? `⚠️ Kasada ₺${Math.abs(summary.cashDiff).toLocaleString("tr-TR", {
                      minimumFractionDigits: 2
                    })} fazla var. Kredi kartı fişi nakit sayılmış olabilir.`
                  : `⚠️ Kasada ₺${Math.abs(summary.cashDiff).toLocaleString("tr-TR", {
                      minimumFractionDigits: 2
                    })} eksik var.`}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-6">
          <button
            onClick={() => setView("list")}
            className="text-sm text-gray-500 border border-gray-200 px-5 py-2.5 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
          >
            İptal
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-opblue text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity w-full sm:w-auto"
          >
            {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Vardiya Kaydet"}
          </button>

          {editId && summary && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => exportShiftToExcel(form, employees)}
                className="flex items-center justify-center gap-2 text-sm text-green-700 border border-green-300 px-4 py-2.5 rounded-lg hover:bg-green-50 transition-colors w-full sm:w-auto"
              >
                📊 Excel İndir
              </button>
              <button
                type="button"
                onClick={() => printShift(form, employees, summary)}
                className="flex items-center justify-center gap-2 text-sm text-opblue border border-opblue/30 px-4 py-2.5 rounded-lg hover:bg-opblue/5 transition-colors w-full sm:w-auto"
              >
                🖨️ PDF / Yazdır
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}