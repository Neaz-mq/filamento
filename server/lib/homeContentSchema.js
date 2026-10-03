import crypto from "node:crypto";

/* ===============================================================
   Home Page Content — admin এর "Home Page Content" পাতার নিয়ম

   পাঁচটা ধাপ (Figma র উপরের ট্যাব):
     hero          Hero ছবি, Key Features, Featured Products (৩টা কার্ড),
                   Client Logos
     featured      "Three Fixtures" অংশ — পেছনের লেখা, শিরোনাম,
                   ৩টা product আর Featured Points
     comparison    Traditional LED বনাম Filamento টেবিল
     videos        Technologies এর video গুলো
     testimonials  গ্রাহকের মতামত

   প্রতিটা ধাপ আলাদা করে save হয়. যে ধাপ কখনো save হয়নি, সেখানে
   DEFAULT_HOME — অর্থাৎ এখনকার landing page এ যা দেখা যায় হুবহু
   সেটাই (landing page এর কোড ছোঁয়া হয়নি, শুধু লেখাগুলো এখানে আনা)

   browser থেকে আসা সব কিছু এখানে যাচাই হয়: লেখার দৈর্ঘ্য, link,
   ছবির ঠিকানা, তালিকার সংখ্যা. ভুল হলে Invalid (400)
   =============================================================== */

export const HOME_STEPS = ["hero", "featured", "comparison", "videos", "testimonials"];

export const HOME_STEP_LABELS = {
  hero: "Hero",
  featured: "Featured Products",
  comparison: "Comparison",
  videos: "Videos",
  testimonials: "Testimonials",
};

// Cloudinary তে site এর ছবি/video এই ফোল্ডারে (product/project থেকে আলাদা)
export const SITE_UPLOAD_ROOT = "filamento/site";

// প্রতিটা তালিকায় সর্বনিম্ন আর সর্বোচ্চ কয়টা
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

// লেখার সর্বোচ্চ দৈর্ঘ্য — client এর counter (34/100) একই সংখ্যা দেখায়
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

/* Key Features আর Featured Points এর icon. admin বেছে নেয় না —
   শিরোনাম দেখে client নিজে ঠিক করে (homeShape.js), এখানে শুধু তালিকা */
export const HOME_ICONS = [
  "energy",
  "warranty",
  "madeIn",
  "certified",
  "listed",
  "maintenance",
  "visibility",
  "glare",
  "installation",
  "roi",
  "spark",
];

/* ---------------------------------------------------------------
   যাচাইয়ের ছোট সাহায্যকারী
   --------------------------------------------------------------- */
export class Invalid extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

const fail = (message) => {
  throw new Invalid(message);
};

const text = (value, max, label, { required = true, multiline = false } = {}) => {
  if (value === undefined || value === null) value = "";
  if (typeof value !== "string" && typeof value !== "number") fail(`${label} must be text.`);
  let clean = String(value).trim();
  clean = multiline
    ? clean.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n")
    : clean.replace(/\s+/g, " ");
  if (required && !clean) fail(`${label} is required.`);
  if (clean.length > max) fail(`${label} can be at most ${max} characters.`);
  return clean;
};

const list = (value, key, label) => {
  const { min, max } = HOME_LISTS[key];
  if (value === undefined || value === null) value = [];
  if (!Array.isArray(value)) fail(`${label} must be a list.`);
  if (value.length < min) fail(`Add at least ${min} ${label.toLowerCase()}.`);
  if (value.length > max) fail(`${label} can have at most ${max} items.`);
  return value;
};

/* প্রতিটা সারির একটা স্থির id — React এর key আর টেনে সাজানোর জন্য.
   না থাকলে নতুন একটা */
const itemId = (value) =>
  typeof value === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(value)
    ? value
    : crypto.randomUUID().replace(/-/g, "").slice(0, 12);

const httpsUrl = (value, label) => {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${label} is not a valid link.`);
  }
  if (parsed.protocol !== "https:") fail(`${label} must start with https://`);
  return parsed.toString();
};

/* link — সাইটের ভেতরের পথ (/products) অথবা https.
   "//" দিয়ে শুরু হলে সেটা আসলে অন্য সাইট, তাই বাতিল */
const siteLink = (value, label, { required = true } = {}) => {
  const clean = text(value, HOME_LIMITS.url, label, { required });
  if (!clean) return "";
  if (clean.startsWith("/")) {
    if (clean.startsWith("//") || /\s/.test(clean)) fail(`${label} is not a valid link.`);
    return clean;
  }
  return httpsUrl(clean, label);
};

// শুধু আমাদের site ফোল্ডারের Cloudinary ফাইল — অন্যগুলো কখনো মোছা হবে না
const publicId = (value) =>
  typeof value === "string" &&
  /^[\w\-./]{1,220}$/.test(value) &&
  value.startsWith(`${SITE_UPLOAD_ROOT}/`)
    ? value
    : "";

/* ছবি বা video: { url, publicId }. url হয় https, নয়তো সাইটের নিজের
   ফাইল ("/brand-logos/airbus.svg") */
const media = (value, label, { required = true } = {}) => {
  const url = typeof value?.url === "string" ? value.url.trim() : "";
  if (!url) {
    if (required) fail(`${label} is required.`);
    return null;
  }
  if (url.length > HOME_LIMITS.url) fail(`${label} link is too long.`);
  const clean = url.startsWith("/") && !url.startsWith("//")
    ? (/^\/[\w\-./%]+$/.test(url) ? url : fail(`${label} is not a valid link.`))
    : httpsUrl(url, label);
  return { url: clean, publicId: publicId(value?.publicId) };
};

const icon = (value) => (HOME_ICONS.includes(value) ? value : "spark");

// ১ থেকে ৫, এক দশমিক পর্যন্ত (4.5, 4.8)
const rating = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1 || number > 5) fail("Rating must be between 1 and 5.");
  return Math.round(number * 10) / 10;
};

const productIdText = (value, label) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value)
    ? value.toLowerCase()
    : fail(`${label}: choose a product.`);

const L = HOME_LIMITS;

/* ---------------------------------------------------------------
   প্রতিটা ধাপ
   --------------------------------------------------------------- */
const CLEANERS = {
  hero(body) {
    return {
      slides: list(body.slides, "slides", "Hero sections").map((item, i) => ({
        id: itemId(item?.id),
        image: media(item?.image, `Hero ${i + 1} image`),
        label: text(item?.label, L.label, `Hero ${i + 1} level text`),
        title: text(item?.title, L.heroTitle, `Hero ${i + 1} title`),
        description: text(item?.description, L.heroDescription, `Hero ${i + 1} description`, {
          multiline: true,
        }),
      })),
      features: list(body.features, "features", "Key features").map((item, i) => ({
        id: itemId(item?.id),
        icon: icon(item?.icon),
        title: text(item?.title, L.featureTitle, `Key feature ${i + 1} title`),
        subtitle: text(item?.subtitle, L.featureSubtitle, `Key feature ${i + 1} sub title`),
      })),
      products: list(body.products, "products", "Featured products").map((item, i) => ({
        id: itemId(item?.id),
        image: media(item?.image, `Featured product ${i + 1} image`),
        title: text(item?.title, L.cardTitle, `Featured product ${i + 1} title`),
        subtitle: text(item?.subtitle, L.cardSubtitle, `Featured product ${i + 1} sub title`),
        link: siteLink(item?.link, `Featured product ${i + 1} link`, { required: false }) || "/products",
      })),
      logos: list(body.logos, "logos", "Client logos").map((item, i) => ({
        id: itemId(item?.id),
        image: media(item?.image, `Logo ${i + 1} image`),
        name: text(item?.name, L.logoName, `Logo ${i + 1} company name`),
      })),
    };
  },

  featured(body) {
    const fixtures = list(body.fixtures, "fixtures", "Fixtures").map((item, i) => ({
      id: itemId(item?.id),
      productId: productIdText(item?.productId, `Fixture ${i + 1}`),
      scope: text(item?.scope, L.scope, `Fixture ${i + 1} scope`),
      description: text(item?.description, L.fixtureDescription, `Fixture ${i + 1} description`, {
        multiline: true,
      }),
    }));
    if (new Set(fixtures.map((item) => item.productId)).size !== fixtures.length) {
      fail("The same product is chosen twice.");
    }

    return {
      behindText: text(body.behindText, L.behindText, "Behind text"),
      title: text(body.title, L.sectionTitle, "Title text"),
      description: text(body.description, L.shortDescription, "Short description", {
        multiline: true,
      }),
      fixtures,
      points: list(body.points, "points", "Featured points").map((item, i) => ({
        id: itemId(item?.id),
        icon: icon(item?.icon),
        title: text(item?.title, L.pointTitle, `Point ${i + 1} title`),
        text: text(item?.text, L.pointText, `Point ${i + 1} text`, { multiline: true }),
      })),
    };
  },

  comparison(body) {
    return {
      title: text(body.title, L.sectionTitle, "Section title"),
      description: text(body.description, L.longDescription, "Short description", {
        multiline: true,
      }),
      rows: list(body.rows, "rows", "Comparison points").map((item, i) => ({
        id: itemId(item?.id),
        metric: text(item?.metric, L.cell, `Row ${i + 1} feature / metric`),
        traditional: text(item?.traditional, L.cell, `Row ${i + 1} traditional LED`),
        filamento: text(item?.filamento, L.cell, `Row ${i + 1} Filamento`),
      })),
    };
  },

  videos(body) {
    return {
      heading: text(body.heading, L.sectionTitle, "Section heading"),
      subtext: text(body.subtext, L.longDescription, "Section subtext", { multiline: true }),
      items: list(body.items, "videos", "Videos").map((item, i) => ({
        id: itemId(item?.id),
        video: media(item?.video, `Video ${i + 1}`),
        cover: media(item?.cover, `Video ${i + 1} cover`, { required: false }),
        title: text(item?.title, L.videoTitle, `Video ${i + 1} title`),
        description: text(item?.description, L.videoDescription, `Video ${i + 1} description`, {
          multiline: true,
        }),
      })),
    };
  },

  testimonials(body) {
    return {
      items: list(body.items, "testimonials", "Testimonials").map((item, i) => ({
        id: itemId(item?.id),
        image: media(item?.image, `Testimonial ${i + 1} image`),
        name: text(item?.name, L.personName, `Testimonial ${i + 1} client name`),
        designation: text(item?.designation, L.designation, `Testimonial ${i + 1} designation`),
        company: text(item?.company, L.company, `Testimonial ${i + 1} company name`),
        projectName: text(item?.projectName, L.projectName, `Testimonial ${i + 1} project name`),
        projectLink: siteLink(item?.projectLink, `Testimonial ${i + 1} project link`),
        rating: rating(item?.rating),
        quote: text(item?.quote, L.quote, `Testimonial ${i + 1} quote`, { multiline: true }),
      })),
    };
  },
};

/* একটা ধাপ যাচাই. ঠিক থাকলে { value }, ভুল হলে { error } */
export function cleanHomeStep(step, body) {
  if (!Object.hasOwn(CLEANERS, step)) return { error: "Unknown section." };
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Nothing to save." };
  }
  try {
    return { value: CLEANERS[step](body) };
  } catch (error) {
    if (error instanceof Invalid) return { error: error.message };
    throw error;
  }
}

/* একটা ধাপের ভেতরের সব Cloudinary ফাইল — save এর পর যেগুলো আর
   নেই সেগুলো মোছার জন্য */
export function homeStepAssets(data) {
  const found = [];
  const walk = (value, resourceType) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach((item) => walk(item, resourceType));
    if (typeof value.publicId === "string" && publicId(value.publicId)) {
      found.push({ publicId: value.publicId, resourceType });
    }
    for (const [key, child] of Object.entries(value)) {
      if (key !== "publicId") walk(child, key === "video" ? "video" : resourceType);
    }
  };
  walk(data, "image");
  return found;
}

/* ---------------------------------------------------------------
   DEFAULT_HOME — এখনকার landing page এর লেখা আর ছবি
   (Hero.jsx, Brands.jsx, Fixtures.jsx, Comparison.jsx,
   Technologies.jsx, Testimonial.jsx আর en.json থেকে)
   --------------------------------------------------------------- */
const CDN = "https://res.cloudinary.com/dzi3u164c/image/upload";
const img = (path) => ({ url: `${CDN}/${path}`, publicId: "" });
const AVATAR = img("v1789637818/a73e9b59e7a15dc477a605d52bd4add7b91a67a9_pewd5s.jpg");

export const DEFAULT_HOME = {
  hero: {
    slides: [
      {
        id: "hero-main",
        image: img("v1789466783/hero-optimised_dtyrew.webp"),
        label: "Industrial LED · Made in the USA",
        title: "Brighter Light. Half the Energy.",
        description:
          "Improve your lighting performance and cut operating costs up to 50% with the LA1, LS1 and RH1 Series.",
      },
    ],
    features: [
      { id: "energy", icon: "energy", title: "Up to 60%", subtitle: "Energy Saving" },
      { id: "warranty", icon: "warranty", title: "5 Year", subtitle: "Warranty" },
      { id: "madeIn", icon: "madeIn", title: "Made in", subtitle: "USA" },
      { id: "certified", icon: "certified", title: "DLC Premium", subtitle: "Certified" },
      { id: "listed", icon: "listed", title: "DL", subtitle: "Listed" },
    ],
    products: [
      {
        id: "high-bay",
        image: img("v1789539354/image_7_ep6gnv.png"),
        title: "High Bay Series",
        subtitle: "Browse Professional High Bay Lighting Solutions",
        link: "/products?category=lamp-fixture",
      },
      {
        id: "build-fixture",
        image: img("v1789461131/card2_dxyfhj.webp"),
        title: "Build Fixture",
        subtitle: "Customize Your Fixture with Compatible Components",
        link: "/products?category=luminaire-configurator",
      },
      {
        id: "optional-parts",
        image: img("v1789461212/card3_rcubwu.webp"),
        title: "Optional Parts",
        subtitle: "Complete Your Setup with Essential Accessories",
        link: "/products?category=lamp-accessory",
      },
    ],
    // landing এর src/assets/logo এর একই SVG, client/public/brand-logos এ কপি
    logos: [
      { id: "prologis", image: { url: "/brand-logos/prologis.svg", publicId: "" }, name: "Prologis" },
      { id: "caterpillar", image: { url: "/brand-logos/caterpillar.svg", publicId: "" }, name: "Caterpillar" },
      { id: "toshiba", image: { url: "/brand-logos/toshiba.svg", publicId: "" }, name: "Toshiba" },
      {
        id: "anheuser-busch",
        image: { url: "/brand-logos/anheuser-busch.svg", publicId: "" },
        name: "Anheuser-Busch",
      },
      { id: "airbus", image: { url: "/brand-logos/airbus.svg", publicId: "" }, name: "Airbus" },
      {
        id: "bobs",
        image: { url: "/brand-logos/bobs-discount-furniture.svg", publicId: "" },
        name: "Bob's Discount Furniture",
      },
    ],
  },

  featured: {
    behindText: "Fixtures",
    title: "Three Fixtures. One Complete Solution.",
    description:
      "Modular lamps, reflectors, mounts, and control caps — configure the exact luminaire your ceiling height and layout demand.",
    /* productId খালি — database এ LA1/LS1/RH1 এর slug দেখে বসানো হয়
       (siteContentRoutes.js → fillDefaultFixtures) */
    fixtures: [
      {
        id: "la1",
        productId: "",
        series: "la1",
        scope: "High-Aisle Racking, Fabrication Bays, Process Lines",
        description:
          "Targeted Optimization: Patented, linear low-glare optics enable up to 50% fewer fixtures and a 50% reduction in energy use.",
      },
      {
        id: "ls1",
        productId: "",
        series: "ls1",
        scope: "Staging Areas, Loading Docks, & Open Stacks",
        description:
          "Integrated High-Area Optimization: Uniform, high-output lighting designed for high-traffic, open floor plans.",
      },
      {
        id: "rh1",
        productId: "",
        series: "rh1",
        scope: "High Occupancy, Industrial, Commercial & Retail",
        description:
          "Three-Pathway Optical Design: Downward, vertical, and uplight distribution brightens walls and racks, and reduces glare.",
      },
    ],
    points: [
      {
        id: "energy",
        icon: "energy",
        title: "Up to 50% Lower Energy",
        text: "Precision optics and non-relay dimming slash kWh without sacrificing output.",
      },
      {
        id: "maintenance",
        icon: "maintenance",
        title: "Less Maintenance",
        text: "Sealed housings and 100,000-hour LEDs remove ladders from your OpEx.",
      },
      {
        id: "visibility",
        icon: "visibility",
        title: "Better Visibility",
        text: "Higher CRI and uniformity improve accuracy, safety, and worker comfort.",
      },
      {
        id: "glare",
        icon: "glare",
        title: "Reduced Glare",
        text: "Patented reflectors deliver crisp light where you need it — nowhere else.",
      },
      {
        id: "installation",
        icon: "installation",
        title: "Faster Installation",
        text: "Lightweight fixtures and pre-configured mounts cut labor hours in half.",
      },
      {
        id: "roi",
        icon: "roi",
        title: "Higher ROI",
        text: "Most facilities see payback in 18 months — often faster with rebates.",
      },
    ],
  },

  comparison: {
    title: "A different class of industrial LED.",
    description:
      "We build our fixtures — optics, driver, dimming — in-house. The result is measurably better performance than off-the-shelf commercial LED.",
    rows: [
      { id: "energy", metric: "Energy savings vs HID", traditional: "20-30%", filamento: "Up to 50%" },
      {
        id: "dimming",
        metric: "Dimming technology",
        traditional: "Relay-based (click, wear)",
        filamento: "Silent non-relay control",
      },
      { id: "glare", metric: "Glare (UGR)", traditional: "> 25", filamento: "< 19" },
      { id: "lifetime", metric: "Lifetime", traditional: "50,000 hrs", filamento: "100,000+ hrs" },
      { id: "warranty", metric: "Warranty", traditional: "2-3 years", filamento: "5 years" },
      {
        id: "design",
        metric: "Custom lighting design",
        traditional: "Not included",
        filamento: "Free with quote",
      },
    ],
  },

  videos: {
    heading: "Every fixture is a research project",
    subtext:
      "Explore the technologies behind superior illumination, energy efficiency, and long-lasting reliability.",
    items: [
      {
        id: "thermal",
        video: {
          url: "https://www.filamento.com/wp-content/uploads/2026/07/RH1_Animation_Final_02_compressed.mp4",
          publicId: "",
        },
        cover: img("v1789621338/Additional_0001_1779697023_1_taubuk.png"),
        title: "Thermal Management",
        description: "Cooler-running design that protects the LEDs and extends fixture life.",
      },
      {
        id: "optical",
        video: {
          url: "https://www.filamento.com/wp-content/uploads/2026/06/10467854031752108853_compressed.mp4",
          publicId: "",
        },
        cover: img("v1789628672/8f7e17c86d7e55308fb2c4aa5e59b763e23cc115_zcjucz.png"),
        title: "Superior Optical Distribution",
        description: "Clean, balanced lighting that outperforms conventional fixtures.",
      },
      {
        id: "driver",
        video: {
          url: "https://www.filamento.com/wp-content/plugins/Tot/upload/resources/VIDEOS/INSV_ACC-005-PT1-000-FL_230907.mp4",
          publicId: "",
        },
        cover: img("v1789471643/fix3_yeppeq.webp"),
        title: "Driver Technology",
        description: "Silent, non-relay dimming with steady, flicker-free output.",
      },
    ],
  },

  testimonials: {
    items: [
      {
        id: "marcus",
        image: AVATAR,
        name: "Marcus L.",
        designation: "Facility Manager",
        company: "Cold Storage",
        projectName: "Cold Storage Projects",
        projectLink: "/projects?category=coldStorage",
        rating: 4.5,
        quote:
          "The custom layout process alone saved us thousands. We knew exactly what we were installing before a single fixture arrived.",
      },
      {
        id: "frank",
        image: AVATAR,
        name: "Frank S.",
        designation: "Facility Manager",
        company: "Cold Storage",
        projectName: "Distribution Center Projects",
        projectLink: "/projects?category=distributionCenter",
        rating: 4,
        quote:
          "Switching to the RH1 series cut our lighting energy use almost in half without losing a single lux on the floor.",
      },
      {
        id: "david",
        image: AVATAR,
        name: "David R.",
        designation: "Plant Manager",
        company: "Manufacturing",
        projectName: "Manufacturing Projects",
        projectLink: "/projects?category=manufacturing",
        rating: 4.8,
        quote:
          "Filamento's team walked our whole facility before quoting anything. The fixture schedule they handed back matched exactly what got installed.",
      },
      {
        id: "elena",
        image: AVATAR,
        name: "Elena M.",
        designation: "Operations Director",
        company: "Warehousing",
        projectName: "Warehouse Projects",
        projectLink: "/projects?category=warehouse",
        rating: 4.6,
        quote: "Five years in and the warranty support has been just as responsive as the sales process was.",
      },
    ],
  },
};
