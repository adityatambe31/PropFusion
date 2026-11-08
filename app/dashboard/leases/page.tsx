"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Edit3,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LeaseFormDialog } from "@/components/dashboard/LeaseFormDialog";
import {
  Lease,
  LeaseFormValues,
  LeaseProperty,
  useLeaseContext,
} from "./lease-context";
import { useRealEstateContext } from "../realestate/real-estate-context";

const PAGE_SIZE = 10;

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function formatLeaseCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function mapLeaseToFormValues(lease: Lease): LeaseFormValues {
  return {
    propertyId: lease.propertyId,
    tenantName: lease.tenant?.name || "",
    tenantEmail: lease.tenant?.email || "",
    tenantPhone: lease.tenant?.phone || "",
    tenantNationalId: lease.tenant?.nationalId || "",
    moveInDate: lease.tenant?.moveInDate || "",
    leaseStart: lease.leaseStart || "",
    leaseEnd: lease.leaseEnd || "",
    monthlyRent: lease.monthlyRent ? String(lease.monthlyRent) : "",
    notes: lease.notes || "",
  };
}

function toLeasePropertyOptions(properties: LeaseProperty[]) {
  return properties;
}

export default function LeaseDashboardPage() {
  const router = useRouter();
  const { leases, loading, createLease, updateLease, deleteLease } = useLeaseContext();
  const { properties } = useRealEstateContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<"rent" | "expiry" | "status">("expiry");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lease | null>(null);

  const leaseOptions = toLeasePropertyOptions(properties);

  const filteredLeases = useMemo(() => {
    let next = [...leases];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      next = next.filter((lease) => {
        const tenantName = lease.tenant?.name?.toLowerCase() || "";
        const tenantEmail = lease.tenant?.email?.toLowerCase() || "";
        const propertyName = lease.property?.name?.toLowerCase() || "";

        return (
          tenantName.includes(query) ||
          tenantEmail.includes(query) ||
          propertyName.includes(query)
        );
      });
    }

    if (selectedPropertyId !== "all") {
      next = next.filter((lease) => lease.propertyId === selectedPropertyId);
    }

    if (selectedStatus !== "all") {
      next = next.filter((lease) => lease.status === selectedStatus);
    }

    if (dateFrom) {
      next = next.filter((lease) => lease.leaseEnd >= dateFrom);
    }

    if (dateTo) {
      next = next.filter((lease) => lease.leaseStart <= dateTo);
    }

    next.sort((a, b) => {
      let comparison = 0;

      if (sortKey === "rent") {
        comparison = a.monthlyRent - b.monthlyRent;
      } else if (sortKey === "expiry") {
        comparison = a.leaseEnd.localeCompare(b.leaseEnd);
      } else if (sortKey === "status") {
        comparison = a.status.localeCompare(b.status);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return next;
  }, [dateFrom, dateTo, leases, searchQuery, selectedPropertyId, selectedStatus, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredLeases.length / PAGE_SIZE));
  const paginatedLeases = filteredLeases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = useMemo(() => {
    return filteredLeases.reduce(
      (acc, lease) => {
        acc.monthlyRent += lease.monthlyRent;

        if (lease.status === "active") acc.active += 1;
        if (lease.status === "pending") acc.pending += 1;
        if (lease.status === "expired") acc.expired += 1;

        return acc;
      },
      { active: 0, expired: 0, pending: 0, monthlyRent: 0 },
    );
  }, [filteredLeases]);

  const handleSort = (key: "rent" | "expiry" | "status") => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "status" ? "asc" : "desc");
  };

  const openCreateForm = () => {
    setEditingLease(null);
    setShowForm(true);
  };

  const handleSaveLease = async (values: LeaseFormValues) => {
    if (editingLease) {
      await updateLease(editingLease.id, values);
      toast.success("Lease updated successfully");
    } else {
      await createLease(values);
      toast.success("Lease created successfully");
    }

    setEditingLease(null);
  };

  const handleDeleteLease = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteLease(deleteTarget.id);
      toast.success("Lease deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete lease");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEditLease = (lease: Lease) => {
    setEditingLease(lease);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500 dark:text-gray-400">
        Loading leases...
      </div>
    );
  }

  return (
    <main className="flex-1 px-4 sm:px-8 py-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">Lease management</p>
            <h1 className="text-3xl sm:text-4xl font-semibold">
              Track every lease, tenant, and expiry from one place.
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">
              Dedicated lease records stay separate from properties, while still syncing back to the dashboard in real time.
            </p>
          </div>

          <Button onClick={openCreateForm} className="bg-white text-slate-950 hover:bg-slate-100">
            <Plus className="w-4 h-4 mr-2" /> New Lease
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total leases</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{filteredLeases.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{totals.active}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Expired / pending</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{totals.pending + totals.expired}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Monthly rent</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {formatLeaseCurrency(totals.monthlyRent)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
                className="pl-9"
                placeholder="Search tenant, email, or property"
              />
            </div>

            <select
              value={selectedPropertyId}
              onChange={(event) => {
                setSelectedPropertyId(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All properties</option>
              {leaseOptions.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => {
                setSelectedStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>

            <div className="flex gap-3">
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
          </div>

          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setSelectedPropertyId("all");
            setSelectedStatus("all");
            setDateFrom("");
            setDateTo("");
            setSortKey("expiry");
            setSortDirection("asc");
            setPage(1);
          }}>
            <Filter className="w-4 h-4 mr-2" /> Reset
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500 dark:text-gray-400">
                <th className="py-3 pr-4">Tenant</th>
                <th className="py-3 pr-4">Property</th>
                <th className="py-3 pr-4">Lease start</th>
                <th className="py-3 pr-4">
                  <button className="inline-flex items-center gap-1" onClick={() => handleSort("expiry")}>
                    Expiry <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-3 pr-4">
                  <button className="inline-flex items-center gap-1" onClick={() => handleSort("rent")}>
                    Monthly rent <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-3 pr-4">
                  <button className="inline-flex items-center gap-1" onClick={() => handleSort("status")}>
                    Status <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500 dark:text-gray-400">
                    No leases match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedLeases.map((lease) => (
                  <tr key={lease.id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                    <td className="py-4 pr-4">
                      <div className="font-medium text-gray-900 dark:text-white">{lease.tenant?.name || "Unnamed tenant"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{lease.tenant?.email || "No email"}</div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="font-medium text-gray-900 dark:text-white">{lease.property?.name || "Unknown property"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{lease.property?.location || lease.property?.unit || lease.propertyId}</div>
                    </td>
                    <td className="py-4 pr-4 text-gray-700 dark:text-gray-300">{lease.leaseStart}</td>
                    <td className="py-4 pr-4 text-gray-700 dark:text-gray-300">{lease.leaseEnd}</td>
                    <td className="py-4 pr-4 text-gray-700 dark:text-gray-300">{formatLeaseCurrency(lease.monthlyRent)}/mo</td>
                    <td className="py-4 pr-4">
                      <Badge className={statusStyles[lease.status]}>{lease.status}</Badge>
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/leases/${lease.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditLease(lease)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setDeleteTarget(lease)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-3 text-sm text-gray-500 dark:text-gray-400">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredLeases.length)} of {filteredLeases.length}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Next
            </Button>
          </div>
        </div>
      </div>

      <LeaseFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingLease(null);
          }
        }}
        title={editingLease ? "Edit lease" : "Create lease"}
        submitLabel={editingLease ? "Update lease" : "Create lease"}
        properties={leaseOptions}
        initialValues={editingLease ? mapLeaseToFormValues(editingLease) : undefined}
        onSubmit={handleSaveLease}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete lease"
        description={`Are you sure? This will remove ${deleteTarget?.tenant?.name || "this tenant"}'s lease at ${deleteTarget?.property?.name || "this property"}.`}
        confirmLabel="Delete lease"
        onConfirm={() => void handleDeleteLease()}
      />
    </main>
  );
}