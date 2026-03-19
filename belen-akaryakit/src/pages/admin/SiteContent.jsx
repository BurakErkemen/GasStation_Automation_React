import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { siteConfig } from "../../config/siteConfig";

// ── Yardımcı bileşenler ───────────────────────────────
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
      {children}
    </div>
  );
}
function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue transition-colors w-full ${className}`}
    />
  );
}
function Textarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`border border-gray-200 rounded-lg px-3 py-2.5 text-base md:text-sm outline-none focus:border-opblue transition-colors w-full resize-none ${className}`}
    />
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
function Card({ children }) {
  return <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">{children}</div>;
}
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap
        ${active ? "bg-opblue text-white" : "text-gray-500 hover:bg-gray-100"}`}
    >
      {children}
    </button>
  );
}

// ── Boş form (siteConfig'den başla) ──────────────────
function buildEmpty() {
  const c = siteConfig;
  return {
    hero: {
      kicker: c.hero.kicker,
      titleLine1: c.hero.title.line1,
      titleAccent: c.hero.title.accent,
      titleLine3: c.hero.title.line3,
      description: c.hero.description,
      primaryBtn: c.hero.buttons.primary.label,
      secondaryBtn: c.hero.buttons.secondary.label,
      pills: c.hero.pills.map(p => ({ icon: p.icon, label: p.label })),
    },
    slides: c.hero.slides.map(s => ({
      tag: s.tag, n: s.n, title: s.title, body: s.body,
    })),
    about: {
      eyebrow: c.about.eyebrow,
      titleLine1: c.about.title.line1,
      titleLine2: c.about.title.line2,
      description: c.about.description,
      ticks: [...c.about.ticks],
      missionTitle: c.about.mission.title,
      missionBody: c.about.mission.body,
      stats: c.about.stats.map(s => ({ n: s.n, l: s.l })),
    },
    services: {
      eyebrow: c.services.eyebrow,
      title: c.services.title,
      items: c.services.items.map(s => ({
        icon: s.icon, title: s.title,
        desc: s.desc, link: s.link,
        items: [...s.items],
      })),
    },
    strip: {
      text: c.strip.text,
      accent: c.strip.accent,
      badge: c.strip.badge,
      sub: c.strip.sub,
    },
  };
}

// ── Ana bileşen ───────────────────────────────────────
export default function SiteContent() {
  const [form, setForm] = useState(buildEmpty());
  const [tab, setTab] = useState("hero");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadContent(); }, []);

  async function loadContent() {
    const snap = await getDoc(doc(db, "settings", "siteContent"));
    if (snap.exists()) setForm({ ...buildEmpty(), ...snap.data() });
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true); setSaved(false);
    try {
      await setDoc(doc(db, "settings", "siteContent"), {
        ...form, updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  function sf(path, val) {
    setForm(prev => {
      const next = structuredClone(prev);
      path.reduce((o, k, i) => i === path.length - 1 ? (o[k] = val) : o[k], next);
      return next;
    });
  }

  function updateArr(path, idx, key, val) {
    setForm(prev => {
      const next = structuredClone(prev);
      const arr = path.reduce((o, k) => o[k], next);
      arr[idx][key] = val;
      return next;
    });
  }

  function updateArrItem(path, idx, itemIdx, val) {
    setForm(prev => {
      const next = structuredClone(prev);
      const arr = path.reduce((o, k) => o[k], next);
      arr[idx].items[itemIdx] = val;
      return next;
    });
  }

  if (loading) return (
    <div className="text-sm text-gray-400 py-10 text-center">Yükleniyor...</div>
  );

  const tabs = [
    { key: "hero", label: "Hero" },
    { key: "slides", label: "Slaytlar" },
    { key: "about", label: "Hakkımızda" },
    { key: "services", label: "Hizmetler" },
    { key: "strip", label: "Opet Strip" },
  ];

  return (
    <div className="max-w-4xl w-full">
      {/* Başlık */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-condensed font-black text-2xl sm:text-3xl uppercase text-gray-800">Site İçeriği</h1>
          <p className="text-sm text-gray-500 mt-1">Ana sayfadaki metinleri ve içerikleri düzenleyin.</p>
        </div>
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-2 rounded-lg w-full sm:w-auto text-center">
            ✓ Kaydedildi
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="overflow-x-auto mb-5">
        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-max min-w-full sm:min-w-0 sm:w-fit">
          {tabs.map(t => (
            <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </TabBtn>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* ── HERO ── */}
        {tab === "hero" && (
          <>
            <Card>
              <SectionTitle>Hero Bölümü</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Üst Etiket (Kicker)">
                  <Input value={form.hero.kicker}
                    onChange={e => sf(["hero", "kicker"], e.target.value)} />
                </Field>
                <Field label="Başlık — 1. Satır">
                  <Input value={form.hero.titleLine1}
                    onChange={e => sf(["hero", "titleLine1"], e.target.value)} />
                </Field>
                <Field label="Başlık — Vurgu (Turuncu)">
                  <Input value={form.hero.titleAccent}
                    onChange={e => sf(["hero", "titleAccent"], e.target.value)} />
                </Field>
                <Field label="Başlık — 3. Satır">
                  <Input value={form.hero.titleLine3}
                    onChange={e => sf(["hero", "titleLine3"], e.target.value)} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Açıklama Metni">
                    <Textarea rows={3} value={form.hero.description}
                      onChange={e => sf(["hero", "description"], e.target.value)} />
                  </Field>
                </div>
                <Field label="Birincil Buton Yazısı">
                  <Input value={form.hero.primaryBtn}
                    onChange={e => sf(["hero", "primaryBtn"], e.target.value)} />
                </Field>
                <Field label="İkincil Buton Yazısı">
                  <Input value={form.hero.secondaryBtn}
                    onChange={e => sf(["hero", "secondaryBtn"], e.target.value)} />
                </Field>
              </div>
            </Card>

            <Card>
              <SectionTitle>Özellik Pilleri</SectionTitle>
              <div className="space-y-3">
                {form.hero.pills.map((p, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label={`Pill ${i + 1} — İkon`}>
                      <Input value={p.icon}
                        onChange={e => updateArr(["hero", "pills"], i, "icon", e.target.value)} />
                    </Field>
                    <Field label={`Pill ${i + 1} — Yazı`}>
                      <Input value={p.label}
                        onChange={e => updateArr(["hero", "pills"], i, "label", e.target.value)} />
                    </Field>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ── SLAYTLAR ── */}
        {tab === "slides" && (
          <Card>
            <SectionTitle>Hero Slaytları</SectionTitle>
            <div className="space-y-6">
              {form.slides.map((s, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 sm:p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-opblue mb-4">
                    Slayt {i + 1}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Etiket (Tag)">
                      <Input value={s.tag}
                        onChange={e => updateArr(["slides"], i, "tag", e.target.value)} />
                    </Field>
                    <Field label="Numara">
                      <Input value={s.n}
                        onChange={e => updateArr(["slides"], i, "n", e.target.value)} />
                    </Field>
                    <Field label="Başlık">
                      <Input value={s.title}
                        onChange={e => updateArr(["slides"], i, "title", e.target.value)} />
                    </Field>
                    <Field label="Açıklama">
                      <Input value={s.body}
                        onChange={e => updateArr(["slides"], i, "body", e.target.value)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── HAKKIMIZDA ── */}
        {tab === "about" && (
          <>
            <Card>
              <SectionTitle>Hakkımızda Bölümü</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Üst Etiket">
                  <Input value={form.about.eyebrow}
                    onChange={e => sf(["about", "eyebrow"], e.target.value)} />
                </Field>
                <Field label="Başlık — 1. Satır">
                  <Input value={form.about.titleLine1}
                    onChange={e => sf(["about", "titleLine1"], e.target.value)} />
                </Field>
                <Field label="Başlık — 2. Satır">
                  <Input value={form.about.titleLine2}
                    onChange={e => sf(["about", "titleLine2"], e.target.value)} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Açıklama Metni">
                    <Textarea rows={3} value={form.about.description}
                      onChange={e => sf(["about", "description"], e.target.value)} />
                  </Field>
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle>Özellik Listesi (Tik İşaretleri)</SectionTitle>
              <div className="space-y-2">
                {form.about.ticks.map((t, i) => (
                  <Field key={i} label={`Madde ${i + 1}`}>
                    <Input value={t}
                      onChange={e => {
                        setForm(prev => {
                          const next = structuredClone(prev);
                          next.about.ticks[i] = e.target.value;
                          return next;
                        });
                      }} />
                  </Field>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle>Misyon</SectionTitle>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Misyon Başlığı">
                  <Input value={form.about.missionTitle}
                    onChange={e => sf(["about", "missionTitle"], e.target.value)} />
                </Field>
                <Field label="Misyon Metni">
                  <Textarea rows={3} value={form.about.missionBody}
                    onChange={e => sf(["about", "missionBody"], e.target.value)} />
                </Field>
              </div>
            </Card>

            <Card>
              <SectionTitle>İstatistik Kartları</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.about.stats.map((s, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Değer">
                      <Input value={s.n}
                        onChange={e => updateArr(["about", "stats"], i, "n", e.target.value)} />
                    </Field>
                    <Field label="Açıklama">
                      <Input value={s.l}
                        onChange={e => updateArr(["about", "stats"], i, "l", e.target.value)} />
                    </Field>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ── HİZMETLER ── */}
        {tab === "services" && (
          <>
            <Card>
              <SectionTitle>Bölüm Başlığı</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Üst Etiket">
                  <Input value={form.services.eyebrow}
                    onChange={e => sf(["services", "eyebrow"], e.target.value)} />
                </Field>
                <Field label="Başlık">
                  <Input value={form.services.title}
                    onChange={e => sf(["services", "title"], e.target.value)} />
                </Field>
              </div>
            </Card>

            {form.services.items.map((s, i) => (
              <Card key={i}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      draggable
                      onDragStart={e => e.dataTransfer.setData("text/plain", i)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        const from = parseInt(e.dataTransfer.getData("text/plain"));
                        const to = i;
                        if (from === to) return;
                        setForm(prev => {
                          const next = structuredClone(prev);
                          const items = next.services.items;
                          const [moved] = items.splice(from, 1);
                          items.splice(to, 0, moved);
                          return next;
                        });
                      }}
                      className="cursor-grab text-gray-300 hover:text-gray-500 select-none px-1 text-lg"
                      title="Sıralamak için sürükle"
                    >
                      ⠿
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-opblue">
                      Hizmet {i + 1}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={s.active !== false}
                          onChange={e => updateArr(["services", "items"], i, "active", e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-9 h-5 rounded-full transition-colors
                          ${s.active !== false ? "bg-opblue" : "bg-gray-200"}`} />
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                          ${s.active !== false ? "translate-x-4 left-0.5" : "left-0.5"}`} />
                      </div>
                      <span className="text-xs font-medium text-gray-500">
                        {s.active !== false ? "Aktif" : "Pasif"}
                      </span>
                    </label>

                    {form.services.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => {
                          const next = structuredClone(prev);
                          next.services.items.splice(i, 1);
                          return next;
                        })}
                        className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors w-full sm:w-auto"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>

                <div className={`${s.active === false ? "opacity-40 pointer-events-none" : ""}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Field label="İkon (emoji)">
                      <div className="flex flex-col gap-2">
                        <Input
                          value={s.icon}
                          onChange={e => updateArr(["services", "items"], i, "icon", e.target.value)}
                          className="text-center text-lg"
                        />
                        <div className="flex flex-wrap gap-1">
                          {["⛽","🛒","☕","🔧","🚗","🛞","💧","⚡","🏪","🅿️"].map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => updateArr(["services", "items"], i, "icon", emoji)}
                              className={`w-8 h-8 rounded text-base hover:bg-gray-100 transition-colors
                                ${s.icon === emoji ? "bg-opblue/10 ring-1 ring-opblue" : ""}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Field>

                    <Field label="Başlık">
                      <Input value={s.title}
                        onChange={e => updateArr(["services", "items"], i, "title", e.target.value)} />
                    </Field>

                    <div className="md:col-span-2">
                      <Field label="Açıklama">
                        <Textarea rows={2} value={s.desc}
                          onChange={e => updateArr(["services", "items"], i, "desc", e.target.value)} />
                      </Field>
                    </div>

                    <Field label="Bağlantı Yazısı">
                      <Input value={s.link}
                        onChange={e => updateArr(["services", "items"], i, "link", e.target.value)} />
                    </Field>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Özellik Listesi
                  </p>
                  <div className="space-y-2">
                    {(s.items || []).map((item, j) => (
                      <div key={j} className="flex gap-2 items-center">
                        <Input
                          value={item}
                          placeholder={`Özellik ${j + 1}`}
                          onChange={e => updateArrItem(["services", "items"], i, j, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setForm(prev => {
                            const next = structuredClone(prev);
                            next.services.items[i].items.splice(j, 1);
                            return next;
                          })}
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5 rounded hover:bg-red-50 flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setForm(prev => {
                        const next = structuredClone(prev);
                        next.services.items[i].items.push("");
                        return next;
                      })}
                      className="text-xs font-semibold text-opblue border border-opblue/30 rounded-lg px-3 py-1.5 hover:bg-opblue/5 transition-colors w-full sm:w-auto"
                    >
                      + Özellik Ekle
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            <button
              type="button"
              onClick={() => setForm(prev => {
                const next = structuredClone(prev);
                next.services.items.push({
                  icon: "⛽", title: "Yeni Hizmet", desc: "",
                  link: "Detay", items: [""], active: true,
                });
                return next;
              })}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm font-semibold text-gray-400 hover:border-opblue/40 hover:text-opblue transition-colors"
            >
              + Yeni Hizmet Ekle
            </button>
          </>
        )}

        {/* ── OPET STRIP ── */}
        {tab === "strip" && (
          <Card>
            <SectionTitle>Opet Strip Yazıları</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Sol Yazı">
                <Input value={form.strip.text}
                  onChange={e => sf(["strip", "text"], e.target.value)} />
              </Field>
              <Field label="Sol Vurgu (Turuncu)">
                <Input value={form.strip.accent}
                  onChange={e => sf(["strip", "accent"], e.target.value)} />
              </Field>
              <Field label="Sağ Badge">
                <Input value={form.strip.badge}
                  onChange={e => sf(["strip", "badge"], e.target.value)} />
              </Field>
              <Field label="Sağ Alt Yazı">
                <Input value={form.strip.sub}
                  onChange={e => sf(["strip", "sub"], e.target.value)} />
              </Field>
            </div>
          </Card>
        )}

        {/* ── Kaydet ── */}
        <div className="flex justify-end pb-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-opblue text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity w-full sm:w-auto"
          >
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}