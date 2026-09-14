import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

if (!uri) {
  throw new Error("MONGO_URI is not defined in .env");
}

const client = new MongoClient(uri);

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
