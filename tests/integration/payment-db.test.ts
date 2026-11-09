import { describe, expect, it, vi } from "vitest";
import type { Db } from "mongodb";
import { createRentPayment, paymentPeriod } from "@/lib/db/payment";

const input = { leaseId: "lease-1", tenantId: "tenant-1", assetId: "property-1", managerId: "manager-1", amount: 1500, date: "2026-11-08", status: "paid" as const, paymentMethod: "card" as const, paymentLast4: "4242", payerName: "Test Tenant" };
function makeDb(existing: unknown = null, transactionFailure = false) {
  const findOne = vi.fn().mockResolvedValue(existing);
  const paymentInsert = vi.fn().mockResolvedValue({ acknowledged: true });
  const leaseUpdate = vi.fn().mockResolvedValue({ matchedCount: 1 });
  const transactionInsert = vi.fn().mockImplementation(async () => {
    if (transactionFailure) throw new Error("SIMULATED_TRANSACTION_WRITE_FAILURE");
    return { acknowledged: true };
  });
  const db = { collection: vi.fn((name: string) => {
    if (name === "payments") return { findOne, insertOne: paymentInsert };
    if (name === "leases") return { updateOne: leaseUpdate };
    if (name === "transactions") return { insertOne: transactionInsert };
    throw new Error(`Unexpected collection: ${name}`);
  }) } as unknown as Db;
  return { db, findOne, paymentInsert, leaseUpdate, transactionInsert };
}
describe("Simulated rent payment database workflow", () => {
  it("converts payment dates into consistent UTC YYYY-MM periods", () => {
    expect(paymentPeriod("2026-11-08T18:00:00Z")).toBe("2026-11");
    expect(paymentPeriod("2026-01-01T00:00:00Z")).toBe("2026-01");
  });
  it("rejects a second paid record for the same lease and period", async () => {
    const m = makeDb({ id: "existing" });
    await expect(createRentPayment(m.db, input)).rejects.toThrow("RENT_ALREADY_PAID");
    expect(m.findOne).toHaveBeenCalledWith({ leaseId: "lease-1", period: "2026-11", status: "paid" });
    expect(m.paymentInsert).not.toHaveBeenCalled();
  });
  it("creates a payment, updates lease history and records revenue", async () => {
    const m = makeDb();
    const payment = await createRentPayment(m.db, input);
    expect(payment.period).toBe("2026-11");
    expect(payment.receiptNumber).toMatch(/^PF-/);
    expect(m.paymentInsert).toHaveBeenCalledOnce();
    expect(m.leaseUpdate).toHaveBeenCalledOnce();
    expect(m.transactionInsert).toHaveBeenCalledOnce();
    expect(m.transactionInsert.mock.calls[0][0]).toMatchObject({ source: "rent-payment", paymentId: payment.id, amount: 1500 });
  });
  it("documents partial-write risk if transaction creation fails", async () => {
    const m = makeDb(null, true);
    await expect(createRentPayment(m.db, input)).rejects.toThrow("SIMULATED_TRANSACTION_WRITE_FAILURE");
    // CURRENT BEHAVIOR: previous writes have already happened. This is NOT a passing data-integrity guarantee.
    expect(m.paymentInsert).toHaveBeenCalledOnce();
    expect(m.leaseUpdate).toHaveBeenCalledOnce();
    // Fix by using transactions / idempotent writes and add an atomicity regression test.
  });
  it.skip("TODO: simultaneous payments must never create two paid records (requires unique index and atomic write)", () => {});
});
