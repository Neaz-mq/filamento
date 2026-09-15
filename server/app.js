import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";

const app = express();

/* ---------- CORS ----------
   production এ সবাইকে allow করা যাবে না। CLIENT_URL এ কমা দিয়ে
   একাধিক origin দেওয়া যায় — Vercel এ preview deployment গুলোর
   URL আলাদা হয়, তাই সেগুলোও লাগতে পারে */
const allowedOrigins = (process.env.CLIENT_URL ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // origin undefined মানে Postman, curl, বা server-to-server call
      if (!origin) return callback(null, true);

      // CLIENT_URL সেট না থাকলে (local dev) সবাইকে ঢুকতে দিচ্ছি
      if (allowedOrigins.length === 0) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  }),
);

app.use(express.json());

/* ---------- DB ----------
   serverless এ প্রতিটা request আলাদা invocation, কিন্তু container
   পুনর্ব্যবহার হয়। তাই connection টা cache করে রাখা হয়েছে (db.js
   দেখুন) আর এখানে শুধু "তৈরি আছে তো?" জিজ্ঞেস করা হচ্ছে।

   প্রথম request এ connect হবে, পরেরগুলো সাথে সাথে পাবে */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Filamento API is running..." });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/api/products", productRoutes);

// 404 — না থাকলে Express এর default HTML page আসত, JSON না
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

/* global error handler. চারটা argument থাকতেই হবে, নাহলে Express
   একে error handler হিসেবে চিনবে না */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("💥", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

export default app;
