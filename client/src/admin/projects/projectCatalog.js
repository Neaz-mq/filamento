import {
  IconArea,
  IconAward,
  IconBolt,
  IconBulb,
  IconChip,
  IconEllipsis,
  IconFactory,
  IconGauge,
  IconGrid,
  IconLampCeiling,
  IconLayers,
  IconLeaf,
  IconLens,
  IconSettings,
  IconShield,
  IconSliders,
  IconSun,
  IconTimer,
  IconUsers,
} from "../icons";

/* ===============================================================
   admin এর Projects অংশের তালিকা আর সীমা

   ⚠️ এটা শুধু ADMIN এর ফাইল. সাইটের (public) পাতার আলাদা ফাইল আছে:
     client/src/pages/projectCatalog.js
   দুটোকে এক করা যাবে না — এখানে icon component আছে (admin/icons),
   আর ওখানে ছবি/API এর কোড. admin এর কোড সাইটের bundle এ ঢোকানো যাবে না.

   ⚠️ নিচের তালিকা আর সীমা server এর সাথে মিলিয়ে রাখবেন:
     server/lib/projectSchema.js      (PROJECT_STATUSES, PROJECT_CATEGORIES,
                                        PROJECT_TYPES, PROJECT_ICONS, PROJECT_LIMITS)
     pages/projectCatalog.js          (PROJECT_TYPES)
     i18n/locales/*.json              (projects.categories.<key>)
   =============================================================== */

/* ---------------------------------------------------------------
   অবস্থা — draft সাইটে যায় না; in-progress আর completed published.
   tone → CSS class (pj-status--green / yellow / grey)
   color → ডোনাট আর বিন্দুর রং
   --------------------------------------------------------------- */
export const STATUSES = {
  draft: { label: "Draft", tone: "grey", color: "#b6bac0" },
  "in-progress": { label: "In Progress", tone: "yellow", color: "#f7be00" },
  completed: { label: "Completed", tone: "green", color: "#22c55e" },
};

// সাইটে যায় এমন অবস্থা (server এর LIVE_STATUSES)
const LIVE_STATUSES = ["in-progress", "completed"];

export const isLive = (status) => LIVE_STATUSES.includes(status);

/* ---------------------------------------------------------------
   Category — বড় ভাগ (server এর PROJECT_CATEGORIES এর ক্রমে)
   --------------------------------------------------------------- */
export const CATEGORIES = [
  { key: "industrial", label: "Industrial" },
  { key: "commercial", label: "Commercial" },
  { key: "retail", label: "Retail" },
  { key: "sports", label: "Sports" },
  { key: "education", label: "Education" },
  { key: "healthcare", label: "Healthcare" },
  { key: "hospitality", label: "Hospitality" },
  { key: "municipal", label: "Municipal" },
  { key: "agriculture", label: "Agriculture" },
];

/* ---------------------------------------------------------------
   Project Type — কোন ধরনের জায়গা (server এর PROJECT_TYPES এর ক্রমে).
   public সাইটের Projects পাতার filter এর key গুলোই
   --------------------------------------------------------------- */
export const PROJECT_TYPES = [
  { key: "airport", label: "Airport" },
  { key: "automotiveDealership", label: "Automotive Dealership" },
  { key: "church", label: "Church" },
  { key: "coldStorage", label: "Cold Storage" },
  { key: "conferenceCenter", label: "Conference Center" },
  { key: "conventionCenter", label: "Convention Center" },
  { key: "distributionCenter", label: "Distribution Center" },
  { key: "gymnasium", label: "Gymnasium" },
  { key: "manufacturing", label: "Manufacturing" },
  { key: "office", label: "Office" },
  { key: "retail", label: "Retail" },
  { key: "streetLights", label: "Street Lights" },
  { key: "warehouse", label: "Warehouse" },
  { key: "other", label: "Other" },
];

/* key থেকে লেখা — list হলো CATEGORIES বা PROJECT_TYPES.
   না পেলে key টাই দেখায় (ফাঁকা বাক্স না) */
export const labelOf = (list, key) => list.find((item) => item.key === key)?.label ?? key ?? "";

/* ---------------------------------------------------------------
   Key Features আর The Solution এর icon — নাম দিয়ে বাছা হয়, server এ শুধু
   নামটা যায়. ⚠️ নামগুলো server এর PROJECT_ICONS (আর সাইটের
   components/projects/ProjectIcons.jsx) এর সাথে একই রাখুন
   --------------------------------------------------------------- */
export const PROJECT_ICONS = {
  area: { label: "Area", Icon: IconArea },
  gauge: { label: "Performance", Icon: IconGauge },
  timer: { label: "Time", Icon: IconTimer },
  bolt: { label: "Energy", Icon: IconBolt },
  leaf: { label: "Eco", Icon: IconLeaf },
  sun: { label: "Light", Icon: IconSun },
  settings: { label: "Settings", Icon: IconSettings },
  grid: { label: "Layout", Icon: IconGrid },
  shield: { label: "Warranty", Icon: IconShield },
  award: { label: "Certified", Icon: IconAward },
  users: { label: "People", Icon: IconUsers },
  factory: { label: "Industrial", Icon: IconFactory },
};

// নাম না মিললে (পুরোনো/ভুল data) bolt
export const iconOf = (key) => (PROJECT_ICONS[key] ?? PROJECT_ICONS.bolt).Icon;

/* ---------------------------------------------------------------
   Product বাছার তালিকার বাঁ পাশের ক্যাটাগরির icon.
   key = admin/products/catalog.js এর CATEGORIES এর key; "" মানে "All Products".
   না মিললে .other ব্যবহার হয়
   --------------------------------------------------------------- */
export const PRODUCT_GROUP_ICONS = {
  "": IconLayers,
  "lamp-fixture": IconBulb,
  "luminaire-configurator": IconLampCeiling,
  "mounting-base": IconGrid,
  reflector: IconLens,
  "control-cap": IconChip,
  "lamp-accessory": IconSettings,
  "reflector-accessory": IconSliders,
  other: IconEllipsis,
};

/* ---------------------------------------------------------------
   লেখার সীমা — server এর PROJECT_LIMITS এর হুবহু একই.
   ⚠️ server এ বদলালে এখানেও বদলান (solutionIntro 1500, solutionText 600)
   --------------------------------------------------------------- */
export const PROJECT_LIMITS = {
  title: 100,
  company: 100,
  shortDescription: 200,
  location: 100,
  story: 2000,
  solutionIntro: 1500,
  images: 12,
  videoUrls: 10,
  keyFeatures: 8,
  featureText: 40,
  solutionFeatures: 12,
  solutionTitle: 60,
  solutionText: 600,
  highlights: 12,
  highlight: 120,
  ctaText: 40,
  url: 600,
  products: 40,
};