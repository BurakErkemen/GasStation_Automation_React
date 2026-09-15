import { useFuelPrices } from "../../hooks/useFuelPrices";
import { siteConfig } from "../../config/siteConfig";

const { fuelPrices } = siteConfig;

function PriceTrend({ current, previous }) {
  if (!previous || !current || current === "—") return null;
  const curr = Number(current);
  const prev = Number(previous);
  if (isNaN(curr) || isNaN(prev) || curr === prev) return null;

  const up = curr > prev;
  return (
    <div className={`flex items-center gap-1 text-[10px] font-bold mt-1
      ${up ? "text-red-400" : "text-green-400"}`}>
      <span>{up ? "▲" : "▼"}</span>
      <span>
        {up ? "+" : ""}
        {(curr - prev).toFixed(2)} ₺
      </span>
    </div>
  );
}

export default function FuelPrices() {
  const { prices, previousPrices, updatedAt, loading } = useFuelPrices();

  return (
    <section id="fuel" className="bg-[#07101F] px-5 py-10 md:px-10 md:py-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-white/6 mb-6">
        <div>
          <h2 className="font-condensed font-black text-2xl md:text-3xl text-white uppercase tracking-wide">
            {fuelPrices.title}
          </h2>
          <p className="text-xs text-white/30 mt-1.5">{fuelPrices.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/35 border border-white/8 px-3 py-1.5 rounded-full w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Canlı · {updatedAt ?? "—"}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {fuelPrices.cards
          .filter(({ key }) => loading || prices?.[key] != null)
          .map(({ key, label, bar, dot }) => (
          <div key={key}
            className="w-[calc(50%-0.375rem)] md:w-[calc(25%-0.5625rem)] bg-[#0D1B30] border border-white/7 rounded-xl pt-5 px-4 pb-4 md:pt-6 md:px-5 md:pb-5 relative overflow-hidden hover:border-white/15 transition-colors">
            <div className={`absolute top-0 inset-x-0 h-[3px] ${bar} rounded-t-xl`} />
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/38 mb-3">
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {label}
            </div>
            <p className="font-condensed font-black text-4xl md:text-5xl text-white leading-none tracking-tight mb-1">
              {loading ? "..." : `₺${Number(prices[key]).toFixed(2)}`}
            </p>
            <p className="text-[11px] text-white/22 tracking-wide">₺ / Litre · KDV dahil</p>

            {/* Trend göstergesi */}
            <PriceTrend
              current={prices?.[key]}
              previous={previousPrices?.[key]}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-5 pt-4 border-t border-white/5 text-[11px] text-white/20">
        <span>{fuelPrices.disclaimer}</span>
        <a href="#contact" className="text-orange font-semibold text-xs">{fuelPrices.ctaLabel}</a>
      </div>
    </section>
  );
}