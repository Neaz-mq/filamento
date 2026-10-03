import {
  IconAward,
  IconBolt,
  IconClipboardTick,
  IconEye,
  IconLocation,
  IconSettings,
  IconShield,
  IconStar,
  IconSun,
  IconTimer,
  IconTrendUp,
} from "../icons";

/* ===============================================================
   Home Page Content — নিয়ম, মাপ আর modal এর ঘরগুলো

   server/lib/homeContentSchema.js এর সাথে মিল রেখে লেখা. এখানে ভুল
   হলেও ক্ষতি নেই — server আবার যাচাই করে, শুধু বার্তাটা পরে আসে
   =============================================================== */

// লেখার সর্বোচ্চ দৈর্ঘ্য — ঘরের ডানে "34/100"
export const HOME_LIMITS = {
  label: 40,
  heroTitle: 100,
  heroDescription: 300,
  featureTitle: 40,
  featureSubtitle: 60,
  cardTitle: 60,
  cardSubtitle: 120,
  logoName: 60,
  behindText: 30,
  sectionTitle: 100,
  shortDescription: 200,
  longDescription: 300,
  scope: 120,
  fixtureDescription: 300,
  pointTitle: 60,
  pointText: 200,
  cell: 60,
  videoTitle: 80,
  videoDescription: 200,
  personName: 60,
  designation: 60,
  company: 60,
  projectName: 80,
  quote: 500,
  url: 600,
};

// প্রতিটা তালিকায় সর্বনিম্ন / সর্বোচ্চ কয়টা
export const HOME_LISTS = {
  slides: { min: 1, max: 5 },
  features: { min: 0, max: 8 },
  products: { min: 0, max: 6 },
  logos: { min: 0, max: 24 },
  fixtures: { min: 1, max: 3 },
  points: { min: 0, max: 8 },
  rows: { min: 1, max: 12 },
  videos: { min: 1, max: 6 },
  testimonials: { min: 1, max: 12 },
};

/* ---------------------------------------------------------------
   Key Features / Featured Points এর icon

   Figma তে icon বাছার ঘর নেই — তাই শিরোনাম পড়ে মানানসই icon
   নিজে থেকেই বসে ("5 Year Warranty" → ঢাল, "Energy" → বিদ্যুৎ).
   কিছু না মিললে আগেরটা থাকে, নতুন হলে ⭐
   --------------------------------------------------------------- */
export const HOME_ICONS = {
  energy: IconBolt,
  warranty: IconShield,
  madeIn: IconLocation,
  certified: IconAward,
  listed: IconClipboardTick,
  maintenance: IconSettings,
  visibility: IconEye,
  glare: IconSun,
  installation: IconTimer,
  roi: IconTrendUp,
  spark: IconStar,
};

const ICON_WORDS = [
  ["energy", /energy|kwh|power|watt|efficien/],
  ["warranty", /warrant|guarantee|\byears?\b/],
  ["madeIn", /made in|\busa\b|america|domestic/],
  ["certified", /certif|\bdlc\b|premium|approved/],
  ["listed", /listed|\bul\b|\bdl\b|\betl\b|complian/],
  ["maintenance", /mainten|service|sealed|durab|lifetime|\bhours?\b/],
  ["visibility", /visib|\bcri\b|clarity|bright|uniform|safety/],
  ["glare", /glare|ugr|optic|reflector/],
  ["installation", /install|mount|setup|labor|labour/],
  ["roi", /\broi\b|payback|return|cost|rebate|saving/],
];

export function guessIcon(text, fallback = "spark") {
  const clean = String(text ?? "").toLowerCase();
  const found = ICON_WORDS.find(([, pattern]) => pattern.test(clean));
  return found ? found[0] : fallback || "spark";
}

/* ---------------------------------------------------------------
   ছোট সাহায্যকারী
   --------------------------------------------------------------- */
export const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12);

// "unsaved" বোঝার জন্য — শেষ save এর সাথে মিলিয়ে দেখা
export const snapshot = (value) => JSON.stringify(value ?? null);

export const serial = (index) => `${String(index + 1).padStart(2, "0")}.`;

/* link ঠিক আছে কি না — সাইটের ভেতরের পথ (/products) অথবা https.
   ঠিক থাকলে "", নাহলে বার্তা */
export function linkProblem(value) {
  const clean = String(value ?? "").trim();
  if (!clean) return "";
  if (clean.startsWith("/")) {
    return clean.startsWith("//") || /\s/.test(clean)
      ? "Use a site path like /projects or a full https:// link."
      : "";
  }
  try {
    return new URL(clean).protocol === "https:" ? "" : "Links must start with https://";
  } catch {
    return "Use a site path like /projects or a full https:// link.";
  }
}

/* ---------------------------------------------------------------
   modal এর ঘরগুলো — প্রতিটা "Add …" modal এই তালিকা থেকে আঁকা হয়
   (HomeModals.jsx → ItemModal)

   type: text (default) | textarea | image | video | link | rating
   width: "half" (দুই কলাম) | "third" (তিন কলাম) | না থাকলে পুরো
   --------------------------------------------------------------- */
const L = HOME_LIMITS;

export const ITEM_FORMS = {
  slide: {
    title: "Hero Section",
    subtitle: "Create a bold, engaging hero section.",
    fields: [
      { key: "image", label: "Upload Image", type: "image", kind: "site-image", required: true },
      {
        key: "label",
        label: "Level Text",
        max: L.label,
        required: true,
        placeholder: "Industrial LED · Made in the USA",
      },
      {
        key: "title",
        label: "Hero Section Title",
        max: L.heroTitle,
        required: true,
        placeholder: "Brighter Light. Half the Energy.",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        max: L.heroDescription,
        required: true,
        placeholder: "Improve your lighting performance and cut operating costs…",
      },
    ],
  },

  feature: {
    title: "Key Features",
    subtitle: "Explore the key features designed for better results.",
    fields: [
      { key: "title", label: "Title", max: L.featureTitle, required: true, width: "half", placeholder: "Up to 60%" },
      {
        key: "subtitle",
        label: "Sub Title",
        max: L.featureSubtitle,
        required: true,
        width: "half",
        placeholder: "Energy Saving",
      },
    ],
  },

  card: {
    title: "Featured Products",
    subtitle: "Point visitors to a product category from the hero.",
    fields: [
      { key: "image", label: "Upload Image", type: "image", kind: "site-image", required: true },
      { key: "title", label: "Title", max: L.cardTitle, required: true, width: "half", placeholder: "High Bay Series" },
      {
        key: "subtitle",
        label: "Sub Title",
        max: L.cardSubtitle,
        required: true,
        width: "half",
        placeholder: "Browse Professional High Bay Lighting Solutions",
      },
      {
        key: "link",
        label: "Card Link",
        type: "link",
        max: L.url,
        placeholder: "/products?category=lamp-fixture",
        hint: "Where the card goes when clicked. Leave empty for the Products page.",
      },
    ],
  },

  logo: {
    title: "Client Logos",
    subtitle: "Show the companies that trust Filamento lighting.",
    fields: [
      { key: "image", label: "Upload Image", type: "image", kind: "site-logo", required: true },
      { key: "name", label: "Company Name", max: L.logoName, required: true, placeholder: "Caterpillar" },
    ],
  },

  point: {
    title: "Key Features",
    subtitle: "Explore the key features designed for better results.",
    fields: [
      {
        key: "title",
        label: "Title",
        max: L.pointTitle,
        required: true,
        placeholder: "Up to 50% Lower Energy",
      },
      {
        key: "text",
        label: "Sub Title",
        type: "textarea",
        max: L.pointText,
        required: true,
        placeholder: "Precision optics and non-relay dimming slash kWh without sacrificing output.",
      },
    ],
  },

  fixture: {
    title: "Featured Product",
    editOnly: true,
    subtitle: "Explain where this fixture works best.",
    fields: [
      {
        key: "scope",
        label: "Best For",
        max: L.scope,
        required: true,
        placeholder: "High-Aisle Racking, Fabrication Bays, Process Lines",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        max: L.fixtureDescription,
        required: true,
        placeholder: "Targeted Optimization: Patented, linear low-glare optics…",
      },
    ],
  },

  row: {
    title: "Comparison Point",
    subtitle: "Highlight key differences and benefits for easy comparison.",
    fields: [
      {
        key: "metric",
        label: "Feature / Metric",
        max: L.cell,
        required: true,
        width: "third",
        placeholder: "Energy savings vs HID",
      },
      {
        key: "traditional",
        label: "Traditional LED",
        max: L.cell,
        required: true,
        width: "third",
        placeholder: "20–30%",
      },
      {
        key: "filamento",
        label: "Filamento",
        max: L.cell,
        required: true,
        width: "third",
        placeholder: "Up to 50%",
      },
    ],
  },

  video: {
    title: "Video Details",
    subtitle: "Get a clear overview of the selected video.",
    fields: [
      { key: "video", label: "Upload Video", type: "video", kind: "site-video", required: true },
      { key: "title", label: "Video Title", max: L.videoTitle, required: true, placeholder: "Thermal Management" },
      {
        key: "description",
        label: "Video Description",
        type: "textarea",
        max: L.videoDescription,
        required: true,
        placeholder: "Cooler-running design that protects the LEDs and extends fixture life.",
      },
    ],
  },

  testimonial: {
    title: "Testimonials",
    subtitle: "Share customer experiences and build trust with real feedback.",
    fields: [
      { key: "image", label: "Upload Image", type: "image", kind: "site-image", required: true },
      {
        key: "name",
        label: "Client Name",
        max: L.personName,
        required: true,
        width: "half",
        placeholder: "Marcus L.",
      },
      {
        key: "designation",
        label: "Client Designation",
        max: L.designation,
        required: true,
        width: "half",
        placeholder: "Facility Manager",
      },
      {
        key: "company",
        label: "Company Name",
        max: L.company,
        required: true,
        width: "half",
        placeholder: "Cold Storage",
      },
      {
        key: "projectName",
        label: "Project Name",
        max: L.projectName,
        required: true,
        width: "half",
        placeholder: "Barn XO",
      },
      {
        key: "projectLink",
        label: "Project Link",
        type: "link",
        max: L.url,
        required: true,
        width: "half",
        placeholder: "/projects/barn-xo",
      },
      { key: "rating", label: "Rating", type: "rating", required: true, width: "half" },
      {
        key: "quote",
        label: "Testimonial Quote",
        type: "textarea",
        max: L.quote,
        required: true,
        placeholder: "The custom layout process alone saved us thousands…",
      },
    ],
  },
};

// নতুন জিনিসের ফাঁকা মান
export function emptyItem(form) {
  const item = { id: newId() };
  for (const field of ITEM_FORMS[form].fields) {
    item[field.key] =
      field.type === "image" || field.type === "video" ? null : field.type === "rating" ? 5 : "";
  }
  return item;
}

/* modal এর একটা জিনিস ঠিক আছে কি না. সমস্যা থাকলে { key: বার্তা } */
export function itemProblems(form, item) {
  const problems = {};
  for (const field of ITEM_FORMS[form].fields) {
    const value = item[field.key];
    if (field.type === "image" || field.type === "video") {
      if (field.required && !value?.url) {
        problems[field.key] = field.type === "video" ? "Add a video." : "Add an image.";
      }
      continue;
    }
    if (field.type === "rating") {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 1 || number > 5) {
        problems[field.key] = "Rating must be between 1 and 5.";
      }
      continue;
    }
    const clean = String(value ?? "").trim();
    if (field.required && !clean) {
      problems[field.key] = `${field.label} is required.`;
    } else if (field.type === "link" && linkProblem(clean)) {
      problems[field.key] = linkProblem(clean);
    }
  }
  return problems;
}

/* ---------------------------------------------------------------
   Save এর আগে পুরো ধাপ দেখা — ফাঁকা ঘর থাকলে server পর্যন্ত না
   গিয়েই বলা যায়. { field, message } অথবা null
   --------------------------------------------------------------- */
const needText = (value, field, message) =>
  String(value ?? "").trim() ? null : { field, message };

const needCount = (list, key, label) => {
  const { min, max } = HOME_LISTS[key];
  if ((list?.length ?? 0) < min) return { field: key, message: `Add at least ${min} ${label}.` };
  if ((list?.length ?? 0) > max) return { field: key, message: `${label} can have at most ${max} items.` };
  return null;
};

export function stepProblem(step, data) {
  switch (step) {
    case "hero":
      return (
        needCount(data.slides, "slides", "hero section") ||
        needCount(data.features, "features", "key features") ||
        needCount(data.products, "products", "featured products") ||
        needCount(data.logos, "logos", "client logos")
      );
    case "featured": {
      const missing = data.fixtures.findIndex((item) => !item.scope?.trim() || !item.description?.trim());
      return (
        needText(data.behindText, "behindText", "Enter the behind text.") ||
        needText(data.title, "title", "Enter the title text.") ||
        needText(data.description, "description", "Enter the short description.") ||
        needCount(data.fixtures, "fixtures", "featured product") ||
        (missing > -1
          ? { field: "fixtures", message: `Featured product ${missing + 1} needs a “best for” line and a description.` }
          : null) ||
        needCount(data.points, "points", "featured points")
      );
    }
    case "comparison":
      return (
        needText(data.title, "title", "Enter the section title.") ||
        needText(data.description, "description", "Enter the short description.") ||
        needCount(data.rows, "rows", "comparison point")
      );
    case "videos":
      return (
        needText(data.heading, "heading", "Enter the section heading.") ||
        needText(data.subtext, "subtext", "Enter the section subtext.") ||
        needCount(data.items, "videos", "video")
      );
    case "testimonials":
      return needCount(data.items, "testimonials", "testimonial");
    default:
      return null;
  }
}
