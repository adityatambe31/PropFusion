/**
 * Shared report generation helpers
 */

export const DATE_RANGES = [
  { label: "Last 3 months", value: "3m" },
  { label: "Last 6 months", value: "6m" },
  { label: "Last 1 year", value: "12m" },
  { label: "Last 2 years", value: "24m" },
  { label: "Custom Range", value: "custom" },
] as const;

export type DateRangeValue = (typeof DATE_RANGES)[number]["value"];

export interface CustomDateRange {
  from: string;
  to: string;
}

export function parseCurrency(s: string | undefined): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function formatCurrency(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0 });
}

export function formatPercent(n: number): string {
  return n.toFixed(1) + "%";
}

export function dateRangeLabel(v: string, custom: CustomDateRange): string {
  if (v === "custom" && custom.from && custom.to) {
    return `${custom.from} → ${custom.to}`;
  }
  const map: Record<string, string> = {
    "3m": "Last 3 Months",
    "6m": "Last 6 Months",
    "12m": "Last 1 Year",
    "24m": "Last 2 Years",
  };
  return map[v] ?? v;
}

// Property expense calculation
export interface PropertyExpenses {
  maintenance: string;
  taxes: string;
  insurance: string;
  utilities: string;
  loanEMI: string;
  managementFees: string;
  other: string;
}

export function calcPropertyMonthlyExpenses(
  expenses?: PropertyExpenses,
): number {
  if (!expenses) return 0;
  return (
    parseCurrency(expenses.maintenance) +
    parseCurrency(expenses.taxes) +
    parseCurrency(expenses.insurance) +
    parseCurrency(expenses.utilities) +
    parseCurrency(expenses.loanEMI) +
    parseCurrency(expenses.managementFees) +
    parseCurrency(expenses.other)
  );
}

export function calcPropertyAnnualExpenses(
  expenses?: PropertyExpenses,
): number {
  return calcPropertyMonthlyExpenses(expenses) * 12;
}

// Land expense calculation
export interface LandExpenses {
  seeds: string;
  labor: string;
  equipment: string;
  fertilizers: string;
  pesticides: string;
  irrigation: string;
  taxes: string;
  insurance: string;
  other: string;
}

export function calcLandAnnualExpenses(expenses?: LandExpenses): number {
  if (!expenses) return 0;
  return (
    parseCurrency(expenses.seeds) +
    parseCurrency(expenses.labor) +
    parseCurrency(expenses.equipment) +
    parseCurrency(expenses.fertilizers) +
    parseCurrency(expenses.pesticides) +
    parseCurrency(expenses.irrigation) +
    parseCurrency(expenses.taxes) +
    parseCurrency(expenses.insurance) +
    parseCurrency(expenses.other)
  );
}

// ROI Calculations
export function calcROI(annualProfit: number, purchasePrice: number): number {
  if (purchasePrice <= 0) return 0;
  return (annualProfit / purchasePrice) * 100;
}

export function calcNetProfit(revenue: number, expenses: number): number {
  return revenue - expenses;
}

export function calcCapRate(
  annualNetIncome: number,
  currentValue: number,
): number {
  if (currentValue <= 0) return 0;
  return (annualNetIncome / currentValue) * 100;
}

export function calcAppreciation(
  purchasePrice: number,
  currentValue: number,
): number {
  if (purchasePrice <= 0) return 0;
  return ((currentValue - purchasePrice) / purchasePrice) * 100;
}

// Days vacant calculation
export function calcDaysVacant(vacantSince?: string): number {
  if (!vacantSince) return 0;
  const vacantDate = new Date(vacantSince);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - vacantDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Days until lease expiry
export function calcDaysUntilLeaseExpiry(leaseEndDate?: string): number {
  if (!leaseEndDate) return 0;
  const endDate = new Date(leaseEndDate);
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
