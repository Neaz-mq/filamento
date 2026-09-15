import { MongoClient } from "mongodb";
import "dotenv/config";

/* ⚠️ dotenv import টা মুছবেন না।
   ES module এ import গুলো importing module এর body এর আগেই চলে,
   তাই app.js এর dotenv এই ফাইলের জন্য যথেষ্ট নয় */

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

if (!uri) {
  throw new Error("MONGO_URI is not defined");
}

/* DB_NAME এর guard ছাড়া client.db(undefined) চুপচাপ URI এর default
   database ধরত — কোনো error ছাড়াই ভুল জায়গায় কাজ করত */
if (!dbName) {
  throw new Error("DB_NAME is not defined");
}

const client = new MongoClient(uri, {
  // default 30s — Atlas এ IP whitelist ভুল থাকলে function timeout
  // হয়ে যেত, কোনো কাজের error message ছাড়াই
  serverSelectionTimeoutMS: 8000,

  /* serverless এ অনেক function instance একসাথে চলতে পারে, প্রতিটা
     নিজের pool খোলে। Atlas এর free tier এ মোট connection সীমিত,
     তাই instance প্রতি pool ছোট রাখা হচ্ছে */
  maxPoolSize: 10,
});

let db;
let connectionPromise;

/* connection টা module scope এ cache করা।

   Vercel একই container পুনর্ব্যবহার করে, তাই দ্বিতীয় request এ
   আর নতুন করে connect করতে হয় না — শুধু cache করা promise
   ফেরত যায়। এটাই serverless + MongoDB এর প্রধান নিয়ম; না করলে
   প্রতি request এ নতুন connection খুলে Atlas এর সীমা ফুরিয়ে যায় */
export const connectDB = () => {
  if (!connectionPromise) {
    connectionPromise = client
      .connect()
      .then((connected) => {
        db = connected.db(dbName);
        console.log(`✅ MongoDB connected: ${dbName}`);
        return db;
      })
      .catch((error) => {
        /* process.exit(1) নয় — serverless এ পুরো function মেরে ফেলা
           যায় না। promise টা মুছে দিচ্ছি যাতে পরের request আবার
           চেষ্টা করতে পারে (যেমন Atlas সাময়িকভাবে down থাকলে) */
        connectionPromise = undefined;
        console.error("❌ MongoDB connection failed:", error.message);
        throw error;
      });
  }

  return connectionPromise;
};

export const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
};

export const closeDB = async () => {
  await client.close();
  db = undefined;
  connectionPromise = undefined;
  console.log("🔌 MongoDB connection closed");
};
