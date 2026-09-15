import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import zhHant from "./locales/zh-Hant.json";
import ja from "./locales/ja.json";

const STORAGE_KEY = "filamento_lang";

export const DEFAULT_LANGUAGE = "en";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN", htmlLang: "en" },
  { code: "zh-Hant", label: "繁體中文", short: "繁中", htmlLang: "zh-Hant" },
  { code: "ja", label: "日本語", short: "日本語", htmlLang: "ja" },
];

const SUPPORTED = LANGUAGES.map((l) => l.code);

// default ভাষাটার URL এ কোনো prefix নেই, তাই শুধু বাকিগুলো
const PREFIXED = SUPPORTED.filter((code) => code !== DEFAULT_LANGUAGE);

/* ---------------------------------------------------------------
   URL helpers — ভাষা এখন path এ থাকে:
   /products  •  /ja/products  •  /zh-Hant/products
   --------------------------------------------------------------- */

export function localeFromPath(pathname) {
  for (const code of PREFIXED) {
    if (pathname === `/${code}` || pathname.startsWith(`/${code}/`)) {
      return code;
    }
  }
  return DEFAULT_LANGUAGE;
}

/** prefix বাদ দিয়ে আসল path — "/ja/products" → "/products" */
export function stripLocale(pathname) {
  for (const code of PREFIXED) {
    if (pathname === `/${code}`) return "/";
    if (pathname.startsWith(`/${code}/`)) return pathname.slice(code.length + 1);
  }
  return pathname;
}

/** নির্দিষ্ট ভাষার জন্য path বানায় — localePath("ja", "/products") → "/ja/products" */
export function localePath(code, path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (code === DEFAULT_LANGUAGE) return clean;
  return clean === "/" ? `/${code}` : `/${code}${clean}`;
}

/* ---------------------------------------------------------------
   Detection
   --------------------------------------------------------------- */

function matchLanguage(tag) {
  if (!tag) return null;
  const lower = tag.toLowerCase();

  /* সব zh-* কে zh-Hant এ পাঠাচ্ছি, Simplified (zh-CN) সহ — Chinese
     শুধু Traditional এই আছে, আর Simplified পাঠক ইংরেজির চেয়ে
     Traditional বেশি বুঝবেন। ওদের English এ পাঠাতে চাইলে এই শর্তটা
     zh-hant / zh-tw / zh-hk এ সীমিত করে দিন */
  if (lower.startsWith("zh")) return "zh-Hant";
  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("en")) return "en";

  return null;
}

export function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && SUPPORTED.includes(stored) ? stored : null;
  } catch {
    return null; // private mode এ localStorage throw করতে পারে
  }
}

export function persistLanguage(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // লেখা না গেলে ভাষা শুধু এই session এ থাকবে
  }
}

export function browserLanguage() {
  const tags = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const tag of tags) {
    const matched = matchLanguage(tag);
    if (matched) return matched;
  }
  return DEFAULT_LANGUAGE;
}

/* এখন ভাষার একমাত্র উৎস URL — browser এর ভাষা বা localStorage
   এখানে আর ভোট দেয় না। কারণ /ja/products লিংকটা যে-ই খুলুক, তার
   জাপানিই দেখা উচিত; নাহলে share করা লিংক একেকজনের কাছে একেক
   ভাষায় খুলত।

   localStorage এখনো ব্যবহার হয়, কিন্তু অন্য কাজে — নিচের
   redirect টুকু দেখুন */
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "zh-Hant": { translation: zhHant },
    ja: { translation: ja },
  },
  lng: localeFromPath(window.location.pathname),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED,
  interpolation: {
    escapeValue: false, // React নিজেই escape করে
  },
});

export default i18n;
