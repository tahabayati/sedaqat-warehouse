import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://root:D6PEbZis8mclO9V4LZxjkyah@alvand.liara.cloud:31197/my-app?authSource=admin';

if (!global.mongoose) global.mongoose = { conn: null, promise: null };

export default async function dbConnect() {
  if (global.mongoose.conn) return global.mongoose.conn;
  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose
      .connect(MONGODB_URI, { dbName: 'warehouse' })
      .then((m) => m);
  }
  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}
