"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ReceiptText, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PaymentRow = {
  id: string;
  date: string;
  amount: number;
  status: string;
  receiptNumber?: string;
  paymentMethod?: string;
  paymentLast4?: string;
  period?: string;
  payerName?: string;
};

export function PaymentHistoryTable({ payments }: { payments: PaymentRow[] }) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("all");
  const [year, setYear] = useState("all");

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          payments
            .map((payment) => new Date(payment.date).getFullYear())
            .filter((value) => Number.isFinite(value)),
        ),
      ).sort((a, b) => b - a),
    [payments],
  );

  const filteredPayments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return payments.filter((payment) => {
      const date = new Date(payment.date);
      const matchesMonth = month === "all" || String(date.getMonth() + 1) === month;
      const matchesYear = year === "all" || String(date.getFullYear()) === year;
      const searchable = [
        payment.receiptNumber,
        payment.status,
        payment.paymentMethod,
        payment.paymentLast4,
        payment.payerName,
        payment.amount.toFixed(2),
        date.toLocaleDateString("en-US"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesMonth && matchesYear && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [month, payments, query, year]);

  const hasFilters = Boolean(query || month !== "all" || year !== "all");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-[1fr_180px_150px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search receipt, amount, method or status"
            className="pl-9"
          />
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger>
            <CalendarDays className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {Array.from({ length: 12 }, (_, index) => (
              <SelectItem key={index + 1} value={String(index + 1)}>
                {new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2026, index, 1))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map((paymentYear) => (
              <SelectItem key={paymentYear} value={String(paymentYear)}>
                {paymentYear}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          disabled={!hasFilters}
          onClick={() => {
            setQuery("");
            setMonth("all");
            setYear("all");
          }}
        >
          Clear
        </Button>
      </div>

      {!payments.length ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No payments recorded yet.
        </div>
      ) : !filteredPayments.length ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No payments match the selected search and filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Period</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Method</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-t">
                  <td className="p-3">{new Date(payment.date).toLocaleDateString("en-US")}</td>
                  <td className="p-3">
                    {payment.period
                      ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
                          new Date(`${payment.period}-01T00:00:00Z`),
                        )
                      : "—"}
                  </td>
                  <td className="p-3">${payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 capitalize">
                    {payment.paymentMethod ? `${payment.paymentMethod}${payment.paymentLast4 ? ` •••• ${payment.paymentLast4}` : ""}` : "—"}
                  </td>
                  <td className="p-3 capitalize">{payment.status}</td>
                  <td className="p-3">
                    <a
                      href={`/api/payments/${payment.id}/receipt`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
                    >
                      <ReceiptText className="h-4 w-4" />
                      {payment.receiptNumber ?? "View"}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {filteredPayments.length} of {payments.length} payment{payments.length === 1 ? "" : "s"}.
      </p>
    </div>
  );
}
