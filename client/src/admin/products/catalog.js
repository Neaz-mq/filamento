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

   ✅ অন্য category র Figma (Lamp Accessory, Reflector Accessory …) এলে শুধু
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

/* Reflector আর Control Cap (Figma: General, Certifications,
   Mechanical). General এ উপরে "Short Description *" আর নিচে
   তালিকা — publish এর আগে বিবরণটা লাগবে (descriptionRequired).
   দুই category র group একই, শুধু বিবরণের নমুনা লেখা আলাদা */
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

/* বাকি category গুলোর Figma এখনো আসেনি — ততদিন এই চারটা সাধারণ
   group. নকশা এলে প্রতিটা category র নিজের তালিকা বসবে */
const BASIC_GROUPS = [
  { id: "general", label: "General", Icon: IconSettings, kind: "list" },
  { id: "features", label: "Features", Icon: IconBolt, kind: "list" },
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
    specGroups: BASIC_GROUPS,
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
    specGroups: BASIC_GROUPS,
  },
  {
    key: "reflector-accessory",
    label: "Reflector Accessory",
    note: "Lenses, guards and covers that fit on a reflector.",
    art: "lens",
    specGroups: BASIC_GROUPS,
  },
  {
    key: "other",
    label: "Other",
    note: "Anything that does not fit the categories above.",
    art: "box",
    specGroups: BASIC_GROUPS,
  },
];

export const categoryOf = (key) =>
  CATEGORIES.find((category) => category.key === key) ?? CATEGORIES.at(-1);

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
