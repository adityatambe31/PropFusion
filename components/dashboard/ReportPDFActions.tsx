"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { pdf } from "@react-pdf/renderer";
import {
  Download,
  Eye,
  X,
  FileText,
  BookOpen,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import ReportPDFDocument, {
  type ReportData,
  type ReportMode,
} from "./ReportPDFDocument";

/* Dynamically import PDFViewer — needs browser APIs, no SSR */
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-white rounded-full animate-spin" />
      </div>
    ),
  },
);

interface Props {
  report: ReportData;
}

export default function ReportPDFActions({ report }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<ReportMode>("summary");
  const [isDownloading, setIsDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<
    "preview" | "download" | "export" | null
  >(null);

  const handleDownload = useCallback(
    async (mode: ReportMode) => {
      setMenuOpen(null);
      setIsDownloading(true);
      try {
        const blob = await pdf(
          <ReportPDFDocument report={report} mode={mode} />,
        ).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${report.title.replace(/\s+/g, "_").toLowerCase()}_${mode}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("PDF download error:", err);
      } finally {
        setIsDownloading(false);
      }
    },
    [report],
  );

  const handleExcelExport = useCallback(() => {
    setMenuOpen(null);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet with stats
    const summaryData = [
      ["Report Title", report.title],
      ["Date Range", report.dateRange],
      ["Asset Type", report.assetType || "—"],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Metric", "Value"],
      ...report.stats.map((s) => [s.label, s.value]),
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // Data sheet with table
    const dataHeader = report.columns;
    const dataRows = report.rows.map((row) =>
      report.columns.map((col) => row[col] || "—"),
    );
    const dataSheet = XLSX.utils.aoa_to_sheet([dataHeader, ...dataRows]);

    // Auto-width columns
    const colWidths = report.columns.map((col, i) => ({
      wch:
        Math.max(
          col.length,
          ...dataRows.map((row) => String(row[i] || "").length),
        ) + 2,
    }));
    dataSheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, dataSheet, "Data");

    // Download
    const filename = `${report.title.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, [report]);

  const handleCSVExport = useCallback(() => {
    setMenuOpen(null);

    const header = report.columns.join(",");
    const body = report.rows
      .map((row) =>
        report.columns
          .map((col) => `"${(row[col] || "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const csv = header + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  const handlePreview = (mode: ReportMode) => {
    setMenuOpen(null);
    setPreviewMode(mode);
    setPreviewOpen(true);
  };

  return (
    <>
      {/* Preview Button with dropdown */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(menuOpen === "preview" ? null : "preview")}
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shadow-sm"
        >
          <Eye className="w-4 h-4" />
          Preview PDF
        </button>
        {menuOpen === "preview" && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(null)}
            />
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => handlePreview("summary")}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Summary</div>
                  <div className="text-xs text-gray-400">
                    Stats & overview table
                  </div>
                </div>
              </button>
              <button
                onClick={() => handlePreview("detailed")}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-700"
              >
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <div className="text-left">
                  <div className="font-medium">Detailed</div>
                  <div className="text-xs text-gray-400">
                    Full asset profiles
                  </div>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Download Button with dropdown */}
      <div className="relative">
        <button
          onClick={() =>
            setMenuOpen(menuOpen === "download" ? null : "download")
          }
          disabled={isDownloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shadow-sm disabled:opacity-50"
        >
          {isDownloading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-white rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isDownloading ? "Generating…" : "Download PDF"}
        </button>
        {menuOpen === "download" && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(null)}
            />
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => handleDownload("summary")}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Summary</div>
                  <div className="text-xs text-gray-400">
                    Stats & overview table
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleDownload("detailed")}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-700"
              >
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <div className="text-left">
                  <div className="font-medium">Detailed</div>
                  <div className="text-xs text-gray-400">
                    Full asset profiles
                  </div>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Export Button with dropdown */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(menuOpen === "export" ? null : "export")}
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Data
        </button>
        {menuOpen === "export" && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(null)}
            />
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={handleExcelExport}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Excel (.xlsx)</div>
                  <div className="text-xs text-gray-400">
                    Full workbook with sheets
                  </div>
                </div>
              </button>
              <button
                onClick={handleCSVExport}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-700"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">CSV</div>
                  <div className="text-xs text-gray-400">
                    Simple comma-separated
                  </div>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewOpen(false)}
          />
          <div className="relative w-[95vw] h-[92vh] max-w-6xl bg-white dark:bg-[#101010] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  PDF Preview —{" "}
                  <span className="capitalize">{previewMode}</span>
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {report.title}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Mode toggle pills */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewMode("summary")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${previewMode === "summary" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setPreviewMode("detailed")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${previewMode === "detailed" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    Detailed
                  </button>
                </div>
                <button
                  onClick={() => handleDownload(previewMode)}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? "Generating…" : "Download"}
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            {/* PDF Viewer */}
            <div className="flex-1 bg-gray-100 dark:bg-[#0a0a0a]">
              <PDFViewer
                width="100%"
                height="100%"
                showToolbar={false}
                style={{ border: "none" }}
              >
                <ReportPDFDocument report={report} mode={previewMode} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
