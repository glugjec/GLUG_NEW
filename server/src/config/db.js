import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/glug';

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 15000,
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log(`[Database] Connected to MongoDB: ${m.connection.host}/${m.connection.name}`);
      return m;
    }).catch(async (err) => {
      cached.promise = null;
      console.warn(`[Database] Could not connect to primary MongoDB at ${uri}: ${err.message}`);

      if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
        try {
          console.log('[Database] Starting in-memory MongoDB fallback for development...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          const mongod = await MongoMemoryServer.create();
          const memUri = mongod.getUri();
          const memMongoose = await mongoose.connect(memUri);
          console.log(`[Database] In-memory MongoDB running successfully at ${memUri}`);
          return memMongoose;
        } catch (memErr) {
          console.warn(`[Database] In-memory MongoDB could not be started: ${memErr.message}`);
        }
      }

      console.error('[Database] Fatal MongoDB connection error. Please verify MONGODB_URI in environment variables.');
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

