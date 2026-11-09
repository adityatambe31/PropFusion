import { describe, expect, it, vi } from "vitest";
import type { Db } from "mongodb";
import { insertAsset, listOrSeedAssets } from "@/lib/db/assets-db";

function mockAssets(existing: Record<string, unknown>[] = []) {
  const find = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(existing) });
  const insertMany = vi.fn().mockResolvedValue({ acknowledged: true });
  const insertOne = vi.fn().mockResolvedValue({ acknowledged: true });
  const collection = vi.fn().mockReturnValue({ find, insertMany, insertOne });
  return { db: { collection } as unknown as Db, find, insertMany, insertOne, collection };
}
describe("Real estate and agriculture persistence helpers (mock database)", () => {
  it.each(["lands", "properties"] as const)("scopes %s queries to manager", async (name) => {
    const m = mockAssets([{ id: "a1", userId: "manager-1", name: "Sample" }]);
    const result = await listOrSeedAssets(m.db, name, "manager-1", [{ name: "Default" }]);
    expect(m.find).toHaveBeenCalledWith({ userId: "manager-1" });
    expect(m.insertMany).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
  it("seeds assets only when no records are found", async () => {
    const m = mockAssets();
    const result = await listOrSeedAssets(m.db, "lands", "manager-1", [{ name: "Demo Land" }]);
    expect(m.insertMany).toHaveBeenCalledOnce();
    expect(result[0]).toMatchObject({ name: "Demo Land", userId: "manager-1" });
  });
  it("enforces manager ownership over submitted userId during create", async () => {
    const m = mockAssets();
    const inserted = await insertAsset(m.db, "properties", "manager-1", { name: "New condo", userId: "attacker" });
    expect(inserted.userId).toBe("manager-1");
    expect(m.insertOne.mock.calls[0][0].userId).toBe("manager-1");
  });
});
