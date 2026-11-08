"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRealEstateContext } from "@/app/dashboard/realestate/real-estate-context";

export type LeaseStatus = "active" | "expired" | "pending";

export interface LeaseTenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId?: string;
  moveInDate?: string;
}

export interface LeaseProperty {
  id: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  type?: string;
  unit?: string;
  status?: string;
}

export interface LeasePayment {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "due" | "late";
  reference?: string;
}

export interface Lease {
  id: string;
  userId: string;
  propertyId: string;
  tenantId: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  status: LeaseStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  daysRemaining?: number;
  tenant: LeaseTenant | null;
  property: LeaseProperty | null;
  paymentHistory?: LeasePayment[];
}

export interface LeaseFormValues {
  propertyId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantNationalId: string;
  moveInDate: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: string;
  notes: string;
}

export type LeaseCreateInput = LeaseFormValues;
export type LeaseUpdateInput = LeaseFormValues;

interface LeaseContextType {
  leases: Lease[];
  loading: boolean;
  refreshLeases: () => Promise<void>;
  createLease: (input: LeaseCreateInput) => Promise<Lease>;
  updateLease: (id: string, input: LeaseUpdateInput) => Promise<Lease>;
  deleteLease: (id: string) => Promise<void>;
  getLease: (id: string) => Lease | undefined;
}

const LeaseContext = createContext<LeaseContextType | undefined>(undefined);

function normalizeLease(lease: Lease): Lease {
  return {
    ...lease,
    paymentHistory: lease.paymentHistory || [],
  };
}

export function LeaseProvider({ children }: { children: ReactNode }) {
  const { refreshProperties, properties } = useRealEstateContext();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshLeases = useCallback(async () => {
    try {
      const response = await fetch("/api/leases");

      if (!response.ok) {
        throw new Error("Failed to fetch leases");
      }

      const data = await response.json();
      setLeases((data.leases || []).map(normalizeLease));
    } catch (error) {
      console.error("Failed to fetch leases:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLeases();
  }, [refreshLeases]);

  const createLease = useCallback(
    async (input: LeaseCreateInput) => {
      const property = properties.find((item) => item.id === input.propertyId);
      const optimisticId = crypto.randomUUID();
      const optimisticLease = normalizeLease({
        id: optimisticId,
        userId: "",
        propertyId: input.propertyId,
        tenantId: optimisticId,
        leaseStart: input.leaseStart,
        leaseEnd: input.leaseEnd,
        monthlyRent: Number(input.monthlyRent || 0),
        status: "pending",
        notes: input.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        daysRemaining: 0,
        tenant: {
          id: optimisticId,
          name: input.tenantName,
          email: input.tenantEmail,
          phone: input.tenantPhone,
          nationalId: input.tenantNationalId,
          moveInDate: input.moveInDate,
        },
        property: property
          ? {
              id: property.id,
              name: property.name,
              location: property.location,
              city: property.city,
              state: property.state,
              type: property.type,
              unit: property.unit,
              status: property.status,
            }
          : null,
      });

      setLeases((prev) => [optimisticLease, ...prev]);

      try {
        const response = await fetch("/api/leases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: input.propertyId,
            tenant: {
              name: input.tenantName,
              email: input.tenantEmail,
              phone: input.tenantPhone,
              nationalId: input.tenantNationalId,
              moveInDate: input.moveInDate,
            },
            leaseStart: input.leaseStart,
            leaseEnd: input.leaseEnd,
            monthlyRent: Number(input.monthlyRent || 0),
            notes: input.notes,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || "Failed to create lease");
        }

        const data = await response.json();
        const savedLease = normalizeLease(data.lease);

        setLeases((prev) =>
          prev.map((lease) => (lease.id === optimisticId ? savedLease : lease)),
        );

        void refreshProperties().catch((error) => {
          console.error("Failed to refresh properties after lease create:", error);
        });

        return savedLease;
      } catch (error) {
        setLeases((prev) => prev.filter((lease) => lease.id !== optimisticId));
        throw error;
      }
    },
    [properties, refreshProperties],
  );

  const updateLease = useCallback(
    async (id: string, input: LeaseUpdateInput) => {
      const originalLease = leases.find((lease) => lease.id === id);
      if (!originalLease) {
        throw new Error("Lease not found");
      }

      const property = properties.find((item) => item.id === input.propertyId);
      const optimisticLease = normalizeLease({
        ...originalLease,
        propertyId: input.propertyId,
        leaseStart: input.leaseStart,
        leaseEnd: input.leaseEnd,
        monthlyRent: Number(input.monthlyRent || 0),
        notes: input.notes,
        tenant: {
          ...(originalLease.tenant || {
            id: originalLease.tenantId,
            name: input.tenantName,
            email: input.tenantEmail,
            phone: input.tenantPhone,
          }),
          name: input.tenantName,
          email: input.tenantEmail,
          phone: input.tenantPhone,
          nationalId: input.tenantNationalId,
          moveInDate: input.moveInDate,
        },
        property: property
          ? {
              id: property.id,
              name: property.name,
              location: property.location,
              city: property.city,
              state: property.state,
              type: property.type,
              unit: property.unit,
              status: property.status,
            }
          : null,
      });

      setLeases((prev) =>
        prev.map((lease) => (lease.id === id ? optimisticLease : lease)),
      );

      try {
        const response = await fetch(`/api/leases/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: input.propertyId,
            tenant: {
              name: input.tenantName,
              email: input.tenantEmail,
              phone: input.tenantPhone,
              nationalId: input.tenantNationalId,
              moveInDate: input.moveInDate,
            },
            leaseStart: input.leaseStart,
            leaseEnd: input.leaseEnd,
            monthlyRent: Number(input.monthlyRent || 0),
            notes: input.notes,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || "Failed to update lease");
        }

        const data = await response.json();
        const savedLease = normalizeLease(data.lease);

        setLeases((prev) =>
          prev.map((lease) => (lease.id === id ? savedLease : lease)),
        );

        void refreshProperties().catch((error) => {
          console.error("Failed to refresh properties after lease update:", error);
        });

        return savedLease;
      } catch (error) {
        setLeases((prev) =>
          prev.map((lease) => (lease.id === id ? originalLease : lease)),
        );
        throw error;
      }
    },
    [leases, properties, refreshProperties],
  );

  const deleteLease = useCallback(
    async (id: string) => {
      const originalLease = leases.find((lease) => lease.id === id);
      if (!originalLease) {
        throw new Error("Lease not found");
      }

      setLeases((prev) => prev.filter((lease) => lease.id !== id));

      try {
        const response = await fetch(`/api/leases/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || "Failed to delete lease");
        }

        void refreshProperties().catch((error) => {
          console.error("Failed to refresh properties after lease delete:", error);
        });
      } catch (error) {
        setLeases((prev) => [originalLease, ...prev]);
        throw error;
      }
    },
    [leases, refreshProperties],
  );

  const getLease = useCallback(
    (id: string) => leases.find((lease) => lease.id === id),
    [leases],
  );

  const value = useMemo(
    () => ({
      leases,
      loading,
      refreshLeases,
      createLease,
      updateLease,
      deleteLease,
      getLease,
    }),
    [createLease, deleteLease, getLease, leases, loading, refreshLeases, updateLease],
  );

  return <LeaseContext.Provider value={value}>{children}</LeaseContext.Provider>;
}

export function useLeaseContext() {
  const context = useContext(LeaseContext);

  if (!context) {
    throw new Error("useLeaseContext must be used within a LeaseProvider");
  }

  return context;
}