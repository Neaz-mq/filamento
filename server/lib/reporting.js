import { getDB } from "../config/db.js";

/* ===============================================================
   Dashboard এর হিসাবের জন্য ছোট সাহায্যকারী

   ১. কোন সময়-অঞ্চল (timezone) ধরে "আজ" আর "এই সপ্তাহ" গোনা হবে
   ২. প্রতিদিন কোন product কতবার দেখা হয়েছে — product_view_days

   ⚠️ "দিন" টা গোনা হয় একটা নির্দিষ্ট সময়-অঞ্চলে (Google Analytics
   এর মতো). নাহলে Dhaka আর San Jose এর admin একই দিনে আলাদা সংখ্যা
   দেখতেন. Filamento র বাজার আমেরিকায়, তাই default San Jose এর সময়.
   বদলাতে চাইলে server এর env এ:
     REPORT_TIMEZONE=Asia/Dhaka
   =============================================================== */

const pickTimezone = () => {
  const wanted = process.env.REPORT_TIMEZONE || "America/Los_Angeles";
  try {
    // ভুল নাম হলে এখানেই RangeError — server বন্ধ না করে UTC তে চলে
    new Intl.DateTimeFormat("en-CA", { timeZone: wanted });
    return wanted;
  } catch {
    console.warn(`⚠️ REPORT_TIMEZONE "${wanted}" চেনা যায়নি — UTC ব্যবহার হচ্ছে`);
    return "UTC";
  }
};

export const REPORT_TIMEZONE = pickTimezone();

// en-CA তারিখ লেখে "2026-10-03" — সরাসরি দিনের key হিসেবে চলে
const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: REPORT_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Date → "2026-10-03" (REPORT_TIMEZONE এর দিন) */
export const dayKey = (date = new Date()) => dayFormat.format(date);

/** "2026-10-03" + 1 → "2026-10-04". শুধু ক্যালেন্ডারের হিসাব, সময় নেই */
export const addDays = (key, amount) => {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

/** "2026-10-03" → 0 (রবিবার) … 6 (শনিবার) */
export const weekdayOf = (key) => new Date(`${key}T00:00:00Z`).getUTCDay();

/* ---------------------------------------------------------------
   প্রতিদিনের product view

   MongoDB collection: product_view_days
     { _id: "2026-10-03|<productId>", day: "2026-10-03",
       productId: ObjectId, count: 12, updatedAt: Date }

   এক product এর এক দিনের জন্য একটাই document — $inc দিয়ে বাড়ে,
   তাই দুইজন একসাথে দেখলেও কোনোটা হারায় না.

   ⚠️ এটা চালু হওয়ার আগের view গুলোর দিন জানা নেই — সেগুলো শুধু
   product এর মোট views এ আছে ("All Time" এ দেখায়). দিনের হিসাব
   আজ থেকে জমতে শুরু করবে
   --------------------------------------------------------------- */
export const PRODUCT_VIEW_DAYS = "product_view_days";

let viewIndexReady;

const ensureViewIndex = () => {
  if (!viewIndexReady) {
    viewIndexReady = getDB()
      .collection(PRODUCT_VIEW_DAYS)
      .createIndex({ day: 1 })
      .catch((error) => {
        viewIndexReady = undefined; // পরের বার আবার চেষ্টা
        throw error;
      });
  }
  return viewIndexReady;
};

/** product এর পাতা একবার দেখা হলো — আজকের ঘরে +1.
    ব্যর্থ হলে শুধু সতর্কবার্তা; দর্শকের পাতা আটকায় না */
export async function recordProductView(productId) {
  try {
    await ensureViewIndex();
    const day = dayKey();
    await getDB()
      .collection(PRODUCT_VIEW_DAYS)
      .updateOne(
        { _id: `${day}|${productId.toString()}` },
        {
          $inc: { count: 1 },
          $set: { day, productId, updatedAt: new Date() },
        },
        { upsert: true },
      );
  } catch (error) {
    console.warn("⚠️ Daily product view failed:", error.message);
  }
}
