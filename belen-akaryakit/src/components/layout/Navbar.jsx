import { useEffect, useMemo, useState } from "react";
import { siteConfig } from "../../config/siteConfig";

const { navbar, firmName, location } = siteConfig;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const navLinks = useMemo(
    () => navbar.links.filter((l) => l.href.startsWith("#")),
    []
  );

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = navLinks
      .map((link) => {
        const id = link.href.replace("#", "");
        return document.getElementById(id);
      })
      .filter((section) => section !== null);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveSection(`#${visible[0].target.id}`);
        }
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0.2, 0.35, 0.5, 0.7],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, [navLinks]);

  return (
    <nav
      className={[
        "sticky top-0 z-50 border-b border-white/10 bg-[#08111d]/92 backdrop-blur-xl transition-all duration-300",
        scrolled ? "shadow-[0_14px_34px_rgba(0,0,0,0.28)]" : "",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 lg:px-10 transition-all duration-300",
          scrolled ? "h-[68px]" : "h-[82px]",
        ].join(" ")}
      >
        <a
          href="#home"
          className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06]"
        >
          <div className="flex items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            <img
              src="/logo.jpg"
              alt={`${firmName} logosu`}
              className={[
                "rounded-lg object-cover transition-all duration-300",
                scrolled ? "h-10 w-10" : "h-12 w-12",
              ].join(" ")}
            />
          </div>

          <div className="hidden h-9 w-px bg-white/10 sm:block" />

          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold tracking-[0.01em] text-white">
              {firmName}
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/40">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange/80" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-3">
          <ul className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
            {navbar.links.map((l) => {
              const isHashLink = l.href.startsWith("#");
              const isActive = isHashLink && activeSection === l.href;

              return (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className={[
                      "inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-orange/15 text-white shadow-[inset_0_0_0_1px_rgba(249,115,22,0.35)]"
                        : "text-white/65 hover:bg-white/[0.07] hover:text-white",
                    ].join(" ")}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
          </ul>

          {navbar.instagram && (
            <a
              href={navbar.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/70 shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
            >
              <span className="text-base leading-none">◎</span>
              <span>{navbar.instagram.label}</span>
            </a>
          )}
        </div>

        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Menüyü aç veya kapat"
          aria-expanded={open}
          className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
        >
          <div className="relative h-5 w-5">
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-5 -translate-y-[7px] rounded bg-current transition-all duration-300 ${
                open ? "translate-y-0 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-5 rounded bg-current transition-all duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-5 translate-y-[7px] rounded bg-current transition-all duration-300 ${
                open ? "translate-y-0 -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </div>

      <div
        className={`md:hidden transition-all duration-300 ease-out ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`mx-4 mb-4 origin-top overflow-hidden rounded-2xl border border-white/10 bg-[#0b1523]/98 shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition-all duration-300 ${
            open ? "max-h-[520px] translate-y-0" : "max-h-0 -translate-y-2"
          }`}
        >
          <div className="border-b border-white/10 px-4 py-4 sm:hidden">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-1.5">
                <img
                  src="/logo.jpg"
                  alt={`${firmName} logosu`}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {firmName}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/40">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange/80" />
                  <span className="truncate">{location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3">
            <div className="flex flex-col gap-1">
              {navbar.links.map((l) => {
                const isHashLink = l.href.startsWith("#");
                const isActive = isHashLink && activeSection === l.href;

                return (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-orange/15 text-white shadow-[inset_0_0_0_1px_rgba(249,115,22,0.35)]"
                        : "text-white/70 hover:bg-white/[0.06] hover:text-white",
                    ].join(" ")}
                  >
                    {l.label}
                  </a>
                );
              })}
            </div>

            {navbar.instagram && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <a
                  href={navbar.instagram.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/75 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
                >
                  <span>◎</span>
                  <span>{navbar.instagram.label}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}