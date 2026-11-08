import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 1,
};

let clientPromise: Promise<MongoClient> | undefined;

if (uri) {
  let client: MongoClient;

  if (process.env.NODE_ENV === "development") {
    // Use global variable to preserve the client connection across HMR reloads
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export async function getDb() {
  if (!clientPromise) {
    throw new Error("MONGODB_URI is not defined in .env");
  }

  const conn = await clientPromise;
  return conn.db("propfusion");
}

export { clientPromise };
