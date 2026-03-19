import { useState, useEffect } from "react";
import { useSiteContent } from "../../hooks/useSiteContent";

export default function Hero() {
  const { hero, slides } = useSiteContent();
  const [cur, setCur] = useState(0);

  useEffect(() => {
    if (!slides?.length) return;
    const t = setInterval(() => setCur((c) => (c + 1) % slides.length), 4800);
    return () => clearInterval(t);
  }, [slides]);

  if (!hero || !slides) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-[1fr_400px] bg-navy relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="absolute -top-40 -left-24 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(37,99,200,0.35) 0%,transparent 70%)" }} />

      {/* SOL */}
      <div className="relative z-10 flex flex-col justify-center px-6 py-12 md:px-11 md:py-16">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-0.5 bg-orange rounded" />
          <span className="text-orange text-[11px] font-bold tracking-[2.5px] uppercase">
            {hero.kicker}
          </span>
        </div>

        <h1 className="font-condensed font-black text-5xl md:text-6xl uppercase text-white leading-none tracking-tight mb-5">
          {hero.titleLine1}<br />
          <span className="text-orange">{hero.titleAccent}</span><br />
          {hero.titleLine3}
        </h1>

        <p className="text-sm text-white/55 leading-relaxed max-w-sm mb-9">
          {hero.description}
        </p>

        <div className="flex flex-wrap gap-2.5 mb-10">
          <a href="#fuel"
            className="bg-orange text-white text-sm font-semibold px-6 py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all">
            {hero.primaryBtn}
          </a>
          <a href="#contact"
            className="text-white/80 text-sm font-medium px-6 py-3 rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all">
            {hero.secondaryBtn}
          </a>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(hero.pills || []).map((p) => (
            <div key={p.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white/60 font-medium">
              <span>{p.icon}</span>{p.label}
            </div>
          ))}
        </div>
      </div>

      {/* SAĞ — slaytlar */}
      <div className="hidden md:flex relative z-10 bg-opblue border-l border-white/8 flex-col justify-center px-10 py-11 overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/4 pointer-events-none" />
        <div key={cur}>
          <span className="inline-block bg-white/10 text-white/65 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded mb-4">
            {slides[cur]?.tag}
          </span>
          <p className="font-condensed font-black text-[88px] text-white/5 leading-none mb-0.5">
            {slides[cur]?.n}
          </p>
          <h2 className="font-condensed font-black text-3xl text-white uppercase mb-3">
            {slides[cur]?.title}
          </h2>
          <p className="text-sm text-white/52 leading-relaxed">
            {slides[cur]?.body}
          </p>
        </div>
        <div className="flex gap-1.5 mt-9">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCur(i)}
              className={`h-[3px] rounded-sm transition-all duration-300 ${i === cur ? "w-10 bg-orange" : "w-6 bg-white/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}