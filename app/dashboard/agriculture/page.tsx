"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid, Map as MapIcon, Sprout, Pencil, Trash2, TrendingUp } from "lucide-react";
import {
  useAgricultureContext,
  Land,
  Tenant,
  Document,
} from "./agriculture-context";
import { geocodeAddress } from "@/lib/helpers/geocode";
import { SingleImageUpload } from "@/components/shared/ImageUpload";
import { SearchFilter, useSearchFilter } from "@/components/shared/SearchFilter";
import { 
  DollarSign, 
  AlertCircle, 
  PlusCircle,
  MapPin,
  Maximize2,
  Tag,
  Droplet
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import Map component to avoid SSR issues
const MapComponent = dynamic(
  () => import("@/components/dashboard/MapComponent"),
  {
    ssr: false,
  },
);

export default function AgricultureDashboard() {
  const router = useRouter();
  const { lands, addLand, updateLand, deleteLand } = useAgricultureContext();
  const [showMap, setShowMap] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newLand, setNewLand] = useState<
    Omit<
      Land,
      "id" | "tenants" | "vehicles" | "animals" | "fertilizers" | "documents"
    > & {
      id?: string;
      tenants?: Tenant[];
      vehicles: string | string[];
      animals: string | string[];
      fertilizers: string | string[];
      documents?: Document[];
    }
  >({
    name: "",
    location: "",
    city: "",
    state: "",
    zip: "",
    crop: "",
    area: "",
    leaseDuration: "",
    profit: "",
    vehicles: "",
    animals: "",
    fertilizers: "",
    coordinates: { lat: 0, lng: 0 },
    parcelNumber: "",
    zoning: "",
    irrigation: "",
    leaseHolderName: "",
    documents: [],
  });

  const handleAddOrEditLand = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we are in Step 1, hitting enter or clicking submit should go to Step 2
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    setIsGeocoding(true);

    // Geocode the address to get coordinates
    let coordinates = { lat: 0, lng: 0 };

    // If editing and coordinates exist, use them as fallback
    if (editIndex !== null && lands[editIndex]?.coordinates) {
      coordinates = lands[editIndex].coordinates;
    }

    if (newLand.location && newLand.city && newLand.state) {
      const geocoded = await geocodeAddress(
        newLand.location,
        newLand.city,
        newLand.state,
        newLand.zip,
      );
      if (geocoded) {
        coordinates = geocoded;
      } else if (coordinates.lat === 0 && coordinates.lng === 0) {
        // Only show alert if we don't have existing coordinates
        alert(
          "Could not find coordinates for this address. The land will be saved but may not appear on the map.",
        );
      }
    }

    const landObj: Land = {
      ...newLand,
      id: editIndex !== null ? lands[editIndex].id : Date.now().toString(),
      vehicles: Array.isArray(newLand.vehicles)
        ? (newLand.vehicles as string[])
        : typeof newLand.vehicles === "string" && newLand.vehicles.length > 0
          ? (newLand.vehicles as string).split(",").map((v: string) => v.trim())
          : [],
      animals: Array.isArray(newLand.animals)
        ? (newLand.animals as string[])
        : typeof newLand.animals === "string" && newLand.animals.length > 0
          ? (newLand.animals as string).split(",").map((a: string) => a.trim())
          : [],
      fertilizers: Array.isArray(newLand.fertilizers)
        ? (newLand.fertilizers as string[])
        : typeof newLand.fertilizers === "string" &&
            newLand.fertilizers.length > 0
          ? (newLand.fertilizers as string)
              .split(",")
              .map((f: string) => f.trim())
          : [],
      tenants: [],
      coordinates,
      leaseHolderName: newLand.leaseHolderName || "",
      documents: newLand.documents || [],
      // Ensure all required fields from interface are present
      city: newLand.city,
      state: newLand.state,
      zip: newLand.zip,
      parcelNumber: newLand.parcelNumber,
      zoning: newLand.zoning,
      irrigation: newLand.irrigation,
    };
    if (editIndex !== null) {
      updateLand(lands[editIndex].id, landObj);
    } else {
      addLand(landObj);
    }
    setIsGeocoding(false);
    setShowAddModal(false);
    setNewLand({
      name: "",
      location: "",
      city: "",
      state: "",
      zip: "",
      crop: "",
      area: "",
      leaseDuration: "",
      profit: "",
      vehicles: "",
      animals: "",
      fertilizers: "",
      coordinates: { lat: 0, lng: 0 },
      parcelNumber: "",
      zoning: "",
      irrigation: "",
      leaseHolderName: "",
      documents: [],
    });
    setEditIndex(null);
    setCurrentStep(1); // Reset step
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [activeSort, setActiveSort] = useState("name-asc");

  const filteredLands = useSearchFilter(
    lands,
    ["name", "location", "city", "state", "crop"],
    searchQuery,
    activeFilters,
    (item, filters) => {
      if (filters.crop && filters.crop !== "all" && item.crop !== filters.crop) return false;
      if (filters.irrigation && filters.irrigation !== "all" && item.irrigation !== filters.irrigation) return false;
      if (filters.state && filters.state !== "all" && item.state !== filters.state) return false;
      return true;
    },
    activeSort,
    (a, b, sortKey) => {
      switch (sortKey) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "area-desc": return parseFloat(b.area) - parseFloat(a.area);
        case "profit-desc": return parseFloat(b.profit.replace(/[^0-9.]/g, "")) - parseFloat(a.profit.replace(/[^0-9.]/g, ""));
        default: return 0;
      }
    }
  );

  const totalAcreage = lands.reduce((acc, land) => acc + parseFloat(land.area.replace(/[^0-9.]/g, "") || "0"), 0);
  const totalRevenue = lands.reduce((acc, land) => acc + parseFloat(land.profit.replace(/[^0-9.]/g, "") || "0"), 0);
  const activeOps = lands.filter(l => (l.animals?.length || 0) > 0 || (l.vehicles?.length || 0) > 0).length;

  const handleDeleteLand = (id: string) => {
    deleteLand(id);
  };

  const handleEditLand = (land: Land, idx: number) => {
    // Strip "acres" suffix from area for editing
    const areaValue = land.area.replace(/\s*acres?\s*$/i, "");
    setNewLand({
      ...land,
      area: areaValue,
      vehicles: land.vehicles,
      animals: land.animals,
      fertilizers: land.fertilizers,
      documents: land.documents || [],
      leaseHolderName: land.leaseHolderName || "",
    });
    setEditIndex(idx);
    setShowAddModal(true);
    setCurrentStep(1);
  };

  const handleDocumentUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: string,
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newDocs: Document[] = Array.from(files).map((file) => ({
        id: Date.now().toString() + Math.random().toString(),
        name: file.name,
        type: documentType,
        file: file,
        url: URL.createObjectURL(file), // Create a temporary URL
      }));

      setNewLand({
        ...newLand,
        documents: [...(newLand.documents || []), ...newDocs],
      });
    }
  };

  const handleRemoveDocument = (docId: string) => {
    setNewLand({
      ...newLand,
      documents: (newLand.documents || []).filter((doc) => doc.id !== docId),
    });
  };

  const handleLandClick = (landId: string) => {
    router.push(`/dashboard/agriculture/${landId}`);
  };

  const getLandImageFallback = (land: Land) => {
    const label = land.crop || "Farmland";
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1f7a3f" />
            <stop offset="100%" stop-color="#5aa469" />
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#bg)" />
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="64" font-family="Arial, sans-serif" font-weight="700">${label}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  // Get default land image based on crop type
  const getLandImage = (land: Land) => {
    if (land.image?.trim()) return land.image;

    const cropImages: Record<string, string> = {
      Corn: "https://images.unsplash.com/photo-1601593768799-76c79c56f726?w=400&h=300&fit=crop",
      Wheat:
        "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop",
      Soybeans:
        "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400&h=300&fit=crop",
      Cotton:
        "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&h=300&fit=crop",
      Rice: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=300&fit=crop",
      Vegetables:
        "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop",
      Fruits:
        "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop",
      Dairy:
        "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=400&h=300&fit=crop",
      Livestock:
        "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&h=300&fit=crop",
      "Organic Farming":
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop",
    };

    return cropImages[land.crop] || getLandImageFallback(land);
  };

  return (
    <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">Agriculture Dashboard</h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-400">Total</span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Lands</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {lands.length}
            </p>
          </div>

          <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Maximize2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-blue-500">Scale</span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Acreage</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalAcreage.toLocaleString()} <span className="text-sm font-normal text-gray-400">acres</span>
            </p>
          </div>

          <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-amber-500">
                <TrendingUp className="w-3 h-3" /> +8%
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Annual Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalRevenue.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-red-500">Operations</span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Active Operations</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeOps}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            onClick={() => setShowMap(false)}
            variant={!showMap ? "default" : "outline"}
            className={cn("rounded-xl", !showMap ? "" : "dark:text-white")}
          >
            <LayoutGrid className={cn("w-4 h-4 mr-2", !showMap ? "" : "dark:text-white")} />
            Lands List
          </Button>
          <Button
            onClick={() => setShowMap(true)}
            variant={showMap ? "default" : "outline"}
            className={cn("rounded-xl", showMap ? "" : "dark:text-white")}
          >
            <MapIcon className={cn("w-4 h-4 mr-2", showMap ? "" : "dark:text-white")} />
            Map View
          </Button>
          <Button 
            onClick={() => {
              setCurrentStep(1);
              setShowAddModal(true);
            }} 
            variant="outline"
            className="rounded-xl dark:text-white"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Land
          </Button>
        </div>

        {/* Search and Filter */}
        {!showMap && lands.length > 0 && (
          <div className="mb-6">
            <SearchFilter
              searchPlaceholder="Search lands..."
              onSearchChange={setSearchQuery}
              filters={[
                {
                  label: "Land Use",
                  key: "crop",
                  options: [
                    { label: "Cropland", value: "Cropland" },
                    { label: "Pasture", value: "Pasture" },
                    { label: "Timber", value: "Timber" },
                    { label: "Vineyard", value: "Vineyard" },
                    { label: "Greenhouse", value: "Greenhouse" },
                  ],
                },
                {
                  label: "Irrigation",
                  key: "irrigation",
                  options: [
                    { label: "Center Pivot", value: "Center Pivot" },
                    { label: "Drip", value: "Drip" },
                    { label: "Well", value: "Well" },
                    { label: "Rainfed", value: "Rainfed" },
                  ],
                },
                {
                  label: "State",
                  key: "state",
                  options: [
                    { label: "Iowa", value: "IA" },
                    { label: "California", value: "CA" },
                    { label: "Texas", value: "TX" },
                    { label: "Washington", value: "WA" },
                    { label: "Ontario", value: "ON" },
                  ],
                },
              ]}
              onFilterChange={(key, value) => setActiveFilters(prev => ({ ...prev, [key]: value }))}
              activeFilters={activeFilters}
              sortOptions={[
                { label: "Name (A-Z)", value: "name-asc" },
                { label: "Name (Z-A)", value: "name-desc" },
                { label: "Area (High-Low)", value: "area-desc" },
                { label: "Profit (High-Low)", value: "profit-desc" },
              ]}
              onSortChange={setActiveSort}
              activeSort={activeSort}
            />
          </div>
        )}

        {!showMap ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredLands.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white dark:bg-[#181818] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-1 dark:text-white">No lands found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredLands.map((land, idx) => (
                <div
                  key={land.id}
                  className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group relative border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    handleLandClick(land.id);
                  }}
                >
                  {/* Land Image Container */}
                  <div className="relative h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getLandImage(land)}
                      alt={land.name || "Land"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = getLandImageFallback(land);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md text-white border",
                        land.leaseDuration === "Owned" 
                          ? "bg-blue-500/80 border-blue-400" 
                          : "bg-green-500/80 border-green-400"
                      )}>
                        {land.leaseDuration === "Owned" ? "Owned" : "Leased"}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300">
                      <button
                        className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 flex items-center justify-center text-blue-600 shadow-lg hover:bg-blue-600 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditLand(land, idx);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 flex items-center justify-center text-red-600 shadow-lg hover:bg-red-600 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLand(land.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">
                        {land.name || "Unnamed Land"}
                      </h2>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-300">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1">
                          {land.location}{land.city ? `, ${land.city}` : ""}{land.state ? ` (${land.state})` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-tight">Land Use</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Tag className="w-3.5 h-3.5 text-green-500" />
                          <span>{land.crop}</span>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-tight">Acreage</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>{land.area}</span>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-tight">Zoning</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>{land.zoning || "N/A"}</span>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-tight">Irrigation</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Droplet className="w-3.5 h-3.5 text-blue-400" />
                          <span>{land.irrigation || "Rainfed"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <p className="text-xs text-gray-400">Annual Rent/Profit</p>
                      <p className="text-base font-bold text-green-600 dark:text-green-400">
                        {land.profit}
                      </p>
                    </div>

                    {(land.animals.length > 0 || land.vehicles.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                        {land.animals.slice(0, 2).map((animal) => (
                          <span key={animal} className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-medium">
                            {animal}
                          </span>
                        ))}
                        {land.vehicles.slice(0, 2).map((vehicle) => (
                          <span key={vehicle} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                            {vehicle}
                          </span>
                        ))}
                        {(land.animals.length + land.vehicles.length) > 4 && (
                          <span className="text-[10px] text-gray-400 self-center">
                            +{(land.animals.length + land.vehicles.length) - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="h-[400px] sm:h-[500px] md:h-[600px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
            {lands.length > 0 ? (
              <MapComponent lands={lands} />
            ) : (
              <div className="h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <p className="text-lg mb-2">No lands added yet</p>
                  <p className="text-sm">Add lands to see them on the map</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Land Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-2xl p-0 md:p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                onClick={() => {
                  setShowAddModal(false);
                  setEditIndex(null);
                  setCurrentStep(1); // Reset step on close
                }}
                aria-label="Close"
              >
                ×
              </button>
              <div className="px-8 pt-8 pb-2">
                <h2 className="text-3xl font-bold mb-1">
                  {editIndex !== null ? "Edit Land" : "Add New Land"}
                </h2>
                <div className="flex items-center gap-2 mb-6">
                  <div
                    className={`h-2 rounded-full flex-1 ${currentStep >= 1 ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"}`}
                  />
                  <div
                    className={`h-2 rounded-full flex-1 ${currentStep >= 2 ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"}`}
                  />
                </div>
                <p className="text-gray-500 dark:text-gray-300 mb-6 text-base">
                  {currentStep === 1
                    ? "Step 1: Basic Property Information"
                    : "Step 2: Operations & Details"}
                </p>
                <form
                  onSubmit={handleAddOrEditLand}
                  className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
                >
                  {currentStep === 1 && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Property Name{" "}
                          <span className="text-gray-400 dark:text-gray-500">(Optional)</span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g. Maple Acres Ranch"
                          value={newLand.name}
                          onChange={(e) =>
                            setNewLand({ ...newLand, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Parcel Number{" "}
                          <span className="text-gray-400 dark:text-gray-500">(APN, optional)</span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="Parcel/APN"
                          value={newLand.parcelNumber || ""}
                          onChange={(e) =>
                            setNewLand({
                              ...newLand,
                              parcelNumber: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="123 Main St"
                          value={newLand.location}
                          onChange={(e) =>
                            setNewLand({ ...newLand, location: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="City"
                          value={newLand.city || ""}
                          onChange={(e) =>
                            setNewLand({ ...newLand, city: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          State/Province <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={newLand.state || ""}
                          onValueChange={(value) =>
                            setNewLand({ ...newLand, state: value })
                          }
                          required
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select State/Province" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>United States</SelectLabel>
                              <SelectItem value="AL">Alabama</SelectItem>
                              <SelectItem value="AK">Alaska</SelectItem>
                              <SelectItem value="AZ">Arizona</SelectItem>
                              <SelectItem value="AR">Arkansas</SelectItem>
                              <SelectItem value="CA">California</SelectItem>
                              <SelectItem value="CO">Colorado</SelectItem>
                              <SelectItem value="CT">Connecticut</SelectItem>
                              <SelectItem value="DE">Delaware</SelectItem>
                              <SelectItem value="FL">Florida</SelectItem>
                              <SelectItem value="GA">Georgia</SelectItem>
                              <SelectItem value="HI">Hawaii</SelectItem>
                              <SelectItem value="ID">Idaho</SelectItem>
                              <SelectItem value="IL">Illinois</SelectItem>
                              <SelectItem value="IN">Indiana</SelectItem>
                              <SelectItem value="IA">Iowa</SelectItem>
                              <SelectItem value="KS">Kansas</SelectItem>
                              <SelectItem value="KY">Kentucky</SelectItem>
                              <SelectItem value="LA">Louisiana</SelectItem>
                              <SelectItem value="ME">Maine</SelectItem>
                              <SelectItem value="MD">Maryland</SelectItem>
                              <SelectItem value="MA">Massachusetts</SelectItem>
                              <SelectItem value="MI">Michigan</SelectItem>
                              <SelectItem value="MN">Minnesota</SelectItem>
                              <SelectItem value="MS">Mississippi</SelectItem>
                              <SelectItem value="MO">Missouri</SelectItem>
                              <SelectItem value="MT">Montana</SelectItem>
                              <SelectItem value="NE">Nebraska</SelectItem>
                              <SelectItem value="NV">Nevada</SelectItem>
                              <SelectItem value="NH">New Hampshire</SelectItem>
                              <SelectItem value="NJ">New Jersey</SelectItem>
                              <SelectItem value="NM">New Mexico</SelectItem>
                              <SelectItem value="NY">New York</SelectItem>
                              <SelectItem value="NC">North Carolina</SelectItem>
                              <SelectItem value="ND">North Dakota</SelectItem>
                              <SelectItem value="OH">Ohio</SelectItem>
                              <SelectItem value="OK">Oklahoma</SelectItem>
                              <SelectItem value="OR">Oregon</SelectItem>
                              <SelectItem value="PA">Pennsylvania</SelectItem>
                              <SelectItem value="RI">Rhode Island</SelectItem>
                              <SelectItem value="SC">South Carolina</SelectItem>
                              <SelectItem value="SD">South Dakota</SelectItem>
                              <SelectItem value="TN">Tennessee</SelectItem>
                              <SelectItem value="TX">Texas</SelectItem>
                              <SelectItem value="UT">Utah</SelectItem>
                              <SelectItem value="VT">Vermont</SelectItem>
                              <SelectItem value="VA">Virginia</SelectItem>
                              <SelectItem value="WA">Washington</SelectItem>
                              <SelectItem value="WV">West Virginia</SelectItem>
                              <SelectItem value="WI">Wisconsin</SelectItem>
                              <SelectItem value="WY">Wyoming</SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>Canada</SelectLabel>
                              <SelectItem value="AB">Alberta</SelectItem>
                              <SelectItem value="BC">
                                British Columbia
                              </SelectItem>
                              <SelectItem value="MB">Manitoba</SelectItem>
                              <SelectItem value="NB">New Brunswick</SelectItem>
                              <SelectItem value="NL">
                                Newfoundland and Labrador
                              </SelectItem>
                              <SelectItem value="NS">Nova Scotia</SelectItem>
                              <SelectItem value="ON">Ontario</SelectItem>
                              <SelectItem value="PE">
                                Prince Edward Island
                              </SelectItem>
                              <SelectItem value="QC">Quebec</SelectItem>
                              <SelectItem value="SK">Saskatchewan</SelectItem>
                              <SelectItem value="NT">
                                Northwest Territories
                              </SelectItem>
                              <SelectItem value="NU">Nunavut</SelectItem>
                              <SelectItem value="YT">Yukon</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          ZIP/Postal Code{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="Zip Code"
                          value={newLand.zip || ""}
                          onChange={(e) =>
                            setNewLand({ ...newLand, zip: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Acreage <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                            placeholder="e.g., 40"
                            type="number"
                            step="0.01"
                            min="0"
                            value={newLand.area.replace(/[^0-9.]/g, "")}
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^0-9.]/g,
                                "",
                              );
                              setNewLand({
                                ...newLand,
                                area: value ? `${value} acres` : "",
                              });
                            }}
                            required
                          />
                          <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            acres
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Land Use
                        </label>
                        <Select
                          value={newLand.crop}
                          onValueChange={(value) =>
                            setNewLand({ ...newLand, crop: value })
                          }
                        >
                          <SelectTrigger className="w-full max-w-full dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="e.g., Cropland, Pasture, Timber" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                            <SelectGroup>
                              <SelectLabel className="dark:text-gray-400">Land Use</SelectLabel>
                              <SelectItem value="Cropland">Cropland</SelectItem>
                              <SelectItem value="Pasture">Pasture</SelectItem>
                              <SelectItem value="Timber">Timber</SelectItem>
                              <SelectItem value="Orchard">Orchard</SelectItem>
                              <SelectItem value="Vineyard">Vineyard</SelectItem>
                              <SelectItem value="Greenhouse">
                                Greenhouse
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Zoning
                        </label>
                        <Select
                          value={newLand.zoning || ""}
                          onValueChange={(value) =>
                            setNewLand({ ...newLand, zoning: value })
                          }
                        >
                          <SelectTrigger className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Select Zoning Type" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                            <SelectGroup>
                              <SelectLabel className="dark:text-gray-400">Zoning Types</SelectLabel>
                              <SelectItem value="Agricultural">
                                Agricultural (A)
                              </SelectItem>
                              <SelectItem value="Agricultural-Residential">
                                Agricultural-Residential (AR)
                              </SelectItem>
                              <SelectItem value="Rural Agricultural">
                                Rural Agricultural (RA)
                              </SelectItem>
                              <SelectItem value="Rural Residential">
                                Rural Residential (RR)
                              </SelectItem>
                              <SelectItem value="Residential">
                                Residential (R)
                              </SelectItem>
                              <SelectItem value="Commercial">
                                Commercial (C)
                              </SelectItem>
                              <SelectItem value="Industrial">
                                Industrial (I)
                              </SelectItem>
                              <SelectItem value="Mixed Use">
                                Mixed Use (MU)
                              </SelectItem>
                              <SelectItem value="Forestry">Forestry</SelectItem>
                              <SelectItem value="Conservation">
                                Conservation
                              </SelectItem>
                              <SelectItem value="Open Space">
                                Open Space
                              </SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Irrigation
                        </label>
                        <Select
                          value={newLand.irrigation || ""}
                          onValueChange={(value) =>
                            setNewLand({ ...newLand, irrigation: value })
                          }
                        >
                          <SelectTrigger className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Select Irrigation Type" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                            <SelectGroup>
                              <SelectLabel className="dark:text-gray-400">Irrigation Types</SelectLabel>
                              <SelectItem value="Well">Well Water</SelectItem>
                              <SelectItem value="Municipal">
                                Municipal Water
                              </SelectItem>
                              <SelectItem value="Canal">Canal/Ditch</SelectItem>
                              <SelectItem value="Sprinkler">
                                Sprinkler System
                              </SelectItem>
                              <SelectItem value="Drip">
                                Drip Irrigation
                              </SelectItem>
                              <SelectItem value="Center Pivot">
                                Center Pivot
                              </SelectItem>
                              <SelectItem value="Flood">
                                Flood Irrigation
                              </SelectItem>
                              <SelectItem value="Rainfed">
                                Rainfed (No Irrigation)
                              </SelectItem>
                              <SelectItem value="None">None</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Land Image */}
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <SingleImageUpload
                          image={newLand.image}
                          onImageChange={(img) =>
                            setNewLand({ ...newLand, image: img })
                          }
                          label="Land Image (Optional)"
                        />
                      </div>

                      <div className="md:col-span-2 text-sm text-gray-500 italic">
                        * Location coordinates will be automatically determined
                        from the address
                      </div>
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Structures
                        </label>
                        <Select
                          value={
                            Array.isArray(newLand.vehicles)
                              ? newLand.vehicles[0] || ""
                              : (newLand.vehicles as string) || ""
                          }
                          onValueChange={(value) => {
                            // Allow comma separated multi-select simulation
                            const structuresArr = Array.isArray(
                              newLand.vehicles,
                            )
                              ? [...newLand.vehicles]
                              : typeof newLand.vehicles === "string" &&
                                  newLand.vehicles.length > 0
                                ? newLand.vehicles
                                    .split(",")
                                    .map((v) => v.trim())
                                : [];
                            if (!structuresArr.includes(value)) {
                              structuresArr.push(value);
                            }
                            setNewLand({ ...newLand, vehicles: structuresArr });
                          }}
                        >
                          <SelectTrigger className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Select Structures" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                            <SelectGroup>
                              <SelectLabel className="dark:text-gray-400">Structures</SelectLabel>
                              <SelectItem value="Barn">Barn</SelectItem>
                              <SelectItem value="House">House</SelectItem>
                              <SelectItem value="Shed">Shed</SelectItem>
                              <SelectItem value="Garage">Garage</SelectItem>
                              <SelectItem value="Workshop">Workshop</SelectItem>
                              <SelectItem value="Greenhouse">
                                Greenhouse
                              </SelectItem>
                              <SelectItem value="Silo">Silo</SelectItem>
                              <SelectItem value="Coop">Chicken Coop</SelectItem>
                              <SelectItem value="Fence">Fencing</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {Array.isArray(newLand.vehicles) &&
                          newLand.vehicles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {newLand.vehicles.map((structure) => (
                                <span
                                  key={structure}
                                  className="bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border dark:border-gray-700 rounded px-2 py-0.5 text-xs flex items-center"
                                >
                                  {structure}
                                  <button
                                    type="button"
                                    className="ml-1 text-gray-400 hover:text-red-500"
                                    onClick={() => {
                                      const vehiclesArr = Array.isArray(
                                        newLand.vehicles,
                                      )
                                        ? newLand.vehicles
                                        : typeof newLand.vehicles ===
                                              "string" &&
                                            newLand.vehicles.length > 0
                                          ? newLand.vehicles
                                              .split(",")
                                              .map((v) => v.trim())
                                          : [];
                                      setNewLand({
                                        ...newLand,
                                        vehicles: vehiclesArr.filter(
                                          (v: string) => v !== structure,
                                        ),
                                      });
                                    }}
                                    aria-label={`Remove ${structure}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Livestock
                        </label>
                        <Select
                          value={
                            Array.isArray(newLand.animals)
                              ? newLand.animals[0] || ""
                              : (newLand.animals as string) || ""
                          }
                          onValueChange={(value) => {
                            // Allow comma separated multi-select simulation
                            const animalsArr = Array.isArray(newLand.animals)
                              ? [...newLand.animals]
                              : typeof newLand.animals === "string" &&
                                  newLand.animals.length > 0
                                ? newLand.animals
                                    .split(",")
                                    .map((a) => a.trim())
                                : [];
                            if (!animalsArr.includes(value)) {
                              animalsArr.push(value);
                            }
                            setNewLand({ ...newLand, animals: animalsArr });
                          }}
                        >
                          <SelectTrigger className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="e.g., Cattle, Sheep" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                            <SelectItem value="Cattle">Cattle</SelectItem>
                            <SelectItem value="Sheep">Sheep</SelectItem>
                            <SelectItem value="Goat">Goat</SelectItem>
                            <SelectItem value="Horse">Horse</SelectItem>
                            <SelectItem value="Pig">Pig</SelectItem>
                            <SelectItem value="Chicken">Chicken</SelectItem>
                          </SelectContent>
                        </Select>
                        {Array.isArray(newLand.animals) &&
                          newLand.animals.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {newLand.animals.map((animal) => (
                                <span
                                  key={animal}
                                  className="bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border dark:border-gray-700 rounded px-2 py-0.5 text-xs flex items-center"
                                >
                                  {animal}
                                  <button
                                    type="button"
                                    className="ml-1 text-gray-400 hover:text-red-500"
                                    onClick={() => {
                                      const animalsArr = Array.isArray(
                                        newLand.animals,
                                      )
                                        ? newLand.animals
                                        : typeof newLand.animals === "string" &&
                                            newLand.animals.length > 0
                                          ? newLand.animals
                                              .split(",")
                                              .map((a) => a.trim())
                                          : [];
                                      setNewLand({
                                        ...newLand,
                                        animals: animalsArr.filter(
                                          (a: string) => a !== animal,
                                        ),
                                      });
                                    }}
                                    aria-label={`Remove ${animal}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Fertilizers Used
                        </label>
                        <Select
                          value={
                            Array.isArray(newLand.fertilizers)
                              ? newLand.fertilizers[0] || ""
                              : (newLand.fertilizers as string) || ""
                          }
                          onValueChange={(value) => {
                            // Allow comma separated multi-select simulation
                            const fertilizersArr = Array.isArray(
                              newLand.fertilizers,
                            )
                              ? [...newLand.fertilizers]
                              : typeof newLand.fertilizers === "string" &&
                                  newLand.fertilizers.length > 0
                                ? newLand.fertilizers
                                    .split(",")
                                    .map((f) => f.trim())
                                : [];
                            if (!fertilizersArr.includes(value)) {
                              fertilizersArr.push(value);
                            }
                            setNewLand({
                              ...newLand,
                              fertilizers: fertilizersArr,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Select Fertilizers" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                            <SelectGroup>
                              <SelectLabel className="dark:text-gray-400">Fertilizers</SelectLabel>
                              <SelectItem value="Urea">Urea</SelectItem>
                              <SelectItem value="DAP">
                                DAP (Diammonium Phosphate)
                              </SelectItem>
                              <SelectItem value="Compost">Compost</SelectItem>
                              <SelectItem value="NPK">
                                NPK (Nitrogen-Phosphorus-Potassium)
                              </SelectItem>
                              <SelectItem value="Manure">Manure</SelectItem>
                              <SelectItem value="Potash">Potash</SelectItem>
                              <SelectItem value="Ammonium Nitrate">
                                Ammonium Nitrate
                              </SelectItem>
                              <SelectItem value="Superphosphate">
                                Superphosphate
                              </SelectItem>
                              <SelectItem value="Organic">
                                Organic Fertilizer
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {Array.isArray(newLand.fertilizers) &&
                          newLand.fertilizers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {newLand.fertilizers.map((fertilizer) => (
                                <span
                                  key={fertilizer}
                                  className="bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border dark:border-gray-700 rounded px-2 py-0.5 text-xs flex items-center"
                                >
                                  {fertilizer}
                                  <button
                                    type="button"
                                    className="ml-1 text-gray-400 hover:text-red-500"
                                    onClick={() => {
                                      const fertilizersArr = Array.isArray(
                                        newLand.fertilizers,
                                      )
                                        ? newLand.fertilizers
                                        : typeof newLand.fertilizers ===
                                              "string" &&
                                            newLand.fertilizers.length > 0
                                          ? newLand.fertilizers
                                              .split(",")
                                              .map((f) => f.trim())
                                          : [];
                                      setNewLand({
                                        ...newLand,
                                        fertilizers: fertilizersArr.filter(
                                          (f: string) => f !== fertilizer,
                                        ),
                                      });
                                    }}
                                    aria-label={`Remove ${fertilizer}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Lease Duration
                        </label>
                        <Select
                          value={newLand.leaseDuration}
                          onValueChange={(value) =>
                            setNewLand({ ...newLand, leaseDuration: value })
                          }
                        >
                          <SelectTrigger className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Select Lease Duration" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                            <SelectGroup>
                              <SelectLabel className="dark:text-gray-400">Lease Duration</SelectLabel>
                              <SelectItem value="Month-to-Month">
                                Month-to-Month
                              </SelectItem>
                              <SelectItem value="1 year">1 Year</SelectItem>
                              <SelectItem value="2 years">2 Years</SelectItem>
                              <SelectItem value="3 years">3 Years</SelectItem>
                              <SelectItem value="5 years">5 Years</SelectItem>
                              <SelectItem value="10 years">10 Years</SelectItem>
                              <SelectItem value="15 years">15 Years</SelectItem>
                              <SelectItem value="20 years">20 Years</SelectItem>
                              <SelectItem value="25 years">25 Years</SelectItem>
                              <SelectItem value="30 years">30 Years</SelectItem>
                              <SelectItem value="99 years">
                                99 Years (Long-term)
                              </SelectItem>
                              <SelectItem value="Owned">
                                Owned (No Lease)
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Annual Rent/Profit
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g., $50,000/year"
                          value={newLand.profit}
                          onChange={(e) =>
                            setNewLand({ ...newLand, profit: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Lease Holder Name
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g., John Smith"
                          value={newLand.leaseHolderName || ""}
                          onChange={(e) =>
                            setNewLand({
                              ...newLand,
                              leaseHolderName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Documents
                        </label>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs text-gray-600 dark:text-gray-400">
                                Lease Agreement
                              </label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white"
                                onChange={(e) =>
                                  handleDocumentUpload(e, "lease_agreement")
                                }
                                multiple
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs text-gray-600 dark:text-gray-400">
                                Bills & Invoices
                              </label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white"
                                onChange={(e) =>
                                  handleDocumentUpload(e, "bill")
                                }
                                multiple
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs text-gray-600 dark:text-gray-400">
                                Property Documents
                              </label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white"
                                onChange={(e) =>
                                  handleDocumentUpload(e, "property_doc")
                                }
                                multiple
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs text-gray-600 dark:text-gray-400">
                                Other Documents
                              </label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white"
                                onChange={(e) =>
                                  handleDocumentUpload(e, "other")
                                }
                                multiple
                              />
                            </div>
                          </div>
                          {(newLand.documents || []).length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-800">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Uploaded Documents:
                              </p>
                              <div className="space-y-1">
                                {newLand.documents?.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700"
                                  >
                                    <span className="text-gray-700 dark:text-gray-200 truncate flex-1">
                                      📄 {doc.name}
                                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                                        ({doc.type.replace("_", " ")})
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveDocument(doc.id)
                                      }
                                      className="ml-2 text-red-500 hover:text-red-700"
                                      aria-label={`Remove ${doc.name}`}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                  <div className="md:col-span-2 flex justify-between gap-2 mt-4">
                    {currentStep === 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddModal(false);
                          setEditIndex(null);
                        }}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentStep(1);
                        }}
                      >
                        Back
                      </Button>
                    )}

                    {currentStep === 1 ? (
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          // Validate required fields
                          if (
                            !newLand.location ||
                            !newLand.city ||
                            !newLand.state ||
                            !newLand.zip ||
                            !newLand.area
                          ) {
                            alert("Please fill in all required fields.");
                            return;
                          }
                          setCurrentStep(2);
                        }}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button type="submit" disabled={isGeocoding}>
                        {isGeocoding
                          ? "Finding location..."
                          : editIndex !== null
                            ? "Save Changes"
                            : "Add Land"}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
  );
}
