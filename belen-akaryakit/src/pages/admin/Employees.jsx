import { useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, serverTimestamp,
  query, orderBy
} from "firebase/firestore";
import { db } from "../../lib/firebase";

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

const POSITIONS = ["Pompa Görevlisi", "Kasiyer", "Vardiya Sorumlusu", "Müdür", "Diğer"];

const emptyForm = {
  name:      "",
  phone:     "",
  tcNo:      "",
  address:   "",
  position:  "Pompa Görevlisi",
  salary:    "",
  startDate: "",
  notes:     "",
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [shifts,    setShifts]    = useState([]);
  const [view,      setView]      = useState("list");
  const [form,      setForm]      = useState(emptyForm);
  const [editId,    setEditId]    = useState(null);
  const [detailId,  setDetailId]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [eSnap, sSnap] = await Promise.all([
      getDocs(query(collection(db, "employees"), orderBy("name"))),
      getDocs(query(collection(db, "shifts"), orderBy("date", "desc"))),
    ]);
    setEmployees(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setShifts(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  function openNew()     { setForm(emptyForm); setEditId(null);  setView("form");   }
  function openEdit(e)   { setForm({ ...e });  setEditId(e.id);  setView("form");   }
  function openDetail(e) { setDetailId(e.id);  setView("detail"); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "employees", editId), { ...form, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, "employees"), { ...form, createdAt: serverTimestamp() });
      }
      await loadAll();
      setView("list");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Çalışanı silmek istediğinize emin misiniz?")) return;
    await deleteDoc(doc(db, "employees", id));
    await loadAll();
    setView("list");
  }

  function sf(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  function getEmployeeStats(employeeId) {
    const worked = shifts.filter(s =>
      (s.employees || []).includes(employeeId)
    );

    const workedDays = new Set(worked.map(s => s.date)).size;

    const byMonth = {};
    worked.forEach(s => {
      const month = s.date?.slice(0, 7);
      if (!month) return;
      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(s);
    });

    return { worked, workedDays, byMonth };
  }

  const filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.phone?.includes(search) ||
    e.position?.toLowerCase().includes(search.toLowerCase())
  );

  // ── FORM ──────────────────────────────────────────
  if (view === "form") {
    return (
      <div className="max-w-2xl w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
              {editId ? "Çalışan Düzenle" : "Yeni Çalışan"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Çalışan bilgilerini doldurun.</p>
          </div>
          <button
            onClick={() => setView("list")}
            className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
          >
            ← Geri
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
          <SectionTitle>Kişisel Bilgiler</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Ad Soyad *">
              <Input placeholder="Ahmet Yılmaz"
                value={form.name}
                onChange={e => sf("name", e.target.value)} />
            </Field>
            <Field label="Telefon">
              <Input placeholder="0 (5__) ___ __ __"
                value={form.phone}
                onChange={e => sf("phone", e.target.value)} />
            </Field>
            <Field label="TC Kimlik No">
              <Input placeholder="12345678901" maxLength={11}
                value={form.tcNo}
                onChange={e => sf("tcNo", e.target.value)} />
            </Field>
            <Field label="Başlangıç Tarihi">
              <Input type="date"
                value={form.startDate}
                onChange={e => sf("startDate", e.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Adres">
                <Input placeholder="Mahalle, Cadde, No — İlçe / İl"
                  value={form.address}
                  onChange={e => sf("address", e.target.value)} />
              </Field>
            </div>
          </div>

          <SectionTitle>Görev Bilgileri</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Pozisyon / Görev">
              <select
                value={form.position}
                onChange={e => sf("position", e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue w-full"
              >
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Maaş (₺)">
              <Input type="number" placeholder="0.00"
                value={form.salary}
                onChange={e => sf("salary", e.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notlar">
                <Textarea rows={3} placeholder="Çalışan hakkında notlar..."
                  value={form.notes}
                  onChange={e => sf("notes", e.target.value)} />
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
              Çalışanı Sil
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
    const employee = employees.find(e => e.id === detailId);
    if (!employee) return null;
    const { worked, workedDays, byMonth } = getEmployeeStats(detailId);

    return (
      <div className="max-w-3xl w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">
              {employee.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {employee.position}
              {employee.startDate && ` · ${employee.startDate} tarihinden beri`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => openEdit(employee)}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Toplam Vardiya</p>
            <p className="font-condensed font-black text-3xl text-opblue">{worked.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Çalışılan Gün</p>
            <p className="font-condensed font-black text-3xl text-green-600">{workedDays}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Maaş</p>
            <p className="font-condensed font-black text-3xl text-gray-800 break-words">
              {employee.salary
                ? `₺${Number(employee.salary).toLocaleString("tr-TR")}`
                : "—"}
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-100">
            <SectionTitle>Vardiya Geçmişi</SectionTitle>
          </div>

          {Object.keys(byMonth).length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              Henüz vardiya kaydı yok.
            </div>
          ) : (
            Object.entries(byMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, monthShifts]) => (
                <div key={month}>
                  <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-600">
                      {new Date(month + "-01").toLocaleString("tr-TR", { month: "long", year: "numeric" })}
                    </p>
                    <span className="text-xs text-gray-400">{monthShifts.length} vardiya</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-sm">
                      <tbody>
                        {monthShifts
                          .sort((a, b) => b.date?.localeCompare(a.date))
                          .map(s => (
                            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-5 py-2.5 font-medium whitespace-nowrap">{s.date}</td>
                              <td className="px-5 py-2.5 whitespace-nowrap">
                                <span className="bg-opblue/10 text-opblue text-xs font-bold px-2 py-0.5 rounded">
                                  {s.period}
                                </span>
                              </td>
                              <td className="px-5 py-2.5 whitespace-nowrap">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded
                                  ${s.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                  {s.status === "open" ? "Açık" : "Kapalı"}
                                </span>
                              </td>
                              <td className="px-5 py-2.5 text-right text-gray-500 text-xs whitespace-nowrap">
                                {s.summary?.fuelTotal
                                  ? `₺${Number(s.summary.fuelTotal).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 mb-6">
          <SectionTitle>Kişisel Bilgiler</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { label: "Telefon",        value: employee.phone     },
              { label: "TC Kimlik No",   value: employee.tcNo      },
              { label: "Adres",          value: employee.address   },
              { label: "Başlangıç",      value: employee.startDate },
            ].filter(i => i.value).map(item => (
              <div key={item.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{item.label}</p>
                <p className="text-gray-700 break-words">{item.value}</p>
              </div>
            ))}
            {employee.notes && (
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Notlar</p>
                <p className="text-gray-500 break-words">{employee.notes}</p>
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
          <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">Çalışanlar</h1>
          <p className="text-sm text-gray-500 mt-1">{employees.length} kayıtlı çalışan</p>
        </div>
        <button
          onClick={openNew}
          className="bg-opblue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 w-full sm:w-auto"
        >
          + Yeni Çalışan
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Ad, telefon veya pozisyona göre ara..."
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
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Ad Soyad</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Pozisyon</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Telefon</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Başlangıç</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Toplam Vardiya</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                    {search ? "Arama sonucu bulunamadı." : "Henüz çalışan kaydı yok."}
                  </td>
                </tr>
              )}
              {filtered.map(e => {
                const { worked } = getEmployeeStats(e.id);
                return (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{e.name}</p>
                      {e.address && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{e.address}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-opblue/8 text-opblue text-xs font-semibold px-2.5 py-1 rounded-lg">
                        {e.position || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{e.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{e.startDate || "—"}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-condensed font-black text-lg text-opblue">{worked.length}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <button
                          onClick={() => openDetail(e)}
                          className="text-xs text-opblue font-semibold hover:underline"
                        >
                          Detay
                        </button>
                        <button
                          onClick={() => openEdit(e)}
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