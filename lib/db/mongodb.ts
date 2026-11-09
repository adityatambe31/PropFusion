import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
// Preserve existing production behavior when this variable is not supplied.
// Set MONGODB_DB_NAME=propfusion_dev in your development .env.local.
const dbName = process.env.MONGODB_DB_NAME || "propfusion";

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 1,
};

// Both Better Auth and application routes share this same client.
// Cache the promise during hot reloads in development.
let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

if (uri) {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClient || !global._mongoClientPromise) {
      global._mongoClient = new MongoClient(uri, options);
      global._mongoClientPromise = global._mongoClient.connect();
    }
    client = global._mongoClient;
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

// Better Auth needs a Db reference synchronously at initialization time.
// A Db reference can be created before the initial connection completes.
export function getAuthDb() {
  if (!client || !clientPromise) {
    throw new Error("MONGODB_URI is not configured");
  }
  return client.db(dbName);
}

export async function getDb() {
  if (!clientPromise) {
    throw new Error("MONGODB_URI is not configured");
  }
  const connection = await clientPromise;
  return connection.db(dbName);
}

export { clientPromise };

declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
