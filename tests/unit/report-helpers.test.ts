import { describe, expect, it } from "vitest";
import {
  parseCurrency, calcPropertyMonthlyExpenses, calcPropertyAnnualExpenses,
  calcLandAnnualExpenses, calcROI, calcNetProfit, calcCapRate, calcAppreciation,
} from "@/lib/helpers/report-helpers";
import { calculateFinancialMetrics } from "@/lib/db/transaction";

describe("PropFusion report calculations", () => {
  it("parses formatted dollar values and handles missing data", () => {
    expect(parseCurrency("$2,350/month")).toBe(2350);
    expect(parseCurrency("-$40.50")).toBe(-40.5);
    expect(parseCurrency(undefined)).toBe(0);
    expect(parseCurrency("unknown")).toBe(0);
  });
  it("sums property expenses consistently for month and year", () => {
    const expenses = { maintenance: "$100", taxes: "$50", insurance: "$25", utilities: "$30", loanEMI: "$400", managementFees: "$20", other: "$5" };
    expect(calcPropertyMonthlyExpenses(expenses)).toBe(630);
    expect(calcPropertyAnnualExpenses(expenses)).toBe(7560);
    expect(calcPropertyMonthlyExpenses()).toBe(0);
  });
  it("sums annual agriculture expenses", () => {
    expect(calcLandAnnualExpenses({ seeds: "100", labor: "200", equipment: "300", fertilizers: "40", pesticides: "20", irrigation: "50", taxes: "60", insurance: "70", other: "10" })).toBe(850);
  });
  it("calculates profit, cap rate, appreciation and guards division by zero", () => {
    expect(calcNetProfit(2000, 750)).toBe(1250);
    expect(calcROI(2000, 10000)).toBe(20);
    expect(calcROI(2000, 0)).toBe(0);
    expect(calcCapRate(6000, 120000)).toBe(5);
    expect(calcAppreciation(100000, 125000)).toBe(25);
  });
  it("aggregates rent revenue and operating expenses", () => {
    const now = "2026-11-01";
    const transactions = [
      { id: "r1", assetId: "p1", userId: "m1", type: "revenue" as const, category: "Rent", amount: 2000, date: now, notes: "", createdAt: now, updatedAt: now },
      { id: "e1", assetId: "p1", userId: "m1", type: "expense" as const, category: "Repair", amount: 500, date: now, notes: "", createdAt: now, updatedAt: now },
    ];
    expect(calculateFinancialMetrics(transactions, 30000)).toEqual({ totalRevenue: 2000, totalExpenses: 500, noi: 1500, roi: 5 });
  });
});
