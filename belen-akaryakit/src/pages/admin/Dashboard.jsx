import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useNavigate } from "react-router-dom";

function StatCard({ label, value, sub, color = "text-opblue", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-5 ${onClick ? "cursor-pointer hover:border-opblue/30 hover:shadow-md transition-all" : ""}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className={`font-condensed font-black text-3xl ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-5 bg-opblue rounded" />
      <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wide">{children}</h3>
    </div>
  );
}

const fmt = (n) => Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading,   setLoading]   = useState(true);
  const [shifts,    setShifts]    = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [invoices,  setInvoices]  = useState([]);
  const [payments,  setPayments]  = useState([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [sSnap, cSnap, eSnap, iSnap, pSnap] = await Promise.all([
      getDocs(query(collection(db, "shifts"),    orderBy("date", "desc"))),
      getDocs(collection(db, "customers")),
      getDocs(collection(db, "employees")),
      getDocs(collection(db, "invoices")),
      getDocs(collection(db, "payments")),
    ]);
    setShifts(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCustomers(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setEmployees(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setInvoices(iSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setPayments(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  if (loading) return (
    <div className="text-sm text-gray-400 py-10 text-center">Yükleniyor...</div>
  );

  // ── Hesaplamalar ───────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  // Vardiya istatistikleri
  const openShifts    = shifts.filter(s => s.status === "open");
  const todayShifts   = shifts.filter(s => s.date === today);
  const monthShifts   = shifts.filter(s => s.date?.startsWith(thisMonth));
  const monthRevenue  = monthShifts.reduce((s, sh) => s + (Number(sh.summary?.fuelTotal) || 0), 0);
  const monthCashDiff = monthShifts.reduce((s, sh) => s + (Number(sh.summary?.cashDiff) || 0), 0);

  // Müşteri istatistikleri — veresiye bakiye
  function getBalance(customerId) {
    let debt = 0, collected = 0;
    shifts.forEach(sh => {
      (sh.creditSales || []).forEach(c => { if (c.customerId === customerId) debt += Number(c.amount) || 0; });
      (sh.debtCollections || []).forEach(c => { if (c.customerId === customerId) collected += Number(c.amount) || 0; });
    });
    return debt - collected;
  }
  const debtors       = customers.filter(c => getBalance(c.id) > 0);
  const totalDebt     = debtors.reduce((s, c) => s + getBalance(c.id), 0);

  // Fatura istatistikleri
  const pendingInvoices = invoices.filter(i => i.status === "pending");
  const pendingTotal    = pendingInvoices.reduce((s, i) => s + (Number(i.total) || 0), 0);

  // Son 5 vardiya
  const recentShifts = shifts.slice(0, 5);

  // Aylık yakıt kırılımı
  const monthFuelBreakdown = ["benzin", "dizel", "eurodiesel", "lpg"].map(f => ({
    label: { benzin: "Benzin", dizel: "Dizel", eurodiesel: "Eurodiesel", lpg: "LPG" }[f],
    liters: monthShifts.reduce((s, sh) => s + (Number(sh.fuelSales?.[f]?.liters) || 0), 0),
    amount: monthShifts.reduce((s, sh) => s + (Number(sh.fuelSales?.[f]?.amount) || 0), 0),
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-condensed font-black text-3xl uppercase text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* ── Üst istatistikler ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Bu Ay Ciro"
          value={`₺${fmt(monthRevenue)}`}
          sub={`${monthShifts.length} vardiya`}
          color="text-opblue" />
        <StatCard
          label="Açık Vardiya"
          value={openShifts.length}
          sub={openShifts.length > 0 ? openShifts.map(s => s.period).join(", ") : "Yok"}
          color={openShifts.length > 0 ? "text-green-600" : "text-gray-400"}
          onClick={() => navigate("/admin/shifts")} />
        <StatCard
          label="Toplam Veresiye"
          value={`₺${fmt(totalDebt)}`}
          sub={`${debtors.length} borçlu müşteri`}
          color={totalDebt > 0 ? "text-orange" : "text-gray-400"}
          onClick={() => navigate("/admin/customers")} />
        <StatCard
          label="Bekleyen Fatura"
          value={`₺${fmt(pendingTotal)}`}
          sub={`${pendingInvoices.length} fatura`}
          color={pendingTotal > 0 ? "text-red-500" : "text-gray-400"}
          onClick={() => navigate("/admin/invoices")} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* ── Bu Ay Kasa Özeti ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionTitle>Bu Ay Kasa Özeti</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Toplam Ciro",     value: `₺${fmt(monthRevenue)}`,                                   color: "text-opblue"   },
              { label: "Nakit Satış",     value: `₺${fmt(monthShifts.reduce((s,sh)=>s+(Number(sh.summary?.cashSales)||0),0))}`,   color: "text-green-600"},
              { label: "Kredi Kartı",     value: `₺${fmt(monthShifts.reduce((s,sh)=>s+(Number(sh.summary?.cardSales)||0),0))}`,   color: "text-sky-600"  },
              { label: "Toplam Harcama",  value: `₺${fmt(monthShifts.reduce((s,sh)=>s+(Number(sh.summary?.expenses)||0),0))}`,    color: "text-red-500"  },
              { label: "Toplam Tahsilat", value: `₺${fmt(monthShifts.reduce((s,sh)=>s+(Number(sh.summary?.collectedCash||0)+Number(sh.summary?.collectedCard||0)),0))}`, color: "text-green-500"},
              { label: "Kasa Farkı",      value: `${monthCashDiff>0?"+":""}₺${fmt(monthCashDiff)}`,
                color: monthCashDiff > 0 ? "text-yellow-500" : monthCashDiff < 0 ? "text-red-500" : "text-gray-400" },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                <p className={`font-condensed font-black text-xl ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Aylık Yakıt Kırılımı ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionTitle>Bu Ay Yakıt Kırılımı</SectionTitle>
          <div className="space-y-3">
            {monthFuelBreakdown.map(f => {
              const pct = monthRevenue > 0 ? (f.amount / monthRevenue) * 100 : 0;
              return (
                <div key={f.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{f.label}</span>
                    <div className="flex gap-4 text-gray-500">
                      <span>{f.liters.toLocaleString("tr-TR")} lt</span>
                      <span className="font-semibold text-gray-800">₺{fmt(f.amount)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-opblue rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* ── Son Vardiyalar ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <SectionTitle>Son Vardiyalar</SectionTitle>
            <button onClick={() => navigate("/admin/shifts")}
              className="text-xs text-opblue font-semibold hover:underline">
              Tümü →
            </button>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {recentShifts.length === 0 && (
                <tr><td className="px-5 py-6 text-center text-gray-400 text-xs">Vardiya kaydı yok.</td></tr>
              )}
              {recentShifts.map(s => {
                const empNames = (s.employees || [])
                  .map(id => employees.find(e => e.id === id)?.name || id)
                  .join(", ");
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate("/admin/shifts")}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{s.date}</p>
                      <p className="text-xs text-gray-400">{empNames || "—"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="bg-opblue/10 text-opblue text-xs font-bold px-2 py-0.5 rounded">
                        {s.period}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <p className="font-semibold">₺{fmt(s.summary?.fuelTotal)}</p>
                      <p className={`text-xs font-bold
                        ${(s.summary?.cashDiff||0) > 0 ? "text-yellow-500" :
                          (s.summary?.cashDiff||0) < 0 ? "text-red-500" : "text-gray-400"}`}>
                        {(s.summary?.cashDiff||0) > 0 ? "+" : ""}
                        {fmt(s.summary?.cashDiff)} ₺
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded
                        ${s.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.status === "open" ? "Açık" : "Kapalı"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Borçlu Müşteriler ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <SectionTitle>Borçlu Müşteriler</SectionTitle>
            <button onClick={() => navigate("/admin/customers")}
              className="text-xs text-opblue font-semibold hover:underline">
              Tümü →
            </button>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {debtors.length === 0 && (
                <tr><td className="px-5 py-6 text-center text-gray-400 text-xs">Borçlu müşteri yok.</td></tr>
              )}
              {debtors
                .sort((a, b) => getBalance(b.id) - getBalance(a.id))
                .slice(0, 5)
                .map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate("/admin/customers")}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{c.name}</p>
                      {c.plate && <p className="text-xs text-gray-400">{c.plate}</p>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-orange">
                        ₺{fmt(getBalance(c.id))}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Alt istatistikler ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Toplam Müşteri"  value={customers.length}  color="text-opblue"   onClick={() => navigate("/admin/customers")} />
        <StatCard label="Toplam Çalışan"  value={employees.length}  color="text-green-600" onClick={() => navigate("/admin/employees")} />
        <StatCard label="Toplam Fatura"   value={invoices.length}   color="text-orange"   onClick={() => navigate("/admin/invoices")} />
        <StatCard label="Toplam Vardiya"  value={shifts.length}     color="text-opblue"   onClick={() => navigate("/admin/shifts")} />
      </div>
    </div>
  );
}