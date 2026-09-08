import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/glug';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`[Database] Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.warn(`[Database] Could not connect to primary MongoDB at ${uri}: ${err.message}`);

    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Starting in-memory MongoDB fallback for development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        await mongoose.connect(memUri);
        console.log(`[Database] In-memory MongoDB running successfully at ${memUri}`);
        return;
      } catch (memErr) {
        console.warn(`[Database] In-memory MongoDB could not be started: ${memErr.message}`);
      }
    }

    console.error('[Database] Fatal MongoDB connection error. Please verify MONGODB_URI in server/.env and check Network Access IP whitelist in Atlas.');
    throw err;
  }
}

