import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri: string = process.env.MONGODB_URI
const dbName: string = process.env.MONGODB_DB || 'health-booker'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri)
  clientPromise = client.connect()
}

/**
 * Gets the MongoDB client instance (for transactions)
 * @returns {Promise<MongoClient>} MongoDB client instance
 */
export async function getClient(): Promise<MongoClient> {
  return clientPromise
}

/**
 * Gets the database instance
 * @returns {Promise<Db>} MongoDB database instance
 */
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db(dbName)
}

export default clientPromise

