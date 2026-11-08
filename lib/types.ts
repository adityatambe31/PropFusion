/**
 * Shared Type Definitions
 */

/* ─── Tenant Management ─── */
export interface Tenant {
  id: string;
  name: string;
  leaseType?: string;
  duration?: string;
  docs?: string[];
  rentAmount?: string;
  leaseStart?: string;
  leaseEnd?: string;
  paymentStatus?: "current" | "late" | "overdue";
  lastPaymentDate?: string;
}

/* ─── Document Management ─── */
export interface Document {
  id: string;
  name: string;
  type: string;
  file: File | null;
  url?: string;
}

/* ─── Real Estate Expenses ─── */
export interface PropertyExpenses {
  maintenance?: string;
  taxes?: string;
  insurance?: string;
  utilities?: string;
  loanEMI?: string;
  managementFees?: string;
  other?: string;
}

/* ─── Agriculture Expenses ─── */
export interface LandExpenses {
  seeds?: string;
  labor?: string;
  equipment?: string;
  fertilizers?: string;
  pesticides?: string;
  irrigation?: string;
  taxes?: string;
  insurance?: string;
  other?: string;
}

/* ─── Property Type ─── */
export interface Property {
  id: string;
  name: string;
  price?: string;
  status: string;
  type?: string;
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  unit?: string;
  structures?: string[];
  amenities?: string[];
  utilities?: string[];
  area?: string;
  systems?: string;
  parcelNumber?: string;
  zoning?: string;
  leaseDuration?: string;
  tenantCount?: number;
  purchasePrice?: string;
  purchaseDate?: string;
  currentValue?: string;
  lastMaintenanceDate?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  tenants?: Tenant[];
  documents?: Document[];
  expenses?: PropertyExpenses;
  description?: string;
  coordinates?: { lat: number; lng: number };
}

/* ─── Land/Agriculture Type ─── */
export interface Land {
  id: string;
  name: string;
  profit?: string;
  crop?: string;
  area?: string;
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  revenue?: string;
  vehicles?: string[];
  animals?: string[];
  fertilizers?: string[];
  irrigation?: string;
  leaseHolderName?: string;
  purchasePrice?: string;
  purchaseDate?: string;
  currentValue?: string;
  yieldPerAcre?: string;
  lastHarvestDate?: string;
  nextHarvestDate?: string;
  cropSeason?: string;
  parcelNumber?: string;
  zoning?: string;
  leaseDuration?: string;
  tenants?: Tenant[];
  documents?: Document[];
  expenses?: LandExpenses;
  description?: string;
  coordinates?: { lat: number; lng: number };
}

/* ─── Report Types ─── */
export interface AssetDetail {
  id: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  area?: string;
  leaseDuration?: string;
  parcelNumber?: string;
  zoning?: string;
  tenants?: Tenant[];
  coordinates?: { lat: number; lng: number };
  description?: string;
  type?: string;
  unit?: string;
  price?: string;
  status?: string;
  purchasePrice?: string;
  currentValue?: string;
  expenses?: PropertyExpenses | LandExpenses;
  crop?: string;
  profit?: string;
  revenue?: string;
}

export interface ReportData {
  title: string;
  reportType?: "revenue" | "occupancy" | "maintenance" | "summary" | "crop";
  dateRange: string;
  assetType?: string;
  stats: { label: string; value: string; accent?: string }[];
  rows: Record<string, string>[];
  columns: string[];
  assets?: AssetDetail[];
}

export type ReportMode = "summary" | "detailed";

/* ─── Currency & Formatting ─── */
export function parseCurrency(value?: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
