/* ===============================================================
   Product এর গঠন — কোন ঘরে কী থাকতে পারে, কত বড়

   admin panel থেকে যা আসে সেটা সরাসরি database এ বসানো হয় না.
   এখানে প্রতিটা ঘর আলাদা করে দেখা হয়: ধরন ঠিক আছে কি না, লেখা
   খুব লম্বা কি না, তালিকায় বেশি জিনিস কি না. অচেনা ঘর বাদ পড়ে
   যায় — কেউ হাতে request বানিয়ে { isAdmin: true } বা হাজার হাজার
   সারি পাঠালেও database এ ঢোকে না.

   ⚠️ client/src/admin/products/catalog.js এ একই সীমাগুলো আছে
   (নাম ১০০, বিবরণ ২০০ ইত্যাদি). একটায় বদলালে অন্যটাতেও বদলাবেন
   =============================================================== */

export const CATEGORIES = [
  "lamp-fixture",
  "luminaire-configurator",
  "mounting-base",
  "reflector",
  "control-cap",
  "lamp-accessory",
  "reflector-accessory",
  "other",
];

/* যে category তে "Color" ঘর আছে (Figma: Mounting Base, Reflector). এগুলোতে
   publish এর আগে রং বেছে দেওয়া লাগবে. নতুন category র Figma তে
   Color থাকলে এখানে আর client এর catalog.js এ (color: true) যোগ
   করবেন */
export const COLOR_CATEGORIES = ["mounting-base", "reflector"];

/* যে category র কোনো Specification group এ "Short Description"
   বাধ্যতামূলক (Figma: Reflector আর Control Cap এর General). client এর catalog.js
   এ ওই group এ descriptionRequired: true */
export const REQUIRED_SPEC_DESCRIPTIONS = {
  reflector: [{ group: "general", label: "general short description" }],
  "control-cap": [{ group: "general", label: "general short description" }],
};

export const STATUSES = ["draft", "published"];

export const DOC_TYPES = [
  "installation-guide",
  "ies",
  "certificate",
  "spec-sheet",
  "warranty",
  "other",
];

// Key Features এর icon — নাম দিয়ে রাখা, ছবি client এ আঁকা হয়
export const FEATURE_ICONS = [
  "bolt",
  "award",
  "shield",
  "factory",
  "leaf",
  "sun",
  "clock",
  "thermometer",
  "settings",
  "box",
];

export const LIMITS = {
  name: 100,
  shortDescription: 200,
  series: 60,
  color: 40,
  images: 12,
  videoUrls: 10,
  keyFeatures: 8,
  featureText: 40,
  specGroups: 30,
  specItems: 60,
  specItem: 300,
  groupDescription: 1000,
  tables: 6,
  tableTitle: 80,
  columns: 12,
  rows: 60,
  cell: 200,
  videos: 20,
  videoTitle: 100,
  videoDescription: 300,
  documents: 30,
  documentName: 150,
  url: 600,
};

/* Cloudinary র যে ফোল্ডারে আমাদের upload যায়. মোছার সময় শুধু
   এই ফোল্ডারের জিনিসই মোছা হয় — ভুল করে বা ইচ্ছে করে অন্য কিছুর
   publicId পাঠালেও সেটা ছোঁয়া হয় না */
export const UPLOAD_ROOT = "filamento/products";

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

const list = (value, max, label) => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail(`${label} must be a list.`);
  if (value.length > max) fail(`${label} can have at most ${max} entries.`);
  return value;
};

/* শুধু https ঠিকানা — javascript: বা data: দিয়ে কেউ admin panel বা
   সাইটে কিছু চালাতে পারবে না */
const httpsUrl = (value, label, { required = true } = {}) => {
  const clean = line(value, LIMITS.url, label, { required });
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

const publicId = (value) => {
  if (typeof value !== "string" || !value) return "";
  return /^[\w\-./]{1,220}$/.test(value) && value.startsWith(`${UPLOAD_ROOT}/`)
    ? value
    : "";
};

const whole = (value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(min, Math.round(number)));
};

const when = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

/* ---------------------------------------------------------------
   প্রতিটা অংশ
   --------------------------------------------------------------- */
const cleanImages = (value) =>
  list(value, LIMITS.images, "Product images").map((image, index) => ({
    url: httpsUrl(image?.url, `Image ${index + 1}`),
    publicId: publicId(image?.publicId),
    width: whole(image?.width, { max: 20000 }),
    height: whole(image?.height, { max: 20000 }),
  }));

const cleanVideoUrls = (value) =>
  list(value, LIMITS.videoUrls, "Video URLs")
    .map((url, index) => httpsUrl(url, `Video URL ${index + 1}`, { required: false }))
    .filter(Boolean);

const cleanFeatures = (value) =>
  list(value, LIMITS.keyFeatures, "Key features")
    .map((feature, index) => ({
      icon: FEATURE_ICONS.includes(feature?.icon) ? feature.icon : "bolt",
      title: line(feature?.title, LIMITS.featureText, `Feature ${index + 1} title`),
      subtitle: line(
        feature?.subtitle,
        LIMITS.featureText,
        `Feature ${index + 1} subtitle`,
      ),
    }))
    .filter((feature) => feature.title || feature.subtitle);

/* টেবিল — Lumen Maintenance, Amps @ Line Voltage, Ballast.
   প্রতিটা সারির ঘর সংখ্যা কলামের সংখ্যার সমান করে দেওয়া হয় —
   কম হলে ফাঁকা ঘর যোগ, বেশি হলে কেটে ফেলা */
const cleanTable = (table, label) => {
  const columns = list(table?.columns, LIMITS.columns, `${label} columns`).map(
    (column, index) => line(column, 40, `${label} column ${index + 1}`),
  );

  const rows = list(table?.rows, LIMITS.rows, `${label} rows`)
    .map((row, rowIndex) => {
      const cells = Array.isArray(row?.cells) ? row.cells : [];
      return {
        label: line(row?.label, 60, `${label} row ${rowIndex + 1}`),
        cells: columns.map((_, cellIndex) =>
          text(cells[cellIndex], LIMITS.cell, `${label} cell`),
        ),
      };
    })
    .filter((row) => row.label || row.cells.some(Boolean));

  return {
    title: line(table?.title, LIMITS.tableTitle, `${label} title`),
    caption: line(table?.caption, 40, `${label} caption`),
    rowHeader: line(table?.rowHeader, 40, `${label} first column`),
    columns,
    rows,
  };
};

/* Specifications — group এর নাম (applications, electrical …) client এর
   category নকশা থেকে আসে. server কোনো নির্দিষ্ট তালিকা জোর করে না,
   কারণ প্রতিটা category র group আলাদা হবে. শুধু আকার আর নামের ধরন
   দেখা হয় */
const cleanSpecs = (value) => {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    fail("Specifications must be an object.");
  }

  const keys = Object.keys(value);
  if (keys.length > LIMITS.specGroups) fail("Too many specification groups.");

  const specs = {};
  for (const key of keys) {
    if (!/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(key)) continue;
    const group = value[key] ?? {};

    const items = list(group.items, LIMITS.specItems, `${key} entries`)
      .map((item, index) => line(item, LIMITS.specItem, `${key} entry ${index + 1}`))
      .filter(Boolean);

    const tables = list(group.tables, LIMITS.tables, `${key} tables`).map(
      (table, index) => cleanTable(table, `${key} table ${index + 1}`),
    );

    const description = text(
      group.description,
      LIMITS.groupDescription,
      `${key} description`,
    );

    specs[key] = { items, tables, description };
  }
  return specs;
};

const cleanVideos = (value) =>
  list(value, LIMITS.videos, "Videos").map((video, index) => ({
    title: line(video?.title, LIMITS.videoTitle, `Video ${index + 1} title`, {
      required: true,
    }),
    description: text(
      video?.description,
      LIMITS.videoDescription,
      `Video ${index + 1} description`,
    ),
    url: httpsUrl(video?.url, `Video ${index + 1} file`),
    publicId: publicId(video?.publicId),
    thumbnail: httpsUrl(video?.thumbnail, `Video ${index + 1} thumbnail`, {
      required: false,
    }),
    duration: whole(video?.duration, { max: 60 * 60 * 10 }),
    bytes: whole(video?.bytes),
    format: line(video?.format, 12, "Video format"),
    uploadedAt: when(video?.uploadedAt),
  }));

const cleanDocuments = (value) =>
  list(value, LIMITS.documents, "Documents").map((doc, index) => ({
    name: line(doc?.name, LIMITS.documentName, `Document ${index + 1} name`, {
      required: true,
    }),
    type: DOC_TYPES.includes(doc?.type) ? doc.type : "other",
    url: httpsUrl(doc?.url, `Document ${index + 1} file`),
    publicId: publicId(doc?.publicId),
    resourceType: ["raw", "image"].includes(doc?.resourceType)
      ? doc.resourceType
      : "raw",
    bytes: whole(doc?.bytes),
    format: line(doc?.format, 12, "Document format").toLowerCase(),
    uploadedAt: when(doc?.uploadedAt),
  }));

/* ---------------------------------------------------------------
   মূল কাজ

   partial = true — PATCH: শুধু যে ঘরগুলো এসেছে সেগুলো দেখা হয়,
   বাকিগুলো database এ যেমন আছে তেমনই থাকে.

   ফেরত দেয় { value } অথবা { error } — throw করে না, যাতে route
   সহজে 400 দিতে পারে
   --------------------------------------------------------------- */
const FIELDS = {
  name: (v) => line(v, LIMITS.name, "Product name", { required: true }),
  shortDescription: (v) =>
    text(v, LIMITS.shortDescription, "Short description"),
  category: (v) => {
    if (!CATEGORIES.includes(v)) fail("Choose a valid category.");
    return v;
  },
  series: (v) => line(v, LIMITS.series, "Series"),
  color: (v) => line(v, LIMITS.color, "Color"),
  stock: (v) =>
    v === "" || v === null || v === undefined
      ? null
      : whole(v, { max: 10_000_000 }),
  status: (v) => (STATUSES.includes(v) ? v : "draft"),
  images: cleanImages,
  videoUrls: cleanVideoUrls,
  keyFeatures: cleanFeatures,
  specs: cleanSpecs,
  videos: cleanVideos,
  documents: cleanDocuments,
};

export function cleanProduct(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Send the product as a JSON object." };
  }

  try {
    const value = {};
    for (const [field, clean] of Object.entries(FIELDS)) {
      if (partial && !(field in body)) continue;
      value[field] = clean(body[field]);
    }

    if (!partial && !value.category) fail("Choose a valid category.");
    return { value };
  } catch (error) {
    if (error instanceof Invalid) return { error: error.message };
    throw error;
  }
}

/* publish করার আগে যা না থাকলেই নয়. draft এ এগুলো ফাঁকা থাকতে
   পারে — অর্ধেক কাজ রেখে পরে ফেরা যায় */
export function missingForPublish(product) {
  const missing = [];
  if (!product.name) missing.push("product name");
  if (!product.shortDescription) missing.push("short description");
  if (!product.category) missing.push("category");
  if (COLOR_CATEGORIES.includes(product.category) && !product.color) {
    missing.push("color");
  }
  for (const need of REQUIRED_SPEC_DESCRIPTIONS[product.category] ?? []) {
    if (!product.specs?.[need.group]?.description) missing.push(need.label);
  }
  if (!product.images?.length) missing.push("at least one product image");
  return missing;
}

/* ঠিকানার জন্য নাম — "LA1 High Bay: Linear Distribution"
   → "la1-high-bay-linear-distribution" */
export const slugify = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "product";

// একটা product এ Cloudinary র যত জিনিস আছে — মোছার সময় কাজে লাগে
export const assetsOf = (product) => [
  ...(product?.images ?? []).map((item) => ({
    publicId: item.publicId,
    resourceType: "image",
  })),
  ...(product?.videos ?? []).map((item) => ({
    publicId: item.publicId,
    resourceType: "video",
  })),
  ...(product?.documents ?? []).map((item) => ({
    publicId: item.publicId,
    resourceType: item.resourceType || "raw",
  })),
].filter((asset) => asset.publicId);
