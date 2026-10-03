/* ===============================================================
   Lead আর সময়ের লেখা — Dashboard আর 🔔 দুই জায়গাতেই একই

   ⚠️ FACILITY এর key গুলো server/routes/quoteRequestRoutes.js এর
   FACILITY_TYPES এর সাথে মিলতে হবে
   =============================================================== */

export const FACILITY = {
  warehouse: "Warehouse Lighting",
  manufacturing: "Manufacturing Lighting",
  commercial: "Commercial Lighting",
  gymnasium: "Gymnasium Lighting",
  retail: "Retail Lighting",
  office: "Office Lighting",
  parking: "Parking Lighting",
  other: "Other Lighting",
};

// form এ facility বাছা না হলে
export const interestOf = (facilityType) => FACILITY[facilityType] || "General Enquiry";

/* Leads পাতার অবস্থা → pill এর লেখা আর রঙের class */
export const LEAD_STATUS = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
};

export const statusOf = (status) => (LEAD_STATUS[status] ? status : "new");

/* দেশের দুই অক্ষর → নাম ("US" → "United States").
   পুরনো browser এ Intl.DisplayNames না থাকলে code টাই থাকে */
let regionNames = null;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  regionNames = null;
}

/* লম্বা নামের বদলে চেনা ছোট নাম — Figma র মতো ("New York, USA") */
const SHORT_COUNTRY = { US: "USA", GB: "UK", AE: "UAE" };

/* { city: "New York", country: "US" } → "New York, USA".
   server location না পেলে (Vercel এর বাইরে, বা পুরনো lead) → "—" */
export function locationOf(location) {
  if (!location) return "—";
  let country = location.country || "";
  if (SHORT_COUNTRY[country]) {
    country = SHORT_COUNTRY[country];
  } else if (country && regionNames) {
    try {
      country = regionNames.of(country) || country;
    } catch {
      // অচেনা code — যেমন আছে
    }
  }
  return [location.city, country].filter(Boolean).join(", ") || "—";
}

/* কত আগে — "2m ago", "3h ago", "2d ago", এক সপ্তাহের বেশি হলে তারিখ.

   now — "এখন" কখন. পাতা আঁকার সময় Date.now() ডাকলে প্রতিবার আলাদা
   ফল আসে (React এর নিয়মে ভুল), তাই server এর উত্তরের সময়টাই পাঠানো
   হয় */
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function timeAgo(value, now) {
  const then = new Date(value).getTime();
  const reference = new Date(now).getTime();
  if (!Number.isFinite(then) || !Number.isFinite(reference)) return "";

  const seconds = Math.max(0, Math.floor((reference - then) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return shortDate.format(new Date(then));
}
