import { Router } from "express";
import { getDB } from "../config/db.js";
import {
  clientIp,
  requireAdmin,
  requireRole,
  requireSameOrigin,
} from "../lib/auth.js";

/* ===============================================================
   Quote request — Home এর Contact form ("Request a Quote")

   POST /api/quote-requests   → 201 { ok: true }     (সবার জন্য খোলা)
   GET  /api/quote-requests   → { requests: [...] }  (শুধু owner/admin —
                                 পরে admin এর Leads পাতা এটাই পড়বে)

   MongoDB collection: quote_requests
     { name, company, phone, email, facilityType, projectSize,
       details, locale, source, status: "new", ip, userAgent, createdAt }

   collection আগে থেকে বানাতে হবে না — প্রথম form জমা হলেই তৈরি হয়
   =============================================================== */

const router = Router();
const COLLECTION = "quote_requests";

/* ⚠️ client এর দুইটা form এর তালিকার সাথে মিলতে হবে:
     client/src/components/Contact.jsx  (মূল Home)
     client/src/home2/data.js           (নতুন Home)
   দুই form এর মিলিত তালিকা — মূল form এ "commercial" আছে, নতুনটায়
   gymnasium/retail/office/parking. ফাঁকা ("") ও চলে — dropdown
   বাধ্যতামূলক নয় */
const FACILITY_TYPES = [
  "warehouse",
  "manufacturing",
  "commercial",
  "gymnasium",
  "retail",
  "office",
  "parking",
  "other",
];
const PROJECT_SIZES = ["under50", "from50to250", "from250to1000", "over1000"];
const LOCALES = ["en", "zh-Hant", "ja"];

/* কোন পাতার form থেকে এসেছে — Leads পাতায় আলাদা করে দেখা যাবে */
const SOURCES = ["home", "home2"];

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* spam এর সীমা — একই IP থেকে এক ঘণ্টায় 5 টা form.
   সত্যিকারের গ্রাহক এর বেশি পাঠায় না, আর bot আটকে যায় */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 5;

let indexesReady;

const ensureIndexes = () => {
  if (!indexesReady) {
    const collection = getDB().collection(COLLECTION);
    indexesReady = Promise.all([
      // Leads পাতায় নতুনগুলো আগে
      collection.createIndex({ createdAt: -1 }),
      // উপরের সীমা গোনার জন্য
      collection.createIndex({ ip: 1, createdAt: 1 }),
    ]).catch((error) => {
      indexesReady = undefined; // পরের request আবার চেষ্টা করবে
      throw error;
    });
  }
  return indexesReady;
};

/* লেখা নেওয়া — string না হলে বা খুব লম্বা হলে ফাঁকা/কাটা */
const text = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/* ---------------------------------------------------------------
   POST /api/quote-requests — form জমা
   --------------------------------------------------------------- */
router.post("/", requireSameOrigin, async (req, res, next) => {
  try {
    const body = req.body ?? {};

    /* ফাঁদ (honeypot) ভরা মানে bot. তাকে "সফল" বলা হয় যাতে সে
       বুঝতে না পারে ধরা পড়েছে — কিন্তু database এ কিছু যায় না */
    if (text(body.website, 200)) {
      return res.status(201).json({ ok: true });
    }

    const request = {
      name: text(body.name, 120),
      company: text(body.company, 160),
      phone: text(body.phone, 40),
      email: text(body.email, 200).toLowerCase(),
      facilityType: FACILITY_TYPES.includes(body.facilityType)
        ? body.facilityType
        : "",
      projectSize: PROJECT_SIZES.includes(body.projectSize)
        ? body.projectSize
        : "",
      details: text(body.details, 2000),
      locale: LOCALES.includes(body.locale) ? body.locale : "en",
      source: SOURCES.includes(body.source) ? body.source : "home",
    };

    /* company আর বাধ্যতামূলক নয় — নতুন Home এর form এ company এর ঘর
       নেই. মূল form এ company এখনো বাধ্যতামূলক, সেটা browser এই দেখা হয় */
    if (!request.name) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!EMAIL_SHAPE.test(request.email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    await ensureIndexes();

    const ip = clientIp(req);
    const collection = getDB().collection(COLLECTION);

    const recent = await collection.countDocuments({
      ip,
      createdAt: { $gt: new Date(Date.now() - WINDOW_MS) },
    });

    if (recent >= MAX_PER_IP) {
      return res.status(429).json({
        message: "Too many requests. Please email us instead.",
      });
    }

    await collection.insertOne({
      ...request,
      // Leads পাতায় "New / Contacted / Closed" এর জন্য
      status: "new",
      ip,
      userAgent: String(req.headers["user-agent"] ?? "").slice(0, 300),
      createdAt: new Date(),
    });

    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------
   GET /api/quote-requests — সর্বশেষ 200 টা (শুধু owner/admin)

   editor শুধু লেখা আর ছবি সামলায়, গ্রাহকের তথ্য দেখে না
   --------------------------------------------------------------- */
router.get(
  "/",
  requireAdmin,
  requireRole("owner", "admin"),
  async (req, res, next) => {
    try {
      const requests = await getDB()
        .collection(COLLECTION)
        .find({}, { projection: { ip: 0, userAgent: 0 } })
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();

      res.set("Cache-Control", "no-store");
      res.json({
        requests: requests.map(({ _id, ...rest }) => ({
          id: _id.toString(),
          ...rest,
        })),
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
