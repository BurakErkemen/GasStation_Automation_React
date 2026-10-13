import test from "node:test";
import assert from "node:assert/strict";
import { cardRowSummary, cardSummary, monthlyBankSummary } from "../src/utils/cardSummary.js";

test("commission rounds to cents and preserves gross", () => {
  assert.deepEqual(cardRowSummary({ amount: "123.45", commissionRate: "2.5", actualFee: "" }), { gross: 123.45, estimatedFee: 3.09, fee: 3.09, net: 120.36 });
});
test("commission always comes from agreement rate", () => {
  assert.equal(cardRowSummary({ amount: 1000, commissionRate: 2, actualFee: 15 }).net, 980);
  assert.equal(cardRowSummary({ amount: 0, commissionRate: 2 }).fee, 0);
});
test("legacy POS records remain readable without inventing commission", () => {
  assert.deepEqual(cardSummary({ sales: { card: "500" } }), { gross: 500, fee: 0, net: 500, legacy: true });
});
test("bank rows replace legacy total rather than double counting", () => {
  assert.deepEqual(cardSummary({ sales: { card: 9999 }, cardPayments: [{ amount: 1000, commissionRate: 2 }, { amount: 500, commissionRate: 3 }] }), { gross: 1500, fee: 35, net: 1465, legacy: false });
});

test("monthly report filters dates, includes idle banks and separates unassigned POS", () => {
  const report = monthlyBankSummary([
    { date: "2026-10-01", cardPayments: [{ agreementId: "a", amount: 1000, commissionRate: 2 }] },
    { date: "2026-09-30", cardPayments: [{ agreementId: "a", amount: 9000, commissionRate: 2 }] },
    { date: "2026-10-02", sales: { card: 500 } }
  ], [{ id: "a", bankName: "A", commissionRate: 5 }, { id: "b", bankName: "B" }], "2026-10");
  assert.deepEqual(report.totals, { gross: 1000, fee: 20, net: 980 });
  assert.equal(report.unassigned, 500);
  assert.equal(report.rows.find(row => row.id === "b").gross, 0);
});

test("fuel and market POS sum together without counting cash as bank income", () => {
  const report = monthlyBankSummary([
    { source: "fuel", date: "2026-10-14", sales: { cash: 900 }, cardPayments: [{ agreementId: "a", amount: 1000, commissionRate: 2 }] },
    { source: "market", date: "2026-10-14", sales: { cash: 500 }, cardPayments: [{ agreementId: "a", amount: 200, commissionRate: 2 }] }
  ], [{ id: "a", bankName: "A" }], "2026-10");
  assert.deepEqual(report.totals, { gross: 1200, fee: 24, net: 1176 });
});
