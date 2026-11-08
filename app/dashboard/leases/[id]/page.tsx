"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Clock3, Edit3, MapPin, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LeaseFormDialog } from "@/components/dashboard/LeaseFormDialog";
import { Lease, LeaseFormValues, useLeaseContext } from "../lease-context";
import { useRealEstateContext } from "../../realestate/real-estate-context";

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

function calculateDaysRemaining(leaseEnd?: string) {
  if (!leaseEnd) return 0;
  const endDate = new Date(leaseEnd);
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

export default function LeaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { leases, getLease, updateLease, deleteLease } = useLeaseContext();
  const { properties } = useRealEstateContext();
  const id = params.id as string;

  const [lease, setLease] = useState<Lease | null>(() => getLease(id) || null);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    async function fetchLease() {
      try {
        const response = await fetch(`/api/leases/${id}`);

        if (!response.ok) {
          throw new Error("Lease not found");
        }

        const data = await response.json();
        setLease(data.lease);
      } catch {
        setLease(getLease(id) || null);
      }
    }

    if (!lease) {
      void fetchLease();
    }
  }, [getLease, id, lease, leases]);

  const daysRemaining = useMemo(
    () => calculateDaysRemaining(lease?.leaseEnd),
    [lease?.leaseEnd],
  );

  const handleSave = async (values: LeaseFormValues) => {
    if (!lease) {
      return;
    }

    const updated = await updateLease(lease.id, values);
    setLease(updated);
    toast.success("Lease updated successfully");
  };

  const handleDelete = async () => {
    if (!lease) {
      return;
    }

    await deleteLease(lease.id);
    toast.success("Lease deleted successfully");
    router.push("/dashboard/leases");
  };

  if (!lease) {
    return (
      <main className="flex-1 px-4 sm:px-8 py-8 max-w-5xl mx-auto w-full">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Lease not found</h1>
          <p className="text-gray-500 dark:text-gray-400">The lease may have been removed or you do not have access to it.</p>
          <Button onClick={() => router.push("/dashboard/leases")}>Back to leases</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 sm:px-8 py-8 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => router.push("/dashboard/leases") }>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEdit(true)}>
            <Edit3 className="w-4 h-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {daysRemaining > 0 && daysRemaining <= 30 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-100 p-4">
          This lease expires in {daysRemaining} days.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tenant profile</p>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{lease.tenant?.name || "Unnamed tenant"}</h1>
              </div>
              <Badge className={statusStyles[lease.status]}>{lease.status}</Badge>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <UserRound className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white">{lease.tenant?.email || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-gray-900 dark:text-white">{lease.tenant?.phone || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Move-in date</p>
                  <p className="text-gray-900 dark:text-white">{lease.tenant?.moveInDate || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserRound className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 dark:text-gray-400">National ID</p>
                  <p className="text-gray-900 dark:text-white">{lease.tenant?.nationalId || "N/A"}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment history</h2>
            {lease.paymentHistory && lease.paymentHistory.length > 0 ? (
              <div className="space-y-3">
                {lease.paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{payment.date}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{payment.reference || "Monthly rent"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{formatLeaseCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{payment.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No payment history has been recorded yet.</p>
            )}
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Lease summary</p>
                <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{lease.property?.name || "Unknown property"}</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {lease.property?.location || lease.property?.unit || lease.propertyId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-60">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Monthly rent</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{formatLeaseCurrency(lease.monthlyRent)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Days remaining</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{daysRemaining > 0 ? daysRemaining : 0}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 col-span-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Lease dates</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{lease.leaseStart} → {lease.leaseEnd}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Lease timeline</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Progress from move-in to expiry</h2>
              </div>
              <Badge className={statusStyles[lease.status]}>{lease.status}</Badge>
            </div>

            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
              {[
                { label: "Move-in", value: lease.tenant?.moveInDate || lease.leaseStart },
                { label: "Today", value: new Date().toISOString().slice(0, 10) },
                { label: "Expiry", value: lease.leaseEnd },
              ].map((step, index) => (
                <div key={step.label} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[0.4rem] top-1.5 h-3 w-3 rounded-full bg-slate-900 dark:bg-slate-100 ring-4 ring-white dark:ring-[#111]" />
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{step.label}</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{step.value}</p>
                    {index === 1 && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Current timeline checkpoint.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-900 p-4 text-sm text-gray-600 dark:text-gray-400">
              Notes: {lease.notes || "No notes have been added yet."}
            </div>
          </section>
        </div>
      </div>

      <LeaseFormDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        title="Edit lease"
        submitLabel="Update lease"
        properties={properties}
        initialValues={mapLeaseToFormValues(lease)}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete lease"
        description={`Are you sure? This will remove ${lease.tenant?.name || "this tenant"}'s lease at ${lease.property?.name || "this property"}.`}
        confirmLabel="Delete lease"
        onConfirm={() => void handleDelete()}
      />
    </main>
  );
}