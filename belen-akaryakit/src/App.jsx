import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import Navbar     from "./components/layout/Navbar";
import Footer     from "./components/layout/Footer";
import Hero       from "./components/sections/Hero";
import FuelPrices from "./components/sections/FuelPrices";
import OpetStrip  from "./components/sections/OpetStrip";
import About      from "./components/sections/About";
import Services   from "./components/sections/Services";
import Contact    from "./components/sections/Contact";

import LoginPage    from "./pages/LoginPage";
import AdminLayout  from "./pages/admin/AdminLayout";
import Dashboard    from "./pages/admin/Dashboard";
import Shifts from "./pages/admin/Shifts";
import AdminContact from "./pages/admin/Contact";
import SiteContent from "./pages/admin/SiteContent";
import Customers from "./pages/admin/Customers";
import AdminFuelPrices from "./pages/admin/FuelPrices";
import Employees from "./pages/admin/Employees";
import Invoices from "./pages/admin/Invoices";
import Payments from "./pages/admin/Payments";
import Suppliers from "./pages/admin/Suppliers";

function HomePage() {
  return (
    <div className="font-barlow">
      <Navbar />
      <Hero />
      <FuelPrices />
      <OpetStrip />
      <About />
      <Services />
      <Contact />
      <Footer />
    </div>
  );
}

function AdminRoutes() {
  return (
    <ProtectedRoute>
      <AdminLayout />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminRoutes />}>
            <Route index element={<Dashboard />} />
            <Route path="shifts" element={<Shifts />} />
            <Route path="contact" element={<AdminContact />} />
            <Route path="content" element={<SiteContent />} />
            <Route path="customers" element={<Customers />} />
            <Route path="fuel" element={<AdminFuelPrices />} />
            <Route path="employees" element={<Employees />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="payments" element={<Payments />} />
            <Route path="suppliers" element={<Suppliers />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}