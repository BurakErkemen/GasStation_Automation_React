import { useContact } from "../../hooks/useContact";
import { siteConfig } from "../../config/siteConfig";

export default function Contact() {
  const { contact, loading } = useContact();

  // Firebase verisi gelene kadar siteConfig'i fallback olarak kullan
  const data = contact || {
    address:   siteConfig.address,
    phone:     siteConfig.phone,
    email:     siteConfig.email,
    hours:     siteConfig.hours,
    mapIframe: siteConfig.mapIframe,
  };

  const { contact: cfg } = siteConfig;
  const values = {
    address:  data.address,
    phone:    data.phone,
    email:    data.email,
    hours:    data.hours,
  };

  return (
    <section id="contact" className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr]">
      <div className="px-6 py-12 md:px-12 md:py-16 border-b md:border-b-0 md:border-r border-gray-200">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[2.5px] uppercase text-opblue mb-3">
          <div className="w-5 h-0.5 bg-opblue rounded" />
          {cfg.eyebrow}
        </div>
        <h2 className="font-condensed font-black text-4xl md:text-[42px] uppercase leading-tight mb-8">
          {cfg.title.line1}<br />{cfg.title.line2}
        </h2>
        {cfg.items.map((it) => (
          <div key={it.label} className="flex gap-3.5 mb-6 items-start">
            <div className="w-9 h-9 flex-shrink-0 mt-0.5 bg-opblue/7 border border-opblue/12 rounded-lg flex items-center justify-center text-base">
              {it.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{it.label}</p>
              <p className="text-sm font-medium">
                {loading ? "—" : (values[it.key] || "—")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 px-6 py-12 md:px-11 md:py-16 flex items-center justify-center">
        {data.mapIframe ? (
          data.mapIframe.includes("<iframe") ? (
            <div className="w-full h-64 md:h-72 rounded-xl overflow-hidden border border-gray-200"
              dangerouslySetInnerHTML={{
                __html: data.mapIframe.replace(
                  "<iframe",
                  '<iframe style="width:100%;height:256px;border:0"'
                )
              }} />
          ) : (
            <iframe src={data.mapIframe}
              className="w-full h-64 md:h-72 rounded-xl border border-gray-200"
              allowFullScreen loading="lazy" />
          )
        ) : (
          <div className="w-full h-64 md:h-72 rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center gap-2.5 text-gray-400">
            <span className="text-4xl opacity-30">🗺️</span>
            <p className="font-semibold text-sm">{cfg.mapPlaceholder.title}</p>
            <p className="text-xs">{cfg.mapPlaceholder.sub}</p>
          </div>
        )}
      </div>
    </section>
  );
}