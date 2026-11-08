"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAgricultureContext, Land, Document } from "../agriculture-context";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, Pencil, FileDown } from "lucide-react";

// Dynamically import Map component
const MapComponent = dynamic(
  () => import("@/components/dashboard/MapComponent"),
  {
    ssr: false,
  },
);

export default function LandDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { getLand, updateLand } = useAgricultureContext();

  const landId = params.id as string;

  // Initialize state with initial lookup
  const [land, setLand] = useState<Land | null>(() => {
    if (!landId) return null;
    return getLand(landId) || null;
  });

  const handleEditLand = () => {
    sessionStorage.setItem("editLandId", landId);
    router.push("/dashboard/agriculture?edit=true");
  };

  const handleGenerateReport = () => {
    router.push(`/dashboard/agriculture/reports?land=${landId}`);
  };

  const handleDocumentUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
      const files = e.target.files;
      if (files && files.length > 0 && land) {
        const newDocs: Document[] = Array.from(files).map((file) => ({
          id: Date.now().toString() + Math.random().toString(),
          name: file.name,
          type: documentType,
          file: file,
          url: URL.createObjectURL(file),
        }));

        const updatedLand = {
          ...land,
          documents: [...(land.documents || []), ...newDocs],
        };

        updateLand(land.id, updatedLand);
        setLand(updatedLand);
      }
    },
    [land, updateLand],
  );

  const handleRemoveDocument = useCallback(
    (docId: string) => {
      if (land) {
        const updatedLand = {
          ...land,
          documents: (land.documents || []).filter((doc) => doc.id !== docId),
        };
        updateLand(land.id, updatedLand);
        setLand(updatedLand);
      }
    },
    [land, updateLand],
  );

  if (!land) {
    return (
      <div className="p-8 flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Land not found</h1>
        <Link href="/dashboard/agriculture">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link href="/dashboard/agriculture">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        </Link>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleEditLand}>
            <Pencil className="w-4 h-4 mr-2" /> Edit Property
          </Button>
          <Button onClick={handleGenerateReport}>
            <FileDown className="w-4 h-4 mr-2" /> Generate Report
          </Button>
        </div>
      </div>

      {/* Title Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {land.name || "Unnamed Property"}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-400">
          <span>📍 {land.location}</span>
          {land.city && <span>• {land.city}</span>}
          {land.state && <span>, {land.state}</span>}
        </div>
      </div>

      {/* Map Section - contained and rounded */}
      <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 relative z-0">
        <MapComponent lands={[land]} />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Acreage</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {land.area}
              </p>
            </div>
            <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Land Use</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {land.crop}
              </p>
            </div>
            <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Zoning</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {land.zoning || "N/A"}
              </p>
            </div>
            <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Lease Duration</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {land.leaseDuration || "N/A"}
              </p>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Operations & Resources
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Structures
                </h4>
                {land.vehicles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {land.vehicles.map((v) => (
                      <span
                        key={v}
                        className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm"
                      >
                        🏠 {v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No structures</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Livestock
                </h4>
                {land.animals.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {land.animals.map((a) => (
                      <span
                        key={a}
                        className="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-sm"
                      >
                        🐄 {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No livestock</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Fertilizers
                </h4>
                {land.fertilizers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {land.fertilizers.map((f) => (
                      <span
                        key={f}
                        className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                      >
                        🧪 {f}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">None listed</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Irrigation
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {land.irrigation || "None listed"}
                </p>
              </div>
            </div>
          </div>

          {/* Financials & Lease */}
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Financials & Lease
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Annual Rent/Profit
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {land.profit || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Lease Holder Name
                </p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {land.leaseHolderName || "N/A"}
                </p>
              </div>
              {land.parcelNumber && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">
                    Parcel Number (APN)
                  </p>
                  <p className="text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-800 inline-block px-2 py-1 rounded">
                    {land.parcelNumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Documents */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Documents
              </h3>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-600 dark:text-gray-400">
                {land.documents?.length || 0}
              </span>
            </div>
            <div className="p-4">
              <div className="space-y-3 mb-6">
                {land.documents?.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] hover:border-blue-200 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-black flex items-center justify-center border border-gray-200 dark:border-gray-700 text-xl shrink-0">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {doc.type.replace("_", " ")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveDocument(doc.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {(!land.documents || land.documents.length === 0) && (
                  <p className="text-center text-gray-400 text-sm py-4">
                    No documents uploaded
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="file"
                    id="upload-lease"
                    className="hidden"
                    onChange={(e) =>
                      handleDocumentUpload(e, "lease_agreement")
                    }
                  />
                  <label
                    htmlFor="upload-lease"
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center"
                  >
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Add Lease
                    </span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="upload-other"
                    className="hidden"
                    onChange={(e) => handleDocumentUpload(e, "other")}
                  />
                  <label
                    htmlFor="upload-other"
                    className="flex flex-col items-center justify-center gap-2 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center"
                  >
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Add Other
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
