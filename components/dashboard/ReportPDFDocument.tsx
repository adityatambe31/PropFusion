"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

/* ─── Types ─── */
export interface PropertyExpenses {
  maintenance?: string;
  taxes?: string;
  insurance?: string;
  utilities?: string;
  loanEMI?: string;
  managementFees?: string;
  other?: string;
}

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

export interface AssetDetail {
  /* Common */
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
  tenants?: {
    id: string;
    name: string;
    rentAmount?: string;
    paymentStatus?: string;
    leaseStart?: string;
    leaseEnd?: string;
  }[];
  coordinates?: { lat: number; lng: number };
  description?: string;
  /* Real Estate */
  type?: string;
  unit?: string;
  tenantCount?: number;
  price?: string;
  structures?: string[];
  amenities?: string[];
  utilities?: string[];
  systems?: string;
  status?: string;
  purchasePrice?: string;
  purchaseDate?: string;
  currentValue?: string;
  expenses?: PropertyExpenses | LandExpenses | Record<string, string>;
  lastMaintenanceDate?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  /* Agriculture */
  crop?: string;
  profit?: string;
  revenue?: string;
  vehicles?: string[];
  animals?: string[];
  fertilizers?: string[];
  irrigation?: string;
  leaseHolderName?: string;
  landExpenses?: LandExpenses;
  yieldPerAcre?: string;
  lastHarvestDate?: string;
  nextHarvestDate?: string;
  cropSeason?: string;
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

/* ─── Color Tokens ─── */
const BLUE = "#2563eb";
const BLUE_LIGHT = "#dbeafe";
const GREEN = "#16a34a";
const GREEN_LIGHT = "#dcfce7";
const DARK = "#111827";
const GRAY = "#6b7280";
const GRAY_LIGHT = "#f3f4f6";
const GRAY_BORDER = "#e5e7eb";
const WHITE = "#ffffff";

function accent(assetType?: string) {
  const isAg =
    assetType?.toLowerCase().includes("agriculture") ||
    assetType?.toLowerCase().includes("ag");
  return {
    primary: isAg ? GREEN : BLUE,
    light: isAg ? GREEN_LIGHT : BLUE_LIGHT,
  };
}

/* ─── Styles ─── */
const s = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 60,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: DARK,
  },

  /* Header / Footer */
  header: {
    position: "absolute",
    top: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  headerLogoBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLogoText: { color: WHITE, fontSize: 11, fontFamily: "Helvetica-Bold" },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerBrandName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK },
  headerTitle: { fontSize: 9, color: GRAY },
  headerLine: {
    position: "absolute",
    top: 52,
    left: 48,
    right: 48,
    height: 1.5,
    borderRadius: 1,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 7.5, color: GRAY },

  /* Cover */
  coverPage: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
  },
  coverAccentBar: { height: 8 },
  coverBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 64,
  },
  coverLogoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  coverLogoText: { color: WHITE, fontSize: 32, fontFamily: "Helvetica-Bold" },
  coverAppName: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 40,
  },
  coverTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  coverSubtitle: {
    fontSize: 12,
    color: GRAY,
    marginBottom: 4,
    textAlign: "center",
  },
  coverDivider: { width: 60, height: 2, borderRadius: 1, marginVertical: 24 },
  coverMeta: {
    fontSize: 10,
    color: GRAY,
    textAlign: "center",
    marginBottom: 2,
  },
  coverBadge: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  coverBadgeText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    letterSpacing: 1,
  },
  coverFooter: { paddingVertical: 16, alignItems: "center" },
  coverFooterText: { fontSize: 8, color: GRAY, letterSpacing: 2 },

  /* ToC */
  tocTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 24,
  },
  tocRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  tocNumber: { width: 24, fontSize: 10, fontFamily: "Helvetica-Bold" },
  tocLabel: { flex: 1, fontSize: 11, color: DARK },
  tocDots: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
    borderBottomStyle: "dotted",
    marginHorizontal: 8,
    marginBottom: 2,
  },
  tocPage: { fontSize: 10, color: GRAY, fontFamily: "Helvetica-Bold" },

  /* Stats */
  statsTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 16,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "48%",
    border: `1px solid ${GRAY_BORDER}`,
    borderRadius: 8,
    padding: 14,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  statValue: { fontSize: 20, fontFamily: "Helvetica-Bold" },

  /* Table */
  tableTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_BORDER,
  },
  tableRowAlt: { backgroundColor: GRAY_LIGHT },
  tableCell: { fontSize: 9, color: DARK },

  /* Detailed — Asset Profile */
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileBadgeText: {
    color: WHITE,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },
  profileName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: DARK },
  profileSubtitle: { fontSize: 10, color: GRAY, marginTop: 2 },

  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 10,
    marginTop: 20,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
  },
  fieldRow: { flexDirection: "row", marginBottom: 6 },
  fieldLabel: {
    width: 140,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
  },
  fieldValue: { flex: 1, fontSize: 9, color: DARK },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  chip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: GRAY_LIGHT,
  },
  chipText: { fontSize: 8, color: DARK },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: GRAY_LIGHT,
    borderRadius: 6,
  },
  tenantName: { fontSize: 9, color: DARK, marginLeft: 6 },

  /* Summary highlights */
  highlightSection: { marginTop: 16 },
  highlightTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 8,
  },
  highlightCard: {
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  highlightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  highlightLabel: { fontSize: 9, color: GRAY },
  highlightValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK },
  highlightSub: { fontSize: 8, color: GRAY },
});

/* ─── Helpers ─── */
function today() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function timestamp() {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function colWidth(totalCols: number) {
  return `${Math.floor(100 / totalCols)}%`;
}

function val(v?: string | number | null) {
  return v != null && v !== "" ? String(v) : "—";
}

function moneyToNumber(v?: string | number | null): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (!v) return 0;
  const cleaned = String(v).replace(/,/g, "").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function findBestNumericColumn(report: ReportData): string | null {
  const candidates = [
    "Net Profit",
    "Profit",
    "Revenue",
    "Value",
    "Price",
    "Expenses",
  ];

  const byPriority = candidates.find((c) => report.columns.includes(c));
  if (byPriority) return byPriority;

  const inferred = report.columns.find((col) => {
    const key = col.toLowerCase();
    return (
      key.includes("revenue") ||
      key.includes("profit") ||
      key.includes("value") ||
      key.includes("price") ||
      key.includes("expense")
    );
  });

  return inferred || null;
}

function pickAssetName(row: Record<string, string>): string {
  return row.Property || row.Land || row.Asset || row.Name || "Unnamed Asset";
}

/* ─── Shared Header ─── */
function Header({ report }: { report: ReportData }) {
  const c = accent(report.assetType);
  return (
    <>
      <View style={s.header} fixed>
        <View style={s.headerBrand}>
          <View style={[s.headerLogoBox, { backgroundColor: c.primary }]}>
            <Text style={s.headerLogoText}>P</Text>
          </View>
          <Text style={s.headerBrandName}>PropFusion</Text>
        </View>
        <Text style={s.headerTitle}>{report.title}</Text>
      </View>
      <View style={[s.headerLine, { backgroundColor: c.primary }]} fixed />
    </>
  );
}

/* ─── Shared Footer ─── */
function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Confidential — Generated by PropFusion</Text>
      <Text style={s.footerText}>{today()}</Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

/* ─── Cover Page ─── */
function CoverPage({ report, mode }: { report: ReportData; mode: ReportMode }) {
  const c = accent(report.assetType);
  return (
    <Page size="A4" style={s.coverPage}>
      <View style={[s.coverAccentBar, { backgroundColor: c.primary }]} />
      <View style={s.coverBody}>
        <View style={[s.coverLogoBox, { backgroundColor: c.primary }]}>
          <Text style={s.coverLogoText}>P</Text>
        </View>
        <Text style={s.coverAppName}>PropFusion</Text>
        <Text style={s.coverTitle}>{report.title}</Text>
        {report.assetType && (
          <Text style={s.coverSubtitle}>{report.assetType}</Text>
        )}
        <View
          style={[
            s.coverBadge,
            { backgroundColor: mode === "detailed" ? DARK : c.primary },
          ]}
        >
          <Text style={s.coverBadgeText}>
            {mode === "detailed" ? "DETAILED REPORT" : "SUMMARY REPORT"}
          </Text>
        </View>
        <View style={[s.coverDivider, { backgroundColor: c.primary }]} />
        <Text style={s.coverMeta}>Period: {report.dateRange}</Text>
        <Text style={s.coverMeta}>Generated: {timestamp()}</Text>
        <Text style={[s.coverMeta, { marginTop: 4 }]}>
          {report.rows.length} asset{report.rows.length !== 1 ? "s" : ""}{" "}
          analyzed
        </Text>
      </View>
      <View style={s.coverFooter}>
        <Text style={s.coverFooterText}>C O N F I D E N T I A L</Text>
      </View>
      <Footer />
    </Page>
  );
}

/* ─── Table of Contents ─── */
function TocPage({ report, mode }: { report: ReportData; mode: ReportMode }) {
  const sections = [
    { num: "1", label: "Executive Summary", page: "3" },
    { num: "2", label: "Data Overview", page: "4" },
  ];
  if (mode === "detailed" && report.assets?.length) {
    report.assets.forEach((a, i) => {
      sections.push({
        num: String(i + 3),
        label: `Asset Profile — ${a.name}`,
        page: String(5 + i),
      });
    });
  }
  return (
    <Page size="A4" style={s.page}>
      <Header report={report} />
      <Text style={s.tocTitle}>Table of Contents</Text>
      {sections.map((sec) => (
        <View key={sec.num} style={s.tocRow}>
          <Text style={s.tocNumber}>{sec.num}.</Text>
          <Text style={s.tocLabel}>{sec.label}</Text>
          <View style={s.tocDots} />
          <Text style={s.tocPage}>{sec.page}</Text>
        </View>
      ))}
      <Footer />
    </Page>
  );
}

/* ─── Executive Summary ─── */
function SummaryPage({ report }: { report: ReportData }) {
  const c = accent(report.assetType);
  const keyMetricCol = findBestNumericColumn(report);

  const topAssets = keyMetricCol
    ? [...report.rows]
        .sort(
          (a, b) =>
            moneyToNumber(b[keyMetricCol]) - moneyToNumber(a[keyMetricCol]),
        )
        .slice(0, 3)
    : [];

  const statusCol = report.columns.includes("Status") ? "Status" : null;
  const statusCounts = statusCol
    ? report.rows.reduce<Record<string, number>>((acc, row) => {
        const status = row[statusCol] || "Unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {})
    : null;

  return (
    <Page size="A4" style={s.page}>
      <Header report={report} />
      <Text style={s.statsTitle}>Executive Summary</Text>
      <View style={s.statsGrid}>
        {report.stats.map((stat) => (
          <View key={stat.label} style={s.statCard}>
            <Text style={s.statLabel}>{stat.label}</Text>
            <Text
              style={[s.statValue, { color: stat.accent ? c.primary : DARK }]}
            >
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={s.highlightSection}>
        <Text style={s.highlightTitle}>Highlights</Text>

        {topAssets.length > 0 && keyMetricCol && (
          <View style={s.highlightCard}>
            <Text style={[s.highlightSub, { marginBottom: 6 }]}>Top assets by {keyMetricCol}</Text>
            {topAssets.map((row, index) => (
              <View key={`${pickAssetName(row)}-${index}`} style={s.highlightRow}>
                <Text style={s.highlightLabel}>
                  {index + 1}. {pickAssetName(row)}
                </Text>
                <Text style={s.highlightValue}>{val(row[keyMetricCol])}</Text>
              </View>
            ))}
          </View>
        )}

        {statusCounts && Object.keys(statusCounts).length > 0 && (
          <View style={s.highlightCard}>
            <Text style={[s.highlightSub, { marginBottom: 6 }]}>Status distribution</Text>
            {Object.entries(statusCounts).map(([status, count]) => (
              <View key={status} style={s.highlightRow}>
                <Text style={s.highlightLabel}>{status}</Text>
                <Text style={s.highlightValue}>{count}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Footer />
    </Page>
  );
}

/* ─── Data Table ─── */
function TablePages({ report }: { report: ReportData }) {
  const c = accent(report.assetType);
  const w = colWidth(report.columns.length);
  return (
    <Page size="A4" style={s.page} wrap>
      <Header report={report} />
      <Text style={s.tableTitle}>Data Overview</Text>
      <View style={[s.tableHeaderRow, { backgroundColor: c.primary }]} fixed>
        {report.columns.map((col) => (
          <Text key={col} style={[s.tableHeaderCell, { width: w }]}>
            {col}
          </Text>
        ))}
      </View>
      {report.rows.map((row, i) => (
        <View
          key={i}
          style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
          wrap={false}
        >
          {report.columns.map((col) => (
            <Text key={col} style={[s.tableCell, { width: w }]}>
              {row[col] || "—"}
            </Text>
          ))}
        </View>
      ))}
      <Footer />
    </Page>
  );
}

/* ─── Field Row helper ─── */
function Field({ label, value }: { label: string; value: string }) {
  if (value === "—" || !value) return null;
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  );
}

/* ─── Chip List ─── */
function ChipList({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <>
      <View style={[s.fieldRow, { marginBottom: 2 }]}>
        <Text style={s.fieldLabel}>{label}</Text>
      </View>
      <View style={[s.chipRow, { marginBottom: 8 }]}>
        {items.map((item, i) => (
          <View key={i} style={s.chip}>
            <Text style={s.chipText}>{item}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

/* ─── Asset Profile Page (Detailed mode) ─── */
function AssetProfilePage({
  asset,
  report,
  index,
}: {
  asset: AssetDetail;
  report: ReportData;
  index: number;
}) {
  const c = accent(report.assetType);
  const isRE = report.assetType?.toLowerCase().includes("real") || !!asset.type;
  const reportType = report.reportType || "summary";
  const isSummary = reportType === "summary";
  const isRevenue = reportType === "revenue";
  const isOccupancy = reportType === "occupancy";
  const isMaintenance = reportType === "maintenance";
  const isCrop = reportType === "crop";
  const propertyExpenses = isRE
    ? (asset.expenses as PropertyExpenses | undefined)
    : undefined;
  const agricultureExpenses = !isRE
    ? ((asset.landExpenses as LandExpenses | undefined) ||
      (asset.expenses as unknown as LandExpenses | undefined))
    : undefined;

  const revenueLike = isRE ? moneyToNumber(asset.price) : moneyToNumber(asset.revenue || asset.profit);
  const expenseTotal = isRE
    ? propertyExpenses
      ? moneyToNumber(propertyExpenses.maintenance) +
        moneyToNumber(propertyExpenses.taxes) +
        moneyToNumber(propertyExpenses.insurance) +
        moneyToNumber(propertyExpenses.utilities) +
        moneyToNumber(propertyExpenses.loanEMI) +
        moneyToNumber(propertyExpenses.managementFees) +
        moneyToNumber(propertyExpenses.other)
      : 0
    : agricultureExpenses
      ? moneyToNumber(agricultureExpenses.seeds) +
        moneyToNumber(agricultureExpenses.labor) +
        moneyToNumber(agricultureExpenses.equipment) +
        moneyToNumber(agricultureExpenses.fertilizers) +
        moneyToNumber(agricultureExpenses.pesticides) +
        moneyToNumber(agricultureExpenses.irrigation) +
        moneyToNumber(agricultureExpenses.taxes) +
        moneyToNumber(agricultureExpenses.insurance) +
        moneyToNumber(agricultureExpenses.other)
      : 0;
  const netEstimate = revenueLike - expenseTotal;

  return (
    <Page size="A4" style={s.page} wrap>
      <Header report={report} />

      {/* Profile Header */}
      <View style={s.profileHeader}>
        <View style={[s.profileBadge, { backgroundColor: c.primary }]}>
          <Text style={s.profileBadgeText}>
            {String(index + 1).padStart(2, "0")}
          </Text>
        </View>
        <View>
          <Text style={s.profileName}>{asset.name}</Text>
          <Text style={s.profileSubtitle}>
            {[asset.location, asset.city, asset.state, asset.zip]
              .filter(Boolean)
              .join(", ")}
          </Text>
        </View>
      </View>

      {/* General Information */}
      <Text style={s.sectionTitle}>General Information</Text>
      {isRE && <Field label="Property Type" value={val(asset.type)} />}
      {isRE && <Field label="Unit" value={val(asset.unit)} />}
      {!isRE && <Field label="Primary Crop" value={val(asset.crop)} />}
      <Field label="Area" value={val(asset.area)} />
      {isRE && <Field label="Status" value={val(asset.status)} />}
      <Field label="Parcel Number" value={val(asset.parcelNumber)} />
      <Field label="Zoning" value={val(asset.zoning)} />
      {asset.description && (
        <Field label="Description" value={asset.description} />
      )}

      {(isSummary || isRevenue || (!isRE && isCrop)) && (
        <>
          <Text style={s.sectionTitle}>Financial Details</Text>
          {isRE && <Field label="Monthly Rent / Price" value={val(asset.price)} />}
          {isRE && (
            <Field label="Purchase Price" value={val(asset.purchasePrice)} />
          )}
          {isRE && <Field label="Current Value" value={val(asset.currentValue)} />}
          {!isRE && <Field label="Annual Revenue" value={val(asset.revenue)} />}
          {!isRE && <Field label="Annual Profit" value={val(asset.profit)} />}
          {!isRE && (
            <Field label="Purchase Price" value={val(asset.purchasePrice)} />
          )}
          {!isRE && <Field label="Current Value" value={val(asset.currentValue)} />}
          {revenueLike > 0 && (
            <Field
              label={isRE ? "Estimated Gross Monthly Income" : "Estimated Gross Annual Income"}
              value={formatMoney(revenueLike)}
            />
          )}
          {expenseTotal > 0 && (
            <Field
              label={isRE ? "Estimated Total Monthly Expenses" : "Estimated Total Annual Expenses"}
              value={formatMoney(expenseTotal)}
            />
          )}
          {(revenueLike > 0 || expenseTotal > 0) && (
            <Field
              label={isRE ? "Estimated Net Monthly" : "Estimated Net Annual"}
              value={formatMoney(netEstimate)}
            />
          )}
          <Field label="Lease Duration" value={val(asset.leaseDuration)} />
          {isRE && <Field label="Lease Start" value={val(asset.leaseStartDate)} />}
          {isRE && <Field label="Lease End" value={val(asset.leaseEndDate)} />}
          {!isRE && (
            <Field label="Lease Holder" value={val(asset.leaseHolderName)} />
          )}
        </>
      )}

      {/* Expense Breakdown - Real Estate */}
      {isRE && propertyExpenses && (isSummary || isRevenue || isMaintenance) && (
        <>
          <Text style={s.sectionTitle}>Monthly Expense Breakdown</Text>
          <Field label="Maintenance" value={val(propertyExpenses.maintenance)} />
          <Field label="Property Taxes" value={val(propertyExpenses.taxes)} />
          <Field label="Insurance" value={val(propertyExpenses.insurance)} />
          <Field label="Utilities" value={val(propertyExpenses.utilities)} />
          <Field label="Loan EMI" value={val(propertyExpenses.loanEMI)} />
          <Field
            label="Management Fees"
            value={val(propertyExpenses.managementFees)}
          />
          <Field label="Other" value={val(propertyExpenses.other)} />
          <Field
            label="Last Maintenance"
            value={val(asset.lastMaintenanceDate)}
          />
        </>
      )}

      {/* Expense Breakdown - Agriculture */}
      {!isRE && agricultureExpenses && (isSummary || isRevenue || isCrop) && (
        <>
          <Text style={s.sectionTitle}>Annual Expense Breakdown</Text>
          <Field label="Seeds" value={val(agricultureExpenses.seeds)} />
          <Field label="Labor" value={val(agricultureExpenses.labor)} />
          <Field label="Equipment" value={val(agricultureExpenses.equipment)} />
          <Field
            label="Fertilizers"
            value={val(agricultureExpenses.fertilizers)}
          />
          <Field
            label="Pesticides"
            value={val(agricultureExpenses.pesticides)}
          />
          <Field
            label="Irrigation"
            value={val(agricultureExpenses.irrigation)}
          />
          <Field label="Taxes" value={val(agricultureExpenses.taxes)} />
          <Field label="Insurance" value={val(agricultureExpenses.insurance)} />
          <Field label="Other" value={val(agricultureExpenses.other)} />
        </>
      )}

      {/* Yield & Harvest - Agriculture */}
      {!isRE && (isSummary || isCrop) && (
        <>
          <Text style={s.sectionTitle}>Yield & Harvest</Text>
          <Field label="Yield per Acre" value={val(asset.yieldPerAcre)} />
          <Field label="Crop Season" value={val(asset.cropSeason)} />
          <Field label="Last Harvest" value={val(asset.lastHarvestDate)} />
          <Field label="Next Harvest" value={val(asset.nextHarvestDate)} />
        </>
      )}

      {isRE && (isSummary || isMaintenance) && (
        <>
          {/* Property Details */}
          <Text style={s.sectionTitle}>Property Details</Text>
          <Field label="Systems" value={val(asset.systems)} />
          <ChipList label="Structures" items={asset.structures} />
          <ChipList label="Amenities" items={asset.amenities} />
          <ChipList label="Utilities" items={asset.utilities} />
        </>
      )}

      {!isRE && (isSummary || isCrop) && (
        <>
          {/* Agriculture Details */}
          <Text style={s.sectionTitle}>Agriculture Details</Text>
          <Field label="Irrigation" value={val(asset.irrigation)} />
          <ChipList label="Fertilizers" items={asset.fertilizers} />
          <ChipList label="Animals" items={asset.animals} />
          <ChipList label="Vehicles" items={asset.vehicles} />
        </>
      )}

      {/* Tenants */}
      {(asset.tenants ?? []).length > 0 && (isSummary || isOccupancy || isMaintenance) && (
        <>
          <Text style={s.sectionTitle}>Tenants ({asset.tenants?.length ?? 0})</Text>
          {(asset.tenants ?? []).map((t, i) => (
            <View key={t.id || i} style={s.tenantRow}>
              <Text style={s.tenantName}>
                • {t.name}
                {t.rentAmount ? ` — ${t.rentAmount}` : ""}
                {t.paymentStatus ? ` (${t.paymentStatus})` : ""}
                {t.leaseEnd ? ` • Lease End: ${t.leaseEnd}` : ""}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* Coordinates */}
      {asset.coordinates && (
        <>
          <Text style={s.sectionTitle}>Location Coordinates</Text>
          <Field label="Latitude" value={String(asset.coordinates.lat)} />
          <Field label="Longitude" value={String(asset.coordinates.lng)} />
        </>
      )}

      <Footer />
    </Page>
  );
}

/* ─── Main Document ─── */
export default function ReportPDFDocument({
  report,
  mode = "summary",
}: {
  report: ReportData;
  mode?: ReportMode;
}) {
  return (
    <Document
      title={report.title}
      author="PropFusion"
      subject={`${report.title} — ${report.dateRange}`}
      creator="PropFusion Reports"
    >
      <CoverPage report={report} mode={mode} />
      <TocPage report={report} mode={mode} />
      <SummaryPage report={report} />
      <TablePages report={report} />

      {/* Detailed: per-asset profile pages */}
      {mode === "detailed" &&
        report.assets?.map((asset, i) => (
          <AssetProfilePage
            key={asset.id}
            asset={asset}
            report={report}
            index={i}
          />
        ))}
    </Document>
  );
}
