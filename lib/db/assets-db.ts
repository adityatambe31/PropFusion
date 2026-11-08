import type { Db, Document } from "mongodb";

/**
 * Shared persistence helpers for the agriculture and real-estate asset APIs.
 * Keep API routes responsible for authentication and HTTP responses.
 */
export async function listOrSeedAssets(
  db: Db,
  collectionName: "lands" | "properties",
  userId: string,
  defaults: readonly Record<string, unknown>[],
): Promise<Document[]> {
  const collection = db.collection(collectionName);
  let assets: Document[] = await collection.find({ userId }).toArray();

  // Preserve existing first-visit demo-data behavior.
  if (assets.length === 0) {
    const seeded = defaults.map((asset) => ({
      ...asset,
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    if (seeded.length > 0) {
      await collection.insertMany(seeded);
    }
    assets = seeded;
  }

  return assets.map((asset) => {
    const { _id, ...rest } = asset;
    return { ...rest, id: asset.id || _id?.toString() };
  });
}

export async function insertAsset(
  db: Db,
  collectionName: "lands" | "properties",
  userId: string,
  body: Record<string, unknown>,
): Promise<Document> {
  const asset = {
    ...body,
    id: body.id || crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection(collectionName).insertOne(asset);
  const { _id, ...responseAsset } = asset as Document;
  return responseAsset;
}
