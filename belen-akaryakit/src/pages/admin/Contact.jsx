import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

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
      className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-opblue transition-colors w-full" />
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-1 h-5 bg-opblue rounded" />
      <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wide">{children}</h3>
    </div>
  );
}

const emptyForm = {
  firmName:  "",
  location:  "",
  address:   "",
  phone:     "",
  email:     "",
  hours:     "",
  mapIframe: "",
};

export default function AdminContact() {
  const [form,    setForm]    = useState(emptyForm);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadContact(); }, []);

  async function loadContact() {
    const snap = await getDoc(doc(db, "settings", "contact"));
    if (snap.exists()) setForm({ ...emptyForm, ...snap.data() });
    setLoading(false);
  }

  function sf(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, "settings", "contact"), {
        ...form,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-400 py-10 text-center">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-3xl">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-condensed font-black text-3xl uppercase text-gray-800">
            İletişim & Harita
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ana sayfada görünen iletişim bilgileri ve harita.
          </p>
        </div>
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-2 rounded-lg">
            ✓ Kaydedildi
          </div>
        )}
      </div>

      <div className="space-y-4">

        {/* ── Firma Bilgileri ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <SectionTitle>Firma Bilgileri</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Firma Adı">
              <Input placeholder="Kahramanlar Belen Akaryakıt"
                value={form.firmName}
                onChange={e => sf("firmName", e.target.value)} />
            </Field>
            <Field label="Konum (Kısa)">
              <Input placeholder="Hatay / Belen"
                value={form.location}
                onChange={e => sf("location", e.target.value)} />
            </Field>
            <Field label="Tam Adres">
              <Input placeholder="Mahalle, Cadde, No — Belen / Hatay"
                value={form.address}
                onChange={e => sf("address", e.target.value)} />
            </Field>
            <Field label="Çalışma Saatleri">
              <Input placeholder="7/24 Açık"
                value={form.hours}
                onChange={e => sf("hours", e.target.value)} />
            </Field>
            <Field label="Telefon">
              <Input placeholder="0 (326) 000 00 00"
                value={form.phone}
                onChange={e => sf("phone", e.target.value)} />
            </Field>
            <Field label="E-posta">
              <Input placeholder="info@belenakaryakit.com"
                value={form.email}
                onChange={e => sf("email", e.target.value)} />
            </Field>
          </div>
        </div>

        {/* ── Google Maps ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <SectionTitle>Google Maps</SectionTitle>
          <Field label="Embed URL veya iframe kodu">
            <textarea
              rows={4}
              placeholder='https://www.google.com/maps/embed?pb=... veya <iframe src="..." />'
              value={form.mapIframe}
              onChange={e => sf("mapIframe", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-opblue transition-colors w-full resize-none font-mono" />
          </Field>
          <p className="text-xs text-gray-400 mt-2">
            Google Maps → Paylaş → Haritayı yerleştir → HTML kopyala
          </p>

          {/* Önizleme */}
          {form.mapIframe && (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Önizleme</p>
              <div className="rounded-xl overflow-hidden border border-gray-200 h-64">
                {form.mapIframe.includes("<iframe") ? (
                  <div dangerouslySetInnerHTML={{
                    __html: form.mapIframe.replace(
                      "<iframe",
                      '<iframe style="width:100%;height:100%;border:0"'
                    )
                  }} />
                ) : (
                  <iframe
                    src={form.mapIframe}
                    style={{ width: "100%", height: "100%", border: 0 }}
                    allowFullScreen
                    loading="lazy" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Kaydet ── */}
        <div className="flex justify-end pb-6">
          <button onClick={handleSave} disabled={saving}
            className="bg-opblue text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}