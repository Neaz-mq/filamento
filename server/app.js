import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import { isAllowedOrigin } from "./config/origins.js";
import productRoutes from "./routes/productRoutes.js";
import videoViewRoutes from "./routes/videoViewRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

/* Vercel এর পেছনে চলে — আসল ব্যবহারকারীর IP আর https বোঝার জন্য */
app.set("trust proxy", 1);

// কোন framework চলছে সেটা বাইরে জানানোর দরকার নেই
app.disable("x-powered-by");

/* ---------- CORS ----------
   কোন সাইট গ্রহণ করা হবে সেটা config/origins.js এ (CLIENT_URL).
   admin এর request গুলো frontend এর নিজের ঠিকানা দিয়ে আসে
   (Vercel rewrite), তাই সেগুলোর CORS লাগে না — এটা বাকিগুলোর জন্য */
app.use(
  cors({
    origin(origin, callback) {
      // origin undefined মানে Postman, curl, বা server-to-server call
      if (!origin || isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  }),
);

// body সর্বোচ্চ 1MB — বড় কিছু পাঠিয়ে server ব্যস্ত রাখা ঠেকাতে
app.use(express.json({ limit: "1mb" }));

// admin login এর cookie পড়ার জন্য
app.use(cookieParser());

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

// Admin login — POST /login, POST /logout, GET /me
app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

// Technologies section এর video কতবার চালানো হয়েছে
app.use("/api/video-views", videoViewRoutes);

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