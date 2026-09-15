import { useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, serverTimestamp,
  query, orderBy
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { exportListToExcel, printListAsPDF, exportWorkbookToExcel, printDocument } from "../../utils/listExport";
import ExportButtons from "../../components/admin/ExportButtons";

// ── Sabitler ──────────────────────────────────────────
const PAYMENT_TYPES = [
  { key: "supplier",  label: "Tedarikçi Ödemesi",     color: "bg-purple-100 text-purple-700" },
  { key: "salary",    label: "Maaş Ödemesi",          color: "bg-blue-100 text-blue-700"    },
  { key: "expense",   label: "Genel Gider",           color: "bg-orange/10 text-orange"     },
  { key: "customer",  label: "Müşteri Ödemesi",       color: "bg-green-100 text-green-700"  },
];

const PAYMENT_METHODS = [
  { key: "cash",      label: "Nakit"          },
  { key: "card",      label: "Kredi Kartı"    },
  { key: "transfer",  label: "Banka Havalesi" },
  { key: "auto",      label: "Otomatik Ödeme" },
  { key: "check",     label: "Çek"            },
];

const STATUS_OPTIONS = [
  { key: "completed", label: "Tamamlandı", color: "bg-green-100 text-green-700" },
  { key: "pending",   label: "Bekliyor",   color: "bg-orange/10 text-orange"    },
  { key: "cancelled", label: "İptal",      color: "bg-red-100 text-red-500"     },
];

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

const fmt = (n) => Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });

const emptyForm = {
  date:        new Date().toISOString().split("T")[0],
  type:        "expense",
  method:      "cash",
  status:      "completed",
  amount:      "",
  recipient:   "",
  description: "",
  refNo:       "",
  dueDate:     "",
  notes:       "",
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [view, setView] = useState("list");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [pSnap, eSnap, cSnap, sSnap] = await Promise.all([
      getDocs(query(collection(db, "payments"), orderBy("date", "desc"))),
      getDocs(collection(db, "employees")),
      getDocs(collection(db, "customers")),
      getDocs(collection(db, "suppliers")),
    ]);
    setPayments(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setEmployees(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCustomers(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setSuppliers(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  function openNew() { setForm(emptyForm); setEditId(null); setView("form"); }
  function openEdit(p) { setForm({ ...p }); setEditId(p.id); setView("form"); }
  function openDetail(p) { setDetailId(p.id); setView("detail"); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "payments", editId), { ...form, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "payments"), { ...form, createdAt: serverTimestamp() });
      }
      await loadAll();
      setView("list");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Ödemeyi silmek istediğinize emin misiniz?")) return;
    await deleteDoc(doc(db, "payments", id));
    await loadAll();
    setView("list");
  }

  async function updateStatus(id, status) {
    await updateDoc(doc(db, "payments", id), { status, updatedAt: serverTimestamp() });
    await loadAll();
  }

  function sf(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  const typeInfo = (key) => PAYMENT_TYPES.find(t => t.key === key) || PAYMENT_TYPES[2];
  const methodInfo = (key) => PAYMENT_METHODS.find(m => m.key === key) || PAYMENT_METHODS[0];
  const statusInfo = (key) => STATUS_OPTIONS.find(s => s.key === key) || STATUS_OPTIONS[0];

  const recipientSuggestions =
    form.type === "salary"   ? employees.map(e => e.name) :
    form.type === "customer" ? customers.map(c => c.name) :
    form.type === "supplier" ? suppliers.map(s => s.name) :
    [];

  const filtered = payments.filter(p => {
    const matchSearch =
      p.recipient?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.refNo?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totalCompleted = payments
    .filter(p => p.status === "completed")
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const totalPending = payments
    .filter(p => p.status === "pending")
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTotal = payments
    .filter(p => p.date?.startsWith(thisMonth) && p.status === "completed")
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  function exportExcel() {
    exportListToExcel("Odemeler", "Ödemeler", [
      { header: "Tarih",       value: p => p.date,                    width: 12 },
      { header: "Tür",         value: p => typeInfo(p.type).label,    width: 20 },
      { header: "Alıcı",       value: p => p.recipient || "—",        width: 22 },
      { header: "Açıklama",    value: p => p.description || "—",      width: 24 },
      { header: "Ref No",      value: p => p.refNo || "—",            width: 14 },
      { header: "Yöntem",      value: p => methodInfo(p.method).label,width: 16 },
      { header: "Tutar (₺)",   value: p => Number(p.amount) || 0,     width: 14 },
      { header: "Durum",       value: p => statusInfo(p.status).label,width: 14 },
    ], filtered);
  }

  function exportPDF() {
    const total = filtered.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    printListAsPDF({
      title: "Ödemeler",
      subtitle: [
        search && `Arama: "${search}"`,
        typeFilter !== "all" && typeInfo(typeFilter).label,
        statusFilter !== "all" && statusInfo(statusFilter).label,
      ].filter(Boolean).join(" · ") || undefined,
      columns: [
        { header: "Tarih",    value: p => p.date },
        { header: "Tür",      value: p => typeInfo(p.type).label },
        { header: "Alıcı",    value: p => p.recipient || "—" },
        { header: "Açıklama", value: p => p.description || "—" },
        { header: "Yöntem",   value: p => methodInfo(p.method).label },
        { header: "Tutar (₺)",value: p => fmt(p.amount), align: "right" },
        { header: "Durum",    value: p => statusInfo(p.status).label },
      ],
      rows: filtered,
      summary: [
        { value: "TOPLAM" }, { value: "" }, { value: "" }, { value: "" }, { value: "" },
        { value: `₺${fmt(total)}`, align: "right" }, { value: "" },
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
              {editId ? "Ödeme Düzenle" : "Yeni Ödeme"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Ödeme bilgilerini doldurun.</p>
          </div>
          <button
            onClick={() => setView("list")}
            className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
          >
            ← Geri
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
          <SectionTitle>Ödeme Bilgileri</SectionTitle>

          <Field label="Ödeme Türü">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_TYPES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => { sf("type", t.key); sf("recipient", ""); }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors text-left
                    ${form.type === t.key
                      ? "bg-opblue text-white border-opblue"
                      : "border-gray-200 text-gray-600 hover:border-opblue/40"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tarih">
              <Input
                type="date"
                value={form.date}
                onChange={e => sf("date", e.target.value)}
              />
            </Field>
            <Field label="Vade Tarihi (Opsiyonel)">
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => sf("dueDate", e.target.value)}
              />
            </Field>
            <Field label="Tutar (₺)">
              <Input
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={e => sf("amount", e.target.value)}
              />
            </Field>
            <Field label="Referans No">
              <Input
                placeholder="Fiş / fatura / çek no"
                value={form.refNo}
                onChange={e => sf("refNo", e.target.value)}
              />
            </Field>
          </div>

          <Field label={
            form.type === "salary"   ? "Çalışan" :
            form.type === "customer" ? "Müşteri" :
            form.type === "supplier" ? "Tedarikçi" : "Alıcı / Kurum"
          }>
            {recipientSuggestions.length > 0 ? (
              <select
                value={form.recipient}
                onChange={e => sf("recipient", e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full"
              >
                <option value="">Seçin</option>
                {recipientSuggestions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="Alıcı / kurum adı"
                value={form.recipient}
                onChange={e => sf("recipient", e.target.value)}
              />
            )}
          </Field>

          <Field label="Açıklama">
            <Input
              placeholder="Ödeme açıklaması"
              value={form.description}
              onChange={e => sf("description", e.target.value)}
            />
          </Field>

          <Field label="Ödeme Yöntemi">
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => sf("method", m.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                    ${form.method === m.key
                      ? "bg-opblue text-white border-opblue"
                      : "border-gray-200 text-gray-600 hover:border-opblue/40"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Durum">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => sf("status", s.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors
                    ${form.status === s.key
                      ? "bg-opblue text-white border-opblue"
                      : "border-gray-200 text-gray-600 hover:border-opblue/40"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Notlar">
            <Textarea
              rows={2}
              placeholder="Ek notlar..."
              value={form.notes}
              onChange={e => sf("notes", e.target.value)}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between mt-4 pb-6">
          {editId && (
            <button
              onClick={() => handleDelete(editId)}
              className="text-sm text-red-500 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-50 w-full sm:w-auto"
            >
              Ödemeyi Sil
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
              disabled={saving || !form.amount}
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
    const p = payments.find(x => x.id === detailId);
    if (!p) return null;

    function exportDetailExcel() {
      exportWorkbookToExcel(`Odeme_${p.refNo || p.id}`, [{
        name: "Ödeme",
        aoa: [
          ["Tarih",          p.date],
          ["Tür",            typeInfo(p.type).label],
          ["Alıcı",          p.recipient || "—"],
          ["Açıklama",       p.description || "—"],
          ["Referans No",    p.refNo || "—"],
          ["Vade Tarihi",    p.dueDate || "—"],
          ["Yöntem",         methodInfo(p.method).label],
          ["Tutar (₺)",      Number(p.amount) || 0],
          ["Durum",          statusInfo(p.status).label],
          ["Notlar",         p.notes || "—"],
        ],
        cols: [{ wch: 16 }, { wch: 28 }],
      }]);
    }

    function exportDetailPDF() {
      printDocument({
        title: `Ödeme — ${p.recipient || typeInfo(p.type).label}`,
        subtitle: `${p.date} · ${statusInfo(p.status).label}`,
        info: [
          { label: "Tür",         value: typeInfo(p.type).label },
          { label: "Alıcı",       value: p.recipient || "—" },
          { label: "Açıklama",    value: p.description || "—" },
          { label: "Referans No", value: p.refNo || "—" },
          { label: "Vade Tarihi", value: p.dueDate || "—" },
          { label: "Yöntem",      value: methodInfo(p.method).label },
          { label: "Tutar",       value: `₺${fmt(p.amount)}` },
          { label: "Durum",       value: statusInfo(p.status).label },
          ...(p.notes ? [{ label: "Notlar", value: p.notes }] : []),
        ],
      });
    }

    return (
      <div className="max-w-2xl w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
              {p.recipient || typeInfo(p.type).label}
            </h1>
            <p className="text-sm text-gray-500 mt-1 break-words">{p.date} · {typeInfo(p.type).label}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <ExportButtons onExcel={exportDetailExcel} onPdf={exportDetailPDF} />
            <button
              onClick={() => openEdit(p)}
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

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className={`text-xs font-bold px-2 py-1 rounded ${typeInfo(p.type).color}`}>
              {typeInfo(p.type).label}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${statusInfo(p.status).color}`}>
              {statusInfo(p.status).label}
            </span>
          </div>

          <p className="font-condensed font-black text-3xl text-gray-800 mb-6">₺{fmt(p.amount)}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: "Alıcı / Kurum", value: p.recipient },
              { label: "Açıklama",      value: p.description },
              { label: "Referans No",   value: p.refNo },
              { label: "Vade Tarihi",   value: p.dueDate },
              { label: "Ödeme Yöntemi", value: methodInfo(p.method).label },
            ].filter(i => i.value).map(item => (
              <div key={item.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{item.label}</p>
                <p className="text-gray-700 break-words">{item.value}</p>
              </div>
            ))}
            {p.notes && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Notlar</p>
                <p className="text-gray-500 break-words">{p.notes}</p>
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
          <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">Ödemeler</h1>
          <p className="text-sm text-gray-500 mt-1">{payments.length} kayıt</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <ExportButtons onExcel={exportExcel} onPdf={exportPDF} />
          <button
            onClick={openNew}
            className="bg-opblue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 w-full sm:w-auto"
          >
            + Yeni Ödeme
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Bu Ay</p>
          <p className="font-condensed font-black text-2xl text-opblue break-words">₺{fmt(monthTotal)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Bekleyen</p>
          <p className="font-condensed font-black text-2xl text-orange break-words">₺{fmt(totalPending)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Toplam Ödenen</p>
          <p className="font-condensed font-black text-2xl text-green-600 break-words">₺{fmt(totalCompleted)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <input
          type="text"
          placeholder="Alıcı, açıklama veya ref no ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full sm:max-w-sm"
        />

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setTypeFilter("all")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                ${typeFilter === "all" ? "bg-white text-opblue shadow-sm" : "text-gray-500"}`}
            >
              Tümü
            </button>
            {PAYMENT_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                  ${typeFilter === t.key ? "bg-white text-opblue shadow-sm" : "text-gray-500"}`}
              >
                {t.label.split(" ")[0]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
            {[{ key: "all", label: "Tümü" }, ...STATUS_OPTIONS].map(s => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                  ${statusFilter === s.key ? "bg-white text-opblue shadow-sm" : "text-gray-500"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Tür</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Alıcı / Açıklama</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Yöntem</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Tutar</th>
                <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                    {search || typeFilter !== "all" || statusFilter !== "all" ? "Sonuç bulunamadı." : "Henüz ödeme kaydı yok."}
                  </td>
                </tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium">{p.date}</p>
                    {p.dueDate && p.status === "pending" && (
                      <p className="text-xs text-orange whitespace-nowrap">Vade: {p.dueDate}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${typeInfo(p.type).color}`}>
                      {typeInfo(p.type).label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.recipient || "—"}</p>
                    {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
                    {p.refNo && <p className="text-xs text-gray-400">Ref: {p.refNo}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {methodInfo(p.method).label}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                    ₺{fmt(p.amount)}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <select
                      value={p.status}
                      onChange={e => updateStatus(p.id, e.target.value)}
                      className={`text-xs font-bold px-2 py-1 rounded border-0 outline-none cursor-pointer
                        ${statusInfo(p.status).color}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <button
                        onClick={() => openDetail(p)}
                        className="text-xs text-opblue font-semibold hover:underline"
                      >
                        Detay
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs text-gray-400 font-semibold hover:underline"
                      >
                        Düzenle
                      </button>
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