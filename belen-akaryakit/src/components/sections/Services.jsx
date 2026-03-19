import { useSiteContent } from "../../hooks/useSiteContent";

export default function Services() {
  const { services } = useSiteContent();

  if (!services) return null;

  return (
    <section id="services" className="px-6 py-12 md:px-10 md:py-16 border-b border-gray-200">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[2.5px] uppercase text-opblue mb-3">
          <div className="w-5 h-0.5 bg-opblue rounded" />
          {services.eyebrow}
        </div>
        <h2 className="font-condensed font-black text-4xl md:text-[42px] uppercase leading-tight">
          {services.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
       {(services.items || [])
        .filter(s => s.active !== false)   // ← sadece aktifler
        .map((s, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-6 md:p-7 flex flex-col gap-3 hover:border-opblue/30 hover:shadow-lg hover:shadow-opblue/5 transition-all">
            <div className="w-11 h-11 bg-opblue/7 rounded-xl flex items-center justify-center text-xl">
              {s.icon}
            </div>
            <p className="font-bold text-[15px]">{s.title}</p>
            <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            <ul className="flex flex-col gap-1.5 flex-1">
              {(s.items || []).map((item, j) => (
                <li key={j} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-1 h-1 rounded-full bg-opblue flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <a href="#contact" className="text-xs font-bold text-opblue hover:text-bluem transition-colors mt-auto">
              {s.link} →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}