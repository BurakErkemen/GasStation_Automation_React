import { useSiteContent } from "../../hooks/useSiteContent";

export default function About() {
  const { about } = useSiteContent();

  if (!about) return null;

  return (
    <section id="about" className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-200">
      <div className="px-6 py-12 md:px-12 md:py-16 border-b md:border-b-0 md:border-r border-gray-200">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[2.5px] uppercase text-opblue mb-3">
          <div className="w-5 h-0.5 bg-opblue rounded" />
          {about.eyebrow}
        </div>
        <h2 className="font-condensed font-black text-4xl md:text-[42px] uppercase leading-tight mb-4">
          {about.titleLine1}<br />{about.titleLine2}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{about.description}</p>
        <ul className="flex flex-col gap-2.5">
          {(about.ticks || []).map((t, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm font-medium">
              <div className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full bg-opblue/10 flex items-center justify-center text-[9px] font-black text-opblue">✓</div>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 py-12 md:px-12 md:py-16 bg-gray-50 flex flex-col gap-3.5">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="font-bold text-sm mb-1.5">{about.missionTitle}</p>
          <p className="text-sm text-gray-500 leading-relaxed">{about.missionBody}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(about.stats || []).map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="font-condensed font-black text-3xl text-opblue leading-none mb-1">{s.n}</p>
              <p className="text-xs text-gray-500 font-medium">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}