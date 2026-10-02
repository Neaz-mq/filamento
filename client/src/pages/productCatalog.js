/* ===============================================================
   সাইটের Products পাতা আর Product Details পাতার নকশা-তথ্য

   admin এর client/src/admin/products/catalog.js এর মতোই, কিন্তু
   আলাদা ফাইল — কারণ admin এর কোড সাইটের bundle এ ঢোকানো যাবে না
   (App.jsx এর নিয়ম). এখানে শুধু দর্শকের যা লাগে: category র নাম আর
   ছবি, Specification এর group গুলোর ক্রম আর শিরোনাম, Filters এর মান.

   ⚠️ মিলিয়ে রাখবেন:
     category র key আর ক্রম   → server/lib/productSchema.js (CATEGORIES)
     Filters এর মান           → server/lib/productSchema.js (FILTER_GROUPS)
                                আর admin/products/catalog.js (FILTER_GROUPS)
     Specification group এর id → admin/products/catalog.js (specGroups)
   =============================================================== */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { api } from "../lib/api";

const CLOUD = "https://res.cloudinary.com/dzi3u164c/image/upload/";

/* ---------------------------------------------------------------
   ছবি — Cloudinary র ছবিকে দরকারি মাপে নামানো

   admin থেকে তোলা ছবি পুরো মাপে (কয়েক MB) থাকে. ঠিকানায়
   c_limit,w_…,f_auto,q_auto বসালে Cloudinary নিজেই ছোট করে আর
   browser অনুযায়ী WebP/AVIF দেয় — পাতা অনেক হালকা হয়.

   ঠিকানায় আগে থেকেই কোনো বদল (e_trim/… ) থাকলে বা অন্য কোনো
   সাইটের ছবি হলে যেমন আছে তেমনই ফেরত দেয়
   --------------------------------------------------------------- */
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;

export function sizedImage(url, width) {
  if (!url) return "";
  const match = CLOUDINARY_UPLOAD.exec(url);
  if (!match) return url;
  return `${match[1]}c_limit,w_${width},f_auto,q_auto/${match[2]}`;
}

/* srcset — একই ছবি কয়েকটা মাপে; browser পর্দা দেখে ঠিকটা নামায়.
   Cloudinary ছাড়া অন্য ছবিতে srcset দেওয়ার মানে নেই */
export function imageSrcSet(url, widths) {
  if (!url || !CLOUDINARY_UPLOAD.test(url)) return undefined;
  return widths.map((width) => `${sizedImage(url, width)} ${width}w`).join(", ");
}

const categoryImage = (path) => `${CLOUD}e_trim/c_limit,w_160,f_auto,q_auto/${path}`;

/* ---------------------------------------------------------------
   Category — উপরের slider এর ঘর, ক্রম server এর CATEGORIES এর মতো

   image — সাইটের নিজের ছবি. যেগুলোর এখনো নেই সেখানে art (হাতে
           আঁকা ছবি, components/products/CategoryArt.jsx). designer
           ছবি দিলে image বসালেই art আর দেখাবে না
   watermark — Product Details এর বড় ছবির পেছনের হালকা লেখা
           (Figma: "FIXTURES")
   --------------------------------------------------------------- */
export const ALL_CATEGORY = {
  key: "",
  labelKey: "productsPage.categories.all",
  image: categoryImage("v1789471643/fix3_yeppeq.webp"),
};

export const CATEGORIES = [
  {
    key: "lamp-fixture",
    labelKey: "productsPage.categories.lampFixture",
    familyKey: "productsPage.families.lampFixture",
    image: categoryImage("v1789621178/image_7_wqtldv.png"),
    watermark: "Fixtures",
  },
  {
    key: "luminaire-configurator",
    labelKey: "productsPage.categories.luminaireConfigurator",
    familyKey: "productsPage.families.luminaireConfigurator",
    image: categoryImage("v1789461131/card2_dxyfhj.webp"),
    watermark: "Builds",
  },
  {
    key: "mounting-base",
    labelKey: "productsPage.categories.mountingBase",
    familyKey: "productsPage.families.mountingBase",
    art: "mounting",
    watermark: "Mounts",
  },
  {
    key: "reflector",
    labelKey: "productsPage.categories.reflector",
    familyKey: "productsPage.families.reflector",
    art: "reflector",
    watermark: "Optics",
  },
  {
    key: "control-cap",
    labelKey: "productsPage.categories.controlCap",
    familyKey: "productsPage.families.controlCap",
    art: "cap",
    watermark: "Controls",
  },
  {
    key: "lamp-accessory",
    labelKey: "productsPage.categories.lampAccessory",
    familyKey: "productsPage.families.lampAccessory",
    image: categoryImage("v1789461212/card3_rcubwu.webp"),
    watermark: "Parts",
  },
  {
    key: "reflector-accessory",
    labelKey: "productsPage.categories.reflectorAccessory",
    familyKey: "productsPage.families.reflectorAccessory",
    art: "lens",
    watermark: "Optics",
  },
  {
    key: "other",
    labelKey: "productsPage.categories.other",
    familyKey: "productsPage.families.other",
    art: "box",
    watermark: "Parts",
  },
];

export const categoryOf = (key) =>
  CATEGORIES.find((category) => category.key === key) ?? CATEGORIES.at(-1);

export const CATEGORY_ORDER = Object.fromEntries(
  CATEGORIES.map((category, index) => [category.key, index]),
);

/* ---------------------------------------------------------------
   Filters — বাঁ পাশের group গুলো (Figma: Power, CRI, CCT, Lumens,
   Termination, Control Module).

   value — server এ রাখা মান (বদলাবেন না)
   label — সবার জন্য একই লেখা (সংখ্যা), নাহলে labelKey (অনুবাদ)
   --------------------------------------------------------------- */
export const FILTER_GROUPS = [
  {
    key: "power",
    labelKey: "productsPage.filters.groups.power",
    options: [
      { value: "up-to-100w", labelKey: "productsPage.filters.options.upTo100w" },
      { value: "101-200w", label: "101–200W" },
      { value: "201-300w", label: "201–300W" },
      { value: "301-400w", label: "301–400W" },
      { value: "over-400w", labelKey: "productsPage.filters.options.over400w" },
    ],
  },
  {
    key: "cri",
    labelKey: "productsPage.filters.groups.cri",
    options: [
      { value: "70", label: "70" },
      { value: "80", label: "80" },
      { value: "90", label: "90" },
    ],
  },
  {
    key: "cct",
    labelKey: "productsPage.filters.groups.cct",
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
    labelKey: "productsPage.filters.groups.lumens",
    options: [
      { value: "under-10k", labelKey: "productsPage.filters.options.under10k" },
      { value: "10k-20k", label: "10K–20K lm" },
      { value: "20k-30k", label: "20K–30K lm" },
      { value: "30k-40k", label: "30K–40K lm" },
      { value: "over-40k", labelKey: "productsPage.filters.options.over40k" },
    ],
  },
  {
    key: "termination",
    labelKey: "productsPage.filters.groups.termination",
    options: [
      { value: "e39", labelKey: "productsPage.filters.options.e39" },
      { value: "e26", labelKey: "productsPage.filters.options.e26" },
      { value: "hardwired", labelKey: "productsPage.filters.options.hardwired" },
      { value: "cord-plug", labelKey: "productsPage.filters.options.cordPlug" },
      { value: "twist-lock", labelKey: "productsPage.filters.options.twistLock" },
    ],
  },
  {
    key: "controlModule",
    labelKey: "productsPage.filters.groups.controlModule",
    options: [
      { value: "non-dimming", labelKey: "productsPage.filters.options.nonDimming" },
      { value: "0-10v", labelKey: "productsPage.filters.options.dimming010v" },
      { value: "bluetooth", labelKey: "productsPage.filters.options.bluetooth" },
      { value: "occupancy", labelKey: "productsPage.filters.options.occupancy" },
      { value: "daylight", labelKey: "productsPage.filters.options.daylight" },
    ],
  },
];

export const optionLabel = (t, option) => (option.labelKey ? t(option.labelKey) : option.label);

/* ---------------------------------------------------------------
   সাজানো (Sort by) — Figma র ছয়টা
   --------------------------------------------------------------- */
export const SORTS = [
  { key: "default", labelKey: "productsPage.sort.default" },
  { key: "featured", labelKey: "productsPage.sort.featured" },
  { key: "newest", labelKey: "productsPage.sort.newest" },
  { key: "popular", labelKey: "productsPage.sort.popular" },
  { key: "name-asc", labelKey: "productsPage.sort.nameAsc" },
  { key: "name-desc", labelKey: "productsPage.sort.nameDesc" },
];

/* ---------------------------------------------------------------
   Specification এর group — বাঁ পাশের তালিকার ক্রম আর শিরোনাম.

   admin যেকোনো category তে যা যা ভরেছে সব এখানে ক্রমে আসে;
   যেটা ফাঁকা সেটা পাতায় দেখায় না. নতুন group যোগ হলে এখানে
   একটা সারি দেবেন (না দিলেও তালিকার শেষে নিজের নামেই দেখাবে)

   layout:
     list   — বিন্দু দেওয়া তালিকা, দুই কলামে (Figma)
     hours  — Lumen Maintenance এর টেবিল আড়াআড়ি করে: উপরে "Hours",
              তারপর ঘণ্টার সারি, তারপর % এর সারি
   --------------------------------------------------------------- */
export const SPEC_GROUPS = [
  { id: "components", labelKey: "productsPage.spec.groups.components" },
  { id: "applications", labelKey: "productsPage.spec.groups.applications" },
  { id: "general", labelKey: "productsPage.spec.groups.general" },
  { id: "features", labelKey: "productsPage.spec.groups.features" },
  {
    id: "certifications",
    labelKey: "productsPage.spec.groups.certifications",
    titleKey: "productsPage.spec.groups.certificationsTitle",
  },
  { id: "controlOptions", labelKey: "productsPage.spec.groups.controlOptions" },
  { id: "mechanical", labelKey: "productsPage.spec.groups.mechanical" },
  { id: "emergencyBattery", labelKey: "productsPage.spec.groups.emergencyBattery" },
  {
    id: "lumenMaintenance",
    labelKey: "productsPage.spec.groups.lumenMaintenance",
    layout: "hours",
  },
  { id: "electrical", labelKey: "productsPage.spec.groups.electrical" },
  { id: "ballastCompatibility", labelKey: "productsPage.spec.groups.ballastCompatibility" },
];

/* "controlOptions" → "Control Options" — তালিকায় নেই এমন group এর নাম */
export const humanize = (id) =>
  id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());

/* Configurator এর ধাপের নাম — server এর COMPONENT_STEPS এর ক্রমে */
export const COMPONENT_STEPS = [
  { key: "lamp", labelKey: "productsPage.spec.steps.lamp" },
  { key: "mountingBase", labelKey: "productsPage.spec.steps.mountingBase" },
  { key: "reflector", labelKey: "productsPage.spec.steps.reflector" },
  { key: "controlCap", labelKey: "productsPage.spec.steps.controlCap" },
  { key: "lampAccessory", labelKey: "productsPage.spec.steps.lampAccessory" },
  { key: "reflectorAccessory", labelKey: "productsPage.spec.steps.reflectorAccessory" },
];

/* ---------------------------------------------------------------
   নাম ভাগ — "LA1 High Bay: Linear Distribution"
     title    "LA1 High Bay"          (card আর বড় শিরোনাম)
     subtitle "Linear Distribution"   (শিরোনামের নিচের লাইন)
   ":" না থাকলে পুরো নামটাই title
   --------------------------------------------------------------- */
export function splitName(name = "") {
  const index = name.indexOf(":");
  if (index <= 0) return { title: name.trim(), subtitle: "" };
  return {
    title: name.slice(0, index).trim(),
    subtitle: name.slice(index + 1).trim(),
  };
}

/* ---------------------------------------------------------------
   সব product এর তালিকা (GET /api/products/catalog) — একবার নামিয়ে
   কয়েক মিনিট মনে রাখা হয়. তাই তালিকা → product → Back এ ফিরে এলে
   আবার নামাতে হয় না, আর Product Details পাতাও একই তালিকা থেকে
   আগের/পরের আর Related product বের করে.

   ভুল হলে মনে রাখা হয় না — "Try again" চাপলে আবার চেষ্টা হয়
   --------------------------------------------------------------- */
const CATALOG_TTL_MS = 5 * 60 * 1000;
let catalogCache = null; // { promise, at }

export function loadCatalog({ force = false } = {}) {
  const fresh = catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS;
  if (!force && fresh) return catalogCache.promise;

  const promise = api.getCatalog().then((data) =>
    Array.isArray(data?.products) ? data.products : [],
  );
  catalogCache = { promise, at: Date.now() };
  promise.catch(() => {
    if (catalogCache?.promise === promise) catalogCache = null;
  });
  return promise;
}

/* { status: "loading" | "ready" | "error", products, retry } */
export function useCatalog() {
  const [state, setState] = useState({ status: "loading", products: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    loadCatalog({ force: attempt > 0 })
      .then((products) => {
        if (alive) setState({ status: "ready", products });
      })
      .catch(() => {
        if (alive) setState({ status: "error", products: [] });
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading", products: [] });
    setAttempt((count) => count + 1);
  }, []);

  return { ...state, retry };
}

/* ---------------------------------------------------------------
   পর্দা ছোট কি না — CSS এর breakpoint এর সাথে মিলিয়ে. ফোন আর
   tablet এ Filters পাশে না বসে উপর থেকে ঢাকা (drawer) হয়ে আসে
   --------------------------------------------------------------- */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/* ট্যাবের শিরোনাম — পাতা ছেড়ে গেলে আগেরটা ফিরে আসে */
export function usePageTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    const previous = document.title;
    document.title = `${title} | Filamento`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

/* তালিকার "Default" ক্রম: category র ক্রম → Featured আগে → নতুন আগে.
   Product Details এর আগের/পরের product ও এই ক্রমেই */
export function compareDefault(a, b) {
  return (
    (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99) ||
    Number(b.featured === true) - Number(a.featured === true) ||
    String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))
  );
}
