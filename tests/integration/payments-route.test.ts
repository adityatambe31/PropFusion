import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  session: vi.fn(), access: vi.fn(), getDb: vi.fn(), createPayment: vi.fn(), listPayments: vi.fn(),
  sendEmail: vi.fn(), audit: vi.fn(),
}));
vi.mock("@/lib/auth/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("@/lib/auth/access", () => ({ getAccessContext: mocks.access }));
vi.mock("@/lib/db/mongodb", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/db/payment", () => ({ createRentPayment: mocks.createPayment, listLeasePayments: mocks.listPayments }));
vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail, getRentReceiptEmailTemplate: vi.fn().mockReturnValue("<html>receipt</html>") }));
vi.mock("@/lib/middleware/audit-logger", () => ({ auditMutation: mocks.audit }));
vi.mock("@/lib/url", () => ({ resolveAppURL: vi.fn().mockReturnValue("http://localhost:3000") }));
import { GET, POST } from "@/app/api/payments/route";

function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/payments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}
const valid = { leaseId: "l1", amount: 1500, payerName: "Test Tenant", paymentLast4: "4242", paymentMethod: "card", date: "2026-11-08" };
const lease = { id: "l1", monthlyRent: 1500, propertyId: "p1", tenantId: "t1", userId: "m1", tenantAuthUserId: "u1" };
const payment = { id: "pay1", receiptNumber: "PF-TEST-1", period: "2026-11", amount: 1500, date: "2026-11-08", leaseId: "l1" };
function fakeDb(foundLease: unknown = lease) {
  return { collection: vi.fn((name: string) => ({
    findOne: vi.fn().mockResolvedValue(name === "leases" ? foundLease : name === "tenants" ? { name: "Tenant", email: "test@example.invalid" } : { name: "Test Property" }),
  })) };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "u1", email: "test@example.invalid", name: "Tenant" } });
  mocks.access.mockResolvedValue({ role: "tenant", leaseId: "l1" });
  mocks.getDb.mockResolvedValue(fakeDb());
  mocks.createPayment.mockResolvedValue(payment);
  mocks.sendEmail.mockResolvedValue({ success: true });
  mocks.audit.mockResolvedValue(undefined);
});
describe("/api/payments authorization and validation (mocked integrations)", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.session.mockResolvedValue(null);
    const res = await POST(request(valid));
    expect(res.status).toBe(401);
    expect(mocks.createPayment).not.toHaveBeenCalled();
  });
  it("returns 403 for property manager attempting tenant payment", async () => {
    mocks.access.mockResolvedValue({ role: "manager" });
    const res = await POST(request(valid));
    expect(res.status).toBe(403);
  });
  it("rejects leases not owned by the signed-in tenant", async () => {
    mocks.getDb.mockResolvedValue(fakeDb(null));
    const res = await POST(request(valid));
    expect(res.status).toBe(404);
  });
  it.each([{ amount: 1499 }, { amount: 0 }, { amount: -1 }, { amount: "not-a-number" }])("rejects incorrect rent amount %j", async (change) => {
    const res = await POST(request({ ...valid, ...change }));
    expect(res.status).toBe(400);
    expect(mocks.createPayment).not.toHaveBeenCalled();
  });
  it.each([{ payerName: "A" }, { paymentLast4: "12" }, { paymentLast4: "abcd" }])("rejects bad payment details %j", async (change) => {
    const res = await POST(request({ ...valid, ...change }));
    expect(res.status).toBe(400);
  });
  it("returns HTTP 409 for duplicate monthly payment", async () => {
    mocks.createPayment.mockRejectedValue(new Error("RENT_ALREADY_PAID"));
    const res = await POST(request(valid));
    expect(res.status).toBe(409);
  });
  it("creates simulated payment and returns receipt metadata", async () => {
    const res = await POST(request(valid));
    expect(res.status).toBe(201);
    expect((await res.json()).payment.receiptNumber).toBe("PF-TEST-1");
    expect(mocks.createPayment).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ amount: 1500, leaseId: "l1", tenantId: "t1", managerId: "m1" }));
  });
  it("GET denies unauthenticated access", async () => {
    mocks.session.mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost:3000/api/payments?leaseId=l1"));
    expect(res.status).toBe(401);
  });
  it("GET denies another tenant's lease", async () => {
    mocks.getDb.mockResolvedValue(fakeDb(null));
    const res = await GET(new NextRequest("http://localhost:3000/api/payments?leaseId=other"));
    expect(res.status).toBe(404);
  });
});
