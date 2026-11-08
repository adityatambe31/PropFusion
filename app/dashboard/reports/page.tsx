"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  useRealEstateContext,
  Property,
} from "@/app/dashboard/realestate/real-estate-context";
import {
  useAgricultureContext,
  Land,
} from "@/app/dashboard/agriculture/agriculture-context";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Building2,
  Sprout,
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
  formatPercent,
  dateRangeLabel,
  calcPropertyMonthlyExpenses,
  calcLandAnnualExpenses,
  calcROI,
  calcNetProfit,
  calcCapRate,
  calcAppreciation,
  calcDaysUntilLeaseExpiry,
} from "@/lib/helpers/report-helpers";

const ReportPDFActions = dynamic(
  () => import("@/components/dashboard/ReportPDFActions"),
  { ssr: false },
);

/* ─── Constants ─── */
const REPORT_TYPES_RE = [
  { label: "Revenue", value: "revenue", icon: TrendingUp },
  { label: "Occupancy", value: "occupancy", icon: Users },
  { label: "Maintenance", value: "maintenance", icon: Wrench },
  { label: "Asset Summary", value: "summary", icon: BarChart3 },
];

const REPORT_TYPES_AG = [
  { label: "Revenue / Profit", value: "revenue", icon: TrendingUp },
  { label: "Crop Analysis", value: "crop", icon: Sprout },
  { label: "Asset Summary", value: "summary", icon: BarChart3 },
];

/* ─── Report Generator ─── */
interface ReportResult {
  title: string;
  reportType: "revenue" | "occupancy" | "maintenance" | "summary" | "crop";
  dateRange: string;
  assetType: string;
  stats: { label: string; value: string; subValue?: string; accent?: string }[];
  rows: Record<string, string>[];
  columns: string[];
  assets?: (Property | Land)[];
}

function generateReport(
  assetType: "realestate" | "agriculture",
  reportType: string,
  selectedIds: string[],
  properties: Property[],
  lands: Land[],
  dateRange: string,
  customRange: { from: string; to: string },
): ReportResult {
  const drLabel = dateRangeLabel(dateRange, customRange);

  if (assetType === "realestate") {
    const selected = properties.filter((p) => selectedIds.includes(p.id));

    if (reportType === "revenue") {
      const totalRevenue = selected.reduce(
        (a, p) => a + parseCurrency(p.price),
        0,
      );
      const totalExpenses = selected.reduce(
        (a, p) => a + calcPropertyMonthlyExpenses(p.expenses),
        0,
      );
      const netProfit = calcNetProfit(totalRevenue, totalExpenses);
      const totalPurchasePrice = selected.reduce(
        (a, p) => a + parseCurrency(p.purchasePrice),
        0,
      );
      const totalCurrentValue = selected.reduce(
        (a, p) => a + parseCurrency(p.currentValue || p.purchasePrice),
        0,
      );
      const annualROI =
        totalPurchasePrice > 0
          ? calcROI(netProfit * 12, totalPurchasePrice)
          : 0;
      const appreciation =
        totalPurchasePrice > 0
          ? calcAppreciation(totalPurchasePrice, totalCurrentValue)
          : 0;

      return {
        title: "Real Estate Revenue Report",
        reportType: "revenue",
        dateRange: drLabel,
        assetType: "Real Estate",
        stats: [
          {
            label: "Total Monthly Revenue",
            value: formatCurrency(totalRevenue),
            accent: "text-emerald-500",
          },
          {
            label: "Total Monthly Expenses",
            value: formatCurrency(totalExpenses),
            accent: "text-red-500",
          },
          {
            label: "Net Monthly Profit",
            value: formatCurrency(netProfit),
            accent: netProfit >= 0 ? "text-emerald-500" : "text-red-500",
          },
          {
            label: "Annual ROI",
            value: formatPercent(annualROI),
            accent:
              annualROI >= 8
                ? "text-emerald-500"
                : annualROI >= 4
                  ? "text-amber-500"
                  : "text-red-500",
          },
          {
            label: "Portfolio Appreciation",
            value: formatPercent(appreciation),
            accent: appreciation >= 0 ? "text-emerald-500" : "text-red-500",
          },
          { label: "Properties Analyzed", value: String(selected.length) },
        ],
        columns: [
          "Property",
          "Location",
          "Type",
          "Revenue",
          "Expenses",
          "Net Profit",
          "ROI",
        ],
        rows: selected.map((p) => {
          const monthlyRev = parseCurrency(p.price);
          const monthlyExp = calcPropertyMonthlyExpenses(p.expenses);
          const net = monthlyRev - monthlyExp;
          const purchasePrice = parseCurrency(p.purchasePrice);
          const roi = purchasePrice > 0 ? calcROI(net * 12, purchasePrice) : 0;
          return {
            Property: p.name,
            Location: `${p.location}, ${p.city || ""}`,
            Type: p.type,
            Revenue: p.price,
            Expenses: formatCurrency(monthlyExp),
            "Net Profit": formatCurrency(net),
            ROI: formatPercent(roi),
          };
        }),
        assets: selected,
      };
    }

    if (reportType === "occupancy") {
      const occupied = selected.filter((p) => p.status === "Occupied").length;
      const vacant = selected.filter((p) => p.status === "Vacant").length;
      const maintenance = selected.filter(
        (p) => p.status === "Under Maintenance",
      ).length;
      const rate = selected.length
        ? Math.round((occupied / selected.length) * 100)
        : 0;
      const totalTenants = selected.reduce(
        (a, p) => a + (p.tenants?.length || 0),
        0,
      );

      // Calculate lease expiry alerts
      const expiringIn30Days = selected.filter((p) => {
        const days = calcDaysUntilLeaseExpiry(p.leaseEndDate);
        return days > 0 && days <= 30;
      }).length;
      const expiringIn90Days = selected.filter((p) => {
        const days = calcDaysUntilLeaseExpiry(p.leaseEndDate);
        return days > 30 && days <= 90;
      }).length;

      // Monthly vacancy loss
      const vacantRevenueLoss = selected
        .filter((p) => p.status === "Vacant")
        .reduce((a, p) => a + parseCurrency(p.price), 0);

      return {
        title: "Occupancy Report",
        reportType: "occupancy",
        dateRange: drLabel,
        assetType: "Real Estate",
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
          {
            label: "Under Maintenance",
            value: String(maintenance),
            accent: "text-amber-500",
          },
          {
            label: "Lease Expiring (30 days)",
            value: String(expiringIn30Days),
            accent: expiringIn30Days > 0 ? "text-red-500" : "text-gray-500",
          },
          {
            label: "Lease Expiring (90 days)",
            value: String(expiringIn90Days),
            accent: expiringIn90Days > 0 ? "text-amber-500" : "text-gray-500",
          },
          {
            label: "Monthly Vacancy Loss",
            value: formatCurrency(vacantRevenueLoss),
            accent: "text-red-400",
          },
        ],
        columns: ["Property", "Status", "Tenants", "Lease Ends", "Days Left"],
        rows: selected.map((p) => {
          const daysLeft = calcDaysUntilLeaseExpiry(p.leaseEndDate);
          return {
            Property: p.name,
            Status: p.status,
            Tenants: String(p.tenants?.length || 0),
            "Lease Ends": p.leaseEndDate || "—",
            "Days Left": daysLeft > 0 ? `${daysLeft} days` : "—",
          };
        }),
        assets: selected,
      };
    }

    if (reportType === "maintenance") {
      const byStatus: Record<string, number> = {};
      selected.forEach((p) => {
        byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      });

      // Calculate total maintenance expenses
      const totalMaintenanceExpenses = selected.reduce(
        (a, p) => a + parseCurrency(p.expenses?.maintenance),
        0,
      );

      // Find properties needing attention (no recent maintenance)
      const needsAttention = selected.filter((p) => {
        if (!p.lastMaintenanceDate) return true;
        const lastMaint = new Date(p.lastMaintenanceDate);
        const monthsAgo =
          (Date.now() - lastMaint.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo > 6; // More than 6 months since last maintenance
      }).length;

      return {
        title: "Maintenance & Status Report",
        reportType: "maintenance",
        dateRange: drLabel,
        assetType: "Real Estate",
        stats: [
          ...Object.entries(byStatus).map(([status, count]) => ({
            label: status,
            value: String(count),
            accent:
              status === "Under Maintenance"
                ? "text-amber-500"
                : status === "Vacant"
                  ? "text-red-400"
                  : "text-emerald-500",
          })),
          {
            label: "Monthly Maintenance Cost",
            value: formatCurrency(totalMaintenanceExpenses),
            accent: "text-amber-500",
          },
          {
            label: "Needs Attention",
            value: String(needsAttention),
            accent: needsAttention > 0 ? "text-red-500" : "text-gray-500",
          },
        ],
        columns: [
          "Property",
          "Status",
          "Last Maintenance",
          "Monthly Cost",
          "Systems",
        ],
        rows: selected.map((p) => ({
          Property: p.name,
          Status: p.status,
          "Last Maintenance": p.lastMaintenanceDate || "Never",
          "Monthly Cost": p.expenses?.maintenance || "—",
          Systems: p.systems || "—",
        })),
        assets: selected,
      };
    }

    // summary - Enhanced with comprehensive metrics
    const totalRevenue = selected.reduce(
      (a, p) => a + parseCurrency(p.price),
      0,
    );
    const totalExpenses = selected.reduce(
      (a, p) => a + calcPropertyMonthlyExpenses(p.expenses),
      0,
    );
    const netProfit = totalRevenue - totalExpenses;
    const totalTenants = selected.reduce(
      (a, p) => a + (p.tenants?.length || 0),
      0,
    );
    const totalPurchasePrice = selected.reduce(
      (a, p) => a + parseCurrency(p.purchasePrice),
      0,
    );
    const totalCurrentValue = selected.reduce(
      (a, p) => a + parseCurrency(p.currentValue || p.purchasePrice),
      0,
    );
    const occupancyRate = selected.length
      ? Math.round(
          (selected.filter((p) => p.status === "Occupied").length /
            selected.length) *
            100,
        )
      : 0;
    const annualROI =
      totalPurchasePrice > 0 ? calcROI(netProfit * 12, totalPurchasePrice) : 0;
    const capRate =
      totalCurrentValue > 0
        ? calcCapRate(netProfit * 12, totalCurrentValue)
        : 0;
    const appreciation =
      totalPurchasePrice > 0
        ? calcAppreciation(totalPurchasePrice, totalCurrentValue)
        : 0;

    return {
      title: "Asset Summary Report",
      reportType: "summary",
      dateRange: drLabel,
      assetType: "Real Estate",
      stats: [
        { label: "Total Properties", value: String(selected.length) },
        { label: "Total Tenants", value: String(totalTenants) },
        {
          label: "Occupancy Rate",
          value: `${occupancyRate}%`,
          accent:
            occupancyRate >= 75
              ? "text-emerald-500"
              : occupancyRate >= 50
                ? "text-amber-500"
                : "text-red-500",
        },
        {
          label: "Portfolio Value",
          value: formatCurrency(totalCurrentValue),
          accent: "text-blue-500",
        },
        {
          label: "Monthly Revenue",
          value: formatCurrency(totalRevenue),
          accent: "text-emerald-500",
        },
        {
          label: "Monthly Expenses",
          value: formatCurrency(totalExpenses),
          accent: "text-red-400",
        },
        {
          label: "Net Monthly Profit",
          value: formatCurrency(netProfit),
          accent: netProfit >= 0 ? "text-emerald-500" : "text-red-500",
        },
        {
          label: "Annual ROI",
          value: formatPercent(annualROI),
          accent:
            annualROI >= 8
              ? "text-emerald-500"
              : annualROI >= 4
                ? "text-amber-500"
                : "text-red-500",
        },
        {
          label: "Cap Rate",
          value: formatPercent(capRate),
          accent: capRate >= 5 ? "text-emerald-500" : "text-amber-500",
        },
        {
          label: "Appreciation",
          value: formatPercent(appreciation),
          accent: appreciation >= 0 ? "text-emerald-500" : "text-red-500",
        },
      ],
      columns: [
        "Property",
        "Location",
        "Type",
        "Status",
        "Value",
        "Revenue",
        "Net Profit",
        "ROI",
      ],
      rows: selected.map((p) => {
        const rev = parseCurrency(p.price);
        const exp = calcPropertyMonthlyExpenses(p.expenses);
        const net = rev - exp;
        const purchase = parseCurrency(p.purchasePrice);
        const roi = purchase > 0 ? calcROI(net * 12, purchase) : 0;
        return {
          Property: p.name,
          Location: `${p.location}, ${p.city || ""}`,
          Type: p.type,
          Status: p.status,
          Value: p.currentValue || p.purchasePrice || "—",
          Revenue: p.price,
          "Net Profit": formatCurrency(net),
          ROI: formatPercent(roi),
        };
      }),
      assets: selected,
    };
  }

  // Agriculture
  const selected = lands.filter((l) => selectedIds.includes(l.id));

  if (reportType === "revenue") {
    const totalRevenue = selected.reduce(
      (a, l) => a + parseCurrency(l.revenue),
      0,
    );
    const totalExpenses = selected.reduce(
      (a, l) => a + calcLandAnnualExpenses(l.expenses),
      0,
    );
    const netProfit = totalRevenue - totalExpenses;
    const totalPurchasePrice = selected.reduce(
      (a, l) => a + parseCurrency(l.purchasePrice),
      0,
    );
    const totalCurrentValue = selected.reduce(
      (a, l) => a + parseCurrency(l.currentValue || l.purchasePrice),
      0,
    );
    const annualROI =
      totalPurchasePrice > 0 ? calcROI(netProfit, totalPurchasePrice) : 0;
    const appreciation =
      totalPurchasePrice > 0
        ? calcAppreciation(totalPurchasePrice, totalCurrentValue)
        : 0;

    return {
      title: "Agriculture Revenue Report",
      reportType: "revenue",
      dateRange: drLabel,
      assetType: "Agriculture",
      stats: [
        {
          label: "Total Annual Revenue",
          value: formatCurrency(totalRevenue),
          accent: "text-emerald-500",
        },
        {
          label: "Total Annual Expenses",
          value: formatCurrency(totalExpenses),
          accent: "text-red-500",
        },
        {
          label: "Net Annual Profit",
          value: formatCurrency(netProfit),
          accent: netProfit >= 0 ? "text-emerald-500" : "text-red-500",
        },
        {
          label: "Annual ROI",
          value: formatPercent(annualROI),
          accent:
            annualROI >= 8
              ? "text-emerald-500"
              : annualROI >= 4
                ? "text-amber-500"
                : "text-red-500",
        },
        {
          label: "Land Appreciation",
          value: formatPercent(appreciation),
          accent: appreciation >= 0 ? "text-emerald-500" : "text-red-500",
        },
        { label: "Lands Analyzed", value: String(selected.length) },
      ],
      columns: [
        "Land",
        "Location",
        "Crop",
        "Revenue",
        "Expenses",
        "Net Profit",
        "ROI",
      ],
      rows: selected.map((l) => {
        const rev = parseCurrency(l.revenue);
        const exp = calcLandAnnualExpenses(l.expenses);
        const net = rev - exp;
        const purchase = parseCurrency(l.purchasePrice);
        const roi = purchase > 0 ? calcROI(net, purchase) : 0;
        return {
          Land: l.name,
          Location: `${l.location}, ${l.city || ""}`,
          Crop: l.crop,
          Revenue: l.revenue || l.profit,
          Expenses: formatCurrency(exp),
          "Net Profit": formatCurrency(net),
          ROI: formatPercent(roi),
        };
      }),
      assets: selected,
    };
  }

  if (reportType === "crop") {
    const cropMap: Record<string, number> = {};
    const cropProfit: Record<string, number> = {};
    const cropArea: Record<string, number> = {};
    selected.forEach((l) => {
      cropMap[l.crop] = (cropMap[l.crop] || 0) + 1;
      cropProfit[l.crop] = (cropProfit[l.crop] || 0) + parseCurrency(l.profit);
      cropArea[l.crop] =
        (cropArea[l.crop] || 0) +
        parseFloat(l.area.replace(/[^0-9.]/g, "") || "0");
    });

    return {
      title: "Crop Analysis Report",
      reportType: "crop",
      dateRange: drLabel,
      assetType: "Agriculture",
      stats: [
        ...Object.entries(cropMap).map(([crop, count]) => ({
          label: crop,
          value: `${count} plot${count > 1 ? "s" : ""}`,
          subValue: formatCurrency(cropProfit[crop]),
          accent: "text-emerald-500",
        })),
        {
          label: "Total Crop Types",
          value: String(Object.keys(cropMap).length),
        },
      ],
      columns: [
        "Land",
        "Crop",
        "Area",
        "Yield/Acre",
        "Irrigation",
        "Next Harvest",
        "Profit",
      ],
      rows: selected.map((l) => ({
        Land: l.name,
        Crop: l.crop,
        Area: l.area,
        "Yield/Acre": l.yieldPerAcre || "—",
        Irrigation: l.irrigation || "—",
        "Next Harvest": l.nextHarvestDate || "—",
        Profit: l.profit,
      })),
      assets: selected,
    };
  }

  // summary - Enhanced agriculture summary
  const totalRevenue = selected.reduce(
    (a, l) => a + parseCurrency(l.revenue),
    0,
  );
  const totalExpenses = selected.reduce(
    (a, l) => a + calcLandAnnualExpenses(l.expenses),
    0,
  );
  const netProfit = totalRevenue - totalExpenses;
  const totalProfit = selected.reduce((a, l) => a + parseCurrency(l.profit), 0);
  const totalPurchasePrice = selected.reduce(
    (a, l) => a + parseCurrency(l.purchasePrice),
    0,
  );
  const totalCurrentValue = selected.reduce(
    (a, l) => a + parseCurrency(l.currentValue || l.purchasePrice),
    0,
  );
  const annualROI =
    totalPurchasePrice > 0 ? calcROI(netProfit, totalPurchasePrice) : 0;
  const appreciation =
    totalPurchasePrice > 0
      ? calcAppreciation(totalPurchasePrice, totalCurrentValue)
      : 0;

  // Crop diversity
  const uniqueCrops = new Set(selected.map((l) => l.crop)).size;

  return {
    title: "Agriculture Asset Summary",
    reportType: "summary",
    dateRange: drLabel,
    assetType: "Agriculture",
    stats: [
      { label: "Total Lands", value: String(selected.length) },
      { label: "Crop Types", value: String(uniqueCrops) },
      {
        label: "Portfolio Value",
        value: formatCurrency(totalCurrentValue),
        accent: "text-blue-500",
      },
      {
        label: "Annual Revenue",
        value: formatCurrency(totalRevenue || totalProfit),
        accent: "text-emerald-500",
      },
      {
        label: "Annual Expenses",
        value: formatCurrency(totalExpenses),
        accent: "text-red-400",
      },
      {
        label: "Net Annual Profit",
        value: formatCurrency(netProfit || totalProfit),
        accent:
          netProfit >= 0 || totalProfit >= 0
            ? "text-emerald-500"
            : "text-red-500",
      },
      {
        label: "Annual ROI",
        value: formatPercent(annualROI),
        accent:
          annualROI >= 8
            ? "text-emerald-500"
            : annualROI >= 4
              ? "text-amber-500"
              : "text-red-500",
      },
      {
        label: "Appreciation",
        value: formatPercent(appreciation),
        accent: appreciation >= 0 ? "text-emerald-500" : "text-red-500",
      },
    ],
    columns: [
      "Land",
      "Location",
      "Crop",
      "Area",
      "Value",
      "Revenue",
      "Net Profit",
      "ROI",
    ],
    rows: selected.map((l) => {
      const rev = parseCurrency(l.revenue) || parseCurrency(l.profit);
      const exp = calcLandAnnualExpenses(l.expenses);
      const net = rev - exp;
      const purchase = parseCurrency(l.purchasePrice);
      const roi = purchase > 0 ? calcROI(net, purchase) : 0;
      return {
        Land: l.name,
        Location: `${l.location}, ${l.city || ""}`,
        Crop: l.crop,
        Area: l.area,
        Value: l.currentValue || l.purchasePrice || "—",
        Revenue: l.revenue || l.profit,
        "Net Profit": formatCurrency(net),
        ROI: formatPercent(roi),
      };
    }),
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
  const csv = header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.title.replace(/\s+/g, "_").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Page ─── */
export default function ReportsPage() {
  const realEstateContext = useRealEstateContext();
  const agricultureContext = useAgricultureContext();
  const properties = realEstateContext?.properties || [];
  const lands = agricultureContext?.lands || [];

  const [assetType, setAssetType] = useState<"realestate" | "agriculture">(
    "realestate",
  );
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [reportType, setReportType] = useState("revenue");
  const [dateRange, setDateRange] = useState<DateRangeValue>("3m");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [report, setReport] = useState<ReportResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReportTypeLabel, setGeneratedReportTypeLabel] = useState("");

  const assets = assetType === "realestate" ? properties : lands;
  const reportTypes =
    assetType === "realestate" ? REPORT_TYPES_RE : REPORT_TYPES_AG;

  // Ensure reportType is valid for the current asset type
  const validReportType = reportTypes.some((rt) => rt.value === reportType)
    ? reportType
    : reportTypes[0].value;

  const activeReportTypeLabel =
    reportTypes.find((rt) => rt.value === validReportType)?.label || "Report";

  const accentStyles =
    assetType === "realestate"
      ? {
          optionActive:
            "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
          link: "text-blue-600 dark:text-blue-400",
          itemActive: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
          checkActive: "border-blue-500 bg-blue-500",
        }
      : {
          optionActive:
            "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
          link: "text-green-600 dark:text-green-400",
          itemActive: "border-green-500 bg-green-50 dark:bg-green-900/20",
          checkActive: "border-green-500 bg-green-500",
        };

  const handleAssetToggle = (id: string) => {
    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === assets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(assets.map((a) => a.id));
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setGeneratedReportTypeLabel(activeReportTypeLabel);
    setTimeout(() => {
      const result = generateReport(
        assetType,
        validReportType,
        selectedAssets,
        properties,
        lands,
        dateRange,
        customRange,
      );
      setReport(result);
      setIsGenerating(false);
    }, 600);
  };

  const handleBack = () => {
    setReport(null);
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
                Reports
              </h1>
            </div>
            <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
              Generate detailed reports across your real estate and agriculture
              assets.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!report ? (
              /* ─── Configuration Form ─── */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="bg-white dark:bg-[#101010] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                  {/* Asset Type Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-800">
                    <button
                      onClick={() => {
                        setAssetType("realestate");
                        setSelectedAssets([]);
                        setReportType("revenue");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${
                        assetType === "realestate"
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      Real Estate
                    </button>
                    <button
                      onClick={() => {
                        setAssetType("agriculture");
                        setSelectedAssets([]);
                        setReportType("revenue");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${
                        assetType === "agriculture"
                          ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-b-2 border-green-600 dark:border-green-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                      }`}
                    >
                      <Sprout className="w-4 h-4" />
                      Agriculture
                    </button>
                  </div>

                  <div className="p-6 sm:p-8 space-y-8">
                    {/* Report Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Report Type
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {reportTypes.map((rt) => {
                          const Icon = rt.icon;
                          const isActive = reportType === rt.value;
                          return (
                            <button
                              key={rt.value}
                              type="button"
                              onClick={() => setReportType(rt.value)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                isActive
                                  ? accentStyles.optionActive
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
                          Select{" "}
                          {assetType === "realestate" ? "Properties" : "Lands"}
                        </label>
                        {assets.length > 0 && (
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            className={`text-xs font-medium hover:underline ${accentStyles.link}`}
                          >
                            {selectedAssets.length === assets.length
                              ? "Deselect All"
                              : "Select All"}
                          </button>
                        )}
                      </div>
                      {assets.length === 0 ? (
                        <div className="text-gray-400 dark:text-gray-500 italic text-sm py-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                          No{" "}
                          {assetType === "realestate" ? "properties" : "lands"}{" "}
                          found. Add some from the{" "}
                          {assetType === "realestate"
                            ? "Real Estate"
                            : "Agriculture"}{" "}
                          dashboard first.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {assets.map((asset) => {
                            const isChecked = selectedAssets.includes(asset.id);
                            return (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() => handleAssetToggle(asset.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                                  isChecked
                                    ? accentStyles.itemActive
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                    isChecked
                                      ? accentStyles.checkActive
                                      : "border-gray-300 dark:border-gray-600"
                                  }`}
                                >
                                  {isChecked && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  )}
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {asset.name}
                                  </span>
                                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                                    {asset.location}
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
                        {DATE_RANGES.map((range) => (
                          <button
                            key={range.value}
                            type="button"
                            onClick={() => setDateRange(range.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                              dateRange === range.value
                                ? accentStyles.optionActive
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                            }`}
                          >
                            {range.label}
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
                              setCustomRange((prev) => ({
                                ...prev,
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
                              setCustomRange((prev) => ({
                                ...prev,
                                to: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Generate Button */}
                    <button
                      onClick={handleGenerate}
                      disabled={selectedAssets.length === 0 || isGenerating}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        assetType === "realestate"
                          ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 shadow-lg"
                          : "bg-green-600 hover:bg-green-700 shadow-green-500/20 shadow-lg"
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating…
                        </>
                      ) : (
                        <>
                          Generate {activeReportTypeLabel}
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ─── Report Results ─── */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {/* Result Header */}
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
                      {report.assetType} • {report.dateRange} •{" "}
                      {report.rows.length} asset
                      {report.rows.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Report Type: {generatedReportTypeLabel || activeReportTypeLabel}
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
                    <ReportPDFActions report={report} />
                  </div>
                </div>

                {/* Stat Cards */}
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
                          stat.subValue
                            ? "text-gray-900 dark:text-white"
                            : stat.accent || "text-gray-900 dark:text-white"
                        }`}
                      >
                        {stat.value}
                      </div>
                      {stat.subValue && (
                        <div
                          className={`text-[15px] font-semibold mt-1 ${
                            stat.accent || "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {stat.subValue}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Data Table */}
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

                {/* New Report Button */}
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
