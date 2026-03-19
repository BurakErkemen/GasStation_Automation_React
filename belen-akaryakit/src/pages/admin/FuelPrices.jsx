import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

const FUELS = [
  { key: "benzin",     label: "Benzin",     color: "bg-orange",    dot: "bg-orange"    },
  { key: "dizel",      label: "Dizel",      color: "bg-sky",       dot: "bg-sky"       },
  { key: "eurodiesel", label: "Eurodiesel", color: "bg-green-500", dot: "bg-green-500" },
  { key: "lpg",        label: "LPG",        color: "bg-purple-500",dot: "bg-purple-500"},
];

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input {...props}
      className="border border-gray-200 text-base sm:text-sm rounded-lg px-3 py-2.5 text-sm outline-none focus:border-opblue transition-colors w-full" />
  );
}

const emptyForm = {
  benzin:     "",
  dizel:      "",
  eurodiesel: "",
  lpg:        "",
};

export default function AdminFuelPrices() {
  const [form,      setForm]      = useState(emptyForm);
  const [prev,      setPrev]      = useState(emptyForm);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { loadPrices(); }, []);

  async function loadPrices() {
    const snap = await getDoc(doc(db, "settings", "fuelPrices"));
    if (snap.exists()) {
      const data = snap.data();
      const prices = {
        benzin:     data.benzin     ?? "",
        dizel:      data.dizel      ?? "",
        eurodiesel: data.eurodiesel ?? "",
        lpg:        data.lpg        ?? "",
      };
      setForm(prices);
      setPrev(prices);
      setUpdatedAt(
        data.updatedAt
          ? new Date(data.updatedAt.toDate()).toLocaleString("tr-TR")
          : null
      );
    }
    setLoading(false);
  }

async function handleSave() {
  const isInvalid = FUELS.some(f => !form[f.key] || isNaN(form[f.key]) || Number(form[f.key]) <= 0);
  if (isInvalid) {
    alert("Lütfen tüm yakıt türleri için geçerli bir fiyat girin.");
    return;
  }

  setSaving(true);
  setSaved(false);
  try {
    await setDoc(doc(db, "settings", "fuelPrices"), {
      ...form,
      previousPrices: {         // eski fiyatları sakla
        benzin:     prev.benzin,
        dizel:      prev.dizel,
        eurodiesel: prev.eurodiesel,
        lpg:        prev.lpg,
      },
      updatedAt: serverTimestamp(),
    });
    setPrev({ ...form });
    setSaved(true);
    await loadPrices();
    setTimeout(() => setSaved(false), 3000);
  } finally {
    setSaving(false);
  }
}

  function hasChanges() {
    return FUELS.some(f => form[f.key] !== prev[f.key]);
  }

  if (loading) return (
    <div className="text-sm text-gray-400 py-10 text-center">Yükleniyor...</div>
  );

  return (
    <div className="max-w-2xl">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase text-gray-800">
            Yakıt Fiyatları
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ana sayfada görünen canlı fiyatları güncelleyin.
            {updatedAt && <span className="ml-2 text-gray-400">Son güncelleme: {updatedAt}</span>}
          </p>
        </div>
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-2 rounded-lg">
            ✓ Kaydedildi
          </div>
        )}
      </div>

      {/* Fiyat kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {FUELS.map(f => (
          <div key={f.key} className="bg-white border border-gray-200 rounded-xl p-5 relative overflow-hidden">
            <div className={`absolute top-0 inset-x-0 h-[3px] ${f.color} rounded-t-xl`} />

            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${f.dot}`} />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{f.label}</p>
            </div>

            <Field label="Litre Fiyatı (₺)">
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                  ₺/L
                </span>
              </div>
            </Field>

            {/* Önceki fiyat */}
            {prev[f.key] && prev[f.key] !== form[f.key] && (
              <p className="text-xs text-gray-400 mt-2">
                Önceki: <span className="line-through">₺{Number(prev[f.key]).toFixed(2)}</span>
                &nbsp;→&nbsp;
                <span className={Number(form[f.key]) > Number(prev[f.key]) ? "text-red-500" : "text-green-600"}>
                  ₺{Number(form[f.key]).toFixed(2)}
                  &nbsp;{Number(form[f.key]) > Number(prev[f.key]) ? "▲" : "▼"}
                </span>
              </p>
            )}

            {/* Mevcut fiyat (değişmemiş) */}
            {prev[f.key] && prev[f.key] === form[f.key] && (
              <p className="text-xs text-gray-400 mt-2">
                Mevcut: <span className="font-semibold text-gray-600">₺{Number(prev[f.key]).toFixed(2)}</span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Önizleme */}
      <div className="bg-[#07101F] rounded-xl p-5 mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
          Ana Sayfa Önizleme
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {FUELS.map(f => (
            <div key={f.key} className="bg-[#0D1B30] border border-white/7 rounded-lg pt-4 px-3 pb-3 relative overflow-hidden">
              <div className={`absolute top-0 inset-x-0 h-[2px] ${f.color}`} />
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-white/38 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />
                {f.label}
              </div>
              <p className="font-condensed font-black text-2xl text-white leading-none">
                {form[f.key] ? `₺${Number(form[f.key]).toFixed(2)}` : "—"}
              </p>
              <p className="text-[9px] text-white/22 mt-1">₺/Litre · KDV dahil</p>
            </div>
          ))}
        </div>
      </div>

      {/* Kaydet */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
        {hasChanges() && (
          <button
            onClick={() => setForm({ ...prev })}
            className="text-sm text-gray-500 border border-gray-200 px-5 py-2.5 rounded-lg hover:bg-gray-50">
            Değişiklikleri İptal Et
          </button>
        )}
        <button
        
          onClick={handleSave}
          disabled={saving || !hasChanges()}
          className="bg-opblue text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity">
          {saving ? "Kaydediliyor..." : "Fiyatları Güncelle"}
        </button>
      </div>
    </div>
  );
}