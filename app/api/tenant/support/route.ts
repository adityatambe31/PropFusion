import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getAccessContext } from "@/lib/auth/access";
import { getDb } from "@/lib/db/mongodb";
import { sendEmail, getSupportAcknowledgementEmailTemplate, getManagerSupportRequestEmailTemplate } from "@/lib/email";
import { ObjectId } from "mongodb";

function ticketNumber() {
  return `SUP-${new Date().toISOString().replace(/\D/g, "").slice(0, 12)}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getAccessContext(session.user.id);
  if (access.role !== "tenant" || !access.leaseId) return NextResponse.json({ error: "Tenant access required" }, { status: 403 });

  const body = await request.json();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  const category = String(body.category || "other");
  if (subject.length < 4 || message.length < 10) return NextResponse.json({ error: "Please provide a clear subject and message." }, { status: 400 });

  const db = await getDb();
  const lease = await db.collection("leases").findOne({ id: access.leaseId });
  if (!lease) return NextResponse.json({ error: "Lease not found" }, { status: 404 });

  let managerObjectId: ObjectId | null = null;
  try {
    managerObjectId = new ObjectId(String(lease.userId));
  } catch {
    managerObjectId = null;
  }

  const managerFilter = managerObjectId
    ? { $or: [{ id: String(lease.userId) }, { _id: managerObjectId }] }
    : { id: String(lease.userId) };

  const [tenant, property, manager] = await Promise.all([
    db.collection("tenants").findOne({ id: String(lease.tenantId) }),
    db.collection("properties").findOne({ id: String(lease.propertyId) }),
    db.collection("user").findOne(managerFilter),
  ]);

  const ticket = ticketNumber();
  const createdAt = new Date().toISOString();
  const supportRequest = {
    id: crypto.randomUUID(), ticketNumber: ticket, leaseId: String(lease.id), tenantId: String(lease.tenantId),
    managerId: String(lease.userId), tenantName: String(tenant?.name || session.user.name || "Tenant"),
    tenantEmail: String(tenant?.email || session.user.email || ""), category, subject, message,
    propertyName: String(property?.name || "Property"), status: "open", createdAt, updatedAt: createdAt,
  };
  await db.collection("supportRequests").insertOne(supportRequest);

  const managerEmail = String(manager?.email || process.env.MANAGEMENT_SUPPORT_EMAIL || "aditya.tambe.professional31@gmail.com");
  const managerPhone = String(property?.managementPhone || process.env.MANAGEMENT_SUPPORT_PHONE || "");
  const frontDesk = String(property?.frontDeskLocation || property?.address || property?.location || "Property front desk");

  await Promise.all([
    sendEmail({
      to: supportRequest.tenantEmail,
      subject: `We received your PropFusion request — ${ticket}`,
      html: getSupportAcknowledgementEmailTemplate({ tenantName: supportRequest.tenantName, ticketNumber: ticket, subject, managerEmail, managerPhone, frontDesk }),
    }),
    sendEmail({
      to: managerEmail,
      subject: `New tenant support request — ${ticket}`,
      html: getManagerSupportRequestEmailTemplate({ ...supportRequest }),
    }),
  ]);

  return NextResponse.json({ request: supportRequest, contacts: { managerEmail, managerPhone, frontDesk } }, { status: 201 });
}
