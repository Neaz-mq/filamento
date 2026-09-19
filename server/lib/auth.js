import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { isAllowedOrigin } from "../config/origins.js";

/* ===============================================================
   Admin login এর মূল অংশ

   কীভাবে কাজ করে:
     ১. login সফল হলে একটা এলোমেলো token তৈরি হয় (32 byte)
     ২. token টা cookie তে যায় — httpOnly, তাই JavaScript পড়তে পারে না
     ৩. database এ token টা নয়, তার hash (SHA-256) রাখা হয় —
        database কোনোদিন ফাঁস হলেও কেউ সেখান থেকে login করতে পারবে না
     ৪. প্রতিটা admin request এ cookie → hash → database এ খোঁজা

   কোনো গোপন key (SESSION_SECRET) লাগে না — token নিজেই এলোমেলো, আর
   session database এ থাকায় logout করলে সাথে সাথে বাতিল হয়
   =============================================================== */

const SESSIONS = "admin_sessions";
export const ADMINS = "admins";

// session এর মেয়াদ — এর পরে আবার login করতে হবে
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 ঘণ্টা

const isProduction = process.env.NODE_ENV === "production";

/* cookie এর নাম. production এ "__Host-" দিয়ে শুরু — ব্রাউজার তখন
   বাধ্য করে: শুধু https, শুধু এই domain, পুরো সাইটের জন্য (Path=/).
   local এ http, তাই সাধারণ নাম */
export const COOKIE_NAME = isProduction ? "__Host-fil_admin" : "fil_admin";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  /* Lax — অন্য সাইট থেকে আসা POST এ cookie যায় না (CSRF এর প্রথম
     বাধা), কিন্তু সাধারণ link এ ক্লিক করে এলে login থাকে */
  sameSite: "lax",
  path: "/",
};

/* ---------------------------------------------------------------
   database index — প্রতি server instance এ একবার
   (একই index বারবার তৈরির চেষ্টা করলে MongoDB কিছু করে না)
   --------------------------------------------------------------- */
let indexesReady;

export const ensureAuthIndexes = () => {
  if (!indexesReady) {
    const db = getDB();
    indexesReady = Promise.all([
      db.collection(ADMINS).createIndex({ email: 1 }, { unique: true }),
      // মেয়াদ শেষ হলে MongoDB নিজেই session মুছে দেয়
      db
        .collection(SESSIONS)
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection(SESSIONS).createIndex({ adminId: 1 }),
    ]).catch((error) => {
      indexesReady = undefined; // পরের request আবার চেষ্টা করবে
      throw error;
    });
  }
  return indexesReady;
};

/* ---------------------------------------------------------------
   সাহায্যকারী
   --------------------------------------------------------------- */
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

/* Vercel আসল IP এই header এ পাঠায়; প্রথমটাই দর্শকের */
export const clientIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip || "unknown";

/* browser এ পাঠানোর মতো admin তথ্য — password hash কখনো বাইরে যায় না */
export const publicAdmin = (admin) => ({
  id: admin._id.toString(),
  email: admin.email,
  name: admin.name,
  role: admin.role,
});

/* ---------------------------------------------------------------
   session তৈরি / বাতিল
   --------------------------------------------------------------- */
export async function createSession(res, admin, req) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();

  await getDB()
    .collection(SESSIONS)
    .insertOne({
      _id: hashToken(token),
      adminId: admin._id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
      userAgent: String(req.headers["user-agent"] ?? "").slice(0, 300),
    });

  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_TTL_MS });
}

export async function destroySession(req, res) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    await getDB().collection(SESSIONS).deleteOne({ _id: hashToken(token) });
  }
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

// কোনো admin কে বন্ধ করলে বা password বদলালে — তার সব session বাতিল
export const destroyAllSessions = (adminId) =>
  getDB().collection(SESSIONS).deleteMany({ adminId: new ObjectId(adminId) });

/* ---------------------------------------------------------------
   পাহারাদার (middleware)

   requireAdmin — login না থাকলে 401. সফল হলে req.admin এ admin
   requireRole  — নির্দিষ্ট ভূমিকা ছাড়া 403
   --------------------------------------------------------------- */
export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: "Not signed in" });
    }

    const db = getDB();
    const session = await db.collection(SESSIONS).findOne({
      _id: hashToken(token),
      expiresAt: { $gt: new Date() },
    });

    /* TTL index মিনিটখানেক দেরিতে মোছে — তাই মেয়াদও নিজে দেখা হচ্ছে */
    if (!session) {
      res.clearCookie(COOKIE_NAME, cookieOptions);
      return res.status(401).json({ message: "Session expired" });
    }

    const admin = await db
      .collection(ADMINS)
      .findOne({ _id: session.adminId, status: "active" });

    // admin বন্ধ বা মুছে ফেলা হয়েছে — session থাকলেও ঢুকতে দেওয়া হয় না
    if (!admin) {
      await db.collection(SESSIONS).deleteOne({ _id: session._id });
      res.clearCookie(COOKIE_NAME, cookieOptions);
      return res.status(401).json({ message: "Not signed in" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
}

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    next();
  };

/* ---------------------------------------------------------------
   লেখার request এ অন্য সাইট ঠেকানো (CSRF এর দ্বিতীয় বাধা)

   ব্রাউজার POST / PATCH / DELETE এ নিজে থেকে Origin header পাঠায়,
   আর সেটা JavaScript বদলাতে পারে না. আমাদের তালিকার বাইরের সাইট
   হলে বাতিল. পড়ার request (GET) এ কিছু বদলায় না, তাই ছাড় */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireSameOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.headers.origin;
  // Origin নেই মানে browser নয় (curl, server) — cookie ও থাকে না সাধারণত
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ message: "Origin not allowed" });
  }
  next();
}