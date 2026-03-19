export function printShift(shift, employees, summary) {
  const empNames = (shift.employees || [])
    .map(id => employees.find(e => e.id === id)?.name || id)
    .join(", ");

  const fmt = (n) => Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });

  const fuelRows = ["benzin", "dizel", "eurodiesel", "lpg"].map(f => `
    <tr>
      <td>${{ benzin:"Benzin", dizel:"Dizel", eurodiesel:"Eurodiesel", lpg:"LPG" }[f]}</td>
      <td>${shift.fuelSales?.[f]?.liters || "—"}</td>
      <td>₺${fmt(shift.fuelSales?.[f]?.amount)}</td>
    </tr>`).join("");

  const otobilRows = (shift.sales?.otobil || []).map(o => `
    <tr>
      <td>${o.fisNo || "—"}</td>
      <td>${o.plate || "—"}</td>
      <td>${o.liters || "—"}</td>
      <td>₺${fmt(o.amount)}</td>
      <td>${o.note || "—"}</td>
    </tr>`).join("");

  const veresiyeRows = (shift.creditSales || []).map(c => `
    <tr>
      <td>${c.customerName || "—"}</td>
      <td>${c.plate || "—"}</td>
      <td>${c.fisNo || "—"}</td>
      <td>${c.liters || "—"}</td>
      <td>₺${fmt(c.amount)}</td>
    </tr>`).join("");

  const tahsilatRows = (shift.debtCollections || []).map(c => `
    <tr>
      <td>${c.customerName || "—"}</td>
      <td>${c.fisNo || "—"}</td>
      <td>₺${fmt(c.amount)}</td>
      <td>${c.method === "cash" ? "Nakit" : "Kredi Kartı"}</td>
    </tr>`).join("");

  const harcamaRows = (shift.cash?.expenses || []).map(e => `
    <tr>
      <td>${e.description || "—"}</td>
      <td>₺${fmt(e.amount)}</td>
    </tr>`).join("");

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Vardiya Raporu — ${shift.date} ${shift.period}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #003DA5; padding-bottom: 12px; }
        .brand { display: flex; align-items: center; gap: 10px; }
        .opet-badge { background: #E8720C; color: #fff; font-weight: 900; font-size: 16px; padding: 4px 12px; border-radius: 4px; letter-spacing: 2px; }
        .firm { font-weight: 700; font-size: 13px; }
        .shift-info { text-align: right; }
        .shift-info h2 { font-size: 16px; color: #003DA5; font-weight: 900; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .section { margin-bottom: 16px; }
        .section-title { font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #003DA5; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { text-align: left; padding: 4px 6px; background: #f3f4f6; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
        td { padding: 4px 6px; border-bottom: 1px solid #f3f4f6; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; }
        .summary-card .label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 2px; }
        .summary-card .value { font-size: 14px; font-weight: 900; color: #003DA5; }
        .summary-card.diff-pos .value { color: #16a34a; }
        .summary-card.diff-neg .value { color: #dc2626; }
        .meta-row { display: flex; gap: 24px; margin-bottom: 12px; }
        .meta-item .meta-label { font-size: 8px; text-transform: uppercase; color: #9ca3af; }
        .meta-item .meta-value { font-weight: 600; font-size: 11px; }
        @media print { body { padding: 16px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">
          <div class="opet-badge">OPET</div>
          <div>
            <div class="firm">Kahramanlar Belen Akaryakıt</div>
            <div style="color:#6b7280;font-size:10px">Hatay / Belen</div>
          </div>
        </div>
        <div class="shift-info">
          <h2>Vardiya Raporu</h2>
          <div style="color:#6b7280">${shift.date} · ${shift.period}</div>
          <div style="margin-top:4px">
            <span style="background:${shift.status==='open'?'#dcfce7':'#f3f4f6'};color:${shift.status==='open'?'#16a34a':'#6b7280'};padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700">
              ${shift.status === "open" ? "Açık" : "Kapalı"}
            </span>
          </div>
        </div>
      </div>

      <div class="meta-row">
        <div class="meta-item">
          <div class="meta-label">Çalışanlar</div>
          <div class="meta-value">${empNames || "—"}</div>
        </div>
      </div>

      <!-- Özet -->
      <div class="section">
        <div class="section-title">Gün Sonu Özeti</div>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">Pompa Toplamı</div>
            <div class="value">₺${fmt(summary.fuelTotal)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Nakit Satış</div>
            <div class="value">₺${fmt(summary.cashSales)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Kredi Kartı</div>
            <div class="value">₺${fmt(summary.cardSales)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Otobil</div>
            <div class="value">₺${fmt(summary.otobilTotal)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Veresiye</div>
            <div class="value" style="color:#E8720C">₺${fmt(summary.creditTotal)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Tahsilat</div>
            <div class="value" style="color:#16a34a">₺${fmt(summary.collectedCash + summary.collectedCard)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Olması Gereken</div>
            <div class="value">₺${fmt(summary.expectedCash)}</div>
          </div>
          <div class="summary-card ${summary.cashDiff > 0 ? 'diff-pos' : summary.cashDiff < 0 ? 'diff-neg' : ''}">
            <div class="label">Kasa Farkı</div>
            <div class="value">${summary.cashDiff > 0 ? '+' : ''}₺${fmt(summary.cashDiff)}</div>
          </div>
        </div>
      </div>

      <div class="grid2">
        <!-- Yakıt Satışları -->
        <div class="section">
          <div class="section-title">Yakıt Satışları</div>
          <table>
            <thead><tr><th>Tür</th><th>Litre</th><th>Tutar</th></tr></thead>
            <tbody>${fuelRows}</tbody>
          </table>
        </div>

        <!-- Kasa -->
        <div class="section">
          <div class="section-title">Kasa</div>
          <table>
            <tbody>
              <tr><td>Vardiya Başı</td><td>₺${fmt(summary.opening)}</td></tr>
              <tr><td>Nakit Tahsilat</td><td>₺${fmt(summary.collectedCash)}</td></tr>
              <tr><td>Harcamalar</td><td>₺${fmt(summary.expenses)}</td></tr>
              <tr><td>Vardiya Sonu Sayım</td><td>₺${fmt(summary.closing)}</td></tr>
              <tr style="font-weight:700"><td>Kasa Farkı</td><td style="color:${summary.cashDiff>=0?'#16a34a':'#dc2626'}">${summary.cashDiff>0?'+':''}₺${fmt(summary.cashDiff)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      ${(shift.sales?.otobil?.length > 0) ? `
      <div class="section">
        <div class="section-title">Otobil Satışları</div>
        <table>
          <thead><tr><th>Fiş No</th><th>Plaka</th><th>Litre</th><th>Tutar</th><th>Not</th></tr></thead>
          <tbody>${otobilRows}</tbody>
        </table>
      </div>` : ""}

      ${(shift.creditSales?.length > 0) ? `
      <div class="section">
        <div class="section-title">Veresiye Satışlar</div>
        <table>
          <thead><tr><th>Müşteri</th><th>Plaka</th><th>Fiş No</th><th>Litre</th><th>Tutar</th></tr></thead>
          <tbody>${veresiyeRows}</tbody>
        </table>
      </div>` : ""}

      ${(shift.debtCollections?.length > 0) ? `
      <div class="section">
        <div class="section-title">Veresiye Tahsilatlar</div>
        <table>
          <thead><tr><th>Müşteri</th><th>Fiş No</th><th>Tutar</th><th>Yöntem</th></tr></thead>
          <tbody>${tahsilatRows}</tbody>
        </table>
      </div>` : ""}

      ${(shift.cash?.expenses?.length > 0) ? `
      <div class="section">
        <div class="section-title">Ek Harcamalar</div>
        <table>
          <thead><tr><th>Açıklama</th><th>Tutar</th></tr></thead>
          <tbody>${harcamaRows}</tbody>
        </table>
      </div>` : ""}

      <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:8px;color:#9ca3af;font-size:9px;text-align:center">
        Kahramanlar Belen Akaryakıt · Rapor tarihi: ${new Date().toLocaleString("tr-TR")}
      </div>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}