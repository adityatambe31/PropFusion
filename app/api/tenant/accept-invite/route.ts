import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getDb } from "@/lib/db/mongodb";
import { hashInviteToken } from "@/lib/db/tenant-invite";
import { auditMutation } from "@/lib/middleware/audit-logger";
import { authUserFilterById, authUserId, MANAGER_EMAIL, normalizeEmail } from "@/lib/auth/user-record";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
  const db = await getDb();
  const invite = await db.collection("tenantInvites").findOne({
    tokenHash: hashInviteToken(token), acceptedAt: null, expiresAt: { $gt: new Date() },
  });
  if (!invite) return NextResponse.json({ error: "Invite is invalid or expired" }, { status: 404 });
  return NextResponse.json({ email: invite.email, name: invite.name, leaseId: invite.leaseId });
}

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (typeof token !== "string" || typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "A valid invite and password of at least 6 characters are required" }, { status: 400 });
  }
  const db = await getDb();
  const invite = await db.collection("tenantInvites").findOne({
    tokenHash: hashInviteToken(token), acceptedAt: null, expiresAt: { $gt: new Date() },
  });
  if (!invite) return NextResponse.json({ error: "Invite is invalid or expired" }, { status: 404 });

  const inviteEmail = normalizeEmail(String(invite.email));
  if (inviteEmail === MANAGER_EMAIL) {
    return NextResponse.json({ error: "The property-manager email cannot be used for a tenant account." }, { status: 409 });
  }

  const existing = await db.collection("user").findOne({ email: inviteEmail });
  let userId = existing ? authUserId(existing) : "";
  if (!existing) {
    const result = await auth.api.signUpEmail({
      body: { email: String(invite.email), password, name: String(invite.name) },
      headers: req.headers,
    });
    userId = String(result.user.id);
  }

  await Promise.all([
    db.collection("user").updateOne(
      authUserFilterById(userId),
      { $set: { role: "tenant", leaseId: String(invite.leaseId), tenantId: String(invite.tenantId), emailVerified: true, updatedAt: new Date() } },
    ),
    db.collection("leases").updateOne(
      { id: String(invite.leaseId) },
      { $set: { tenantAuthUserId: userId, updatedAt: new Date().toISOString() } },
    ),
    db.collection("tenantInvites").updateOne(
      { _id: invite._id },
      { $set: { acceptedAt: new Date(), acceptedUserId: userId } },
    ),
  ]);
  await auditMutation(db, { userId, userEmail: String(invite.email), userRole: "tenant", action: "CREATE", entity: "tenant", entityId: String(invite.tenantId), metadata: { leaseId: invite.leaseId, inviteAccepted: true } });
  return NextResponse.json({ success: true });
}
