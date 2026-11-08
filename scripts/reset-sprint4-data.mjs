// This script clears entire business collections. Never run it on production.
if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
  throw new Error("Refusing to reset a production database.");
}
if (process.env.ALLOW_DESTRUCTIVE_DB_RESET !== "YES_DELETE_ALL_BUSINESS_DATA") {
  throw new Error("Destructive reset blocked. Set ALLOW_DESTRUCTIVE_DB_RESET=YES_DELETE_ALL_BUSINESS_DATA only for an isolated disposable development database.");
}
import { MongoClient, ObjectId } from "mongodb";
import crypto from "node:crypto";

const MANAGER_EMAIL = "aditya.tambe.professional31@gmail.com";
const TENANT_EMAIL = "tambeaditya22@gmail.com";
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is missing. Put it in .env before running this script.");

const client = new MongoClient(uri);
await client.connect();
const db = client.db("propfusion");
const users = db.collection("user");

const manager = await users.findOne({ email: MANAGER_EMAIL });
const tenantUser = await users.findOne({ email: TENANT_EMAIL });
if (!manager || !tenantUser) {
  console.error("\nBoth Better Auth accounts must exist before seeding.\n");
  console.error(`Manager missing: ${!manager} (${MANAGER_EMAIL})`);
  console.error(`Tenant missing: ${!tenantUser} (${TENANT_EMAIL})`);
  console.error("Sign up both accounts once, verify their emails, then run npm run db:reset-sprint4 again.\n");
  await client.close();
  process.exit(1);
}

const idOf = (u) => typeof u.id === "string" && u.id ? u.id : String(u._id);
const filterFor = (u) => u.id ? { id: u.id } : { _id: u._id };
const managerId = idOf(manager);
const tenantAuthUserId = idOf(tenantUser);

const collectionsToClear = [
  "properties", "lands", "leases", "tenants", "tenantInvites",
  "transactions", "payments", "auditLogs"
];
for (const name of collectionsToClear) await db.collection(name).deleteMany({});
// Clear sessions only for these two demo users so both log in fresh.
await db.collection("session").deleteMany({ userId: { $in: [managerId, tenantAuthUserId] } });

const now = new Date();
const nowIso = now.toISOString();
const propertyId = crypto.randomUUID();
const tenantId = crypto.randomUUID();
const leaseId = crypto.randomUUID();

await users.updateOne(filterFor(manager), {
  $set: { role: "manager", emailVerified: true, updatedAt: now },
  $unset: { leaseId: "", tenantId: "" },
});
await users.updateOne(filterFor(tenantUser), {
  $set: { role: "tenant", leaseId, tenantId, emailVerified: true, updatedAt: now },
});

await db.collection("properties").insertOne({
  id: propertyId,
  userId: managerId,
  name: "4 Forestlaneway Residences",
  location: "Toronto, Ontario",
  address: "4 Forestlaneway, Toronto, ON",
  city: "Toronto",
  state: "ON",
  type: "Condo",
  unit: "Unit 1205",
  status: "Occupied",
  area: "950 sq ft",
  purchasePrice: "$500,000",
  currentValue: "$540,000",
  price: "$2,300/month",
  tenantCount: 1,
  coordinates: { lat: 43.7615, lng: -79.4111 },
  expenses: { maintenance: "$250/month", taxes: "$350/month", insurance: "$100/month", utilities: "$75/month", loanEMI: "$1,900/month", managementFees: "$150/month", other: "$50/month" },
  createdAt: nowIso,
  updatedAt: nowIso,
});

await db.collection("tenants").insertOne({
  id: tenantId,
  userId: managerId,
  leaseId,
  propertyId,
  name: "Aditya Tenant",
  email: TENANT_EMAIL,
  phone: "416-555-0122",
  nationalId: "CA-DEMO-2026",
  moveInDate: "2026-07-25",
  createdAt: nowIso,
  updatedAt: nowIso,
});

await db.collection("leases").insertOne({
  id: leaseId,
  userId: managerId,
  propertyId,
  tenantId,
  tenantAuthUserId,
  leaseStart: "2026-07-25",
  leaseEnd: "2027-07-24",
  monthlyRent: 2300,
  status: "active",
  notes: "Sprint 4 seeded tenant lease",
  createdAt: nowIso,
  updatedAt: nowIso,
});

await db.collection("tenantInvites").insertOne({
  id: crypto.randomUUID(),
  email: TENANT_EMAIL,
  name: "Aditya Tenant",
  leaseId,
  tenantId,
  managerId,
  tokenHash: "seeded-account-no-invite-required",
  expiresAt: new Date(now.getTime() + 7 * 86400000),
  acceptedAt: now,
  acceptedUserId: tenantAuthUserId,
  createdAt: now,
});

await db.collection("transactions").insertMany([
  { id: crypto.randomUUID(), assetId: propertyId, userId: managerId, type: "revenue", category: "Rent", amount: 2300, date: "2026-07-01", notes: "July rent", source: "manual", createdAt: nowIso },
  { id: crypto.randomUUID(), assetId: propertyId, userId: managerId, type: "expense", category: "Maintenance", amount: 300, date: "2026-07-10", notes: "Plumbing repair", source: "manual", createdAt: nowIso },
]);

await db.collection("payments").insertOne({
  id: crypto.randomUUID(), leaseId, tenantId, assetId: propertyId, managerId,
  amount: 2300, date: "2026-06-01", period: "2026-06", status: "paid", createdAt: nowIso,
});

console.log("\n✅ Sprint 4 database reset complete");
console.log(`Manager: ${MANAGER_EMAIL} (${managerId})`);
console.log(`Tenant:  ${TENANT_EMAIL} (${tenantAuthUserId})`);
console.log(`Property: ${propertyId}`);
console.log(`Lease:    ${leaseId}`);
console.log("\nAll old Sprint 4 business data was deleted. Better Auth users were preserved.\n");
await client.close();
