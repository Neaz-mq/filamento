import { slugify } from "./productSchema.js";

/* ===============================================================
   Project এর গঠন — কোন ঘরে কী থাকতে পারে, কত বড়

   productSchema.js এর মতোই: admin panel থেকে যা আসে সেটা আগে
   এখানে পরিষ্কার হয়, অচেনা ঘর বাদ পড়ে, লেখা খুব লম্বা হলে 400.

   ⚠️ client/src/admin/projects/projectCatalog.js এ একই তালিকা আর
   সীমা আছে. একটায় বদলালে অন্যটাতেও বদলাবেন
   =============================================================== */

/* অবস্থা — Figma র তিনটা সংখ্যা (Completed, In Progress, Draft).
   draft সাইটে যায় না; বাকি দুইটা published, শুধু কাজের অবস্থা আলাদা */
export const PROJECT_STATUSES = ["draft", "in-progress", "completed"];
export const LIVE_STATUSES = ["in-progress", "completed"];

/* Category — বড় ভাগ (Figma র টেবিলে Industrial, Commercial …) */
export const PROJECT_CATEGORIES = {
  industrial: "Industrial",
  commercial: "Commercial",
  retail: "Retail",
  sports: "Sports",
  education: "Education",
  healthcare: "Healthcare",
  hospitality: "Hospitality",
  municipal: "Municipal",
  agriculture: "Agriculture",
};

/* Project Type — কোন ধরনের জায়গা. public সাইটের Projects পাতার
   "environment" filter এর key গুলোই (en.json → projects.categories),
   তাই পরে সাইট API থেকে পড়লে filter সরাসরি মিলে যাবে */
export const PROJECT_TYPES = {
  airport: "Airport",
  automotiveDealership: "Automotive Dealership",
  church: "Church",
  coldStorage: "Cold Storage",
  conferenceCenter: "Conference Center",
  conventionCenter: "Convention Center",
  distributionCenter: "Distribution Center",
  gymnasium: "Gymnasium",
  manufacturing: "Manufacturing",
  office: "Office",
  retail: "Retail",
  streetLights: "Street Lights",
  warehouse: "Warehouse",
  other: "Other",
};

// Key Features আর The Solution এর icon — নাম দিয়ে রাখা, ছবি client এ
export const PROJECT_ICONS = [
  "area",
  "gauge",
  "timer",
  "bolt",
  "leaf",
  "sun",
  "settings",
  "grid",
  "shield",
  "award",
  "users",
  "factory",
];

export const PROJECT_LIMITS = {
  title: 100,
  company: 100,
  shortDescription: 200,
  location: 100,
  story: 2000,
  images: 12,
  videoUrls: 10,
  keyFeatures: 8,
  featureText: 40,
  solutionFeatures: 12,
  solutionTitle: 60,
  solutionText: 200,
  highlights: 12,
  highlight: 120,
  ctaText: 40,
  url: 600,
  products: 40,
};

/* Cloudinary র project এর ফোল্ডার. মোছার সময় শুধু এই ফোল্ডারের
   জিনিসই মোছা হয় */
export const PROJECT_UPLOAD_ROOT = "filamento/projects";

/* ---------------------------------------------------------------
   ছোট সাহায্যকারী
   --------------------------------------------------------------- */
class Invalid extends Error {}

const fail = (message) => {
  throw new Invalid(message);
};

const text = (value, max, label, { required = false } = {}) => {
  if (value === undefined || value === null) value = "";
  if (typeof value !== "string" && typeof value !== "number") {
    fail(`${label} must be text.`);
  }
  const clean = String(value).trim();
  if (required && !clean) fail(`${label} is required.`);
  if (clean.length > max) fail(`${label} can be at most ${max} characters.`);
  return clean;
};

// এক লাইনের লেখা — ভেতরের নতুন লাইন আর tab এক ফাঁকা হয়ে যায়
const line = (value, max, label, options) =>
  text(value, max, label, options).replace(/\s+/g, " ");

/* লম্বা লেখা (Challenge, Results) — অনুচ্ছেদ থাকে, তাই নতুন লাইন
   রাখা হয়. শুধু \r\n কে \n আর তিনের বেশি ফাঁকা লাইনকে দুইটা করা */
const story = (value, label) =>
  text(value, PROJECT_LIMITS.story, label)
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

const list = (value, max, label) => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail(`${label} must be a list.`);
  if (value.length > max) fail(`${label} can have at most ${max} entries.`);
  return value;
};

/* শুধু https ঠিকানা — javascript: বা data: দিয়ে কেউ কিছু চালাতে
   পারবে না */
const httpsUrl = (value, label, { required = true } = {}) => {
  const clean = line(value, PROJECT_LIMITS.url, label, { required });
  if (!clean) return "";
  let parsed;
  try {
    parsed = new URL(clean);
  } catch {
    fail(`${label} is not a valid link.`);
  }
  if (parsed.protocol !== "https:") fail(`${label} must start with https://`);
  return parsed.toString();
};

/* Call to Action এর link — সাইটের ভেতরের পথ (/products) অথবা https.
   "//" দিয়ে শুরু হলে সেটা আসলে অন্য সাইট, তাই বাতিল */
const siteLink = (value, label) => {
  const clean = line(value, PROJECT_LIMITS.url, label);
  if (!clean) return "";
  if (clean.startsWith("/")) {
    if (clean.startsWith("//") || /\s/.test(clean)) fail(`${label} is not a valid link.`);
    return clean;
  }
  return httpsUrl(clean, label);
};

const publicId = (value) => {
  if (typeof value !== "string" || !value) return "";
  return /^[\w\-./]{1,220}$/.test(value) && value.startsWith(`${PROJECT_UPLOAD_ROOT}/`)
    ? value
    : "";
};

const whole = (value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(min, Math.round(number)));
};

const oneOf = (value, options, label) => {
  if (value === undefined || value === null || value === "") return "";
  if (!Object.hasOwn(options, value)) fail(`Choose a valid ${label}.`);
  return value;
};

/* তারিখ — "2026-05-28". ক্যালেন্ডারে আসলেই আছে কি না দেখা হয়
   (2026-02-31 বাতিল) */
const day = (value) => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail("Date must look like 2026-05-28.");
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    fail("Date is not a real day.");
  }
  const year = date.getUTCFullYear();
  if (year < 1950 || year > 2100) fail("Date year looks wrong.");
  return value;
};

const productIdText = (value) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value) ? value.toLowerCase() : "";

/* ---------------------------------------------------------------
   প্রতিটা অংশ
   --------------------------------------------------------------- */
const cleanImages = (value) =>
  list(value, PROJECT_LIMITS.images, "Project images").map((image, index) => ({
    url: httpsUrl(image?.url, `Image ${index + 1}`),
    publicId: publicId(image?.publicId),
    width: whole(image?.width, { max: 20000 }),
    height: whole(image?.height, { max: 20000 }),
  }));

const cleanVideoUrls = (value) =>
  list(value, PROJECT_LIMITS.videoUrls, "Video URLs")
    .map((url, index) => httpsUrl(url, `Video URL ${index + 1}`, { required: false }))
    .filter(Boolean);

const icon = (value) => (PROJECT_ICONS.includes(value) ? value : "bolt");

const cleanFeatures = (value) =>
  list(value, PROJECT_LIMITS.keyFeatures, "Key features")
    .map((feature, index) => ({
      icon: icon(feature?.icon),
      title: line(feature?.title, PROJECT_LIMITS.featureText, `Feature ${index + 1} title`),
      subtitle: line(
        feature?.subtitle,
        PROJECT_LIMITS.featureText,
        `Feature ${index + 1} subtitle`,
      ),
    }))
    .filter((feature) => feature.title || feature.subtitle);

const cleanSolution = (value) =>
  list(value, PROJECT_LIMITS.solutionFeatures, "Solution features")
    .map((feature, index) => ({
      icon: icon(feature?.icon),
      title: line(
        feature?.title,
        PROJECT_LIMITS.solutionTitle,
        `Solution feature ${index + 1} title`,
      ),
      description: line(
        feature?.description,
        PROJECT_LIMITS.solutionText,
        `Solution feature ${index + 1} description`,
      ),
    }))
    .filter((feature) => feature.title || feature.description);

const cleanHighlights = (value) =>
  list(value, PROJECT_LIMITS.highlights, "Highlights")
    .map((item, index) => line(item, PROJECT_LIMITS.highlight, `Highlight ${index + 1}`))
    .filter(Boolean);

/* Call to Action — লেখা থাকলে link ও লাগবে (আর উল্টোটাও), নাহলে
   সাইটে এমন বোতাম আসত যেটা কোথাও যায় না */
const cleanCta = (value) => {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const cta = {
    text: line(raw.text, PROJECT_LIMITS.ctaText, "Button text"),
    link: siteLink(raw.link, "Button link"),
    newTab: raw.newTab === true,
  };
  if (cta.text && !cta.link) fail("Add a link for the Call to Action button.");
  if (cta.link && !cta.text) fail("Add the Call to Action button text.");
  return cta;
};

/* Product Used — library র product এর id. একই product দুইবার না.
   product টা সত্যিই আছে কি না projectController দেখে */
const cleanProducts = (value) => {
  const seen = new Set();
  return list(value, PROJECT_LIMITS.products, "Products used")
    .map(productIdText)
    .filter((id) => {
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
};

/* ---------------------------------------------------------------
   মূল কাজ

   partial = true — PATCH: শুধু যে ঘরগুলো এসেছে সেগুলো দেখা হয়.
   ফেরত দেয় { value } অথবা { error }
   --------------------------------------------------------------- */
const FIELDS = {
  title: (v) => line(v, PROJECT_LIMITS.title, "Project title", { required: true }),
  company: (v) => line(v, PROJECT_LIMITS.company, "Company name"),
  shortDescription: (v) => text(v, PROJECT_LIMITS.shortDescription, "Short description"),
  projectType: (v) => oneOf(v, PROJECT_TYPES, "project type"),
  category: (v) => oneOf(v, PROJECT_CATEGORIES, "category"),
  location: (v) => line(v, PROJECT_LIMITS.location, "Location"),
  date: day,
  status: (v) => (PROJECT_STATUSES.includes(v) ? v : "draft"),
  images: cleanImages,
  videoUrls: cleanVideoUrls,
  keyFeatures: cleanFeatures,
  challenge: (v) => story(v, "The Challenge"),
  solution: cleanSolution,
  results: (v) => story(v, "The Results"),
  highlights: cleanHighlights,
  cta: cleanCta,
  products: cleanProducts,
};

export function cleanProject(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Send the project as a JSON object." };
  }

  try {
    const value = {};
    for (const [field, clean] of Object.entries(FIELDS)) {
      if (partial && !(field in body)) continue;
      value[field] = clean(body[field]);
    }
    return { value };
  } catch (error) {
    if (error instanceof Invalid) return { error: error.message };
    throw error;
  }
}

/* publish (Completed বা In Progress) করার আগে যা না থাকলেই নয় —
   Figma তে * দেওয়া ঘরগুলো. draft এ ফাঁকা থাকতে পারে */
export function missingForPublish(project) {
  const missing = [];
  if (!project.title) missing.push("project title");
  if (!project.company) missing.push("company name");
  if (!project.shortDescription) missing.push("short description");
  if (!project.projectType) missing.push("project type");
  if (!project.category) missing.push("category");
  if (!project.location) missing.push("location");
  if (!project.date) missing.push("date");
  if (!project.images?.length) missing.push("at least one project image");
  return missing;
}

export const isLive = (status) => LIVE_STATUSES.includes(status);

// slugify ফাঁকা নামে "product" দেয় — project এ সেটা "project"
export const projectSlug = (title) => {
  const slug = slugify(title);
  return slug === "product" && !/product/i.test(String(title)) ? "project" : slug;
};

/* "Texas, USA" → "USA". Projects by Location এর জন্য — শেষ অংশটাই
   দেশ ধরা হয়, আর একই দেশের কয়েক রকম নাম এক করা হয় */
const COUNTRY_NAMES = {
  us: "USA",
  usa: "USA",
  "u.s.": "USA",
  "u.s.a.": "USA",
  "united states": "USA",
  "united states of america": "USA",
  america: "USA",
  uk: "UK",
  "united kingdom": "UK",
  england: "UK",
  uae: "UAE",
  "united arab emirates": "UAE",
};

/* আমেরিকার অঙ্গরাজ্য — "Austin, Texas" লিখলেও USA ধরা হয় */
const US_STATES = new Set(
  [
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
    "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho",
    "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine",
    "maryland", "massachusetts", "michigan", "minnesota", "mississippi",
    "missouri", "montana", "nebraska", "nevada", "new hampshire", "new jersey",
    "new mexico", "new york", "north carolina", "north dakota", "ohio",
    "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina",
    "south dakota", "tennessee", "texas", "utah", "vermont", "virginia",
    "washington", "west virginia", "wisconsin", "wyoming",
    "district of columbia", "washington dc", "washington, d.c.",
  ],
);

export function countryOf(location) {
  const parts = String(location ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return "";
  const last = parts.at(-1);
  const key = last.toLowerCase();
  if (US_STATES.has(key)) return "USA";
  return COUNTRY_NAMES[key] ?? last;
}

// একটা project এ Cloudinary র যত ছবি আছে — মোছার সময় কাজে লাগে
export const projectAssets = (project) =>
  (project?.images ?? [])
    .map((item) => ({ publicId: item.publicId, resourceType: "image" }))
    .filter((asset) => asset.publicId);
