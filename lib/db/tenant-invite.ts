import { createHash, randomBytes } from "crypto";
import type { Db } from "mongodb";

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createTenantInvite(db: Db, input: {
  email: string;
  name: string;
  leaseId: string;
  tenantId: string;
  managerId: string;
}) {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const invite = {
    id: crypto.randomUUID(),
    ...input,
    email: input.email.trim().toLowerCase(),
    tokenHash: hashInviteToken(token),
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
    acceptedAt: null,
    createdAt: now,
  };
  await db.collection("tenantInvites").deleteMany({ email: invite.email, leaseId: input.leaseId, acceptedAt: null });
  await db.collection("tenantInvites").insertOne(invite);
  return { invite, token };
}
