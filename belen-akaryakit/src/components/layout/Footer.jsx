import { siteConfig } from "../../config/siteConfig";

const { footer, navbar } = siteConfig;

export default function Footer() {
  return (
    <footer className="bg-navy flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 md:px-10">
      <div className="flex items-center gap-3">
        <span className="bg-orange text-white font-condensed font-black text-sm tracking-widest px-3 py-1 rounded">
          {navbar.brand}
        </span>
        <span className="text-xs text-white/35">{footer.copy}</span>
      </div>
      <div className="flex gap-5">
        {footer.links.map((l) => (
          <a key={l.href} href={l.href} className="text-xs text-white/40 hover:text-white/85 transition-colors font-medium">
            {l.label}
          </a>
        ))}
      </div>
    </footer>
  );
}