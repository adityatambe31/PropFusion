
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddTransactionModal } from "./AddTransactionModal";
import {
  TransactionTable,
  type TransactionRow,
} from "./TransactionTable";

type Metrics = {
  totalRevenue: number;
  totalExpenses: number;
  noi: number;
  roi: number;
};

const emptyMetrics: Metrics = {
  totalRevenue: 0,
  totalExpenses: 0,
  noi: 0,
  roi: 0,
};

export function AssetTransactionsSection({
  assetId,
}: {
  assetId: string;
}) {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);

  // Refresh after a transaction is added or deleted.
  const load = useCallback(async () => {
    const response = await fetch(
      `/api/transactions?assetId=${encodeURIComponent(assetId)}`,
      { cache: "no-store" }
    );

    if (!response.ok) return;

    const data = await response.json();
    setRows(data.transactions);
    setMetrics(data.metrics);
  }, [assetId]);

  // Load transactions whenever the asset changes.
  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialData() {
      try {
        const response = await fetch(
          `/api/transactions?assetId=${encodeURIComponent(assetId)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        if (!controller.signal.aborted) {
          setRows(data.transactions);
          setMetrics(data.metrics);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load transactions:", error);
        }
      }
    }

    void loadInitialData();

    return () => controller.abort();
  }, [assetId]);

  const cards = [
    ["Revenue", metrics.totalRevenue],
    ["Expenses", metrics.totalExpenses],
    ["NOI", metrics.noi],
    ["ROI", `${metrics.roi.toFixed(2)}%`],
  ] as const;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Transactions
          </h2>
          <p className="text-sm text-muted-foreground">
            Track real revenue and expenses for this asset.
          </p>
        </div>

        <AddTransactionModal
          assetId={assetId}
          onSaved={load}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {label}
              </CardTitle>
            </CardHeader>

            <CardContent className="text-2xl font-bold">
              {typeof value === "number"
                ? `$${value.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}`
                : value}
            </CardContent>
          </Card>
        ))}
      </div>

      <TransactionTable
        rows={rows}
        onDeleted={load}
      />
    </section>
  );
}
