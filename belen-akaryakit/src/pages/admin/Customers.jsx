import { useState, useEffect } from "react";
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

function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue transition-colors w-full resize-none"
    />
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-5 bg-opblue rounded" />
      <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wide">
        {children}
      </h3>
    </div>
  );
}

const emptyForm = {
  name: "",
  phone: "",
  address: "",
  plate: "",
  taxNo: "",
  notes: "",
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [view, setView] = useState("list"); // "list" | "form" | "detail"
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [cSnap, sSnap] = await Promise.all([
      getDocs(query(collection(db, "customers"), orderBy("name"))),
      getDocs(query(collection(db, "shifts"), orderBy("date", "desc"))),
    ]);
    setCustomers(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setShifts(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  function openNew() {
    setForm(emptyForm);
    setEditId(null);
    setView("form");
  }

  function openEdit(c) {
    setForm({ ...c });
    setEditId(c.id);
    setView("form");
  }

  function openDetail(c) {
    setDetailId(c.id);
    setView("detail");
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "customers", editId), {
          ...form,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "customers"), {
          ...form,
          createdAt: serverTimestamp()
        });
      }
      await loadAll();
      setView("list");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Müşteriyi silmek istediğinize emin misiniz?")) return;
    await deleteDoc(doc(db, "customers", id));
    await loadAll();
    setView("list");
  }

  function sf(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function getCustomerStats(customerId) {
    const credits = [];
    const collections = [];

    shifts.forEach(shift => {
      (shift.creditSales || []).forEach(c => {
        if (c.customerId === customerId) {
          credits.push({ ...c, date: shift.date, period: shift.period, shiftId: shift.id });
        }
      });
      (shift.debtCollections || []).forEach(c => {
        if (c.customerId === customerId) {
          collections.push({ ...c, date: shift.date, period: shift.period, shiftId: shift.id });
        }
      });
    });

    const totalDebt = credits.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const totalCollected = collections.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const balance = totalDebt - totalCollected;

    return { credits, collections, totalDebt, totalCollected, balance };
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.plate?.toLowerCase().includes(search.toLowerCase())
  );

  // ── FORM görünümü ─────────────────────────────────
  if (view === "form") {
    return (
      <div className="max-w-2xl w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
              {editId ? "Müşteri Düzenle" : "Yeni Müşteri"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Müşteri bilgilerini doldurun.</p>
          </div>
          <button
            onClick={() => setView("list")}
            className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
          >
            ← Geri
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
          <SectionTitle>Müşteri Bilgileri</SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Ad Soyad *">
              <Input
                placeholder="Ahmet Yılmaz"
                value={form.name}
                onChange={e => sf("name", e.target.value)}
              />
            </Field>

            <Field label="Telefon">
              <Input
                placeholder="0 (5__) ___ __ __"
                value={form.phone}
                onChange={e => sf("phone", e.target.value)}
              />
            </Field>

            <Field label="Plaka">
              <Input
                placeholder="31 ABC 123"
                value={form.plate}
                onChange={e => sf("plate", e.target.value.toUpperCase())}
              />
            </Field>

            <Field label="Vergi No / TC">
              <Input
                placeholder="1234567890"
                value={form.taxNo}
                onChange={e => sf("taxNo", e.target.value)}
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
                  placeholder="Müşteri hakkında notlar..."
                  value={form.notes}
                  onChange={e => sf("notes", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between mt-4 pb-6">
          {editId ? (
            <button
              onClick={() => handleDelete(editId)}
              className="text-sm text-red-500 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors w-full sm:w-auto"
            >
              Müşteriyi Sil
            </button>
          ) : (
            <div />
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
              className="bg-opblue text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity w-full sm:w-auto"
            >
              {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DETAY görünümü ────────────────────────────────
  if (view === "detail") {
    const customer = customers.find(c => c.id === detailId);
    if (!customer) return null;

    const { credits, collections, totalDebt, totalCollected, balance } = getCustomerStats(detailId);

    return (
      <div className="max-w-3xl w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
              {customer.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1 break-words">
              {customer.phone} {customer.plate && `· ${customer.plate}`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => openEdit(customer)}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Toplam Veresiye
            </p>
            <p className="font-condensed font-black text-2xl text-orange break-words">
              ₺{totalDebt.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Toplam Tahsilat
            </p>
            <p className="font-condensed font-black text-2xl text-green-600 break-words">
              ₺{totalCollected.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div
            className={`border rounded-xl p-5 ${
              balance > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Bakiye (Borç)
            </p>
            <p
              className={`font-condensed font-black text-2xl break-words ${
                balance > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              ₺{balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Veresiye geçmişi */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
            <SectionTitle>Veresiye Geçmişi</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Tarih</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Vardiya</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Fiş No</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Litre</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Tutar</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Not</th>
                </tr>
              </thead>
              <tbody>
                {credits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400 text-xs">
                      Veresiye kaydı yok.
                    </td>
                  </tr>
                )}
                {credits.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">{c.date}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="bg-opblue/10 text-opblue text-xs font-bold px-2 py-0.5 rounded">
                        {c.period}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{c.fisNo || "—"}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500 whitespace-nowrap">
                      {c.liters || "—"} lt
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-orange whitespace-nowrap">
                      ₺{Number(c.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{c.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tahsilat geçmişi */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
            <SectionTitle>Tahsilat Geçmişi</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Tarih</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Vardiya</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Fiş No</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Tutar</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Yöntem</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">Not</th>
                </tr>
              </thead>
              <tbody>
                {collections.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400 text-xs">
                      Tahsilat kaydı yok.
                    </td>
                  </tr>
                )}
                {collections.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">{c.date}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="bg-opblue/10 text-opblue text-xs font-bold px-2 py-0.5 rounded">
                        {c.period}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{c.fisNo || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-green-600 whitespace-nowrap">
                      ₺{Number(c.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          c.method === "cash"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {c.method === "cash" ? "Nakit" : "Kart"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{c.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Müşteri bilgileri */}
        {(customer.address || customer.taxNo || customer.notes) && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 mb-6">
            <SectionTitle>Ek Bilgiler</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {customer.address && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Adres</p>
                  <p className="text-gray-700 break-words">{customer.address}</p>
                </div>
              )}

              {customer.taxNo && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Vergi No / TC</p>
                  <p className="text-gray-700 break-words">{customer.taxNo}</p>
                </div>
              )}

              {customer.notes && (
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Notlar</p>
                  <p className="text-gray-500 break-words">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LİSTE görünümü ────────────────────────────────
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
            Müşteriler
          </h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} kayıtlı müşteri</p>
        </div>

        <button
          onClick={openNew}
          className="bg-opblue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity w-full sm:w-auto"
        >
          + Yeni Müşteri
        </button>
      </div>

      {/* Arama */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Ad, telefon veya plakaya göre ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-base md:text-sm outline-none focus:border-opblue transition-colors w-full sm:max-w-sm"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Ad Soyad</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Telefon</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Plaka</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Bakiye</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                    {search ? "Arama sonucu bulunamadı." : "Henüz müşteri kaydı yok."}
                  </td>
                </tr>
              )}

              {filtered.map(c => {
                const { balance } = getCustomerStats(c.id);

                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{c.name}</p>
                      {c.address && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {c.address}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {c.phone || "—"}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {c.plate ? (
                        <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded">
                          {c.plate}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span
                        className={`font-bold text-sm ${
                          balance > 0
                            ? "text-red-500"
                            : balance < 0
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {balance > 0 ? "Borçlu " : balance < 0 ? "Alacaklı " : ""}
                        ₺{Math.abs(balance).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2
                        })}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <button
                          onClick={() => openDetail(c)}
                          className="text-xs text-opblue font-semibold hover:underline"
                        >
                          Detay
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs text-gray-400 font-semibold hover:underline"
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