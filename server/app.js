import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import { isAllowedOrigin } from "./config/origins.js";
import productRoutes from "./routes/productRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import videoViewRoutes from "./routes/videoViewRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import quoteRequestRoutes from "./routes/quoteRequestRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import overviewRoutes from "./routes/overviewRoutes.js";

const app = express();

const isProduction = process.env.NODE_ENV === "production";

/* Vercel এর পেছনে চলে — আসল ব্যবহারকারীর IP আর https বোঝার জন্য */
app.set("trust proxy", 1);

// কোন framework চলছে সেটা বাইরে জানানোর দরকার নেই
app.disable("x-powered-by");

/* ---------- CORS ----------
   কোন সাইট গ্রহণ করা হবে সেটা config/origins.js এ (CLIENT_URL).
   admin এর request গুলো frontend এর নিজের ঠিকানা দিয়ে আসে
   (Vercel rewrite), তাই সেগুলোর CORS লাগে না — এটা বাকিগুলোর জন্য.

   অচেনা সাইট হলে 403 — আগে এটা 500 যেত, মনে হতো server ভেঙেছে */
app.use(
  cors({
    origin(origin, callback) {
      // origin undefined মানে Postman, curl, বা server-to-server call
      if (!origin || isAllowedOrigin(origin)) return callback(null, true);

      const error = new Error("Origin not allowed");
      error.status = 403;
      callback(error);
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

// Users & Roles — একাধিক admin
app.use("/api/admins", adminUserRoutes);

// Admin Dashboard এর সংখ্যা আর 🔔 — GET /overview, GET /notifications
app.use("/api/admin", overviewRoutes);

app.use("/api/products", productRoutes);

// Projects — admin এর Projects পাতা আর সাইটের Projects
app.use("/api/projects", projectRoutes);

// ছবি / video / document তোলার অনুমতিপত্র (Cloudinary)
app.use("/api/uploads", uploadRoutes);

// Home এর Contact form — গ্রাহকের quote request
app.use("/api/quote-requests", quoteRequestRoutes);

// নতুন Home এর footer — newsletter
app.use("/api/newsletter", newsletterRoutes);

// Technologies section এর video কতবার চালানো হয়েছে
app.use("/api/video-views", videoViewRoutes);

// 404 — না থাকলে Express এর default HTML page আসত, JSON না
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

/* global error handler. চারটা argument থাকতেই হবে, নাহলে Express
   একে error handler হিসেবে চিনবে না.

   500 এর আসল বার্তা শুধু log এ যায়, browser এ নয় — MongoDB র error এ
   database এর ঠিকানা বা ভেতরের তথ্য থাকতে পারে. 400-499 (যেমন ভুল
   JSON, body খুব বড়) এর বার্তা নিরাপদ, সেগুলো যেমন আছে তেমনই যায় */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) console.error("💥", err);

  res.status(status).json({
    message:
      status >= 500 && isProduction
        ? "Internal server error"
        : err.message || "Internal server error",
  });
});

export default app;
