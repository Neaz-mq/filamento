import { Router } from "express";
import { getDB } from "../config/db.js";
import {
  clientIp,
  requireAdmin,
  requireRole,
  requireSameOrigin,
} from "../lib/auth.js";

/* ===============================================================
   Newsletter — নতুন Home এর footer এর ইমেইল ঘর

   POST /api/newsletter   { email, locale } → 201 { ok: true }   (সবার জন্য)
   GET  /api/newsletter   → { subscribers: [...] }  (শুধু owner/admin)

   MongoDB collection: newsletter_subscribers
     { email, locale, ip, createdAt, updatedAt }

   একই ইমেইল দুইবার দিলে নতুন সারি হয় না (email এ unique index) —
   আর উত্তর সবসময় একই "ok", যাতে কেউ বুঝতে না পারে কোন ইমেইল আগে
   থেকেই তালিকায় আছে
   =============================================================== */

const router = Router();
const COLLECTION = "newsletter_subscribers";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCALES = ["en", "zh-Hant", "ja"];

// একই IP থেকে এক ঘণ্টায় 10 বার — সত্যিকারের মানুষের জন্য যথেষ্ট
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 10;

let indexesReady;

const ensureIndexes = () => {
  if (!indexesReady) {
    const collection = getDB().collection(COLLECTION);
    indexesReady = Promise.all([
      collection.createIndex({ email: 1 }, { unique: true }),
      collection.createIndex({ ip: 1, updatedAt: 1 }),
    ]).catch((error) => {
      indexesReady = undefined; // পরের request আবার চেষ্টা করবে
      throw error;
    });
  }
  return indexesReady;
};

router.post("/", requireSameOrigin, async (req, res, next) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase().slice(0, 200)
        : "";
    const locale = LOCALES.includes(req.body?.locale) ? req.body.locale : "en";

    if (!EMAIL_SHAPE.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    await ensureIndexes();

    const ip = clientIp(req);
    const collection = getDB().collection(COLLECTION);

    const recent = await collection.countDocuments({
      ip,
      updatedAt: { $gt: new Date(Date.now() - WINDOW_MS) },
    });

    if (recent >= MAX_PER_IP) {
      return res.status(429).json({ message: "Too many requests. Please try later." });
    }

    const now = new Date();
    await collection.updateOne(
      { email },
      {
        $set: { locale, ip, updatedAt: now },
        $setOnInsert: { email, createdAt: now },
      },
      { upsert: true },
    );

    res.status(201).json({ ok: true });
  } catch (error) {
    // দুইজন একসাথে একই ইমেইল দিলে unique index এ একটা আটকায় — সেটাও "ok"
    if (error?.code === 11000) return res.status(201).json({ ok: true });
    next(error);
  }
});

router.get("/", requireAdmin, requireRole("owner", "admin"), async (req, res, next) => {
  try {
    const subscribers = await getDB()
      .collection(COLLECTION)
      .find({}, { projection: { ip: 0 } })
      .sort({ createdAt: -1 })
      .limit(1000)
      .toArray();

    res.set("Cache-Control", "no-store");
    res.json({
      subscribers: subscribers.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
