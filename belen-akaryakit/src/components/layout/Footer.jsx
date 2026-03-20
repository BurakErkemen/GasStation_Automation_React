import { Link } from "react-router-dom";
import { siteConfig } from "../../config/siteConfig";

const { footer, navbar } = siteConfig;

export default function Footer() {
  return (
    <footer className="bg-navy border-t border-white/10 flex flex-col gap-4 px-6 py-5 md:px-10 md:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-orange text-white font-condensed font-black text-sm tracking-widest px-3 py-1 rounded">
            {navbar.brand}
          </span>
          <span className="text-xs text-white/35">{footer.copy}</span>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          {footer.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-xs text-white/40 hover:text-white/85 transition-colors duration-200 font-medium"
            >
              {l.label}
            </a>
          ))}

          <Link
            to="/admin/login"
            title="Yonetim Girisi"
            aria-label="Yonetim Girisi"
            className="text-xs text-white/10 hover:text-white/30 transition-colors duration-500 select-none"
          >
            o
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-white/25">
          Web sitesi hazirlayan
        </span>

        <a
          href={footer.credit.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition-all duration-300 hover:border-white/25 hover:bg-white/10 hover:-translate-y-0.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold">
            CY
          </span>

          <span className="flex flex-col leading-tight">
            <span className="text-[11px] text-white/35">Powered by</span>
            <span className="text-sm font-semibold text-white/75 transition-colors duration-300 group-hover:text-white">
              {footer.credit.label}
            </span>
          </span>

          <span className="text-xs text-white/30 transition-transform duration-300 group-hover:translate-x-1">
            &rarr;
          </span>
        </a>
      </div>
    </footer>
  );
}