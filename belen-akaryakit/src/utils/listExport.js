import * as XLSX from "xlsx";

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// sheets: [{ name, columns, rows }] (tablo) veya [{ name, aoa, cols }] (ham satırlar, shiftExport.js ile aynı desen)
export function exportWorkbookToExcel(filename, sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, columns, rows, aoa, cols }) => {
    const ws = aoa
      ? XLSX.utils.aoa_to_sheet(aoa)
      : XLSX.utils.aoa_to_sheet([columns.map(c => c.header), ...rows.map(row => columns.map(c => c.value(row)))]);
    ws["!cols"] = cols || (columns ? columns.map(c => ({ wch: c.width || 16 })) : undefined);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// columns: [{ header, value(row), width, align }]
export function exportListToExcel(filename, sheetName, columns, rows) {
  exportWorkbookToExcel(filename, [{ name: sheetName, columns, rows }]);
}

function renderTable(columns, rows, summary) {
  const rowsHtml = rows.map(row => `
    <tr>${columns.map(c =>
      `<td style="text-align:${c.align || "left"}">${escapeHtml(c.value(row) ?? "—")}</td>`
    ).join("")}</tr>
  `).join("");

  return `
    <table>
      <thead><tr>${columns.map(c => `<th style="text-align:${c.align || "left"}">${escapeHtml(c.header)}</th>`).join("")}</tr></thead>
      <tbody>${rowsHtml || `<tr><td colspan="${columns.length}" style="text-align:center;color:#999;padding:16px">Kayıt bulunamadı.</td></tr>`}</tbody>
      ${summary ? `<tfoot><tr>${summary.map(s => `<td style="text-align:${s.align || "left"}">${escapeHtml(s.value)}</td>`).join("")}</tr></tfoot>` : ""}
    </table>
  `;
}

// info: [{ label, value }] — üstte özet/bilgi kartı
// sections: [{ heading, columns, rows, summary }] — her biri kendi başlığıyla ayrı tablo
export function printDocument({ title, subtitle, info, sections }) {
  const win = window.open("", "_blank", "width=1000,height=800");
  if (!win) {
    alert("Yazdırma penceresi açılamadı. Tarayıcının pop-up engelleyicisini kontrol edin.");
    return;
  }

  const infoHtml = info?.length ? `
    <div class="info-grid">
      ${info.map(i => `
        <div class="info-item">
          <p class="info-label">${escapeHtml(i.label)}</p>
          <p class="info-value">${escapeHtml(i.value ?? "—")}</p>
        </div>
      `).join("")}
    </div>
  ` : "";

  const sectionsHtml = (sections || []).map(s => `
    ${s.heading ? `<h2>${escapeHtml(s.heading)}</h2>` : ""}
    ${renderTable(s.columns, s.rows, s.summary)}
  `).join("");

  const totalRows = (sections || []).reduce((s, sec) => s + sec.rows.length, 0);

  win.document.write(`
    <!doctype html>
    <html lang="tr">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 32px; }
        h1 { font-size: 18px; margin: 0 0 2px; }
        h2 { font-size: 13px; margin: 24px 0 8px; }
        h2:first-of-type { margin-top: 20px; }
        .subtitle { font-size: 12px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; }
        th { background: #f3f4f6; text-align: left; text-transform: uppercase; letter-spacing: .03em; font-size: 9px; color: #555; }
        tfoot td { font-weight: bold; background: #fafafa; }
        .info-grid { display: flex; flex-wrap: wrap; gap: 20px; margin: 16px 0 8px; padding: 14px 16px; background: #fafafa; border: 1px solid #eee; border-radius: 6px; }
        .info-item { min-width: 120px; }
        .info-label { font-size: 9px; text-transform: uppercase; letter-spacing: .03em; color: #999; margin: 0 0 2px; }
        .info-value { font-size: 13px; font-weight: bold; margin: 0; }
        .meta { font-size: 10px; color: #999; margin-top: 20px; }
        @media print { .meta { margin-top: 12px; } }
      </style>
    </head>
    <body>
      <h1>Kahramanlar Belen Akaryakıt</h1>
      <div class="subtitle">${escapeHtml(title)}${subtitle ? " · " + escapeHtml(subtitle) : ""}</div>
      ${infoHtml}
      ${sectionsHtml}
      <div class="meta">Oluşturulma: ${new Date().toLocaleString("tr-TR")}${sections?.length ? ` · ${totalRows} kayıt` : ""}</div>
      <script>
        window.onload = function () { window.print(); };
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

// columns/rows/summary tek tablo için kısayol (liste sayfaları)
export function printListAsPDF({ title, subtitle, columns, rows, summary }) {
  printDocument({ title, subtitle, sections: [{ heading: null, columns, rows, summary }] });
}
