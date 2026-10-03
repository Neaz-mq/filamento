import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

/* ===============================================================
   সাইটের Projects পাতা আর Project Details পাতার সাহায্যকারী

   admin এর client/src/admin/projects/projectCatalog.js এর মতোই
   তালিকা, কিন্তু আলাদা ফাইল — admin এর কোড সাইটের bundle এ
   ঢোকানো যাবে না (App.jsx এর নিয়ম).

   ⚠️ Project Type এর key আর ক্রম মিলিয়ে রাখবেন:
     server/lib/projectSchema.js        (PROJECT_TYPES)
     admin/projects/projectCatalog.js   (PROJECT_TYPES)
     i18n/locales/*.json                (projects.categories.<key>)
   =============================================================== */

/* Project Type — category pill আর "All environments" dropdown এর ক্রম
   (server এর PROJECT_TYPES এর ক্রমেই). যে type এ কোনো project নেই
   সেটা পাতায় দেখায় না */
export const PROJECT_TYPES = [
  "airport",
  "automotiveDealership",
  "church",
  "coldStorage",
  "conferenceCenter",
  "conventionCenter",
  "distributionCenter",
  "gymnasium",
  "manufacturing",
  "office",
  "retail",
  "streetLights",
  "warehouse",
  "other",
];

/* ---------------------------------------------------------------
   ছবি না থাকলে বা নামতে না পারলে — type অনুযায়ী একটা নমুনা ছবি,
   যাতে card বা hero কখনো ফাঁকা না দেখায়.

   Cloudinary র নিজেদের ছবি আর Unsplash (Unsplash License: বিনা
   খরচে ব্যবহার করা যায়). admin এ ছবি দিলেই এগুলো আর দেখায় না
   --------------------------------------------------------------- */
const CLOUD = "https://res.cloudinary.com/dzi3u164c/image/upload/";
const UNSPLASH = "https://images.unsplash.com/";

const OWN = {
  arena: `${CLOUD}v1789985331/be5360cb5806dd39ba58c23000d7201a66b3447a_wl2fwe.jpg`,
  barn: `${CLOUD}v1789985339/3041207c74d5ee01e3921128797d9c9614c8156d_adbdcq.jpg`,
  fitness: `${CLOUD}v1789985350/55103d210a35d777640fc5b5351acecee6d9580e_uvrmn1.jpg`,
};

const unsplash = (id) => `${UNSPLASH}${id}?auto=format&fit=crop&q=75`;

const FALLBACK_PHOTOS = {
  airport: unsplash("photo-1579695779019-7fe42ce31317"),
  automotiveDealership: unsplash("photo-1761738217531-44a249d1dc87"),
  church: unsplash("photo-1560264280-88b68371db39"),
  coldStorage: unsplash("photo-1684695749267-233af13276d0"),
  conferenceCenter: unsplash("photo-1560264280-88b68371db39"),
  conventionCenter: OWN.arena,
  distributionCenter: unsplash("photo-1721937718756-3bfec49f42a2"),
  gymnasium: OWN.fitness,
  manufacturing: unsplash("photo-1496247749665-49cf5b1022e9"),
  office: unsplash("photo-1747992021633-762a63985d01"),
  retail: OWN.barn,
  streetLights: unsplash("photo-1743369673059-cae28a9a8c9c"),
  warehouse: unsplash("photo-1684695749267-233af13276d0"),
  other: OWN.arena,
};

export const fallbackPhoto = (type) => FALLBACK_PHOTOS[type] ?? FALLBACK_PHOTOS.other;

/* project এর সব ছবির ঠিকানা — না থাকলে type এর নমুনা ছবি একটা */
export const projectPhotos = (project) => {
  const urls = (project?.images ?? []).map((image) => image?.url).filter(Boolean);
  return urls.length ? urls : [fallbackPhoto(project?.projectType)];
};

/* ---------------------------------------------------------------
   ছবিকে দরকারি মাপে নামানো

   admin থেকে তোলা ছবি পুরো মাপে (কয়েক MB) থাকে:
     Cloudinary — ঠিকানায় c_limit,w_…,f_auto,q_auto বসে; Cloudinary
                  নিজেই ছোট করে আর browser অনুযায়ী WebP/AVIF দেয়
     Unsplash   — ঠিকানার w= বদলানো
   অন্য সাইটের ছবি যেমন আছে তেমনই
   --------------------------------------------------------------- */
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;

export function photoUrl(url, width) {
  if (!url) return "";
  const cloud = CLOUDINARY_UPLOAD.exec(url);
  if (cloud) return `${cloud[1]}c_limit,w_${width},f_auto,q_auto/${cloud[2]}`;
  if (url.startsWith(UNSPLASH)) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("w", String(width));
      if (!parsed.searchParams.has("auto")) parsed.searchParams.set("auto", "format");
      if (!parsed.searchParams.has("q")) parsed.searchParams.set("q", "75");
      return parsed.toString();
    } catch {
      return url;
    }
  }
  return url;
}

export function photoSrcSet(url, widths) {
  if (!url || !(CLOUDINARY_UPLOAD.test(url) || url.startsWith(UNSPLASH))) return undefined;
  return widths.map((width) => `${photoUrl(url, width)} ${width}w`).join(", ");
}

/* ---------------------------------------------------------------
   সব project এর তালিকা (GET /api/projects) — একবার নামিয়ে কয়েক
   মিনিট মনে রাখা হয়. তাই তালিকা → project → Back এ আবার নামাতে
   হয় না, আর Project Details পাতা একই তালিকা থেকে আগের/পরের
   project বের করে.

   ভুল হলে মনে রাখা হয় না — "Try again" চাপলে আবার চেষ্টা হয়
   --------------------------------------------------------------- */
const LIST_TTL_MS = 5 * 60 * 1000;
let listCache = null; // { promise, at }

export function loadProjects({ force = false } = {}) {
  const fresh = listCache && Date.now() - listCache.at < LIST_TTL_MS;
  if (!force && fresh) return listCache.promise;

  const promise = api.getProjects().then((data) =>
    Array.isArray(data?.projects) ? data.projects : [],
  );
  listCache = { promise, at: Date.now() };
  promise.catch(() => {
    if (listCache?.promise === promise) listCache = null;
  });
  return promise;
}

/* { status: "loading" | "ready" | "error", projects, retry } */
export function useProjectList() {
  const [state, setState] = useState({ status: "loading", projects: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    loadProjects({ force: attempt > 0 })
      .then((projects) => {
        if (alive) setState({ status: "ready", projects });
      })
      .catch(() => {
        if (alive) setState({ status: "error", projects: [] });
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading", projects: [] });
    setAttempt((count) => count + 1);
  }, []);

  return { ...state, retry };
}

/* তালিকায় শেষবার কী বাছা ছিল (?q=…&category=…). Project Details এর
   "All projects" চাপলে সেই filter এই ফেরে — দর্শককে আবার খুঁজতে হয় না */
let lastListSearch = "";

export const rememberListSearch = (search) => {
  lastListSearch = search && search !== "?" ? search : "";
};

export const listSearch = () => lastListSearch;

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

/* লম্বা লেখা (Challenge, Results) → অনুচ্ছেদ. admin এ ফাঁকা লাইন
   দিয়ে অনুচ্ছেদ ভাগ করা হয় */
export const paragraphs = (text) =>
  String(text ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

/* "The result: …" দিয়ে শুরু হওয়া অনুচ্ছেদ মোটা লেখায় (Figma র
   শেষ লাইনের মতো) */
export const isResultLine = (text) => /^the result\b/i.test(text);
