const money = value => Math.round((Number(value) || 0) * 100) / 100;

export function cardRowSummary(row) {
  const gross = money(row.amount);
  const estimatedFee = money(gross * (Number(row.commissionRate) || 0) / 100);
  const fee = estimatedFee;
  return { gross, estimatedFee, fee, net: money(gross - fee) };
}

export function monthlyBankSummary(shifts, agreements, month) {
  const banks = new Map(agreements.map(a => [a.id, { id: a.id, name: a.bankName, company: a.company || "", active: a.active, gross: 0, fee: 0, net: 0 }]));
  let unassigned = 0;
  shifts.filter(s => s.date?.startsWith(month)).forEach(shift => {
    if (!shift.cardPayments?.length) unassigned = money(unassigned + Number(shift.sales?.card || 0));
    (shift.cardPayments || []).forEach(row => {
      const current = banks.get(row.agreementId) || { id: row.agreementId, name: row.bankName, company: row.company || "", active: false, gross: 0, fee: 0, net: 0 };
      const totals = cardRowSummary(row);
      banks.set(row.agreementId, { ...current, gross: money(current.gross + totals.gross), fee: money(current.fee + totals.fee), net: money(current.net + totals.net) });
    });
  });
  const rows = [...banks.values()];
  return { rows, unassigned, totals: rows.reduce((sum, row) => ({ gross: money(sum.gross + row.gross), fee: money(sum.fee + row.fee), net: money(sum.net + row.net) }), { gross: 0, fee: 0, net: 0 }) };
}

export function cardSummary(shift) {
  const rows = shift.cardPayments || [];
  if (!rows.length) return { gross: money(shift.sales?.card), fee: 0, net: money(shift.sales?.card), legacy: true };
  return rows.reduce((sum, row) => {
    const item = cardRowSummary(row);
    return { gross: money(sum.gross + item.gross), fee: money(sum.fee + item.fee), net: money(sum.net + item.net), legacy: false };
  }, { gross: 0, fee: 0, net: 0, legacy: false });
}
