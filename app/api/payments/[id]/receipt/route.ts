import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getAccessContext } from "@/lib/auth/access";
import { getDb } from "@/lib/db/mongodb";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
      character
    ] ?? character,
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const db = await getDb();
  const payment = await db.collection("payments").findOne({ id });
  if (!payment) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

  const access = await getAccessContext(session.user.id);
  const lease = await db.collection("leases").findOne({ id: String(payment.leaseId) });
  const allowed =
    Boolean(lease) &&
    (access.role === "tenant"
      ? String(lease?.tenantAuthUserId) === session.user.id || access.leaseId === String(lease?.id)
      : String(lease?.userId) === session.user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [tenant, property] = await Promise.all([
    db.collection("tenants").findOne({ id: String(payment.tenantId) }),
    db.collection("properties").findOne({ id: String(payment.assetId) }),
  ]);

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(payment.amount));

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(payment.receiptNumber)}</title>
<style>
body{font-family:Arial,sans-serif;background:#f4f6f8;color:#111827;margin:0;padding:32px}.receipt{max-width:720px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden}.head{background:#111827;color:#fff;padding:28px 34px}.body{padding:34px}.row{display:flex;justify-content:space-between;gap:24px;padding:12px 0;border-bottom:1px solid #eef2f7}.muted{color:#64748b}.amount{font-size:34px;font-weight:700;margin:8px 0 24px}.actions{max-width:720px;margin:16px auto;text-align:right}button{background:#111827;color:#fff;border:0;border-radius:8px;padding:11px 18px;font-weight:700;cursor:pointer}@media print{body{background:#fff;padding:0}.actions{display:none}.receipt{border:0}}
</style></head><body>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="receipt"><div class="head"><h1 style="margin:0">PropFusion</h1><p style="margin:7px 0 0;color:#cbd5e1">Official rent payment receipt</p></div>
<div class="body"><div class="muted">Amount paid</div><div class="amount">${amount}</div>
<div class="row"><span class="muted">Receipt number</span><strong>${escapeHtml(payment.receiptNumber)}</strong></div>
<div class="row"><span class="muted">Tenant</span><strong>${escapeHtml(tenant?.name)}</strong></div>
<div class="row"><span class="muted">Tenant email</span><strong>${escapeHtml(tenant?.email)}</strong></div>
<div class="row"><span class="muted">Property</span><strong>${escapeHtml(property?.name ?? property?.propertyName)}</strong></div>
<div class="row"><span class="muted">Address</span><strong>${escapeHtml(property?.address ?? property?.location)}</strong></div>
<div class="row"><span class="muted">Rent period</span><strong>${escapeHtml(payment.period)}</strong></div>
<div class="row"><span class="muted">Payment date</span><strong>${escapeHtml(new Date(String(payment.date)).toLocaleDateString("en-US"))}</strong></div>
<div class="row"><span class="muted">Payment method</span><strong>${escapeHtml(payment.paymentMethod === "bank" ? "Bank account" : "Card")} ending in ${escapeHtml(payment.paymentLast4)}</strong></div>
<p class="muted" style="font-size:12px;line-height:1.5;margin-top:24px">This receipt confirms a simulated payment recorded within PropFusion. It does not represent a charge processed by a real bank or card network.</p>
</div></div></body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
