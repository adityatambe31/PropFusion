"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useRealEstateContext,
  Property,
  Document,
  Tenant,
} from "../real-estate-context";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  Pencil,
  FileDown,
} from "lucide-react";
import { TenantManagement } from "@/components/dashboard/TenantManagement";
import { AssetTransactionsSection } from "@/components/dashboard/AssetTransactionsSection";

// Dynamically import Map component
const MapComponent = dynamic(
  () => import("@/components/dashboard/MapComponent"),
  {
    ssr: false,
  },
);

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { getProperty, updateProperty } = useRealEstateContext();

  const id = params.id as string;

  // Initialize state with initial lookup
  const [property, setProperty] = useState<Property | null>(() => {
    if (!id) return null;
    return getProperty(id) || null;
  });

  const handleTenantsChange = useCallback(
    (newTenants: Tenant[]) => {
      if (property) {
        const updatedProperty = {
          ...property,
          tenants: newTenants,
          tenantCount: newTenants.length,
        };
        updateProperty(property.id, updatedProperty);
        setProperty(updatedProperty);
      }
    },
    [property, updateProperty],
  );

  const handleEditProperty = () => {
    // Navigate back to dashboard with edit state (could also use query param)
    sessionStorage.setItem("editPropertyId", id);
    router.push("/dashboard/realestate?edit=true");
  };

  const handleGenerateReport = () => {
    router.push(`/dashboard/realestate/reports?property=${id}`);
  };

  const handleDocumentUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
      const files = e.target.files;
      if (files && files.length > 0 && property) {
        const newDocs: Document[] = Array.from(files).map((file) => ({
          id: Date.now().toString() + Math.random().toString(),
          name: file.name,
          type: documentType,
          file: file,
          url: URL.createObjectURL(file),
        }));

        const updatedProperty = {
          ...property,
          documents: [...(property.documents || []), ...newDocs],
        };

        updateProperty(property.id, updatedProperty);
        setProperty(updatedProperty);
      }
    },
    [property, updateProperty],
  );

  const handleRemoveDocument = useCallback(
    (docId: string) => {
      if (property) {
        const updatedProperty = {
          ...property,
          documents: (property.documents || []).filter(
            (doc) => doc.id !== docId,
          ),
        };
        updateProperty(property.id, updatedProperty);
        setProperty(updatedProperty);
      }
    },
    [property, updateProperty],
  );

  if (!property) {
    return (
      <div className="p-8 flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Property not found</h1>
        <Link href="/dashboard/realestate">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Adapter for map component
  const mapLands = [
    {
      ...property,
      crop: property.type, // Mapping type to crop for MapComponent compatibility
      profit: property.price,
      vehicles: [],
      animals: [],
      fertilizers: [],
    },
  ];

  return (
    <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link href="/dashboard/realestate">
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
          <Button variant="outline" onClick={handleEditProperty}>
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
          {property.name || "Unnamed Property"}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-400">
          <span>📍 {property.location}</span>
          {property.city && <span>• {property.city}</span>}
          {property.state && <span>, {property.state}</span>}
        </div>
      </div>

      {/* Map Section - contained and rounded */}
      <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 relative z-0">
        <MapComponent lands={mapLands} />
      </div>

      <AssetTransactionsSection assetId={property.id} />

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Area</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {property.area}
              </p>
            </div>
            <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Type</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {property.type}
              </p>
            </div>
            <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Zoning</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {property.zoning || "N/A"}
              </p>
            </div>
            <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Lease Duration</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {property.leaseDuration || "N/A"}
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
                {property.structures && property.structures.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {property.structures.map((v) => (
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
                  Amenities
                </h4>
                {property.amenities && property.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((a) => (
                      <span
                        key={a}
                        className="bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm"
                      >
                        ✨ {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No amenities</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Utilities
                </h4>
                {property.utilities && property.utilities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {property.utilities.map((f) => (
                      <span
                        key={f}
                        className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                      >
                        ⚡ {f}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">None listed</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Systems
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {property.systems || "None listed"}
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
                <p className="text-sm text-gray-500 mb-1">Price/Rent</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {property.price || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Tenants</p>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {property.tenants && property.tenants.length > 0
                    ? property.tenants.length === 1
                      ? property.tenants[0].name
                      : `${property.tenants.length} Tenants`
                    : "N/A"}
                </div>
                {property.tenants && property.tenants.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {property.tenants.map((t) => t.name).join(", ")}
                  </div>
                )}
              </div>
              {property.parcelNumber && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">
                    Parcel Number (APN)
                  </p>
                  <p className="text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-800 inline-block px-2 py-1 rounded">
                    {property.parcelNumber}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tenant Management */}
          <TenantManagement
            tenants={property.tenants || []}
            onTenantsChange={handleTenantsChange}
            propertyName={property.name}
          />
        </div>

        {/* Right Column: Documents */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Documents
              </h3>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-600 dark:text-gray-400">
                {property.documents?.length || 0}
              </span>
            </div>
            <div className="p-4">
              <div className="space-y-3 mb-6">
                {property.documents?.map((doc) => (
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
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(!property.documents || property.documents.length === 0) && (
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
