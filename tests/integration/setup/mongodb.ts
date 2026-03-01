import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

let mongoServer: MongoMemoryReplSet | null = null

export async function startTestDatabase() {
  if (!mongoServer) {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
      instanceOpts: [
        {
          args: ['--setParameter', 'maxTransactionLockRequestTimeoutMillis=1000'],
        },
      ],
    })
  }

  const uri = mongoServer.getUri()

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(uri)
  }

  return uri
}

export async function clearTestDatabase() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})))
  }
}

export async function stopTestDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }

  if (mongoServer) {
    await mongoServer.stop()
    mongoServer = null
  }
}
