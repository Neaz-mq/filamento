import {
  IconActivity,
  IconAward,
  IconBattery,
  IconBolt,
  IconBox,
  IconClock,
  IconFactory,
  IconLayers,
  IconLeaf,
  IconSettings,
  IconShield,
  IconSliders,
  IconSun,
  IconThermometer,
  IconTrendUp,
} from "../icons";

/* ===============================================================
   Product এর নকশা — কোন category তে কোন Specification group,
   কোন ধরনের document, কত বড় লেখা চলবে

   ✅ কোনো category র Figma বদলালে শুধু
   এই ফাইলে ওই category র specGroups বদলাবেন — পাতার কোডে হাত
   দিতে হবে না.

   ⚠️ সীমাগুলো server/lib/productSchema.js এর সাথে মিলিয়ে রাখা.
   একটায় বদলালে অন্যটাতেও বদলাবেন
   =============================================================== */

export const LIMITS = {
  name: 100,
  shortDescription: 200,
  series: 60,
  color: 40,
  images: 12,
  videoUrls: 10,
  keyFeatures: 8,
  featureText: 40,
  specItems: 60,
  specItem: 300,
  groupDescription: 1000,
  tables: 6,
  columns: 12,
  rows: 60,
  cell: 200,
  videos: 20,
  videoTitle: 100,
  videoDescription: 300,
  documents: 30,
  documentName: 150,
  componentOptions: 30,
  componentCode: 24,
};

/* ---------------------------------------------------------------
   Upload এর সীমা — Cloudinary র free plan এর সীমার ভেতরে:
     ছবি 10MB, video 100MB, অন্য ফাইল (raw) 10MB.
   paid plan নিলে এখানে বাড়িয়ে দেবেন
   --------------------------------------------------------------- */
const MB = 1024 * 1024;

export const UPLOADS = {
  image: {
    maxBytes: 10 * MB,
    extensions: ["jpg", "jpeg", "png", "webp", "avif"],
    accept: "image/jpeg,image/png,image/webp,image/avif",
    hint: "JPG, PNG or WebP, up to 10 MB",
  },
  video: {
    maxBytes: 100 * MB,
    extensions: ["mp4", "mov", "webm", "m4v"],
    accept: "video/mp4,video/quicktime,video/webm,.m4v",
    hint: "MP4, MOV or WebM, up to 100 MB",
  },
  document: {
    maxBytes: 10 * MB,
    extensions: ["pdf", "ies", "ldt", "doc", "docx", "xls", "xlsx", "txt", "csv"],
    accept: ".pdf,.ies,.ldt,.doc,.docx,.xls,.xlsx,.txt,.csv",
    hint: "PDF, IES, DOC, XLS, TXT · Maximum file size: 10MB",
  },
  /* Home Page Content — Figma র লেখা অনুযায়ী ছবি 5 MB পর্যন্ত.
     logo তে SVG ও চলে (গ্রাহকের logo প্রায়ই SVG) */
  "site-image": {
    maxBytes: 5 * MB,
    extensions: ["jpg", "jpeg", "png", "webp", "avif"],
    accept: "image/jpeg,image/png,image/webp,image/avif",
    hint: "2000×2000px or higher. JPG, PNG or WebP, up to 5 MB",
  },
  "site-logo": {
    maxBytes: 5 * MB,
    extensions: ["svg", "png", "webp", "jpg", "jpeg", "avif"],
    accept: "image/svg+xml,image/png,image/webp,image/jpeg,image/avif",
    hint: "SVG or transparent PNG works best. Up to 5 MB",
  },
  "site-video": {
    maxBytes: 100 * MB,
    extensions: ["mp4", "mov", "webm", "m4v"],
    accept: "video/mp4,video/quicktime,video/webm,.m4v",
    hint: "MP4, MOV or WebM, up to 100 MB",
  },
};

/* ---------------------------------------------------------------
   Key Features এর icon — server এ শুধু নামটা যায়
   --------------------------------------------------------------- */
export const FEATURE_ICONS = {
  bolt: { label: "Energy", Icon: IconBolt },
  award: { label: "Certified", Icon: IconAward },
  shield: { label: "Warranty", Icon: IconShield },
  factory: { label: "Industrial", Icon: IconFactory },
  leaf: { label: "Eco", Icon: IconLeaf },
  sun: { label: "Light", Icon: IconSun },
  clock: { label: "Lifetime", Icon: IconClock },
  thermometer: { label: "Thermal", Icon: IconThermometer },
  settings: { label: "Settings", Icon: IconSettings },
  box: { label: "Package", Icon: IconBox },
};

/* ---------------------------------------------------------------
   Specification group

   kind:
     list        — এক লাইনের লেখার তালিকা (Features, Mechanical …)
     table       — একটা টেবিল (Lumen Maintenance)
     listTables  — তালিকা + এক বা একাধিক টেবিল (Electrical)
     textTable   — বিবরণ + টেবিল (Ballast Compatibility)
     textList    — বিবরণ + তালিকা (Reflector এর General).
                   descriptionRequired: true দিলে publish এর আগে
                   বিবরণ লাগবে, descriptionMax — কত অক্ষর
     components  — Configurator এর ধাপ আর option (ComponentsEditor).
                   এর তথ্য product.components এ থাকে, specs এ না

   columns: 2  — ছোট লেখা পাশাপাশি দুই কলামে (Applications, UL/DLC)
   --------------------------------------------------------------- */
const AMPS_TABLE = {
  title: "Amps @ Line Voltage (VAC)",
  caption: "VS",
  rowHeader: "Watt",
  columns: ["100V", "120V", "220V", "240V", "277V"],
  rows: [],
};

const LAMP_FIXTURE_GROUPS = [
  { id: "applications", label: "Applications", Icon: IconLayers, kind: "list", columns: 2 },
  { id: "general", label: "General", Icon: IconSettings, kind: "list" },
  { id: "features", label: "Features", Icon: IconBolt, kind: "list" },
  { id: "certifications", label: "Certifications", Icon: IconAward, kind: "list", columns: 2 },
  { id: "controlOptions", label: "Control Options", Icon: IconSliders, kind: "list" },
  { id: "mechanical", label: "Mechanical", Icon: IconSettings, kind: "list" },
  {
    id: "emergencyBattery",
    label: "Emerg. Battery",
    title: "Emergency Battery Option",
    Icon: IconBattery,
    kind: "list",
  },
  {
    id: "lumenMaintenance",
    label: "Lumen Maint.",
    title: "Lumen Maintenance",
    Icon: IconTrendUp,
    kind: "table",
    numbered: true,
    fixedColumns: true,
    template: {
      title: "Lumen Maintenance",
      caption: "",
      rowHeader: "Hours (Hrs)",
      columns: ["Lumen Maintenance (%)"],
      rows: [],
    },
  },
  {
    id: "electrical",
    label: "Electrical",
    Icon: IconActivity,
    kind: "listTables",
    template: AMPS_TABLE,
  },
  {
    id: "ballastCompatibility",
    label: "Ballast Compat.",
    title: "Ballast Compatibility",
    Icon: IconSettings,
    kind: "textTable",
    multiline: true,
    template: {
      title: "HID Ballast Compatibility",
      caption: "",
      rowHeader: "Type",
      columns: ["45-70W", "100W", "150W", "175W", "200W", "250W"],
      rows: [],
    },
  },
];

/* Mounting Base (Figma: General, Certifications, Mechanical,
   Electrical) — সবগুলোই সাধারণ তালিকা, Electrical এ টেবিল নেই */
const MOUNTING_BASE_GROUPS = [
  { id: "general", label: "General", Icon: IconSettings, kind: "list" },
  { id: "certifications", label: "Certifications", Icon: IconAward, kind: "list", columns: 2 },
  { id: "mechanical", label: "Mechanical", Icon: IconSettings, kind: "list" },
  { id: "electrical", label: "Electrical", Icon: IconActivity, kind: "list" },
];

/* Reflector, Control Cap আর Reflector Accessory (Figma: General,
   Certifications, Mechanical). General এ উপরে "Short Description *" আর নিচে
   তালিকা — publish এর আগে বিবরণটা লাগবে (descriptionRequired).
   তিন category র group একই, শুধু বিবরণের নমুনা লেখা আলাদা */
const describedGroups = (descriptionPlaceholder) => [
  {
    id: "general",
    label: "General",
    Icon: IconSettings,
    kind: "textList",
    descriptionRequired: true,
    descriptionMax: 500,
    descriptionPlaceholder,
  },
  { id: "certifications", label: "Certifications", Icon: IconAward, kind: "list", columns: 2 },
  { id: "mechanical", label: "Mechanical", Icon: IconSettings, kind: "list" },
];

const REFLECTOR_GROUPS = describedGroups(
  "The optional reflector is available to create a traditional high-bay aesthetic…",
);

const CONTROL_CAP_GROUPS = describedGroups(
  "What the control cap does and which lamps and systems it works with…",
);

const REFLECTOR_ACCESSORY_GROUPS = describedGroups(
  "What the accessory adds to the reflector and how it fits…",
);

/* Lamp Accessory আর Other (Figma: General, Certifications,
   Mechanical) — তিনটাই সাধারণ তালিকা, General এ কোনো বিবরণ নেই,
   Color ঘরও নেই. দুই category র group একই */
const PLAIN_GROUPS = [
  { id: "general", label: "General", Icon: IconSettings, kind: "list" },
  { id: "certifications", label: "Certifications", Icon: IconAward, kind: "list", columns: 2 },
  { id: "mechanical", label: "Mechanical", Icon: IconSettings, kind: "list" },
];

/* ---------------------------------------------------------------
   Color ঘরের পছন্দ (Figma: Mounting Base এ "White/Black").
   নতুন রং লাগলে এই তালিকায় যোগ করবেন
   --------------------------------------------------------------- */
export const COLORS = [
  "White",
  "Black",
  "White/Black",
  "Silver",
  "Grey",
  "Bronze",
];

/* ---------------------------------------------------------------
   Luminaire Configurator — "নিজের মতো বানাও" fixture (Figma নেই,
   বাকি category গুলোর নকশা মেনে বানানো)

   গ্রাহক ধাপে ধাপে অংশ বাছে: Lamp → Mounting Base → Reflector → …
   প্রতিটা ধাপে library র কয়েকটা product (option), তার একটা
   default. "Required" ধাপে গ্রাহককে কিছু একটা বাছতেই হবে.

   code — ordering code এর অংশ (LA1, HK, C7). সব default এর code
   মিলে পুরো build এর code: LA1-HK-C7

   ⚠️ server/lib/productSchema.js এর COMPONENT_STEPS এর সাথে মিলিয়ে
   রাখা. required এখানে শুধু নতুন product এর শুরুর মান — admin
   প্রতিটা ধাপে বদলাতে পারে
   --------------------------------------------------------------- */
export const CONFIGURATOR = "luminaire-configurator";

export const COMPONENT_STEPS = [
  { key: "lamp", category: "lamp-fixture", label: "Lamp", required: true },
  { key: "mountingBase", category: "mounting-base", label: "Mounting Base", required: true },
  { key: "reflector", category: "reflector", label: "Reflector", required: false },
  { key: "controlCap", category: "control-cap", label: "Control Cap", required: false },
  { key: "lampAccessory", category: "lamp-accessory", label: "Lamp Accessory", required: false },
  {
    key: "reflectorAccessory",
    category: "reflector-accessory",
    label: "Reflector Accessory",
    required: false,
  },
];

/* Configurator এর Specifications: প্রথমে Components (ধাপ আর
   option), তারপর পুরো build এর General, Certifications, Mechanical.
   আলাদা অংশের নিজের spec (wattage, মাপ …) ওই product এই থাকে */
const CONFIGURATOR_GROUPS = [
  { id: "components", label: "Components", Icon: IconLayers, kind: "components" },
  {
    id: "general",
    label: "General",
    Icon: IconSettings,
    kind: "textList",
    descriptionMax: 500,
    descriptionPlaceholder: "What this build is for and how the parts fit together…",
  },
  { id: "certifications", label: "Certifications", Icon: IconAward, kind: "list", columns: 2 },
  { id: "mechanical", label: "Mechanical", Icon: IconSettings, kind: "list" },
];

/* ---------------------------------------------------------------
   Category — Choose a Category modal এর ৮টা ঘর

   image — সাইটের Cloudinary র আসল ছবি (মূল পাতার Hero আর
           Fixtures অংশে যেগুলো আছে)
   art   — যেগুলোর ছবি এখনো নেই, সেখানে হাতে আঁকা ছোট ছবি
           (CategoryArt.jsx). designer ছবি দিলে image বসিয়ে দেবেন,
           art নিজে থেকেই সরে যাবে
   color — Product Info তে "Color" ঘর দেখাবে আর publish এর আগে
           লাগবে. server/lib/productSchema.js এর COLOR_CATEGORIES
           এও একই category রাখবেন
   --------------------------------------------------------------- */
const CLOUD = "https://res.cloudinary.com/dzi3u164c/image/upload/";
export const cloudImage = (path, width = 240) =>
  `${CLOUD}e_trim/c_limit,w_${width},f_auto,q_auto/${path}`;

export const CATEGORIES = [
  {
    key: "lamp-fixture",
    label: "Lamp/Fixture",
    note: "LED lamps and complete fixtures like LA1, LS1 and RH1.",
    image: cloudImage("v1789621178/image_7_wqtldv.png"),
    specGroups: LAMP_FIXTURE_GROUPS,
  },
  {
    key: "luminaire-configurator",
    label: "Luminaire Configurator",
    note: "Build-your-own fixtures made from a lamp, base and reflector.",
    image: cloudImage("v1789461131/card2_dxyfhj.webp"),
    specGroups: CONFIGURATOR_GROUPS,
  },
  {
    key: "mounting-base",
    label: "Mounting Base",
    note: "Hooks, bases and sockets that hold the lamp.",
    art: "mounting",
    color: true,
    specGroups: MOUNTING_BASE_GROUPS,
  },
  {
    key: "reflector",
    label: "Reflector",
    note: "Aluminium and polycarbonate reflectors that shape the beam.",
    art: "reflector",
    color: true,
    specGroups: REFLECTOR_GROUPS,
  },
  {
    key: "control-cap",
    label: "Control Cap",
    note: "Sensor and wireless control modules that sit on the lamp.",
    art: "cap",
    specGroups: CONTROL_CAP_GROUPS,
  },
  {
    key: "lamp-accessory",
    label: "Lamp Accessory",
    note: "Cords, cables, rings and other parts for the lamp.",
    image: cloudImage("v1789461212/card3_rcubwu.webp"),
    specGroups: PLAIN_GROUPS,
  },
  {
    key: "reflector-accessory",
    label: "Reflector Accessory",
    note: "Lenses, guards and covers that fit on a reflector.",
    art: "lens",
    specGroups: REFLECTOR_ACCESSORY_GROUPS,
  },
  {
    key: "other",
    label: "Other",
    note: "Anything that does not fit the categories above.",
    art: "box",
    specGroups: PLAIN_GROUPS,
  },
];

export const categoryOf = (key) =>
  CATEGORIES.find((category) => category.key === key) ?? CATEGORIES.at(-1);

/* ---------------------------------------------------------------
   সাইটের Products পাতার বাঁ পাশের Filters — প্রতিটা group এর মান.
   server এ শুধু key যায়; লেখা (label) এখান থেকে.

   ⚠️ একই তালিকা আরও দুই জায়গায়:
     server/lib/productSchema.js         (FILTER_GROUPS — কোন মান চলবে)
     client/src/pages/productCatalog.js  (সাইটের পাতা)
   key একবার চালু হলে বদলাবেন না — পুরনো product এ সেটাই রাখা আছে
   --------------------------------------------------------------- */
export const FILTER_GROUPS = [
  {
    key: "power",
    label: "Power",
    options: [
      { value: "up-to-100w", label: "Up to 100W" },
      { value: "101-200w", label: "101–200W" },
      { value: "201-300w", label: "201–300W" },
      { value: "301-400w", label: "301–400W" },
      { value: "over-400w", label: "Over 400W" },
    ],
  },
  {
    key: "cri",
    label: "CRI",
    options: [
      { value: "70", label: "70" },
      { value: "80", label: "80" },
      { value: "90", label: "90" },
    ],
  },
  {
    key: "cct",
    label: "CCT",
    options: [
      { value: "2200k", label: "2200K" },
      { value: "2700k", label: "2700K" },
      { value: "3000k", label: "3000K" },
      { value: "3500k", label: "3500K" },
      { value: "4000k", label: "4000K" },
      { value: "5000k", label: "5000K" },
    ],
  },
  {
    key: "lumens",
    label: "Lumens",
    options: [
      { value: "under-10k", label: "Under 10,000 lm" },
      { value: "10k-20k", label: "10,000–20,000 lm" },
      { value: "20k-30k", label: "20,000–30,000 lm" },
      { value: "30k-40k", label: "30,000–40,000 lm" },
      { value: "over-40k", label: "Over 40,000 lm" },
    ],
  },
  {
    key: "termination",
    label: "Termination",
    options: [
      { value: "e39", label: "E39 Mogul Base" },
      { value: "e26", label: "E26 Medium Base" },
      { value: "hardwired", label: "Hardwired" },
      { value: "cord-plug", label: "Cord & Plug" },
      { value: "twist-lock", label: "Twist-Lock Plug" },
    ],
  },
  {
    key: "controlModule",
    label: "Control Module",
    options: [
      { value: "non-dimming", label: "Non-dimming" },
      { value: "0-10v", label: "0–10V Dimming" },
      { value: "bluetooth", label: "Bluetooth Wireless" },
      { value: "occupancy", label: "Occupancy Sensor" },
      { value: "daylight", label: "Daylight Sensor" },
    ],
  },
];

/* ---------------------------------------------------------------
   Document এর ধরন — টেবিলের রঙিন pill
   --------------------------------------------------------------- */
export const DOC_TYPES = [
  { key: "installation-guide", label: "Installation Guide", tone: "blue" },
  { key: "ies", label: "IES File", tone: "yellow" },
  { key: "certificate", label: "Certificate", tone: "purple" },
  { key: "spec-sheet", label: "Spec Sheet", tone: "green" },
  { key: "warranty", label: "Warranty", tone: "teal" },
  { key: "other", label: "Other", tone: "grey" },
];

export const docTypeOf = (key) =>
  DOC_TYPES.find((type) => type.key === key) ?? DOC_TYPES.at(-1);

/* ফাইলের নাম দেখে ধরন আন্দাজ — admin চাইলে বদলাতে পারে */
export function guessDocType(fileName = "") {
  const name = fileName.toLowerCase();
  if (/\.(ies|ldt)$/.test(name)) return "ies";
  if (/install|mount|wiring|manual/.test(name)) return "installation-guide";
  if (/warrant/.test(name)) return "warranty";
  if (/cert|\bul\b|dlc|\bce\b|etl/.test(name)) return "certificate";
  if (/spec|datasheet|data-sheet|data_sheet/.test(name)) return "spec-sheet";
  return "";
}

/* ---------------------------------------------------------------
   ছোট সাহায্যকারী
   --------------------------------------------------------------- */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * MB ? 2 : 1)} MB`;
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");
  return `${String(minutes).padStart(2, "0")}:${rest}`;
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export const formatDate = (value) =>
  value ? dateFormat.format(new Date(value)) : "";

export const formatTime = (value) =>
  value ? timeFormat.format(new Date(value)) : "";

// "01." "02." — Figma র মতো দুই অঙ্কের ক্রমিক নম্বর
export const serial = (index) => `${String(index + 1).padStart(2, "0")}.`;
