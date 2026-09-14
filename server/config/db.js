import { MongoClient } from "mongodb";
import "dotenv/config";

/* ⚠️ এই import টা মুছবেন না।
   ES module এ import গুলো importing module এর body এর আগেই evaluate হয়,
   মানে index.js এর dotenv.config() চলার আগেই এই ফাইলটা পুরো চলে যায়।
   এখানে dotenv না থাকলে নিচের process.env গুলো undefined পেত। */

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

if (!uri) {
  throw new Error("MONGO_URI is not defined in .env");
}

/* DB_NAME এর guard আগে ছিল না। না থাকলে client.db(undefined) চুপচাপ
   URI এর default database ধরত — আর আপনার URI তে কোনো db path নেই,
   তাই কোনো error ছাড়াই ভুল database এ কাজ করতে থাকত। */
if (!dbName) {
  throw new Error("DB_NAME is not defined in .env");
}

const client = new MongoClient(uri, {
  // default 30s — Atlas এ IP whitelist ভুল থাকলে ৩০ সেকেন্ড ঝুলে থাকত
  serverSelectionTimeoutMS: 5000,
});

let db;

export const connectDB = async () => {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log(`✅ MongoDB connected: ${dbName}`);
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
};

// nodemon বারবার restart করলে connection জমে যায় — তাই shutdown এ close
export const closeDB = async () => {
  await client.close();
  db = undefined;
  console.log("🔌 MongoDB connection closed");
};
