import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getAccessContext } from "@/lib/auth/access";
import { getDb } from "@/lib/db/mongodb";
import { createRentPayment, listLeasePayments } from "@/lib/db/payment";
import { auditMutation } from "@/lib/middleware/audit-logger";
import { getRentReceiptEmailTemplate, sendEmail } from "@/lib/email";
import { resolveAppURL } from "@/lib/url";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getAccessContext(session.user.id);
  const leaseId = new URL(req.url).searchParams.get("leaseId") ?? access.leaseId;
  if (!leaseId) return NextResponse.json({ error: "leaseId is required" }, { status: 400 });

  const db = await getDb();
  const lease = await db.collection("leases").findOne({
    id: leaseId,
    ...(access.role === "tenant"
      ? { tenantAuthUserId: session.user.id }
      : { userId: session.user.id }),
  });
  if (!lease) return NextResponse.json({ error: "Lease not found" }, { status: 404 });

  return NextResponse.json({ payments: await listLeasePayments(db, leaseId) });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getAccessContext(session.user.id);
  if (access.role !== "tenant") {
    return NextResponse.json({ error: "Tenant access required" }, { status: 403 });
  }

  const body = await req.json();
  const db = await getDb();
  const lease = await db.collection("leases").findOne({
    id: String(body.leaseId ?? access.leaseId),
    tenantAuthUserId: session.user.id,
  });
  if (!lease) return NextResponse.json({ error: "Lease not found" }, { status: 404 });

  const expectedAmount = Number(lease.monthlyRent ?? 0);
  const requestedAmount = Number(body.amount ?? expectedAmount);
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0 || requestedAmount !== expectedAmount) {
    return NextResponse.json({ error: "Payment amount does not match the monthly rent." }, { status: 400 });
  }

  const paymentMethod = body.paymentMethod === "bank" ? "bank" : "card";
  const paymentLast4 = String(body.paymentLast4 ?? "").replace(/\D/g, "").slice(-4);
  const payerName = String(body.payerName ?? "").trim();
  if (payerName.length < 2 || paymentLast4.length !== 4) {
    return NextResponse.json({ error: "Please provide valid payment details." }, { status: 400 });
  }

  try {
    const payment = await createRentPayment(db, {
      leaseId: String(lease.id),
      tenantId: String(lease.tenantId),
      assetId: String(lease.propertyId),
      managerId: String(lease.userId),
      amount: expectedAmount,
      date: String(body.date ?? new Date().toISOString().slice(0, 10)),
      status: "paid",
      paymentMethod,
      paymentLast4,
      payerName,
    });

    const [tenant, property] = await Promise.all([
      db.collection("tenants").findOne({ id: String(lease.tenantId) }),
      db.collection("properties").findOne({ id: String(lease.propertyId) }),
    ]);

    const receiptUrl = `${resolveAppURL({ requestOrigin: new URL(req.url).origin })}/api/payments/${payment.id}/receipt`;
    const receiptEmail = await sendEmail({
      to: String(tenant?.email ?? session.user.email ?? ""),
      subject: `Rent payment receipt — ${payment.receiptNumber}`,
      html: getRentReceiptEmailTemplate({
        tenantName: String(tenant?.name ?? session.user.name ?? "Tenant"),
        propertyName: String(property?.name ?? property?.propertyName ?? "Property"),
        propertyAddress: String(property?.address ?? property?.location ?? ""),
        amount: payment.amount,
        paymentDate: new Date(payment.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        period: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
          new Date(`${payment.period}-01T00:00:00Z`),
        ),
        receiptNumber: payment.receiptNumber,
        paymentMethod: paymentMethod === "bank" ? "Bank account" : "Card",
        paymentLast4,
        receiptUrl,
      }),
    });

    await auditMutation(db, {
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: "tenant",
      action: "CREATE",
      entity: "payment",
      entityId: payment.id,
      metadata: {
        leaseId: payment.leaseId,
        amount: payment.amount,
        receiptNumber: payment.receiptNumber,
        receiptEmailSent: Boolean(process.env.RESEND_API_KEY) && receiptEmail.success,
      },
    });

    return NextResponse.json(
      { payment, receiptEmailSent: Boolean(process.env.RESEND_API_KEY) && receiptEmail.success },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "RENT_ALREADY_PAID") {
      return NextResponse.json({ error: "Rent is already paid for this period" }, { status: 409 });
    }
    console.error("Payment creation failed:", error);
    return NextResponse.json({ error: "Payment could not be processed." }, { status: 500 });
  }
}
