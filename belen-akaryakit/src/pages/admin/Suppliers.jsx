import { useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, serverTimestamp,
  query, orderBy
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { exportListToExcel, printListAsPDF, exportWorkbookToExcel, printDocument } from "../../utils/listExport";
import ExportButtons from "../../components/admin/ExportButtons";

const CATEGORIES = [
  "Akaryakıt", "Market / Gıda", "Temizlik",
  "Teknik Servis", "Elektrik", "İnşaat / Tadilat",
  "Yazılım / Teknoloji", "Diğer"
];

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

const fmt = (n) => Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });

const emptyForm = {
  name:     "",
  phone:    "",
  email:    "",
  address:  "",
  taxNo:    "",
  category: "Diğer",
  iban:     "",
  notes:    "",
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [view, setView] = useState("list");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [sSnap, pSnap, iSnap] = await Promise.all([
      getDocs(query(collection(db, "suppliers"), orderBy("name"))),
      getDocs(query(collection(db, "payments"), orderBy("date", "desc"))),
      getDocs(query(collection(db, "invoices"), orderBy("date", "desc"))),
    ]);
    setSuppliers(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setPayments(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setInvoices(iSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  function openNew() { setForm(emptyForm); setEditId(null); setView("form"); }
  function openEdit(s) { setForm({ ...s }); setEditId(s.id); setView("form"); }
  function openDetail(s) { setDetailId(s.id); setView("detail"); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "suppliers", editId), { ...form, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "suppliers"), { ...form, createdAt: serverTimestamp() });
      }
      await loadAll();
      setView("list");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Tedarikçiyi silmek istediğinize emin misiniz?")) return;
    await deleteDoc(doc(db, "suppliers", id));
    await loadAll();
    setView("list");
  }

  function sf(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  function getSupplierStats(supplierName) {
    const supplierPayments = payments.filter(p =>
      p.type === "supplier" && p.recipient === supplierName
    );
    const supplierInvoices = invoices.filter(i =>
      i.customerName === supplierName
    );

    const totalPaid = supplierPayments
      .filter(p => p.status === "completed")
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const totalPending = supplierPayments
      .filter(p => p.status === "pending")
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const invoiceTotal = supplierInvoices
      .reduce((s, i) => s + (Number(i.total) || 0), 0);

    const balance = invoiceTotal - totalPaid;

    return { supplierPayments, supplierInvoices, totalPaid, totalPending, invoiceTotal, balance };
  }

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  function exportExcel() {
    exportListToExcel("Tedarikciler", "Tedarikçiler", [
      { header: "Firma Adı",       value: s => s.name,                                     width: 24 },
      { header: "Kategori",        value: s => s.category || "—",                          width: 18 },
      { header: "Telefon",         value: s => s.phone || "—",                             width: 16 },
      { header: "Fatura Toplamı (₺)", value: s => getSupplierStats(s.name).invoiceTotal,   width: 18 },
      { header: "Ödenen (₺)",      value: s => getSupplierStats(s.name).totalPaid,         width: 14 },
      { header: "Bekleyen (₺)",    value: s => getSupplierStats(s.name).totalPending,      width: 14 },
    ], filtered);
  }

  function exportPDF() {
    const totalPending = filtered.reduce((s, x) => s + getSupplierStats(x.name).totalPending, 0);
    printListAsPDF({
      title: "Tedarikçiler — Ödeme Durumu",
      subtitle: search ? `Arama: "${search}"` : undefined,
      columns: [
        { header: "Firma Adı",    value: s => s.name },
        { header: "Kategori",     value: s => s.category || "—" },
        { header: "Telefon",      value: s => s.phone || "—" },
        { header: "Fatura (₺)",   value: s => fmt(getSupplierStats(s.name).invoiceTotal), align: "right" },
        { header: "Ödenen (₺)",   value: s => fmt(getSupplierStats(s.name).totalPaid),    align: "right" },
        { header: "Bekleyen (₺)", value: s => fmt(getSupplierStats(s.name).totalPending), align: "right" },
      ],
      rows: filtered,
      summary: [
        { value: "TOPLAM" }, { value: "" }, { value: "" }, { value: "" }, { value: "" },
        { value: `₺${fmt(totalPending)}`, align: "right" },
      ],
    });
  }

  // ── FORM ──────────────────────────────────────────
  if (view === "form") {
    return (
      <div className="max-w-2xl w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
              {editId ? "Tedarikçi Düzenle" : "Yeni Tedarikçi"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Tedarikçi bilgilerini doldurun.</p>
          </div>
          <button
            onClick={() => setView("list")}
            className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
          >
            ← Geri
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
          <SectionTitle>Firma Bilgileri</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Firma / Ad Soyad *">
              <Input
                placeholder="Tedarikçi adı"
                value={form.name}
                onChange={e => sf("name", e.target.value)}
              />
            </Field>
            <Field label="Kategori">
              <select
                value={form.category}
                onChange={e => sf("category", e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Telefon">
              <Input
                placeholder="0 (___) ___ __ __"
                value={form.phone}
                onChange={e => sf("phone", e.target.value)}
              />
            </Field>
            <Field label="E-posta">
              <Input
                type="email"
                placeholder="ornek@firma.com"
                value={form.email}
                onChange={e => sf("email", e.target.value)}
              />
            </Field>
            <Field label="Vergi No">
              <Input
                placeholder="1234567890"
                value={form.taxNo}
                onChange={e => sf("taxNo", e.target.value)}
              />
            </Field>
            <Field label="IBAN">
              <Input
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                value={form.iban}
                onChange={e => sf("iban", e.target.value.toUpperCase())}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Adres">
                <Input
                  placeholder="Mahalle, Cadde, No — İlçe / İl"
                  value={form.address}
                  onChange={e => sf("address", e.target.value)}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Notlar">
                <Textarea
                  rows={3}
                  placeholder="Tedarikçi hakkında notlar..."
                  value={form.notes}
                  onChange={e => sf("notes", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between mt-4 pb-6">
          {editId && (
            <button
              onClick={() => handleDelete(editId)}
              className="text-sm text-red-500 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-50 w-full sm:w-auto"
            >
              Tedarikçiyi Sil
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
              disabled={saving || !form.name}
              className="bg-opblue text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 w-full sm:w-auto"
            >
              {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DETAY ─────────────────────────────────────────
  if (view === "detail") {
    const supplier = suppliers.find(s => s.id === detailId);
    if (!supplier) return null;
    const { supplierPayments, supplierInvoices, totalPaid, totalPending, invoiceTotal, balance } = getSupplierStats(supplier.name);

    const invoiceColumns = [
      { header: "Fatura No", value: i => i.invoiceNo,                                  width: 14 },
      { header: "Tarih",     value: i => i.date,                                       width: 12 },
      { header: "Tutar (₺)", value: i => Number(i.total) || 0,                         width: 14, align: "right" },
      { header: "Durum",     value: i => i.status === "paid" ? "Ödendi" : "Bekliyor",  width: 12 },
    ];
    const paymentColumns = [
      { header: "Tarih",     value: p => p.date,                    width: 12 },
      { header: "Açıklama",  value: p => p.description || "—",      width: 24 },
      { header: "Yöntem",    value: p => p.method,                  width: 14 },
      { header: "Tutar (₺)", value: p => Number(p.amount) || 0,     width: 14, align: "right" },
      { header: "Durum",     value: p => p.status === "completed" ? "Tamamlandı" : p.status === "pending" ? "Bekliyor" : "İptal", width: 14 },
    ];

    function exportDetailExcel() {
      exportWorkbookToExcel(`Tedarikci_${supplier.name}`, [
        { name: "Faturalar", columns: invoiceColumns, rows: supplierInvoices },
        { name: "Ödemeler",  columns: paymentColumns, rows: supplierPayments },
      ]);
    }

    function exportDetailPDF() {
      printDocument({
        title: `Tedarikçi: ${supplier.name}`,
        subtitle: [supplier.category, supplier.phone].filter(Boolean).join(" · ") || undefined,
        info: [
          { label: "Fatura Toplamı", value: `₺${fmt(invoiceTotal)}` },
          { label: "Ödenen",         value: `₺${fmt(totalPaid)}` },
          { label: "Bekleyen",       value: `₺${fmt(totalPending)}` },
          { label: "Bakiye",         value: `₺${fmt(balance)}` },
        ],
        sections: [
          { heading: "Bize Kesilen Faturalar", columns: invoiceColumns.map(c => ({ ...c, value: row => typeof c.value(row) === "number" ? fmt(c.value(row)) : c.value(row) })), rows: supplierInvoices },
          { heading: "Ödeme Geçmişi", columns: paymentColumns.map(c => ({ ...c, value: row => typeof c.value(row) === "number" ? fmt(c.value(row)) : c.value(row) })), rows: supplierPayments },
        ],
      });
    }

    return (
      <div className="max-w-3xl w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
              {supplier.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1 break-words">
              {supplier.category}
              {supplier.phone && ` · ${supplier.phone}`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <ExportButtons onExcel={exportDetailExcel} onPdf={exportDetailPDF} />
            <button
              onClick={() => openEdit(supplier)}
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

        {/* Özet kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Fatura Toplamı</p>
            <p className="font-condensed font-black text-2xl text-opblue break-words">₺{fmt(invoiceTotal)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Ödenen</p>
            <p className="font-condensed font-black text-2xl text-green-600 break-words">₺{fmt(totalPaid)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Bekleyen</p>
            <p className="font-condensed font-black text-2xl text-orange break-words">₺{fmt(totalPending)}</p>
          </div>
          <div className={`border rounded-xl p-5 ${balance > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Bakiye (Borç)</p>
            <p className={`font-condensed font-black text-2xl break-words ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
              ₺{fmt(Math.abs(balance))}
            </p>
          </div>
        </div>

        {/* Fatura geçmişi */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-100">
            <SectionTitle>Bize Kesilen Faturalar</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Fatura No</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Tarih</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Tutar</th>
                  <th className="text-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Durum</th>
                </tr>
              </thead>
              <tbody>
                {supplierInvoices.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-gray-400 text-xs">Fatura kaydı yok.</td></tr>
                )}
                {supplierInvoices.map((inv, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-semibold text-opblue whitespace-nowrap">{inv.invoiceNo}</td>
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{inv.date}</td>
                    <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">₺{fmt(inv.total)}</td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded
                        ${inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange/10 text-orange"}`}>
                        {inv.status === "paid" ? "Ödendi" : "Bekliyor"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ödeme geçmişi */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <SectionTitle>Ödeme Geçmişi</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Tarih</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Açıklama</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Yöntem</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Tutar</th>
                  <th className="text-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Durum</th>
                </tr>
              </thead>
              <tbody>
                {supplierPayments.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6 text-gray-400 text-xs">Ödeme kaydı yok.</td></tr>
                )}
                {supplierPayments.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {p.description || "—"}
                      {p.refNo && <span className="text-xs ml-1 text-gray-400">· {p.refNo}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{p.method}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-green-600 whitespace-nowrap">₺{fmt(p.amount)}</td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded
                        ${p.status === "completed" ? "bg-green-100 text-green-700" :
                          p.status === "pending"   ? "bg-orange/10 text-orange"   :
                                                     "bg-red-100 text-red-500"}`}>
                        {p.status === "completed" ? "Tamamlandı" : p.status === "pending" ? "Bekliyor" : "İptal"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Firma bilgileri */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
          <SectionTitle>Firma Bilgileri</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { label: "Telefon",  value: supplier.phone   },
              { label: "E-posta",  value: supplier.email   },
              { label: "Vergi No", value: supplier.taxNo   },
              { label: "IBAN",     value: supplier.iban    },
              { label: "Adres",    value: supplier.address },
            ].filter(i => i.value).map(item => (
              <div key={item.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{item.label}</p>
                <p className="text-gray-700 font-mono text-xs break-words">{item.value}</p>
              </div>
            ))}
            {supplier.notes && (
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Notlar</p>
                <p className="text-gray-500 break-words">{supplier.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── LİSTE ─────────────────────────────────────────
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">Tedarikçiler</h1>
          <p className="text-sm text-gray-500 mt-1">{suppliers.length} kayıtlı tedarikçi</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <ExportButtons onExcel={exportExcel} onPdf={exportPDF} />
          <button
            onClick={openNew}
            className="bg-opblue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 w-full sm:w-auto"
          >
            + Yeni Tedarikçi
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Firma adı, kategori veya telefona göre ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full sm:max-w-sm"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Firma Adı</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Telefon</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Ödenen</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Bekleyen</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                  {search ? "Sonuç bulunamadı." : "Henüz tedarikçi kaydı yok."}
                </td></tr>
              )}
              {filtered.map(s => {
                const { totalPaid, totalPending } = getSupplierStats(s.name);
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{s.name}</p>
                      {s.email && <p className="text-xs text-gray-400 mt-0.5 break-words">{s.email}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-opblue/8 text-opblue text-xs font-semibold px-2.5 py-1 rounded-lg">
                        {s.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600 whitespace-nowrap">
                      ₺{fmt(totalPaid)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-orange whitespace-nowrap">
                      {totalPending > 0 ? `₺${fmt(totalPending)}` : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <button onClick={() => openDetail(s)}
                          className="text-xs text-opblue font-semibold hover:underline">Detay</button>
                        <button onClick={() => openEdit(s)}
                          className="text-xs text-gray-400 font-semibold hover:underline">Düzenle</button>
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