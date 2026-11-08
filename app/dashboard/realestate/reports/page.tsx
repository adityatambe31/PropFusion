"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  useRealEstateContext,
  Property,
} from "@/app/dashboard/realestate/real-estate-context";

const ReportPDFActions = dynamic(
  () => import("@/components/dashboard/ReportPDFActions"),
  { ssr: false },
);
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  TrendingUp,
  Users,
  Wrench,
  BarChart3,
  Download,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import {
  DATE_RANGES,
  DateRangeValue,
  parseCurrency,
  formatCurrency,
  dateRangeLabel,
} from "@/lib/helpers/report-helpers";

/* ─── Constants ─── */
const REPORT_TYPES = [
  { label: "Revenue", value: "revenue", icon: TrendingUp },
  { label: "Occupancy", value: "occupancy", icon: Users },
  { label: "Maintenance", value: "maintenance", icon: Wrench },
  { label: "Asset Summary", value: "summary", icon: BarChart3 },
];

/* ─── Report Generator ─── */
interface ReportResult {
  title: string;
  dateRange: string;
  stats: { label: string; value: string; accent?: string }[];
  rows: Record<string, string>[];
  columns: string[];
  assets?: Property[];
}

function generateReport(
  reportType: string,
  selected: Property[],
  dateRange: string,
  customRange: { from: string; to: string },
): ReportResult {
  const drLabel = dateRangeLabel(dateRange, customRange);

  if (reportType === "revenue") {
    const totalRevenue = selected.reduce(
      (a, p) => a + parseCurrency(p.price),
      0,
    );
    return {
      title: "Real Estate Revenue Report",
      dateRange: drLabel,
      stats: [
        {
          label: "Total Monthly Revenue",
          value: formatCurrency(totalRevenue),
          accent: "text-emerald-500",
        },
        { label: "Properties Analyzed", value: String(selected.length) },
        {
          label: "Avg. Revenue / Property",
          value: formatCurrency(
            selected.length ? totalRevenue / selected.length : 0,
          ),
        },
      ],
      columns: ["Property", "Location", "Type", "Status", "Monthly Revenue"],
      rows: selected.map((p) => ({
        Property: p.name,
        Location: `${p.location}, ${p.city || ""}`,
        Type: p.type,
        Status: p.status,
        "Monthly Revenue": p.price,
      })),
      assets: selected,
    };
  }

  if (reportType === "occupancy") {
    const occupied = selected.filter((p) => p.status === "Occupied").length;
    const vacant = selected.filter((p) => p.status === "Vacant").length;
    const rate = selected.length
      ? Math.round((occupied / selected.length) * 100)
      : 0;
    const totalTenants = selected.reduce(
      (a, p) => a + (p.tenants?.length || 0),
      0,
    );
    return {
      title: "Occupancy Report",
      dateRange: drLabel,
      stats: [
        {
          label: "Occupancy Rate",
          value: `${rate}%`,
          accent:
            rate >= 75
              ? "text-emerald-500"
              : rate >= 50
                ? "text-amber-500"
                : "text-red-500",
        },
        { label: "Total Tenants", value: String(totalTenants) },
        { label: "Occupied", value: String(occupied) },
        { label: "Vacant", value: String(vacant), accent: "text-red-400" },
      ],
      columns: ["Property", "Status", "Tenants", "Lease Duration"],
      rows: selected.map((p) => ({
        Property: p.name,
        Status: p.status,
        Tenants: String(p.tenants?.length || 0),
        "Lease Duration": p.leaseDuration || "—",
      })),
      assets: selected,
    };
  }

  if (reportType === "maintenance") {
    const byStatus: Record<string, number> = {};
    selected.forEach((p) => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });
    return {
      title: "Maintenance & Status Report",
      dateRange: drLabel,
      stats: Object.entries(byStatus).map(([status, count]) => ({
        label: status,
        value: String(count),
        accent:
          status === "Under Maintenance"
            ? "text-amber-500"
            : status === "Vacant"
              ? "text-red-400"
              : "text-emerald-500",
      })),
      columns: ["Property", "Status", "Systems", "Structures", "Amenities"],
      rows: selected.map((p) => ({
        Property: p.name,
        Status: p.status,
        Systems: p.systems || "—",
        Structures: p.structures?.join(", ") || "—",
        Amenities: p.amenities?.join(", ") || "—",
      })),
      assets: selected,
    };
  }

  // summary
  const totalRevenue = selected.reduce((a, p) => a + parseCurrency(p.price), 0);
  const totalTenants = selected.reduce(
    (a, p) => a + (p.tenants?.length || 0),
    0,
  );
  return {
    title: "Real Estate Asset Summary",
    dateRange: drLabel,
    stats: [
      { label: "Properties", value: String(selected.length) },
      { label: "Total Tenants", value: String(totalTenants) },
      {
        label: "Total Revenue",
        value: formatCurrency(totalRevenue),
        accent: "text-emerald-500",
      },
    ],
    columns: [
      "Property",
      "Location",
      "Type",
      "Area",
      "Status",
      "Price",
      "Tenants",
    ],
    rows: selected.map((p) => ({
      Property: p.name,
      Location: `${p.location}, ${p.city || ""}`,
      Type: p.type,
      Area: p.area,
      Status: p.status,
      Price: p.price,
      Tenants: String(p.tenants?.length || 0),
    })),
    assets: selected,
  };
}

/* ─── CSV Export ─── */
function exportCSV(report: ReportResult) {
  const header = report.columns.join(",");
  const body = report.rows
    .map((r) =>
      report.columns
        .map((c) => `"${(r[c] || "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.title.replace(/\s+/g, "_").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Page ─── */
export default function RealEstateReportsPage() {
  const { properties } = useRealEstateContext();

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [reportType, setReportType] = useState("revenue");
  const [dateRange, setDateRange] = useState<DateRangeValue>("3m");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [report, setReport] = useState<ReportResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAssetToggle = (id: string) => {
    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    setSelectedAssets(
      selectedAssets.length === properties.length
        ? []
        : properties.map((p) => p.id),
    );
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const selected = properties.filter((p) => selectedAssets.includes(p.id));
      setReport(generateReport(reportType, selected, dateRange, customRange));
      setIsGenerating(false);
    }, 600);
  };

  const handleBack = () => setReport(null);

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
              Real Estate Reports
            </h1>
          </div>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
            Generate detailed reports for your real estate properties.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!report ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bg-white dark:bg-[#101010] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 space-y-8">
                  {/* Report Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Report Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {REPORT_TYPES.map((rt) => {
                        const Icon = rt.icon;
                        const isActive = reportType === rt.value;
                        return (
                          <button
                            key={rt.value}
                            type="button"
                            onClick={() => setReportType(rt.value)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                              isActive
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">
                              {rt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Asset Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Select Properties
                      </label>
                      {properties.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {selectedAssets.length === properties.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      )}
                    </div>
                    {properties.length === 0 ? (
                      <div className="text-gray-400 dark:text-gray-500 italic text-sm py-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                        No properties found. Add some from the Real Estate
                        dashboard first.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {properties.map((p) => {
                          const isChecked = selectedAssets.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleAssetToggle(p.id)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                                isChecked
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300 dark:border-gray-600"
                                }`}
                              >
                                {isChecked && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                )}
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {p.name}
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">
                                  {p.location}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Date Range
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DATE_RANGES.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setDateRange(r.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                            dateRange === r.value
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    {dateRange === "custom" && (
                      <div className="flex items-center gap-3 mt-3">
                        <input
                          type="date"
                          className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:outline-none"
                          value={customRange.from}
                          onChange={(e) =>
                            setCustomRange((p) => ({
                              ...p,
                              from: e.target.value,
                            }))
                          }
                        />
                        <span className="text-gray-400 text-sm">to</span>
                        <input
                          type="date"
                          className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:outline-none"
                          value={customRange.to}
                          onChange={(e) =>
                            setCustomRange((p) => ({
                              ...p,
                              to: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Generate */}
                  <button
                    onClick={handleGenerate}
                    disabled={selectedAssets.length === 0 || isGenerating}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        Generate Report
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to form
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {report.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {report.dateRange} • {report.rows.length} propert
                    {report.rows.length !== 1 ? "ies" : "y"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => exportCSV(report)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <ReportPDFActions
                    report={{ ...report, assetType: "Real Estate" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {report.stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
                  >
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {stat.label}
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        stat.accent || "text-gray-900 dark:text-white"
                      }`}
                    >
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white dark:bg-[#101010] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a0a]">
                        {report.columns.map((col) => (
                          <th
                            key={col}
                            className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {report.columns.map((col) => (
                            <td
                              key={col}
                              className="px-5 py-3.5 text-gray-700 dark:text-gray-300 whitespace-nowrap"
                            >
                              {col === "Status" ? (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    row[col] === "Occupied"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      : row[col] === "Vacant"
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  }`}
                                >
                                  {row[col]}
                                </span>
                              ) : (
                                row[col] || "—"
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleBack}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  Generate New Report
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
