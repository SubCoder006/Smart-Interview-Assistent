import mongoose from "mongoose";

// ─── Env guard ────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables");
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// ─── Global cache (prevents multiple connections in Next.js dev hot-reload) ───

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache;
}

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

const cache = global._mongooseCache;

// ─── Connection options ───────────────────────────────────────────────────────

const CONNECTION_OPTIONS: mongoose.ConnectOptions = {
  dbName:             "smart-interview",
  maxPoolSize:        10,        // max concurrent connections
  serverSelectionTimeoutMS: 5000, // fail fast if MongoDB unreachable
  socketTimeoutMS:    45000,     // close sockets after 45s of inactivity
};

// ─── Connect ──────────────────────────────────────────────────────────────────

export async function connectDB(): Promise<typeof mongoose> {
  // return existing connection
  if (cache.conn) return cache.conn;

  // reuse in-flight promise (handles parallel requests during startup)
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI!, CONNECTION_OPTIONS)
      .then((instance) => {
        console.log(`✅ MongoDB connected → smart-interview`);
        return instance;
      })
      .catch((err) => {
        cache.promise = null; // reset so next request retries
        console.error("❌ MongoDB connection failed:", err.message);
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

// ─── Connection event listeners (useful for debugging) ───────────────────────

mongoose.connection.on("disconnected", () =>
  console.warn("⚠️  MongoDB disconnected")
);

mongoose.connection.on("reconnected", () =>
  console.log("🔄 MongoDB reconnected")
);

// ─── Health check utility (use in /api/health route) ─────────────────────────

export function getConnectionState(): string {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] ?? "unknown";
}

export default connectDB;