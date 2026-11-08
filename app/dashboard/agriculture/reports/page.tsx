"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  useAgricultureContext,
  Land,
} from "@/app/dashboard/agriculture/agriculture-context";

const ReportPDFActions = dynamic(
  () => import("@/components/dashboard/ReportPDFActions"),
  { ssr: false },
);
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  Sprout,
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
  { label: "Revenue / Profit", value: "revenue", icon: TrendingUp },
  { label: "Crop Analysis", value: "crop", icon: Sprout },
  { label: "Asset Summary", value: "summary", icon: BarChart3 },
];

/* ─── Report Generator ─── */
interface ReportResult {
  title: string;
  dateRange: string;
  stats: { label: string; value: string; accent?: string }[];
  rows: Record<string, string>[];
  columns: string[];
  assets?: Land[];
}

function generateReport(
  reportType: string,
  selected: Land[],
  dateRange: string,
  customRange: { from: string; to: string },
): ReportResult {
  const drLabel = dateRangeLabel(dateRange, customRange);

  if (reportType === "revenue") {
    const totalProfit = selected.reduce(
      (a, l) => a + parseCurrency(l.profit),
      0,
    );
    return {
      title: "Agriculture Revenue Report",
      dateRange: drLabel,
      stats: [
        {
          label: "Total Annual Profit",
          value: formatCurrency(totalProfit),
          accent: "text-emerald-500",
        },
        { label: "Lands Analyzed", value: String(selected.length) },
        {
          label: "Avg. Profit / Land",
          value: formatCurrency(
            selected.length ? totalProfit / selected.length : 0,
          ),
        },
      ],
      columns: ["Land", "Location", "Crop", "Area", "Annual Profit"],
      rows: selected.map((l) => ({
        Land: l.name,
        Location: `${l.location}, ${l.city || ""}`,
        Crop: l.crop,
        Area: l.area,
        "Annual Profit": l.profit,
      })),
      assets: selected,
    };
  }

  if (reportType === "crop") {
    const cropMap: Record<string, number> = {};
    selected.forEach((l) => {
      cropMap[l.crop] = (cropMap[l.crop] || 0) + 1;
    });
    return {
      title: "Crop Analysis Report",
      dateRange: drLabel,
      stats: Object.entries(cropMap).map(([crop, count]) => ({
        label: crop,
        value: `${count} plot${count > 1 ? "s" : ""}`,
      })),
      columns: [
        "Land",
        "Crop",
        "Area",
        "Irrigation",
        "Fertilizers",
        "Animals",
        "Vehicles",
      ],
      rows: selected.map((l) => ({
        Land: l.name,
        Crop: l.crop,
        Area: l.area,
        Irrigation: l.irrigation || "—",
        Fertilizers: l.fertilizers?.join(", ") || "—",
        Animals: l.animals?.join(", ") || "—",
        Vehicles: l.vehicles?.join(", ") || "—",
      })),
      assets: selected,
    };
  }

  // summary
  const totalProfit = selected.reduce((a, l) => a + parseCurrency(l.profit), 0);
  return {
    title: "Agriculture Asset Summary",
    dateRange: drLabel,
    stats: [
      { label: "Lands", value: String(selected.length) },
      {
        label: "Total Profit",
        value: formatCurrency(totalProfit),
        accent: "text-emerald-500",
      },
      {
        label: "Total Tenants",
        value: String(
          selected.reduce((a, l) => a + (l.tenants?.length || 0), 0),
        ),
      },
    ],
    columns: [
      "Land",
      "Location",
      "Crop",
      "Area",
      "Profit",
      "Lease Duration",
      "Tenants",
    ],
    rows: selected.map((l) => ({
      Land: l.name,
      Location: `${l.location}, ${l.city || ""}`,
      Crop: l.crop,
      Area: l.area,
      Profit: l.profit,
      "Lease Duration": l.leaseDuration || "—",
      Tenants: String(l.tenants?.length || 0),
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
export default function AgricultureReportsPage() {
  const { lands } = useAgricultureContext();

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
      selectedAssets.length === lands.length ? [] : lands.map((l) => l.id),
    );
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const selected = lands.filter((l) => selectedAssets.includes(l.id));
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
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
              Agriculture Reports
            </h1>
          </div>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
            Generate detailed reports for your agriculture lands.
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
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
                        Select Lands
                      </label>
                      {lands.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-xs font-medium text-green-600 dark:text-green-400 hover:underline"
                        >
                          {selectedAssets.length === lands.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      )}
                    </div>
                    {lands.length === 0 ? (
                      <div className="text-gray-400 dark:text-gray-500 italic text-sm py-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                        No lands found. Add some from the Agriculture
                        dashboard first.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {lands.map((l) => {
                          const isChecked = selectedAssets.includes(l.id);
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => handleAssetToggle(l.id)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                                isChecked
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? "border-green-500 bg-green-500"
                                    : "border-gray-300 dark:border-gray-600"
                                }`}
                              >
                                {isChecked && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                )}
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {l.name}
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">
                                  {l.location} • {l.crop}
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
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
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
                          className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 focus:outline-none"
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
                          className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 focus:outline-none"
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
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 shadow-green-500/20 shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:white mb-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to form
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {report.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {report.dateRange} • {report.rows.length} land
                    {report.rows.length !== 1 ? "s" : ""}
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
                    report={{ ...report, assetType: "Agriculture" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
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
                              {row[col] || "—"}
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
