"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Tenant {
  id: string;
  name: string;
  leaseType?: string; // e.g., "Apartment 301"
  duration?: string;
  docs?: string[];
  rentAmount?: string;
  leaseStart?: string;
  leaseEnd?: string;
  paymentStatus?: "current" | "late" | "overdue";
  lastPaymentDate?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string; // 'lease_agreement' | 'bill' | 'invoice' | 'other'
  file: File | null;
  url?: string; // For future use
}

export interface PropertyExpenses {
  maintenance: string;
  taxes: string;
  insurance: string;
  utilities: string;
  loanEMI: string;
  managementFees: string;
  other: string;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  city?: string;
  state?: string;
  zip?: string;
  type: string; // "Condo", "Apartment", "Townhouse", "Detached House"
  unit: string;
  tenantCount: number;
  tenants: Tenant[];
  area: string;
  leaseDuration: string;
  price: string;
  coordinates: { lat: number; lng: number };
  documents?: Document[];
  parcelNumber?: string;
  zoning?: string;
  structures?: string[];
  amenities?: string[];
  utilities?: string[];
  systems?: string;
  status: string; // "Occupied", "Vacant", "Under Maintenance"
  description?: string;
  // Financial tracking
  purchasePrice?: string;
  purchaseDate?: string;
  currentValue?: string;
  expenses?: PropertyExpenses;
  // Vacancy tracking
  vacantSince?: string;
  daysVacant?: number;
  // Maintenance tracking
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  // Lease tracking
  leaseStartDate?: string;
  leaseEndDate?: string;
  // Property image
  image?: string;
}

interface RealEstateContextType {
  properties: Property[];
  addProperty: (property: Property) => void;
  updateProperty: (id: string, updatedProperty: Property) => void;
  deleteProperty: (id: string) => void;
  getProperty: (id: string) => Property | undefined;
  refreshProperties: () => Promise<void>;
  loading: boolean;
}

const RealEstateContext = createContext<RealEstateContextType | undefined>(
  undefined,
);

export function RealEstateProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProperties = async () => {
    try {
      const res = await fetch("/api/properties");
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshProperties();
  }, []);

  const addProperty = async (property: Property) => {
    // Optimistic update
    setProperties((prev) => [...prev, property]);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(property),
      });

      if (!res.ok) {
        throw new Error("Failed to save property to database");
      }
      
      const data = await res.json();
      // Update local state with the exact object returned by the database (with correct IDs, timestamps)
      setProperties((prev) =>
        prev.map((p) => (p.id === property.id ? data.property : p))
      );
    } catch (err) {
      console.error("Failed to add property:", err);
      // Rollback optimistic update
      setProperties((prev) => prev.filter((p) => p.id !== property.id));
    }
  };

  const updateProperty = async (id: string, updatedProperty: Property) => {
    const originalProperty = properties.find((p) => p.id === id);
    // Optimistic update
    setProperties((prev) =>
      prev.map((prop) => (prop.id === id ? updatedProperty : prop))
    );

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProperty),
      });

      if (!res.ok) {
        throw new Error("Failed to update property in database");
      }
    } catch (err) {
      console.error("Failed to update property:", err);
      // Rollback optimistic update
      if (originalProperty) {
        setProperties((prev) =>
          prev.map((prop) => (prop.id === id ? originalProperty : prop))
        );
      }
    }
  };

  const deleteProperty = async (id: string) => {
    const originalProperty = properties.find((p) => p.id === id);
    // Optimistic update
    setProperties((prev) => prev.filter((prop) => prop.id !== id));

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete property from database");
      }
    } catch (err) {
      console.error("Failed to delete property:", err);
      // Rollback optimistic update
      if (originalProperty) {
        setProperties((prev) => [...prev, originalProperty]);
      }
    }
  };

  const getProperty = (id: string) => {
    return properties.find((prop) => prop.id === id);
  };

  return (
    <RealEstateContext.Provider
      value={{
        properties,
        addProperty,
        updateProperty,
        deleteProperty,
        getProperty,
        refreshProperties,
        loading,
      }}
    >
      {children}
    </RealEstateContext.Provider>
  );
}

export function useRealEstateContext() {
  const context = useContext(RealEstateContext);
  if (context === undefined) {
    throw new Error(
      "useRealEstateContext must be used within a RealEstateProvider",
    );
  }
  return context;
}
