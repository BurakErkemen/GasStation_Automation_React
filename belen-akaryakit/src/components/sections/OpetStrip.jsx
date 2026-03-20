import { useSiteContent } from "../../hooks/useSiteContent";

export default function OpetStrip() {
  const { strip } = useSiteContent();

  if (!strip) return null;

  return (
    <div className="bg-opblue flex items-center justify-between px-5 md:px-10 py-3 md:h-[52px] border-y border-white/8 gap-3">
      <p className="font-condensed font-black text-base md:text-xl uppercase text-white tracking-wide">
        {strip.text}{" "}
        <span className="text-orange">{strip.accent}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className="bg-orange text-white font-condensed font-black text-base md:text-xl tracking-widest px-2.5 md:px-3.5 py-0.5 md:py-1 rounded">
          {strip.badge}
        </span>
        <span className="hidden sm:block text-xs md:text-sm text-white/60 font-medium">
          {strip.sub}
        </span>
      </div>
    </div>
  );
}