"use client";
import { useState, useMemo, useEffect } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import {
  useRealEstateContext,
  Property,
  Tenant,
  Document,
  PropertyExpenses,
} from "@/app/dashboard/realestate/real-estate-context";
import { geocodeAddress } from "@/lib/helpers/geocode";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SearchFilter } from "@/components/shared/SearchFilter";
import { SingleImageUpload } from "@/components/shared/ImageUpload";
import { Pencil, Trash2, Search } from "lucide-react";

// Dynamically import Map component
const MapComponent = dynamic(() => import("@/components/dashboard/MapComponent"), {
  ssr: false,
});

import {
  TrendingUp,
  Users,
  Home,
  DollarSign,
  AlertCircle,
  LayoutGrid,
  Map as MapIcon,
  PlusCircle,
  MapPin,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RealEstateDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { properties, addProperty, updateProperty, deleteProperty } =
    useRealEstateContext();
  const [showMap, setShowMap] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState("name");

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Edit trigger state (for handling edits from detail page)
  // Initialize from sessionStorage only once
  const [pendingEditId, setPendingEditId] = useState<string | null>(() => {
    if (typeof window !== "undefined" && searchParams.get("edit") === "true") {
      const editId = sessionStorage.getItem("editPropertyId");
      if (editId) {
        sessionStorage.removeItem("editPropertyId");
        return editId;
      }
    }
    return null;
  });

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    let result = [...properties];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.location?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query) ||
          p.type?.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      result = result.filter((p) => p.status === filters.status);
    }

    // Type filter
    if (filters.type && filters.type !== "all") {
      result = result.filter((p) => p.type === filters.type);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "price":
          const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, "") || "0");
          const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, "") || "0");
          return priceB - priceA;
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        default:
          return 0;
      }
    });

    return result;
  }, [properties, searchQuery, filters, sortBy]);

  const emptyExpenses: PropertyExpenses = {
    maintenance: "",
    taxes: "",
    insurance: "",
    utilities: "",
    loanEMI: "",
    managementFees: "",
    other: "",
  };

  const [newProperty, setNewProperty] = useState<
    Omit<Property, "id" | "tenants" | "documents"> & {
      id?: string;
      tenants?: Tenant[];
      documents?: Document[];
      image?: string;
    }
  >({
    name: "",
    location: "",
    city: "",
    state: "",
    zip: "",
    type: "",
    unit: "",
    area: "",
    leaseDuration: "",
    price: "",
    tenantCount: 0,
    tenants: [],
    coordinates: { lat: 0, lng: 0 },
    status: "Vacant",
    documents: [],
    parcelNumber: "",
    zoning: "",
    structures: [],
    amenities: [],
    utilities: [],
    systems: "",
    purchasePrice: "",
    purchaseDate: "",
    currentValue: "",
    expenses: emptyExpenses,
    leaseStartDate: "",
    leaseEndDate: "",
    image: "",
  });

  const handleAddOrEditProperty = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only process form submission on Step 3
    if (currentStep !== 3) {
      return;
    }

    setIsGeocoding(true);

    let coordinates = { lat: 0, lng: 0 };
    if (editIndex !== null && properties[editIndex]?.coordinates) {
      coordinates = properties[editIndex].coordinates;
    }

    if (newProperty.location && newProperty.city && newProperty.state) {
      const geocoded = await geocodeAddress(
        newProperty.location,
        newProperty.city,
        newProperty.state,
        newProperty.zip,
      );
      if (geocoded) {
        coordinates = geocoded;
      } else if (coordinates.lat === 0 && coordinates.lng === 0) {
        alert(
          "Could not find coordinates for this address. The property will be saved but may not appear on the map.",
        );
      }
    }

    const propObj: Property = {
      ...newProperty,
      id: editIndex !== null ? properties[editIndex].id : crypto.randomUUID(),
      tenants: newProperty.tenants || [],
      documents: newProperty.documents || [],
      coordinates,
      // Ensure all required fields
      city: newProperty.city,
      state: newProperty.state,
      zip: newProperty.zip,
      tenantCount: newProperty.tenantCount || 0,

      // New fields
      parcelNumber: newProperty.parcelNumber,
      zoning: newProperty.zoning,
      structures: newProperty.structures,
      amenities: newProperty.amenities,
      utilities: newProperty.utilities,
      systems: newProperty.systems,
      // Financial fields
      purchasePrice: newProperty.purchasePrice,
      purchaseDate: newProperty.purchaseDate,
      currentValue: newProperty.currentValue,
      expenses: newProperty.expenses,
      // Lease dates
      leaseStartDate: newProperty.leaseStartDate,
      leaseEndDate: newProperty.leaseEndDate,
    };

    if (editIndex !== null) {
      updateProperty(properties[editIndex].id, propObj);
    } else {
      addProperty(propObj);
    }

    setIsGeocoding(false);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewProperty({
      name: "",
      location: "",
      city: "",
      state: "",
      zip: "",
      type: "",
      unit: "",
      area: "",
      leaseDuration: "",
      price: "",
      tenantCount: 0,
      tenants: [],
      coordinates: { lat: 0, lng: 0 },
      status: "Vacant",
      documents: [],
      parcelNumber: "",
      zoning: "",
      structures: [],
      amenities: [],
      utilities: [],
      systems: "",
      purchasePrice: "",
      purchaseDate: "",
      currentValue: "",
      expenses: emptyExpenses,
      leaseStartDate: "",
      leaseEndDate: "",
      image: "",
    });
    setEditIndex(null);
    setCurrentStep(1);
  };

  const handleDeleteProperty = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteProperty(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleEditProperty = (prop: Property, idx: number) => {
    const areaValue = prop.area.replace(/\s*sq\s*ft\s*$/i, "");
    setNewProperty({
      ...prop,
      area: areaValue,
      tenants: prop.tenants || [],
      documents: prop.documents || [],
      structures: prop.structures || [],
      amenities: prop.amenities || [],
      utilities: prop.utilities || [],
      expenses: prop.expenses || emptyExpenses,
    });
    setEditIndex(idx);
    setShowAddModal(true);
    setCurrentStep(1);
  };

  // Process pending edit from detail page (after handleEditProperty is defined)
  useEffect(() => {
    if (pendingEditId) {
      const propIndex = properties.findIndex((p) => p.id === pendingEditId);
      if (propIndex !== -1) {
        // Schedule state update to avoid cascading render warnings
        const timer = setTimeout(() => {
          handleEditProperty(properties[propIndex], propIndex);
          setPendingEditId(null);
        }, 0);
        return () => clearTimeout(timer);
      } else {
        setPendingEditId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEditId, properties]);

  const handlePropertyClick = (propId: string) => {
    router.push(`/dashboard/realestate/${propId}`);
  };

  const nextStep = (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Basic validation for Step 1
    if (currentStep === 1) {
      if (
        !newProperty.location ||
        !newProperty.city ||
        !newProperty.state ||
        !newProperty.zip ||
        !newProperty.type ||
        !newProperty.price ||
        !newProperty.area
      ) {
        alert("Please fill in all required fields in Step 1.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get default property image based on type
  const getPropertyImage = (property: Property) => {
    if (property.image) return property.image;

    const typeImages: Record<string, string> = {
      Condo:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      Apartment:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
      Townhouse:
        "https://images.unsplash.com/photo-1625602812206-5ec545ca1231?w=400&h=300&fit=crop",
      "Detached House":
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
      Commercial:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop",
      Industrial:
        "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop",
    };

    return (
      typeImages[property.type] ||
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop"
    );
  };

  // Helper to handle array inputs for tags
  const handleArrayInput = (
    value: string,
    field: "structures" | "amenities" | "utilities",
  ) => {
    // For simplicity in this demo, we'll treat the input as a comma-separated string
    // and convert it when saving, but since the state stores arrays,
    // we need to handle the conversion in the input value prop or change state structure.
    // To match the Agriculture example which handles it a bit loosely,
    // we will just split by comma for the state update.
    const arrayValues = value.split(",").map((v) => v.trim());
    setNewProperty({ ...newProperty, [field]: arrayValues });
  };

  return (
    <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">
          Real Estate Dashboard
        </h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Home className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-400">Updated today</span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Properties</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {properties.length}
            </p>
          </div>

          <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-green-500">Active</span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Active Tenants</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {properties.reduce((acc, p) => acc + (p.tenants?.length || 0), 0)}
            </p>
          </div>

          <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-amber-500">
                <TrendingUp className="w-3 h-3" /> +12%
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Monthly Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${properties.reduce((acc, p) => acc + parseFloat(p.price?.replace(/[^0-9.]/g, "") || "0"), 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-[#181818] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-red-500">High Priority</span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Critical Alerts</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {properties.filter(p => p.status === "Vacant").length +
                properties.reduce((acc, p) => acc + (p.tenants?.filter(t => t.paymentStatus === "overdue" || t.paymentStatus === "late").length || 0), 0)}
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
            Properties
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
              resetForm();
              setShowAddModal(true);
            }}
            variant="outline"
            className="rounded-xl dark:text-white"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Search and Filter */}
        {!showMap && properties.length > 0 && (
          <div className="mb-6">
            <SearchFilter
              searchPlaceholder="Search properties..."
              onSearchChange={setSearchQuery}
              filters={[
                {
                  label: "Status",
                  key: "status",
                  options: [
                    { label: "Occupied", value: "Occupied" },
                    { label: "Vacant", value: "Vacant" },
                    { label: "Under Maintenance", value: "Under Maintenance" },
                  ],
                },
                {
                  label: "Type",
                  key: "type",
                  options: [
                    { label: "Condo", value: "Condo" },
                    { label: "Apartment", value: "Apartment" },
                    { label: "Townhouse", value: "Townhouse" },
                    { label: "Detached House", value: "Detached House" },
                    { label: "Office", value: "Office" },
                    { label: "Retail", value: "Retail" },
                  ],
                },
              ]}
              onFilterChange={(key, value) =>
                setFilters((prev) => ({ ...prev, [key]: value }))
              }
              activeFilters={filters}
              sortOptions={[
                { label: "Name", value: "name" },
                { label: "Price", value: "price" },
                { label: "Status", value: "status" },
              ]}
              onSortChange={setSortBy}
              activeSort={sortBy}
            />
          </div>
        )}

        {!showMap ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProperties.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                {properties.length === 0 ? (
                  <>
                    <p className="text-lg mb-2">No properties added yet</p>
                    <p className="text-sm">
                      Click &quot;+ Add Property&quot; to get started
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg mb-2">No matching properties</p>
                    <p className="text-sm">
                      Try adjusting your search or filters
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredProperties.map((property, idx) => (
                <div
                  key={property.id}
                  className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group relative border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    handlePropertyClick(property.id);
                  }}
                >
                  {/* Property Image Container */}
                  <div className="relative h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getPropertyImage(property)}
                      alt={property.name || "Property"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md text-white border",
                        property.status === "Occupied" 
                          ? "bg-green-500/80 border-green-400" 
                          : property.status === "Vacant"
                            ? "bg-red-500/80 border-red-400"
                            : "bg-amber-500/80 border-amber-400"
                      )}>
                        {property.status || "Vacant"}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300">
                      <button
                        className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 flex items-center justify-center text-blue-600 shadow-lg hover:bg-blue-600 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProperty(property, idx);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 flex items-center justify-center text-red-600 shadow-lg hover:bg-red-600 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProperty(property.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">
                        {property.name || "Unnamed Property"}
                      </h2>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-300">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1">
                          {property.location}{property.city ? `, ${property.city}` : ""}{property.state ? ` (${property.state})` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-tight">Property Type</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Home className="w-3.5 h-3.5 text-blue-500" />
                          <span>{property.type}</span>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-tight">Area</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Maximize2 className="w-3.5 h-3.5 text-green-500" />
                          <span>{property.area}</span>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-tight">Tenants</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Users className="w-3.5 h-3.5 text-amber-500" />
                          <span>{property.tenantCount} active</span>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-tight">Unit</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <AlertCircle className="w-3.5 h-3.5 text-purple-500" />
                          <span>{property.unit || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <p className="text-xs text-gray-400">Monthly Rent</p>
                      <p className="text-base font-bold text-green-600 dark:text-green-400">
                        {property.price}
                      </p>
                    </div>

                    {(property.tenants.length > 0 || (property.amenities?.length || 0) > 0) && (
                      <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                        {property.tenants.slice(0, 1).map((tenant) => (
                          <span key={tenant.id} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                            {tenant.name}
                          </span>
                        ))}
                        {property.amenities?.slice(0, 2).map((amenity) => (
                          <span key={amenity} className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-medium">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="h-[400px] sm:h-[500px] md:h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
            <MapComponent
              lands={properties.map((p) => ({
                ...p,
                crop: p.type,
                profit: p.price,
                vehicles: [],
                animals: [],
                fertilizers: [],
              }))}
            />
          </div>
        )}

        {/* Add/Edit Property Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-2xl p-0 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>

              <div className="px-8 pt-8 pb-2">
                <h2 className="text-3xl font-bold mb-1 dark:text-white">
                  {editIndex !== null ? "Edit Property" : "Add New Property"}
                </h2>
                <div className="flex items-center gap-2 mb-6">
                  <div
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      currentStep >= 1 ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                  <div
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                  <div
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      currentStep >= 3 ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                </div>
                <p className="text-gray-500 dark:text-gray-300 mb-6 text-base">
                  {currentStep === 1
                    ? "Step 1: Basic Information"
                    : currentStep === 2
                      ? "Step 2: Details & Systems"
                      : "Step 3: Financials & Expenses"}
                </p>

                <form
                  onSubmit={handleAddOrEditProperty}
                  onKeyDown={(e) => {
                    // Handle Enter key on step 1 to advance to step 2
                    if (
                      e.key === "Enter" &&
                      currentStep === 1 &&
                      !(e.target as HTMLElement).matches("textarea")
                    ) {
                      e.preventDefault();
                      nextStep();
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
                >
                  {currentStep === 1 ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Property Name{" "}
                          <span className="text-gray-400 dark:text-gray-500">(Optional)</span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g. Skyline Towers"
                          value={newProperty.name}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Parcel Number{" "}
                          <span className="text-gray-400 dark:text-gray-500">(Optional)</span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="APN / Tax ID"
                          value={newProperty.parcelNumber || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              parcelNumber: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="123 Main St"
                          value={newProperty.location}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              location: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="City"
                          value={newProperty.city || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              city: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          State / Province{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="State"
                          value={newProperty.state || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              state: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Zip Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="Zip"
                          value={newProperty.zip || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              zip: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                       <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Property Type <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={newProperty.type}
                          onValueChange={(val) =>
                            setNewProperty({ ...newProperty, type: val })
                          }
                        >
                          <SelectTrigger className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                            <SelectGroup>
                              <SelectLabel className="dark:text-gray-400">Residential</SelectLabel>
                              <SelectItem value="Condo">Condo</SelectItem>
                              <SelectItem value="Apartment">
                                Apartment
                              </SelectItem>
                              <SelectItem value="Townhouse">
                                Townhouse
                              </SelectItem>
                              <SelectItem value="Detached House">
                                Detached House
                              </SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel className="dark:text-gray-400">Commercial</SelectLabel>
                              <SelectItem value="Office">Office</SelectItem>
                              <SelectItem value="Retail">Retail</SelectItem>
                              <SelectItem value="Industrial">
                                Industrial
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Unit / Suite
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g. 3 BHK or Apt 101"
                          value={newProperty.unit}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              unit: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Price / Rent <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g. $3500/month"
                          value={newProperty.price}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              price: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Area (sq ft) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex">
                          <input
                            className="w-full border dark:border-gray-700 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 border-r-0 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                            placeholder="1500"
                            type="number"
                            value={newProperty.area}
                            onChange={(e) =>
                              setNewProperty({
                                ...newProperty,
                                area: e.target.value,
                              })
                            }
                            required
                          />
                          <span className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-lg px-3 flex items-center text-gray-500 dark:text-gray-300">
                            sq ft
                          </span>
                        </div>
                      </div>

                      {/* Property Image */}
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <SingleImageUpload
                          image={newProperty.image}
                          onImageChange={(img) =>
                            setNewProperty({ ...newProperty, image: img })
                          }
                          label="Property Image (Optional)"
                        />
                      </div>

                      <div className="md:col-span-2 text-sm text-gray-500 italic mt-2">
                        * Location coordinates will be automatically determined
                        from the address
                      </div>
                    </>
                  ) : currentStep === 2 ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Zoning
                        </label>
                        <Select
                          value={newProperty.zoning}
                          onValueChange={(val) =>
                            setNewProperty({ ...newProperty, zoning: val })
                          }
                        >
                          <SelectTrigger className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Select Zoning" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                            <SelectItem value="Residential (R)">
                              Residential
                            </SelectItem>
                            <SelectItem value="Commercial (C)">
                              Commercial
                            </SelectItem>
                            <SelectItem value="Mixed Use (MU)">
                              Mixed Use
                            </SelectItem>
                            <SelectItem value="Industrial (I)">
                              Industrial
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Lease Duration
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g. 1 Year"
                          value={newProperty.leaseDuration}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              leaseDuration: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Status
                        </label>
                        <Select
                          value={newProperty.status}
                          onValueChange={(val) =>
                            setNewProperty({ ...newProperty, status: val })
                          }
                        >
                          <SelectTrigger className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                            <SelectItem value="Vacant">Vacant</SelectItem>
                            <SelectItem value="Occupied">Occupied</SelectItem>
                            <SelectItem value="Under Maintenance">
                              Under Maintenance
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Systems (HVAC/Solar)
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g. Central HVAC, Solar"
                          value={newProperty.systems || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              systems: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Structures{" "}
                          <span className="text-gray-400 dark:text-gray-500">
                            (Comma separated)
                          </span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g. Garage, Pool House, Shed"
                          value={
                            Array.isArray(newProperty.structures)
                              ? newProperty.structures.join(", ")
                              : ""
                          }
                          onChange={(e) =>
                            handleArrayInput(e.target.value, "structures")
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Amenities{" "}
                          <span className="text-gray-400 dark:text-gray-500">
                            (Comma separated)
                          </span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g. Pool, Gym, Concierge"
                          value={
                            Array.isArray(newProperty.amenities)
                              ? newProperty.amenities.join(", ")
                              : ""
                          }
                          onChange={(e) =>
                            handleArrayInput(e.target.value, "amenities")
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Utilities{" "}
                          <span className="text-gray-400 dark:text-gray-500">
                            (Comma separated)
                          </span>
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g. Hydro, Water, Gas, Internet"
                          value={
                            Array.isArray(newProperty.utilities)
                              ? newProperty.utilities.join(", ")
                              : ""
                          }
                          onChange={(e) =>
                            handleArrayInput(e.target.value, "utilities")
                          }
                        />
                      </div>
                    </>
                  ) : currentStep === 3 ? (
                    <>
                      {/* Financial Information */}
                      <div className="md:col-span-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Financial Information
                        </h3>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Purchase Price
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g. $500,000"
                          value={newProperty.purchasePrice || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              purchasePrice: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Current Value
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="e.g. $550,000"
                          value={newProperty.currentValue || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              currentValue: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Purchase Date
                        </label>
                        <input
                          type="date"
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white"
                          value={newProperty.purchaseDate || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              purchaseDate: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Lease Start Date
                        </label>
                        <input
                          type="date"
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white"
                          value={newProperty.leaseStartDate || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              leaseStartDate: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Lease End Date
                        </label>
                        <input
                          type="date"
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white"
                          value={newProperty.leaseEndDate || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              leaseEndDate: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* Monthly Expenses */}
                      <div className="md:col-span-2 mt-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Monthly Expenses
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Track your recurring costs
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Maintenance
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="$0"
                          value={newProperty.expenses?.maintenance || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              expenses: {
                                ...newProperty.expenses!,
                                maintenance: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Property Taxes
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="$0"
                          value={newProperty.expenses?.taxes || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              expenses: {
                                ...newProperty.expenses!,
                                taxes: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Insurance
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="$0"
                          value={newProperty.expenses?.insurance || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              expenses: {
                                ...newProperty.expenses!,
                                insurance: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Utilities
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="$0"
                          value={newProperty.expenses?.utilities || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              expenses: {
                                ...newProperty.expenses!,
                                utilities: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Loan/Mortgage EMI
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="$0"
                          value={newProperty.expenses?.loanEMI || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              expenses: {
                                ...newProperty.expenses!,
                                loanEMI: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Management Fees
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="$0"
                          value={newProperty.expenses?.managementFees || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              expenses: {
                                ...newProperty.expenses!,
                                managementFees: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Other Expenses
                        </label>
                        <input
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                          placeholder="$0"
                          value={newProperty.expenses?.other || ""}
                          onChange={(e) =>
                            setNewProperty({
                              ...newProperty,
                              expenses: {
                                ...newProperty.expenses!,
                                other: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="md:col-span-2 flex justify-between gap-2 mt-4">
                    {currentStep === 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddModal(false)}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                      >
                        Back
                      </Button>
                    )}

                    {currentStep < 3 ? (
                      <Button type="button" onClick={(e) => nextStep(e)}>
                        Next
                      </Button>
                    ) : (
                      <Button type="submit" disabled={isGeocoding}>
                        {isGeocoding
                          ? "Processing..."
                          : editIndex !== null
                            ? "Save Changes"
                            : "Add Property"}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirmId !== null}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
          title="Delete Property"
          description="Are you sure you want to delete this property? This action cannot be undone and all associated data will be lost."
          confirmLabel="Delete Property"
          onConfirm={confirmDelete}
        />
      </main>
  );
}
