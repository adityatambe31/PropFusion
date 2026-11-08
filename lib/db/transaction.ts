import type { Db, Filter } from "mongodb";

export type TransactionType = "revenue" | "expense";
export type TransactionRecord = {
  id: string;
  assetId: string;
  userId: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  notes: string;
  source?: "manual" | "rent-payment";
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
};

const collection = (db: Db) => db.collection<TransactionRecord>("transactions");

export async function createTransaction(db: Db, input: Omit<TransactionRecord,"id"|"createdAt"|"updatedAt">) {
  const now = new Date().toISOString();
  const transaction: TransactionRecord = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now };
  await collection(db).insertOne(transaction);
  return transaction;
}

export async function listTransactions(db: Db, userId: string, filters: { assetId?: string; portfolioType?: string; from?: string; to?: string }) {
  const query: Filter<TransactionRecord> = { userId };
  if (filters.assetId) query.assetId = filters.assetId;
  if (filters.from || filters.to) query.date = { ...(filters.from ? { $gte: filters.from } : {}), ...(filters.to ? { $lte: filters.to } : {}) };
  if (filters.portfolioType) {
    const assetCollection = filters.portfolioType === "agriculture" ? "lands" : "properties";
    const assets = await db.collection(assetCollection).find({ userId }).project({ id: 1 }).toArray();
    query.assetId = { $in: assets.map((asset) => String(asset.id)) };
  }
  return collection(db).find(query).sort({ date: -1, createdAt: -1 }).toArray();
}

export async function deleteTransaction(db: Db, userId: string, id: string) {
  return collection(db).findOneAndDelete({ id, userId });
}

export function calculateFinancialMetrics(transactions: TransactionRecord[], purchasePrice = 0) {
  const totalRevenue = transactions.filter((item) => item.type === "revenue").reduce((sum,item)=>sum+item.amount,0);
  const totalExpenses = transactions.filter((item) => item.type === "expense").reduce((sum,item)=>sum+item.amount,0);
  const noi = totalRevenue-totalExpenses;
  return { totalRevenue, totalExpenses, noi, roi: purchasePrice > 0 ? (noi/purchasePrice)*100 : 0 };
}
