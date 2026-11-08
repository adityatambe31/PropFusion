/** Read-only structural health report: counts, indexes and referential consistency.
 * Run against a safe, authorized database; outputs aggregate counts only.
 */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
const names = ["user", "session", "account", "verification", "properties", "lands", "leases", "tenants", "tenantInvites", "payments", "transactions", "auditLogs", "supportRequests"];
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || "propfusion");
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name));
  console.log("READ-ONLY DATABASE AUDIT — no data modified");
  for (const name of names) {
    if (!existing.has(name)) { console.log(`${name}: collection absent`); continue; }
    const collection = db.collection(name);
    const count = await collection.countDocuments({});
    const indexes = (await collection.indexes()).map(index => ({ name: index.name, key: index.key, unique: Boolean(index.unique) }));
    console.log(JSON.stringify({ collection: name, count, indexes }));
  }
  if (existing.has("leases")) {
    const leases = db.collection("leases");
    for (const [field, target] of [["propertyId", "properties"], ["tenantId", "tenants"]]) {
      if (!existing.has(target)) continue;
      const result = await leases.aggregate([
        { $lookup: { from: target, localField: field, foreignField: "id", as: "matching" } },
        { $match: { matching: { $size: 0 } } },
        { $count: "count" },
      ]).toArray();
      console.log(`leases missing ${target}: ${result[0]?.count || 0}`);
    }
  }
  if (existing.has("payments")) {
    const duplicatePeriods = await db.collection("payments").aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: { leaseId: "$leaseId", period: "$period" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: "count" },
    ]).toArray();
    console.log(`duplicate paid lease-period groups: ${duplicatePeriods[0]?.count || 0}`);
  }
} finally { await client.close(); }
