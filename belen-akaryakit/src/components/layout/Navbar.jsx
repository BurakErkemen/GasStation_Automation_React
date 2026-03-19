import { useState } from "react";
import { siteConfig } from "../../config/siteConfig";

const { navbar, firmName, location } = siteConfig;

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-navy border-b border-white/5">
      <div className="flex items-center justify-between h-16 px-5 md:px-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="bg-orange text-white font-condensed font-black text-lg tracking-widest px-4 py-1 rounded">
            {navbar.brand}
          </span>
          <div className="w-px h-7 bg-white/10 hidden sm:block" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white leading-tight">{firmName}</p>
            <p className="text-xs text-white/40 mt-0.5">{location}</p>
          </div>
        </div>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1 list-none">
          {navbar.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-sm font-medium text-white/60 px-3 py-1.5 rounded hover:text-white hover:bg-white/7 transition-colors">
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href={navbar.cta.href} className="text-sm font-semibold text-white bg-orange px-4 py-2 rounded hover:opacity-90 transition-opacity ml-2">
              {navbar.cta.label}
            </a>
          </li>
        </ul>

        {/* Hamburger */}
        <button onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2">
          <span className={`w-6 h-0.5 bg-white transition-all ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`w-6 h-0.5 bg-white transition-all ${open ? "opacity-0" : ""}`} />
          <span className={`w-6 h-0.5 bg-white transition-all ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-navy border-t border-white/5 px-5 py-4 flex flex-col gap-2">
          {navbar.links.map((l) => (
            <a key={l.href} href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-white/70 py-2 border-b border-white/5">
              {l.label}
            </a>
          ))}
          <a href={navbar.cta.href}
            onClick={() => setOpen(false)}
            className="mt-2 text-sm font-semibold text-white bg-orange px-4 py-2.5 rounded text-center">
            {navbar.cta.label}
          </a>
        </div>
      )}
    </nav>
  );
}