"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Tenant {
  id: string;
  name: string;
  leaseType?: string;
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

export interface LandExpenses {
  seeds: string;
  labor: string;
  equipment: string;
  fertilizers: string;
  pesticides: string;
  irrigation: string;
  taxes: string;
  insurance: string;
  other: string;
}

export interface Land {
  id: string;
  name: string;
  location: string;
  city?: string;
  state?: string;
  zip?: string;
  crop: string;
  area: string;
  leaseDuration: string;
  profit: string;
  vehicles: string[];
  animals: string[];
  fertilizers: string[];
  tenants: Tenant[];
  coordinates: { lat: number; lng: number };
  parcelNumber?: string;
  zoning?: string;
  irrigation?: string;
  leaseHolderName?: string;
  documents?: Document[];
  // Financial tracking
  purchasePrice?: string;
  purchaseDate?: string;
  currentValue?: string;
  expenses?: LandExpenses;
  revenue?: string; // Annual revenue from crops
  // Yield tracking
  yieldPerAcre?: string;
  expectedYield?: string;
  // Harvest tracking
  lastHarvestDate?: string;
  nextHarvestDate?: string;
  plantingDate?: string;
  // Season
  cropSeason?: string; // "Kharif", "Rabi", "Zaid"
  // Land image
  image?: string;
}

interface AgricultureContextType {
  lands: Land[];
  addLand: (land: Land) => void;
  updateLand: (id: string, updatedLand: Land) => void;
  deleteLand: (id: string) => void;
  getLand: (id: string) => Land | undefined;
  loading: boolean;
}

const AgricultureContext = createContext<AgricultureContextType | undefined>(
  undefined,
);

export function AgricultureProvider({ children }: { children: ReactNode }) {
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLands() {
      try {
        const res = await fetch("/api/lands");
        if (res.ok) {
          const data = await res.json();
          setLands(data.lands || []);
        }
      } catch (err) {
        console.error("Failed to fetch lands:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLands();
  }, []);

  const addLand = async (land: Land) => {
    // Optimistic update
    setLands((prev) => [...prev, land]);

    try {
      const res = await fetch("/api/lands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(land),
      });

      if (!res.ok) {
        throw new Error("Failed to save land to database");
      }

      const data = await res.json();
      // Update local state with the exact object returned by the database (with correct IDs, timestamps)
      setLands((prev) =>
        prev.map((l) => (l.id === land.id ? data.land : l))
      );
    } catch (err) {
      console.error("Failed to add land:", err);
      // Rollback optimistic update
      setLands((prev) => prev.filter((l) => l.id !== land.id));
    }
  };

  const updateLand = async (id: string, updatedLand: Land) => {
    const originalLand = lands.find((l) => l.id === id);
    // Optimistic update
    setLands((prev) =>
      prev.map((land) => (land.id === id ? updatedLand : land))
    );

    try {
      const res = await fetch(`/api/lands/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLand),
      });

      if (!res.ok) {
        throw new Error("Failed to update land in database");
      }
    } catch (err) {
      console.error("Failed to update land:", err);
      // Rollback optimistic update
      if (originalLand) {
        setLands((prev) =>
          prev.map((land) => (land.id === id ? originalLand : land))
        );
      }
    }
  };

  const deleteLand = async (id: string) => {
    const originalLand = lands.find((l) => l.id === id);
    // Optimistic update
    setLands((prev) => prev.filter((land) => land.id !== id));

    try {
      const res = await fetch(`/api/lands/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete land from database");
      }
    } catch (err) {
      console.error("Failed to delete land:", err);
      // Rollback optimistic update
      if (originalLand) {
        setLands((prev) => [...prev, originalLand]);
      }
    }
  };

  const getLand = (id: string) => {
    return lands.find((land) => land.id === id);
  };

  return (
    <AgricultureContext.Provider
      value={{ lands, addLand, updateLand, deleteLand, getLand, loading }}
    >
      {children}
    </AgricultureContext.Provider>
  );
}

export function useAgricultureContext() {
  const context = useContext(AgricultureContext);
  if (context === undefined) {
    throw new Error(
      "useAgricultureContext must be used within an AgricultureProvider",
    );
  }
  return context;
}
