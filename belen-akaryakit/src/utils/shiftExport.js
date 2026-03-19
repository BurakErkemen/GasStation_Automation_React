import * as XLSX from "xlsx";

const fmt = (n) => Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });

export function exportShiftToExcel(shift, employees) {
  const wb = XLSX.utils.book_new();
  const sum = shift.summary || {};

  const empNames = (shift.employees || [])
    .map(id => employees.find(e => e.id === id)?.name || id)
    .join(", ");

  // ── SAYFA 1: Özet ──────────────────────────────
  const ozet = [
    ["KAHRAMANLAR BELEN AKARYAKIT"],
    ["VARDİYA RAPORU"],
    [],
    ["Tarih",          shift.date],
    ["Vardiya",        shift.period],
    ["Durum",          shift.status === "open" ? "Açık" : "Kapalı"],
    ["Çalışanlar",     empNames || "—"],
    [],
    ["── SATIŞ ÖZETİ ──"],
    ["Pompa Toplamı (₺)",     sum.fuelTotal    || 0],
    ["Nakit Satış (₺)",       sum.cashSales    || 0],
    ["Kredi Kartı (₺)",       sum.cardSales    || 0],
    ["Otobil (₺)",            sum.otobilTotal  || 0],
    ["Veresiye (₺)",          sum.creditTotal  || 0],
    [],
    ["── KASA ──"],
    ["Vardiya Başı (₺)",      sum.opening      || 0],
    ["Tahsilat Nakit (₺)",    sum.collectedCash|| 0],
    ["Tahsilat Kart (₺)",     sum.collectedCard|| 0],
    ["Harcamalar (₺)",        sum.expenses     || 0],
    ["Vardiya Sonu Sayım (₺)",sum.closing      || 0],
    ["Olması Gereken (₺)",    sum.expectedCash || 0],
    ["Kasa Farkı (₺)",        sum.cashDiff     || 0],
    [],
    ["── YAKLAŞIK BANKA ──"],
    ["Beklenen Banka (₺)",    sum.expectedBank || 0],
  ];

  const wsOzet = XLSX.utils.aoa_to_sheet(ozet);
  wsOzet["!cols"] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsOzet, "Özet");

  // ── SAYFA 2: Yakıt Satışları ───────────────────
  const fuelRows = [
    ["Yakıt Türü", "Litre", "Tutar (₺)"],
    ...["benzin", "dizel", "eurodiesel", "lpg"].map(f => [
      { benzin: "Benzin", dizel: "Dizel", eurodiesel: "Eurodiesel", lpg: "LPG" }[f],
      shift.fuelSales?.[f]?.liters || 0,
      shift.fuelSales?.[f]?.amount || 0,
    ]),
    [],
    ["TOPLAM", "", { f: "SUM(C2:C5)" }],
  ];
  const wsFuel = XLSX.utils.aoa_to_sheet(fuelRows);
  wsFuel["!cols"] = [{ wch: 16 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsFuel, "Yakıt Satışları");

  // ── SAYFA 3: Otobil ────────────────────────────
  const otobilRows = [
    ["Fiş No", "Plaka", "Litre", "Tutar (₺)", "Not"],
    ...(shift.sales?.otobil || []).map(o => [
      o.fisNo, o.plate, o.liters, o.amount, o.note
    ]),
  ];
  const wsOtobil = XLSX.utils.aoa_to_sheet(otobilRows);
  wsOtobil["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsOtobil, "Otobil");

  // ── SAYFA 4: Veresiye ──────────────────────────
  const veresiyeRows = [
    ["Müşteri", "Plaka", "Fiş No", "Litre", "Tutar (₺)", "Not"],
    ...(shift.creditSales || []).map(c => [
      c.customerName, c.plate, c.fisNo, c.liters, c.amount, c.note
    ]),
  ];
  const wsVeresiye = XLSX.utils.aoa_to_sheet(veresiyeRows);
  wsVeresiye["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsVeresiye, "Veresiye");

  // ── SAYFA 5: Tahsilatlar ───────────────────────
  const tahsilatRows = [
    ["Müşteri", "Fiş No", "Tutar (₺)", "Yöntem", "Not"],
    ...(shift.debtCollections || []).map(c => [
      c.customerName, c.fisNo, c.amount,
      c.method === "cash" ? "Nakit" : "Kredi Kartı",
      c.note
    ]),
  ];
  const wsTahsilat = XLSX.utils.aoa_to_sheet(tahsilatRows);
  wsTahsilat["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsTahsilat, "Tahsilatlar");

  // ── SAYFA 6: Harcamalar ────────────────────────
  const harcamaRows = [
    ["Açıklama", "Tutar (₺)"],
    ...(shift.cash?.expenses || []).map(e => [e.description, e.amount]),
    [],
    ["TOPLAM", { f: `SUM(B2:B${(shift.cash?.expenses?.length || 0) + 1})` }],
  ];
  const wsHarcama = XLSX.utils.aoa_to_sheet(harcamaRows);
  wsHarcama["!cols"] = [{ wch: 28 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsHarcama, "Harcamalar");

  // ── İndir ──────────────────────────────────────
  XLSX.writeFile(wb, `Vardiya_${shift.date}_${shift.period}.xlsx`);
}