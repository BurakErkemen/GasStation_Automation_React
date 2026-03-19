import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { label: "Dashboard",         href: "/admin",               icon: "▦" },
  { label: "Yakıt Fiyatları",   href: "/admin/fuel",          icon: "⛽" },
  { label: "Site İçeriği",      href: "/admin/content",       icon: "✏️" },
  { label: "İletişim & Harita", href: "/admin/contact",       icon: "📍" },
  { label: "Vardiyalar",        href: "/admin/shifts",        icon: "🕐" },
  { label: "Müşteriler",        href: "/admin/customers",     icon: "👥" },
  { label: "Çalışanlar",        href: "/admin/employees",     icon: "👤" },
  { label: "Faturalar",         href: "/admin/invoices",      icon: "🧾" },
  { label: "Ödemeler",          href: "/admin/payments",      icon: "💳" },
  { label: "Tedarikçiler",      href: "/admin/suppliers",     icon: "🏭" },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Mobilde kapalı, masaüstünde açık başla
  const [collapsed,    setCollapsed]    = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  // Rota değişince mobil menüyü kapat
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/admin/login");
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 h-16 px-4 border-b border-white/5 flex-shrink-0
        ${collapsed ? "justify-center" : ""}`}>
        <span className="bg-orange text-white font-condensed font-black text-base tracking-widest px-3 py-1 rounded flex-shrink-0">
          OPET
        </span>
        {!collapsed && (
          <span className="text-xs text-white/50 font-medium leading-tight">
            Admin<br />Paneli
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} to={item.href} end={item.href === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors mx-2 rounded-lg mb-0.5
              ${isActive
                ? "bg-opblue text-white font-semibold"
                : "text-white/50 hover:text-white hover:bg-white/5"}`
            }>
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Çıkış */}
      <div className="flex-shrink-0 border-t border-white/5 p-4">
        {!collapsed && (
          <p className="text-xs text-white/30 truncate mb-3">{user?.email}</p>
        )}
        <button onClick={handleLogout}
          className={`flex items-center gap-2 text-xs font-medium text-white/40
            hover:text-red-400 bg-white/5 hover:bg-red-400/10 transition-colors
            rounded-lg px-3 py-2 w-full ${collapsed ? "justify-center" : ""}`}>
          <span>🚪</span>
          {!collapsed && "Çıkış Yap"}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 font-barlow">

      {/* ── Masaüstü Sidebar ── */}
      <aside className={`hidden md:flex flex-col bg-navy border-r border-white/5
        transition-all duration-200 h-screen sticky top-0 flex-shrink-0
        ${collapsed ? "w-16" : "w-56"}`}>
        <SidebarContent />
      </aside>

      {/* ── Mobil Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Mobil Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-navy border-r border-white/5
        z-50 flex flex-col transition-transform duration-200 md:hidden
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* ── Ana İçerik ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center
          justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-30">
          <button
            onClick={() => {
              if (window.innerWidth >= 768) {
                setCollapsed(!collapsed);
              } else {
                setMobileOpen(!mobileOpen);
              }
            }}
            className="flex flex-col gap-1.5 p-1.5 text-gray-400 hover:text-gray-600">
            <span className="w-5 h-0.5 bg-current rounded" />
            <span className="w-5 h-0.5 bg-current rounded" />
            <span className="w-5 h-0.5 bg-current rounded" />
          </button>

          {/* Mobilde logo */}
          <span className="md:hidden font-condensed font-black text-navy text-lg tracking-widest">
            OPET <span className="text-xs font-sans font-normal text-gray-400">Admin</span>
          </span>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-opblue flex items-center justify-center
              text-white text-xs font-bold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Sayfa içeriği */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}