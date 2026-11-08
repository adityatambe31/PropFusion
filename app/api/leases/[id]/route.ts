import { auth } from "@/lib/auth/auth";
import { getDb } from "@/lib/db/mongodb";
import {
  calculateLeaseStatus,
  getPopulatedLeaseById,
  syncPropertyLeaseSnapshots,
  type LeaseStatus,
} from "@/lib/db/leases-db";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const db = await getDb();
    const lease = await getPopulatedLeaseById(db, session.user.id, resolvedParams.id);

    if (!lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    return NextResponse.json({ lease });
  } catch (error) {
    console.error("Error in GET /api/leases/[id]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let id = "";
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    id = resolvedParams.id;
    const body = await req.json();
    const db = await getDb();

    const existingLease = await db.collection("leases").findOne({
      id,
      userId: session.user.id,
    });

    if (!existingLease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const tenant = normalizeTenant(body.tenant) || {
      name: String(body.tenantName || ""),
      email: String(body.tenantEmail || ""),
      phone: String(body.tenantPhone || ""),
      nationalId: typeof body.tenantNationalId === "string" ? body.tenantNationalId : "",
      moveInDate: typeof body.moveInDate === "string" ? body.moveInDate : "",
    };

    if (!tenant.name || !tenant.email || !tenant.phone) {
      return NextResponse.json(
        { error: "Tenant name, email, and phone are required" },
        { status: 400 },
      );
    }

    const propertyId = String(body.propertyId || existingLease.propertyId);
    const originalPropertyId = String(existingLease.propertyId || propertyId);
    const monthlyRent = parseMonthlyRent(body.monthlyRent ?? existingLease.monthlyRent);
    const leaseStart = String(body.leaseStart || existingLease.leaseStart || "");
    const leaseEnd = String(body.leaseEnd || existingLease.leaseEnd || "");
    const notes = typeof body.notes === "string" ? body.notes : String(existingLease.notes || "");
    const status = calculateLeaseStatus(
      leaseStart,
      leaseEnd,
      body.status as LeaseStatus | undefined,
    );

    await db.collection("tenants").updateOne(
      { id: String(existingLease.tenantId), userId: session.user.id },
      {
        $set: {
          ...tenant,
          propertyId,
          leaseId: id,
          updatedAt: new Date().toISOString(),
        },
      },
    );

    await db.collection("leases").updateOne(
      { id, userId: session.user.id },
      {
        $set: {
          propertyId,
          tenantId: String(existingLease.tenantId),
          leaseStart,
          leaseEnd,
          monthlyRent,
          status,
          notes,
          updatedAt: new Date().toISOString(),
        },
      },
    );

    await syncPropertyLeaseSnapshots(db, session.user.id, [originalPropertyId, propertyId]);

    const updatedLease = await getPopulatedLeaseById(db, session.user.id, id);

    if (!updatedLease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    return NextResponse.json({ lease: updatedLease });
  } catch (error) {
    console.error(`Error in PUT /api/leases/${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let id = "";
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    id = resolvedParams.id;
    const db = await getDb();

    const lease = await db.collection("leases").findOne({
      id,
      userId: session.user.id,
    });

    if (!lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    await Promise.all([
      db.collection("leases").deleteOne({ id, userId: session.user.id }),
      db.collection("tenants").deleteOne({
        id: String(lease.tenantId),
        userId: session.user.id,
      }),
    ]);

    await syncPropertyLeaseSnapshots(db, session.user.id, [String(lease.propertyId)]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in DELETE /api/leases/${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}