import { useState, useEffect, useRef } from "react";
import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, serverTimestamp,
  query, orderBy
} from "firebase/firestore";
import { db } from "../../lib/firebase";

// ── Yardımcı bileşenler ───────────────────────────────
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
      {children}
    </div>
  );
}
function Input({ ...props }) {
  return <input {...props}
    className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue transition-colors w-full" />;
}
function Textarea({ ...props }) {
  return <textarea {...props}
    className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue transition-colors w-full resize-none" />;
}
function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-5 bg-opblue rounded" />
      <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wide">{children}</h3>
    </div>
  );
}
function AddRowBtn({ onClick, label }) {
  return (
    <button type="button" onClick={onClick}
      className="mt-2 text-xs font-semibold text-opblue border border-opblue/30 rounded-lg px-3 py-1.5 hover:bg-opblue/5 w-full sm:w-auto">
      + {label}
    </button>
  );
}
function RemoveBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 flex-shrink-0">
      ✕
    </button>
  );
}

// ── Hesaplamalar ──────────────────────────────────────
function calcInvoice(items, kdvRate) {
  const subtotal = items.reduce((s, i) =>
    s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);
  const kdv = subtotal * ((Number(kdvRate) || 0) / 100);
  const total = subtotal + kdv;
  return { subtotal, kdv, total };
}

// ── Boş form ──────────────────────────────────────────
function emptyForm(invoiceNo) {
  return {
    invoiceNo,
    date: new Date().toISOString().split("T")[0],
    customerId: "",
    customerName: "",
    status: "pending",
    kdvRate: 20,
    items: [{ description: "", qty: "", price: "", unit: "Adet" }],
    notes: "",
  };
}

const UNITS = ["Adet", "Litre", "Kg", "Hizmet"];

// ── PDF Baskı stili ───────────────────────────────────
const printStyles = `
  @media print {
    body * { visibility: hidden !important; }
    #invoice-print, #invoice-print * { visibility: visible !important; }
    #invoice-print {
      position: fixed !important;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: white;
      padding: 40px;
      font-family: sans-serif;
      color: #111;
    }
    .no-print { display: none !important; }
  }
`;

// ── Ana bileşen ───────────────────────────────────────
export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [view, setView] = useState("list");
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [iSnap, cSnap] = await Promise.all([
      getDocs(query(collection(db, "invoices"), orderBy("date", "desc"))),
      getDocs(collection(db, "customers")),
    ]);
    setInvoices(iSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCustomers(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  function nextInvoiceNo() {
    if (invoices.length === 0) return "FTR-001";
    const nums = invoices
      .map(i => parseInt(i.invoiceNo?.replace(/\D/g, "") || "0"))
      .filter(n => !isNaN(n));
    const max = Math.max(...nums, 0);
    return `FTR-${String(max + 1).padStart(3, "0")}`;
  }

  function openNew() { setForm(emptyForm(nextInvoiceNo())); setEditId(null); setView("form"); }
  function openEdit(inv) { setForm({ ...inv }); setEditId(inv.id); setView("form"); }
  function openDetail(inv) { setDetailId(inv.id); setView("detail"); }

  async function handleSave() {
    setSaving(true);
    const calc = calcInvoice(form.items, form.kdvRate);
    const payload = { ...form, ...calc, updatedAt: serverTimestamp() };
    try {
      if (editId) {
        await updateDoc(doc(db, "invoices", editId), payload);
      } else {
        await addDoc(collection(db, "invoices"), { ...payload, createdAt: serverTimestamp() });
      }
      await loadAll();
      setView("list");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Faturayı silmek istediğinize emin misiniz?")) return;
    await deleteDoc(doc(db, "invoices", id));
    await loadAll();
    setView("list");
  }

  async function toggleStatus(inv) {
    const newStatus = inv.status === "paid" ? "pending" : "paid";
    await updateDoc(doc(db, "invoices", inv.id), { status: newStatus, updatedAt: serverTimestamp() });
    await loadAll();
  }

  function sf(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  function updateItem(idx, key, val) {
    setForm(prev => {
      const next = structuredClone(prev);
      next.items[idx][key] = val;
      return next;
    });
  }
  function addItem() { setForm(prev => ({ ...prev, items: [...prev.items, { description: "", qty: "", price: "", unit: "Adet" }] })); }
  function removeItem(idx) { setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) })); }

  const fmt = (n) => Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNo?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || inv.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + (Number(i.total) || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (Number(i.total) || 0), 0);

  // ── FORM ──────────────────────────────────────────
  if (view === "form" && form) {
    const calc = calcInvoice(form.items, form.kdvRate);
    return (
      <div className="max-w-3xl w-full">
        <style>{printStyles}</style>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
              {editId ? "Fatura Düzenle" : "Yeni Fatura"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Fatura bilgilerini doldurun.</p>
          </div>
          <button
            onClick={() => setView("list")}
            className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
          >
            ← Geri
          </button>
        </div>

        <div className="space-y-4">
          {/* Temel bilgiler */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <SectionTitle>Fatura Bilgileri</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Fatura No">
                <Input
                  value={form.invoiceNo}
                  onChange={e => sf("invoiceNo", e.target.value)}
                />
              </Field>
              <Field label="Tarih">
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => sf("date", e.target.value)}
                />
              </Field>
              <Field label="Durum">
                <select
                  value={form.status}
                  onChange={e => sf("status", e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full"
                >
                  <option value="pending">Bekliyor</option>
                  <option value="paid">Ödendi</option>
                </select>
              </Field>
              <div className="md:col-span-3">
                <Field label="Müşteri">
                  <select
                    value={form.customerId}
                    onChange={e => {
                      const c = customers.find(x => x.id === e.target.value);
                      sf("customerId", e.target.value);
                      sf("customerName", c?.name || "");
                    }}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full"
                  >
                    <option value="">Müşteri seçin (opsiyonel)</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* Kalemler */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <SectionTitle>Fatura Kalemleri</SectionTitle>
            <div className="space-y-3">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-2 items-end border border-gray-100 rounded-lg p-3 xl:p-0 xl:border-0">
                  <div className="xl:col-span-5">
                    <Field label={i === 0 ? "Açıklama" : "Açıklama"}>
                      <Input
                        placeholder="Hizmet / Ürün açıklaması"
                        value={item.description}
                        onChange={e => updateItem(i, "description", e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="xl:col-span-2">
                    <Field label={i === 0 ? "Birim" : "Birim"}>
                      <select
                        value={item.unit}
                        onChange={e => updateItem(i, "unit", e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full"
                      >
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="xl:col-span-2">
                    <Field label={i === 0 ? "Miktar" : "Miktar"}>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.qty}
                        onChange={e => updateItem(i, "qty", e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="xl:col-span-2">
                    <Field label={i === 0 ? "Birim Fiyat (₺)" : "Birim Fiyat (₺)"}>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={item.price}
                        onChange={e => updateItem(i, "price", e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="xl:col-span-1 flex items-end pb-0.5">
                    {form.items.length > 1 && <RemoveBtn onClick={() => removeItem(i)} />}
                  </div>
                </div>
              ))}
            </div>
            <AddRowBtn onClick={addItem} label="Kalem Ekle" />

            {/* Toplam */}
            <div className="mt-6 border-t border-gray-100 pt-4">
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Ara Toplam</span>
                    <span>₺{fmt(calc.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 gap-4">
                    <div className="flex items-center gap-2">
                      <span>KDV</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">%</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={form.kdvRate}
                          onChange={e => sf("kdvRate", e.target.value)}
                          className="border border-gray-200 rounded px-2 py-0.5 text-xs outline-none focus:border-opblue w-16 text-center"
                        />
                      </div>
                    </div>
                    <span className="whitespace-nowrap">₺{fmt(calc.kdv)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                    <span>Toplam</span>
                    <span className="text-opblue whitespace-nowrap">₺{fmt(calc.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notlar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <SectionTitle>Notlar</SectionTitle>
            <Textarea
              rows={3}
              placeholder="Fatura notu..."
              value={form.notes}
              onChange={e => sf("notes", e.target.value)}
            />
          </div>

          {/* Kaydet */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pb-6">
            {editId && (
              <button
                onClick={() => handleDelete(editId)}
                className="text-sm text-red-500 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-50 w-full sm:w-auto"
              >
                Faturayı Sil
              </button>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:ml-auto">
              <button
                onClick={() => setView("list")}
                className="text-sm text-gray-500 border border-gray-200 px-5 py-2.5 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-opblue text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 w-full sm:w-auto"
              >
                {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DETAY + PDF ────────────────────────────────────
  if (view === "detail") {
    const inv = invoices.find(i => i.id === detailId);
    if (!inv) return null;
    const calc = calcInvoice(inv.items || [], inv.kdvRate);

    return (
      <div className="max-w-3xl w-full">
        <style>{printStyles}</style>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 no-print">
          <div>
            <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
              {inv.invoiceNo}
            </h1>
            <p className="text-sm text-gray-500 mt-1 break-words">
              {inv.customerName || "Müşterisiz"} · {inv.date}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="text-sm text-white bg-opblue border border-opblue px-4 py-2 rounded-lg hover:opacity-90 w-full sm:w-auto"
            >
              🖨️ PDF / Yazdır
            </button>
            <button
              onClick={() => openEdit(inv)}
              className="text-sm text-opblue border border-opblue/30 px-4 py-2 rounded-lg hover:bg-opblue/5 w-full sm:w-auto"
            >
              Düzenle
            </button>
            <button
              onClick={() => setView("list")}
              className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
            >
              ← Geri
            </button>
          </div>
        </div>

        {/* Fatura görünümü — hem ekran hem print */}
        <div id="invoice-print" className="bg-white border border-gray-200 rounded-xl p-4 sm:p-8">
          {/* Başlık */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-orange text-white font-condensed font-black text-base tracking-widest px-3 py-1 rounded">
                  OPET
                </span>
                <span className="font-bold text-gray-800">Kahramanlar Belen Akaryakıt</span>
              </div>
              <p className="text-xs text-gray-400">Hatay / Belen</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-condensed font-black text-2xl text-opblue">{inv.invoiceNo}</p>
              <p className="text-xs text-gray-400 mt-1">Tarih: {inv.date}</p>
              <span className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full
                ${inv.status === "paid"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange/10 text-orange"}`}>
                {inv.status === "paid" ? "✓ Ödendi" : "⏳ Bekliyor"}
              </span>
            </div>
          </div>

          {/* Müşteri */}
          {inv.customerName && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Fatura Kesilen</p>
              <p className="font-semibold text-gray-800 break-words">{inv.customerName}</p>
            </div>
          )}

          {/* Kalemler */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm mb-6">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Açıklama</th>
                  <th className="text-center py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Birim</th>
                  <th className="text-right py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Miktar</th>
                  <th className="text-right py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Birim Fiyat</th>
                  <th className="text-right py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {(inv.items || []).map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3 text-center text-gray-500 whitespace-nowrap">{item.unit}</td>
                    <td className="py-3 text-right text-gray-500 whitespace-nowrap">{item.qty}</td>
                    <td className="py-3 text-right text-gray-500 whitespace-nowrap">₺{fmt(item.price)}</td>
                    <td className="py-3 text-right font-medium whitespace-nowrap">
                      ₺{fmt((Number(item.qty) || 0) * (Number(item.price) || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Toplam */}
          <div className="flex justify-end mb-6">
            <div className="w-full sm:w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Ara Toplam</span>
                <span className="whitespace-nowrap">₺{fmt(calc.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>KDV (%{inv.kdvRate})</span>
                <span className="whitespace-nowrap">₺{fmt(calc.kdv)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t-2 border-gray-200 pt-2">
                <span>Genel Toplam</span>
                <span className="text-opblue whitespace-nowrap">₺{fmt(calc.total)}</span>
              </div>
            </div>
          </div>

          {/* Notlar */}
          {inv.notes && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Notlar</p>
              <p className="text-sm text-gray-500 break-words">{inv.notes}</p>
            </div>
          )}
        </div>

        {/* Durum değiştir */}
        <div className="mt-4 flex justify-end no-print">
          <button
            onClick={() => toggleStatus(inv)}
            className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors w-full sm:w-auto
              ${inv.status === "paid"
                ? "border-orange/30 text-orange hover:bg-orange/5"
                : "border-green-300 text-green-700 hover:bg-green-50"}`}
          >
            {inv.status === "paid" ? "Bekliyor olarak işaretle" : "Ödendi olarak işaretle"}
          </button>
        </div>
      </div>
    );
  }

  // ── LİSTE ─────────────────────────────────────────
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">Faturalar</h1>
          <p className="text-sm text-gray-500 mt-1">{invoices.length} fatura</p>
        </div>
        <button
          onClick={openNew}
          className="bg-opblue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 w-full sm:w-auto"
        >
          + Yeni Fatura
        </button>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Toplam Fatura</p>
          <p className="font-condensed font-black text-3xl text-opblue">{invoices.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Bekleyen</p>
          <p className="font-condensed font-black text-3xl text-orange break-words">₺{fmt(totalPending)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Tahsil Edilen</p>
          <p className="font-condensed font-black text-3xl text-green-600 break-words">₺{fmt(totalPaid)}</p>
        </div>
      </div>

      {/* Filtre & Arama */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Fatura no veya müşteri ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: "all", label: "Tümü" },
            { key: "pending", label: "Bekliyor" },
            { key: "paid", label: "Ödendi" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                ${filter === f.key ? "bg-white text-opblue shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Fatura No</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Müşteri</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Tutar</th>
                <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                  {search ? "Sonuç bulunamadı." : "Henüz fatura yok."}
                </td></tr>
              )}
              {filtered.map(inv => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-opblue whitespace-nowrap">{inv.invoiceNo}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{inv.date}</td>
                  <td className="px-4 py-3">{inv.customerName || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                    ₺{fmt(inv.total || calcInvoice(inv.items || [], inv.kdvRate).total)}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(inv)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors
                        ${inv.status === "paid"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-orange/10 text-orange hover:bg-orange/20"}`}
                    >
                      {inv.status === "paid" ? "✓ Ödendi" : "⏳ Bekliyor"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <button onClick={() => openDetail(inv)}
                        className="text-xs text-opblue font-semibold hover:underline">Detay</button>
                      <button onClick={() => openEdit(inv)}
                        className="text-xs text-gray-400 font-semibold hover:underline">Düzenle</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}