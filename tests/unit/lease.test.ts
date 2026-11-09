import { describe, expect, it, vi, afterEach } from "vitest";
import { calculateDaysRemaining, calculateLeaseStatus } from "@/lib/db/leases-db";

afterEach(() => vi.useRealTimers());
describe("Lease status business rules", () => {
  it("marks future leases pending and past leases expired", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
    expect(calculateLeaseStatus("2026-12-01", "2027-12-01")).toBe("pending");
    expect(calculateLeaseStatus("2025-01-01", "2026-01-01")).toBe("expired");
    expect(calculateLeaseStatus("2026-01-01", "2027-01-01")).toBe("active");
  });
  it("uses an explicitly provided status", () => {
    expect(calculateLeaseStatus("2030-01-01", "2031-01-01", "active")).toBe("active");
  });
  it("calculates remaining days and defaults missing dates to zero", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-08T00:00:00Z"));
    expect(calculateDaysRemaining("2026-11-11T00:00:00Z")).toBe(3);
    expect(calculateDaysRemaining(undefined)).toBe(0);
  });
});
