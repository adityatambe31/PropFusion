import { getDb } from "@/lib/db/mongodb";
import {
  authUserFilterById,
  authUserId,
  findAuthUserById,
  MANAGER_EMAIL,
  normalizeEmail,
  TENANT_EMAIL,
} from "@/lib/auth/user-record";

export type AppRole = "manager" | "tenant" | "admin";
export type AccessContext = {
  role: AppRole;
  leaseId?: string;
  tenantId?: string;
  email?: string;
};

export async function getAccessContext(sessionUserId: string): Promise<AccessContext> {
  const db = await getDb();
  const users = db.collection("user");
  const user = await findAuthUserById(users, sessionUserId);
  if (!user) return { role: "manager" };

  const canonicalUserId = authUserId(user);
  const email = typeof user.email === "string" ? normalizeEmail(user.email) : undefined;

  // These two demo accounts always keep their intended role.
  if (email === MANAGER_EMAIL) {
    if (user.role !== "manager") {
      await users.updateOne(authUserFilterById(canonicalUserId), {
        $set: { role: "manager", updatedAt: new Date() },
        $unset: { leaseId: "", tenantId: "" },
      });
    }
    return { role: "manager", email };
  }

  if (user.role === "admin") return { role: "admin", email };

  if (email === TENANT_EMAIL || user.role === "tenant") {
    let leaseId = typeof user.leaseId === "string" ? user.leaseId : undefined;
    let tenantId = typeof user.tenantId === "string" ? user.tenantId : undefined;

    if (!leaseId && email) {
      const tenant = await db.collection("tenants").findOne(
        { email },
        { sort: { updatedAt: -1, createdAt: -1 } },
      );
      leaseId = tenant?.leaseId ? String(tenant.leaseId) : undefined;
      tenantId = tenant?.id ? String(tenant.id) : undefined;
    }

    if (!leaseId && email) {
      const invite = await db.collection("tenantInvites").findOne(
        { email, acceptedAt: { $ne: null } },
        { sort: { acceptedAt: -1, createdAt: -1 } },
      );
      leaseId = invite?.leaseId ? String(invite.leaseId) : undefined;
      tenantId = invite?.tenantId ? String(invite.tenantId) : tenantId;
    }

    if (leaseId) {
      const lease = await db.collection("leases").findOne({ id: leaseId });
      if (lease) {
        tenantId = tenantId ?? (lease.tenantId ? String(lease.tenantId) : undefined);
        await Promise.all([
          users.updateOne(authUserFilterById(canonicalUserId), {
            $set: {
              role: "tenant",
              leaseId,
              ...(tenantId ? { tenantId } : {}),
              updatedAt: new Date(),
            },
          }),
          db.collection("leases").updateOne(
            { id: leaseId },
            { $set: { tenantAuthUserId: canonicalUserId, updatedAt: new Date().toISOString() } },
          ),
        ]);
        return { role: "tenant", leaseId, tenantId, email };
      }
    }

    return { role: "tenant", email };
  }

  return { role: "manager", email };
}
