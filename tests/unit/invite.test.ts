import { describe, expect, it, vi } from "vitest";
import { createTenantInvite, hashInviteToken } from "@/lib/db/tenant-invite";
import type { Db } from "mongodb";

describe("Tenant invite security", () => {
  it("hashes tokens deterministically without exposing the raw token", () => {
    const hash = hashInviteToken("abc123");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashInviteToken("abc123")).toBe(hash);
    expect(hash).not.toContain("abc123");
    expect(hashInviteToken("other")).not.toBe(hash);
  });
  it("normalizes email, stores only token hash, and expires invitation in seven days", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ deletedCount: 0 });
    const insertOne = vi.fn().mockResolvedValue({ acknowledged: true });
    const db = { collection: vi.fn().mockReturnValue({ deleteMany, insertOne }) } as unknown as Db;
    const before = Date.now();
    const { token, invite } = await createTenantInvite(db, { email: "  TENANT@EXAMPLE.COM ", name: "Test Tenant", leaseId: "l1", tenantId: "t1", managerId: "m1" });
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(invite.email).toBe("tenant@example.com");
    expect(invite.tokenHash).toBe(hashInviteToken(token));
    expect(JSON.stringify(insertOne.mock.calls)).not.toContain(token);
    expect(invite.expiresAt.getTime() - before).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000 - 1000);
    expect(deleteMany).toHaveBeenCalledWith({ email: "tenant@example.com", leaseId: "l1", acceptedAt: null });
  });
});
