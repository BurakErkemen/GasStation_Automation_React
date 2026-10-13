import { NavLink, Outlet } from "react-router-dom";

export default function SiteSettings() {
  return <div>
    <h1 className="font-condensed font-black text-3xl text-gray-800 mb-4">Site Ayarları</h1>
    <nav className="flex flex-wrap gap-2 mb-6">
      {[["fuel", "Yakıt Fiyatları"], ["content", "Site İçeriği"], ["contact", "İletişim & Harita"]].map(([path, label]) =>
        <NavLink key={path} to={path} className={({ isActive }) => `px-4 py-2 rounded-lg text-sm ${isActive ? "bg-opblue text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{label}</NavLink>)}
    </nav>
    <Outlet />
  </div>;
}
