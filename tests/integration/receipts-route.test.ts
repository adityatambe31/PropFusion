import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ session: vi.fn(), access: vi.fn(), getDb: vi.fn() }));
vi.mock("@/lib/auth/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("@/lib/auth/access", () => ({ getAccessContext: mocks.access }));
vi.mock("@/lib/db/mongodb", () => ({ getDb: mocks.getDb }));
import { GET } from "@/app/api/payments/[id]/receipt/route";
const req = () => new NextRequest("http://localhost:3000/api/payments/payment1/receipt");
const ctx = { params: Promise.resolve({ id: "payment1" }) };
function fakeDb({ payment = { id: "payment1", leaseId: "l1", tenantId: "t1", assetId: "p1", amount: 500, date: "2026-11-08", period: "2026-11", receiptNumber: "PF-1", paymentMethod: "card", paymentLast4: "4242" } as unknown, lease = { id: "l1", userId: "manager1", tenantAuthUserId: "tenant1" } as unknown } = {}) {
  const records: Record<string, unknown> = { payments: payment, leases: lease, tenants: { name: "<script>alert(1)</script>", email: "test@example.invalid" }, properties: { name: "Example House", location: "Toronto" } };
  return { collection: vi.fn((name: string) => ({ findOne: vi.fn().mockResolvedValue(records[name]) })) };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "tenant1" } });
  mocks.access.mockResolvedValue({ role: "tenant", leaseId: "l1" });
  mocks.getDb.mockResolvedValue(fakeDb());
});
describe("Receipt access rules", () => {
  it("blocks anonymous requests", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await GET(req(), ctx)).status).toBe(401);
  });
  it("returns 404 for missing receipt", async () => {
    mocks.getDb.mockResolvedValue(fakeDb({ payment: null }));
    expect((await GET(req(), ctx)).status).toBe(404);
  });
  it("blocks another tenant from viewing a receipt", async () => {
    mocks.access.mockResolvedValue({ role: "tenant", leaseId: "other" });
    mocks.getDb.mockResolvedValue(fakeDb({ lease: { id: "l1", userId: "manager1", tenantAuthUserId: "someone-else" } }));
    expect((await GET(req(), ctx)).status).toBe(403);
  });
  it("returns private, escaped HTML to authorized tenant", async () => {
    const res = await GET(req(), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const html = await res.text();
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("simulated payment");
  });
  it("allows owning manager to retrieve receipt", async () => {
    mocks.session.mockResolvedValue({ user: { id: "manager1" } });
    mocks.access.mockResolvedValue({ role: "manager" });
    expect((await GET(req(), ctx)).status).toBe(200);
  });
});
