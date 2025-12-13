import mongoose from 'mongoose'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI

let client: any
let clientPromise: Promise<any>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongoose = global as typeof globalThis & {
    mongoose: any
  }
  if (!globalWithMongoose.mongoose) {
    globalWithMongoose.mongoose = { conn: null, promise: null }
  }
  client = globalWithMongoose.mongoose
} else {
  // In production mode, it's best to not use a global variable.
  client = { conn: null, promise: null }
}

async function dbConnect() {
  if (client.conn) {
    return client.conn
  }
  if (!client.promise) {
    const opts = {
      bufferCommands: false,
    }
    client.promise = mongoose.connect(uri, opts).then((mongoose) => {
      return mongoose
    })
  }
  client.conn = await client.promise
  return client.conn
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default dbConnect

// The code below is for the MongoDB adapter, which needs the client promise

import { MongoClient } from 'mongodb'

const options = {}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise: Promise<MongoClient>
  }
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export { clientPromise }
