"use client";

import { useCallback, useEffect, useState } from "react";
import { LeaseInfoCard } from "@/components/tenant/LeaseInfoCard";
import {
  PaymentHistoryTable,
  type PaymentRow,
} from "@/components/tenant/PaymentHistoryTable";
import { PayRentModal } from "@/components/tenant/PayRentModal";
import { Button } from "@/components/ui/button";
import { LifeBuoy } from "lucide-react";
import Link from "next/link";

type TenantDashboardData = {
  tenant: { name: string; email: string; phone?: string };
  lease: {
    id: string;
    start: string;
    end: string;
    status: string;
    monthlyRent: number;
  };
  property: { name: string; address: string };
  payments: PaymentRow[];
};

export default function TenantDashboardPage() {
  const [data, setData] = useState<TenantDashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tenant/dashboard", { cache: "no-store" });
      const result = (await response.json()) as TenantDashboardData & {
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        setError(result.details || result.error || "Could not load tenant dashboard");
        return;
      }

      setData(result);
    } catch (error) {
      console.error(error);
      setError("Could not connect to the tenant dashboard API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center">Loading tenant dashboard…</main>;
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-semibold text-red-900">Could not load tenant dashboard</h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-5 rounded-lg bg-red-900 px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const alreadyPaid = data.payments.some(
    (payment) => payment.status === "paid" && payment.date.startsWith(currentPeriod),
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Tenant portal</p>
          <h1 className="text-3xl font-bold">Welcome, {data.tenant.name}</h1>
          <p className="text-muted-foreground">Your lease and rent payment overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/tenant/support"><LifeBuoy className="mr-2 h-4 w-4" /> Customer support</Link>
          </Button>
          <PayRentModal
          leaseId={data.lease.id}
          propertyName={data.property.name}
          amount={data.lease.monthlyRent}
          alreadyPaid={alreadyPaid}
          tenantEmail={data.tenant.email}
          onPaid={loadDashboard}
        />
        </div>
      </div>
      <LeaseInfoCard property={data.property} lease={data.lease} />
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Payment history</h2>
        <PaymentHistoryTable payments={data.payments} />
      </section>
    </main>
  );
}
