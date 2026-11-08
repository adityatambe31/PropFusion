import type { Db } from "mongodb";
import { createTransaction } from "@/lib/db/transaction";
import type { LeasePaymentRecord } from "@/lib/db/leases-db";

export type PaymentRecord = {
  id: string;
  leaseId: string;
  tenantId: string;
  assetId: string;
  managerId: string;
  amount: number;
  date: string;
  period: string;
  status: "paid" | "pending";
  paymentMethod?: "card" | "bank";
  paymentLast4?: string;
  payerName?: string;
  receiptNumber: string;
  createdAt: string;
};

type LeasePaymentHistoryDocument = {
  paymentHistory?: LeasePaymentRecord[];
  lastPaymentDate?: string;
  updatedAt?: string;
};

const payments = (db: Db) => db.collection<PaymentRecord>("payments");
const leases = (db: Db) => db.collection<LeasePaymentHistoryDocument>("leases");

export function paymentPeriod(date: string) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function receiptNumber() {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `PF-${stamp}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function createRentPayment(
  db: Db,
  input: Omit<PaymentRecord, "id" | "period" | "receiptNumber" | "createdAt">,
) {
  const period = paymentPeriod(input.date);
  const existing = await payments(db).findOne({ leaseId: input.leaseId, period, status: "paid" });
  if (existing) throw new Error("RENT_ALREADY_PAID");

  const payment: PaymentRecord = {
    id: crypto.randomUUID(),
    ...input,
    period,
    receiptNumber: receiptNumber(),
    createdAt: new Date().toISOString(),
  };

  await payments(db).insertOne(payment);
  const paymentHistoryEntry: LeasePaymentRecord = {
    id: payment.id,
    date: payment.date,
    amount: payment.amount,
    status: payment.status,
    reference: payment.receiptNumber,
    receiptNumber: payment.receiptNumber,
    paymentMethod: payment.paymentMethod,
    paymentLast4: payment.paymentLast4,
  };

  await leases(db).updateOne(
    { id: input.leaseId },
    {
      $push: {
        paymentHistory: paymentHistoryEntry,
      },
      $set: { lastPaymentDate: payment.date, updatedAt: new Date().toISOString() },
    },
  );
  await createTransaction(db, {
    assetId: input.assetId,
    userId: input.managerId,
    type: "revenue",
    category: "Rent",
    amount: input.amount,
    date: input.date,
    notes: `Tenant rent payment for ${period} (${payment.receiptNumber})`,
    source: "rent-payment",
    paymentId: payment.id,
  });
  return payment;
}

export async function listLeasePayments(db: Db, leaseId: string) {
  return payments(db).find({ leaseId }).sort({ date: -1 }).toArray();
}
