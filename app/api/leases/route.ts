import { auth } from "@/lib/auth/auth";
import { getDb } from "@/lib/db/mongodb";
import {
  calculateLeaseStatus,
  getPopulatedLeases,
  populateLeaseRecord,
  syncPropertyLeaseSnapshot,
  type LeaseStatus,
} from "@/lib/db/leases-db";
import { NextRequest, NextResponse } from "next/server";
import { createTenantInvite } from "@/lib/db/tenant-invite";
import { sendEmail } from "@/lib/email";
import { auditMutation } from "@/lib/middleware/audit-logger";
import { resolveAppURL } from "@/lib/url";

function parseMonthlyRent(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function normalizeTenant(tenant: unknown) {
  if (!tenant || typeof tenant !== "object") {
    return null;
  }

  const record = tenant as Record<string, unknown>;

  if (!record.name || !record.email || !record.phone) {
    return null;
  }

  return {
    name: String(record.name),
    email: String(record.email),
    phone: String(record.phone),
    nationalId: typeof record.nationalId === "string" ? record.nationalId : "",
    moveInDate: typeof record.moveInDate === "string" ? record.moveInDate : "",
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = new URL(req.url).searchParams.get("propertyId") || undefined;
    const db = await getDb();
    const leases = await getPopulatedLeases(db, session.user.id, propertyId);

    return NextResponse.json({ leases });
  } catch (error) {
    console.error("Error in GET /api/leases:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const tenant = normalizeTenant(body.tenant);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant name, email, and phone are required" },
        { status: 400 },
      );
    }

    if (!body.propertyId || !body.leaseStart || !body.leaseEnd) {
      return NextResponse.json(
        { error: "Property, lease start, and lease end are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const property = await db.collection("properties").findOne({
      id: String(body.propertyId),
      userId: session.user.id,
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const tenantId = crypto.randomUUID();
    const leaseId = crypto.randomUUID();
    const now = new Date().toISOString();
    const monthlyRent = parseMonthlyRent(body.monthlyRent);
    const status = calculateLeaseStatus(
      String(body.leaseStart),
      String(body.leaseEnd),
      body.status as LeaseStatus | undefined,
    );

    const newTenant = {
      id: tenantId,
      userId: session.user.id,
      leaseId,
      propertyId: String(body.propertyId),
      ...tenant,
      createdAt: now,
      updatedAt: now,
    };

    const newLease = {
      id: leaseId,
      userId: session.user.id,
      propertyId: String(body.propertyId),
      tenantId,
      leaseStart: String(body.leaseStart),
      leaseEnd: String(body.leaseEnd),
      monthlyRent,
      status,
      notes: typeof body.notes === "string" ? body.notes : "",
      createdAt: now,
      updatedAt: now,
    };

    await Promise.all([
      db.collection("tenants").insertOne(newTenant),
      db.collection("leases").insertOne(newLease),
    ]);

    await syncPropertyLeaseSnapshot(db, session.user.id, String(body.propertyId));

    const { token } = await createTenantInvite(db, {
      email: tenant.email,
      name: tenant.name,
      leaseId,
      tenantId,
      managerId: session.user.id,
    });
    const inviteUrl = `${resolveAppURL({ requestOrigin: new URL(req.url).origin })}/tenant/accept-invite?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: tenant.email,
      subject: "You are invited to the PropFusion tenant portal",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px"><h2>Welcome to PropFusion</h2><p>Hi ${tenant.name},</p><p>Your property manager created your lease portal account. Use the button below to create your password and view your lease.</p><p><a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Set up tenant account</a></p><p style="font-size:12px;color:#666">This link expires in 7 days.</p></div>`,
    });
    await auditMutation(db, { userId: session.user.id, userEmail: session.user.email, action: "CREATE", entity: "lease", entityId: leaseId, metadata: { propertyId: String(body.propertyId), tenantEmail: tenant.email } });

    const populatedLease = await db.collection("leases").findOne({
      id: leaseId,
      userId: session.user.id,
    });

    if (!populatedLease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const responseLease = await populateLeaseRecord(db, populatedLease);

    return NextResponse.json({ lease: responseLease }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/leases:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}