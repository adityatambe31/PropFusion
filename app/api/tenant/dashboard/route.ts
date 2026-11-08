import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getAccessContext } from "@/lib/auth/access";
import { getDb } from "@/lib/db/mongodb";
import { listLeasePayments } from "@/lib/db/payment";
import { authUserFilterById } from "@/lib/auth/user-record";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const access = await getAccessContext(session.user.id);
    let lease =
      access.role === "tenant" && access.leaseId
        ? await db.collection("leases").findOne({ id: access.leaseId })
        : null;

    if (!lease) {
      lease = await db.collection("leases").findOne({
        tenantAuthUserId: session.user.id,
      });
    }

    if (!lease && session.user.email) {
      const tenant = await db.collection("tenants").findOne({
        email: session.user.email.toLowerCase(),
      });
      if (tenant?.leaseId) {
        lease = await db.collection("leases").findOne({ id: String(tenant.leaseId) });
      }
    }

    if (!lease) {
      return NextResponse.json(
        {
          error: "Tenant access required",
          details: `The signed-in account (${session.user.email}) is not linked to an accepted tenant invitation.`,
        },
        { status: 403 },
      );
    }

    // Self-heal partial link states from older invite flows.
    if (access.role !== "tenant") {
      await db.collection("user").updateOne(
        authUserFilterById(session.user.id),
        {
          $set: {
            role: "tenant",
            leaseId: String(lease.id),
            tenantId: lease.tenantId ? String(lease.tenantId) : undefined,
            updatedAt: new Date(),
          },
        },
      );
    }

    const [tenant, property, payments] = await Promise.all([
      db.collection("tenants").findOne({ id: String(lease.tenantId) }),
      db.collection("properties").findOne({ id: String(lease.propertyId) }),
      listLeasePayments(db, String(lease.id)),
    ]);

    return NextResponse.json({
      tenant: {
        name: String(tenant?.name ?? session.user.name ?? "Tenant"),
        email: String(tenant?.email ?? session.user.email ?? ""),
        phone: String(tenant?.phone ?? ""),
      },
      lease: {
        id: String(lease.id),
        start: String(lease.leaseStart ?? ""),
        end: String(lease.leaseEnd ?? ""),
        status: String(lease.status ?? "pending"),
        monthlyRent: Number(lease.monthlyRent ?? 0),
      },
      property: {
        name: String(property?.name ?? property?.propertyName ?? "Property"),
        address: String(property?.address ?? property?.location ?? ""),
      },
      payments,
    });
  } catch (error) {
    console.error("Tenant dashboard error:", error);
    return NextResponse.json(
      {
        error: "Unable to load tenant dashboard",
        details: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}
