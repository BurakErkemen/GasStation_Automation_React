import { useSiteContent } from "../../hooks/useSiteContent";

export default function OpetStrip() {
  const { strip } = useSiteContent();

  if (!strip) return null;

  return (
    <div className="bg-opblue h-[52px] flex items-center justify-between px-10 border-y border-white/8">
      <p className="font-condensed font-black text-xl uppercase text-white tracking-wide">
        {strip.text} <span className="text-orange">{strip.accent}</span>
      </p>
      <div className="flex items-center gap-2.5">
        <span className="bg-orange text-white font-condensed font-black text-xl tracking-widest px-3.5 py-1 rounded">
          {strip.badge}
        </span>
        <span className="text-sm text-white/60 font-medium">{strip.sub}</span>
      </div>
    </div>
  );
}