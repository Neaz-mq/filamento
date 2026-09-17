import { Router } from "express";
import { getDB } from "../config/db.js";

/* ===============================================================
   Video view — Technologies section এর video গুলো কতবার চালানো
   হয়েছে তার হিসাব.

   MongoDB collection: video_views
     { _id: "optical", count: 40, updatedAt: Date }

   collection বা document আগে থেকে বানাতে হবে না — প্রথম play এ
   নিজে থেকেই তৈরি হয় (upsert). _id নিজেই index, আলাদা index লাগে না.

   এখানে শুধু আসল play গোনা হয়. পাতায় যে "শুরুর সংখ্যা" যোগ হয়
   (1.2k ইত্যাদি), সেটা frontend এর Technologies.jsx এ আলাদা —
   database এ মেশানো হয় না
   =============================================================== */

const router = Router();
const COLLECTION = "video_views";

/* শুধু এই id গুলোই গোনা হয়. নাহলে যে কেউ বাইরে থেকে
   /api/video-views/যা-খুশি পাঠিয়ে database এ হাজারটা document
   বানিয়ে ফেলতে পারত.
   frontend এ নতুন video যোগ করলে এখানেও id টা যোগ করতে হবে */
const VIDEO_IDS = ["thermal", "optical", "driver"];

/* ---------------------------------------------------------------
   একই জায়গা থেকে ঘন ঘন গোনা ঠেকানো

   frontend নিজেও session এ একবারের বেশি পাঠায় না. কিন্তু কেউ
   সরাসরি API ডাকলে সেটা পেরিয়ে যাওয়া যায় — তাই server এও একটা
   সাধারণ বাধা: একই IP থেকে একই video, 10 মিনিটে একবার.

   ⚠️ এটা memory তে থাকে. Vercel এ একাধিক instance চলতে পারে, আর
   instance ঘুমিয়ে গেলে মুছে যায় — তাই এটা পুরো সুরক্ষা নয়, শুধু
   সহজ অপব্যবহার আটকায়. view সংখ্যার জন্য এটুকুই যথেষ্ট
   --------------------------------------------------------------- */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRACKED = 5000;
const recentViews = new Map(); // "ip:id" → সময়

const clientIp = (req) =>
  // Vercel আসল IP এই header এ পাঠায়; প্রথমটাই দর্শকের
  req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip || "unknown";

const shouldCount = (key, now) => {
  const last = recentViews.get(key);
  if (last && now - last < WINDOW_MS) return false;

  // Map যেন অসীম না বাড়ে — বড় হলে পুরনোগুলো ফেলে দেওয়া
  if (recentViews.size >= MAX_TRACKED) {
    for (const [storedKey, time] of recentViews) {
      if (now - time >= WINDOW_MS) recentViews.delete(storedKey);
    }
    // তাও ভরা থাকলে (খুব বেশি আলাদা IP) সবচেয়ে পুরনোটা বাদ
    if (recentViews.size >= MAX_TRACKED) {
      recentViews.delete(recentViews.keys().next().value);
    }
  }

  recentViews.set(key, now);
  return true;
};

/* ---------------------------------------------------------------
   GET /api/video-views
   → { views: { thermal: 12, optical: 40, driver: 0 } }

   যে video এখনো একবারও চলেনি, সেটাও 0 হিসেবে আসে
   --------------------------------------------------------------- */
router.get("/", async (req, res, next) => {
  try {
    const docs = await getDB()
      .collection(COLLECTION)
      .find({ _id: { $in: VIDEO_IDS } })
      .toArray();

    const views = Object.fromEntries(VIDEO_IDS.map((id) => [id, 0]));
    docs.forEach((doc) => {
      views[doc._id] = doc.count ?? 0;
    });

    // সংখ্যা বদলায় — browser বা Vercel যেন পুরনো উত্তর জমিয়ে না রাখে
    res.set("Cache-Control", "no-store");
    res.json({ views });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------
   POST /api/video-views/:id
   → { id, count, counted }

   counted: false — এই বারটা গোনা হয়নি (একই IP থেকে খুব শিগগির),
   তবু সর্বশেষ সংখ্যা ফেরত যায়, যাতে পাতায় ঠিক সংখ্যাই দেখায়
   --------------------------------------------------------------- */
router.post("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!VIDEO_IDS.includes(id)) {
    return res.status(404).json({ message: `Unknown video: ${id}` });
  }

  try {
    const collection = getDB().collection(COLLECTION);
    const counted = shouldCount(`${clientIp(req)}:${id}`, Date.now());

    let doc;
    if (counted) {
      /* $inc এক ধাপে বাড়ায় — দুইজন একই মুহূর্তে play করলেও দুইটাই
         গোনা হয়, একটা আরেকটাকে মুছে দেয় না.
         mongodb driver v6 এ findOneAndUpdate সরাসরি document দেয় */
      doc = await collection.findOneAndUpdate(
        { _id: id },
        { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
        { upsert: true, returnDocument: "after" },
      );
    } else {
      doc = await collection.findOne({ _id: id });
    }

    res.set("Cache-Control", "no-store");
    res.json({ id, count: doc?.count ?? 0, counted });
  } catch (error) {
    next(error);
  }
});

export default router;