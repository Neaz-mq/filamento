import {
  IconArea,
  IconAward,
  IconBolt,
  IconBox,
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
  IconLink,
  IconSettings,
  IconShield,
  IconSun,
  IconTimer,
  IconUsersGroup,
} from "../icons";

/* ===============================================================
   Project এর নকশা — অবস্থা, Category, Project Type, icon, সীমা

   ⚠️ server/lib/projectSchema.js এর সাথে মিলিয়ে রাখা. একটায় কিছু
   যোগ বা বদল করলে অন্যটাতেও করবেন

   ⚠️ এই ফাইলের প্রতিটা export একবারই থাকবে. পুরো লেখা দুইবার বসে
   গেলে Vite "Duplicated export" দেখিয়ে থেমে যায়
   =============================================================== */

export const PROJECT_LIMITS = {
  title: 100,
  company: 100,
  shortDescription: 200,
  location: 100,
  story: 2000,
  solutionIntro: 500,
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
  products: 40,
};

/* অবস্থা — draft সাইটে যায় না; In Progress আর Completed দুইটাই
   সাইটে দেখায়. রং Figma র Project Overview এর মতো */
export const STATUSES = {
  completed: { label: "Completed", tone: "green", color: "#22c55e" },
  "in-progress": { label: "In Progress", tone: "yellow", color: "#f7be00" },
  draft: { label: "Draft", tone: "grey", color: "#c1c2c3" },
};

export const isLive = (status) => status === "completed" || status === "in-progress";

/* Category — বড় ভাগ (Figma র টেবিলের নীল pill) */
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

/* Project Type — কোন ধরনের জায়গা. public Projects পাতার
   "environment" filter এর key গুলোই, তাই সাইটের সাথে মিলে যায় */
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

export const labelOf = (list, key) => list.find((item) => item.key === key)?.label ?? "";

/* Key Features আর The Solution এর icon — server এ শুধু নামটা যায় */
export const PROJECT_ICONS = {
  area: { label: "Area", Icon: IconArea },
  gauge: { label: "Savings", Icon: IconGauge },
  timer: { label: "Lifetime", Icon: IconTimer },
  bolt: { label: "Energy", Icon: IconBolt },
  leaf: { label: "Eco", Icon: IconLeaf },
  sun: { label: "Light", Icon: IconSun },
  settings: { label: "Maintenance", Icon: IconSettings },
  grid: { label: "Versatile", Icon: IconGrid },
  shield: { label: "Safety", Icon: IconShield },
  award: { label: "Award", Icon: IconAward },
  users: { label: "People", Icon: IconUsersGroup },
  factory: { label: "Industrial", Icon: IconFactory },
};

export const iconOf = (key) => (PROJECT_ICONS[key] ?? PROJECT_ICONS.bolt).Icon;

/* Product Used এর বাঁ পাশের তালিকা — product এর category ধরে
   (Figma র icon এর মতো). Home Page Content এর "Add 3 Fixtures"
   modal ও এটা ব্যবহার করে */
export const PRODUCT_GROUP_ICONS = {
  "": IconGrid,
  "lamp-fixture": IconBulb,
  "luminaire-configurator": IconLayers,
  "mounting-base": IconLampCeiling,
  reflector: IconLens,
  "control-cap": IconChip,
  "lamp-accessory": IconLink,
  "reflector-accessory": IconBox,
  other: IconEllipsis,
};