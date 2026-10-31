import { useEffect, useState } from "react";
import { api } from "./api";

/* ===============================================================
   Home Page Content — সাইটের দিকের পড়া

   admin এ "Save Change" দিলে database এ যায় (site_content collection).
   এই ফাইল সেটা GET /api/site-content/home থেকে এনে Hero, Brands
   ইত্যাদিকে দেয়.

   উত্তরের আকার: { content: { hero: { slides, features, products,
   logos }, featured, comparison, videos, testimonials } }

   নিয়ম:
     • একবার এনে মনে রাখা হয় — Hero আর Brands দুটো একই request ভাগ করে
     • server ধীর বা বন্ধ থাকলে সাইট ভাঙে না — আগের হুবহু লেখা-ছবিই
       দেখায় (fallback)
     • সাইট খোলার সময় একবারের বেশি "পুরনো → নতুন" ঝলক যেন না দেখা যায়,
       তাই উত্তর আসা (বা ১.৫ সেকেন্ড) পর্যন্ত অংশটা লুকানো থাকে
   =============================================================== */

// এর বেশি পুরনো হলে (SPA তে পাতা বদলে ফিরলে) নতুন করে আনে
const FRESH_MS = 60_000;

// উত্তর না এলে এতক্ষণ পরে fallback দিয়েই দেখানো শুরু
const SETTLE_MS = 1500;

let cache = null; // { content, at }
let inflight = null;

function load() {
  if (inflight) return inflight;

  inflight = api
    .getHomeContent()
    .then((body) => {
      const content = body?.content;
      if (!content || typeof content !== "object") {
        throw new Error("Unexpected home content response");
      }
      cache = { content, at: Date.now() };
      return content;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/* content — server এর content (না এলে null)
   settled — উত্তর এসেছে, বা ব্যর্থ হয়েছে, বা অপেক্ষার সময় শেষ.
             true হলে অংশটা দেখানো নিরাপদ */
export function useHomeContent() {
  const [state, setState] = useState(() => ({
    content: cache?.content ?? null,
    settled: Boolean(cache),
  }));

  useEffect(() => {
    let alive = true;

    const stale = !cache || Date.now() - cache.at > FRESH_MS;
    if (stale) {
      load()
        .then((content) => {
          if (alive) setState({ content, settled: true });
        })
        .catch(() => {
          // ব্যর্থ — হাতে যা আছে (cache বা fallback) তাই চলবে
          if (alive) setState((old) => ({ ...old, settled: true }));
        });
    }

    const timer = setTimeout(() => {
      if (alive) setState((old) => (old.settled ? old : { ...old, settled: true }));
    }, SETTLE_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return state;
}

/* ---------------------------------------------------------------
   ছোট সাহায্যকারী
   --------------------------------------------------------------- */
export const isCloudinary = (url) =>
  typeof url === "string" &&
  url.includes("res.cloudinary.com") &&
  url.includes("/image/upload/");

/* Cloudinary ছবিতে মাপ/format এর নির্দেশ বসায়. অন্য ঠিকানা (যেমন
   "/brand-logos/x.svg") যেমন আছে তেমনই */
export function cloudinaryUrl(url, transform) {
  if (!isCloudinary(url)) return url;
  return url.replace("/image/upload/", `/image/upload/${transform}/`);
}

export const isExternalLink = (link) => /^https?:\/\//i.test(link ?? "");

// "Brighter Light. Half the Energy." → ["Brighter", "Light. Half the Energy."]
export function splitFirstWord(text) {
  const clean = String(text ?? "").trim();
  const at = clean.indexOf(" ");
  return at === -1 ? [clean, ""] : [clean.slice(0, at), clean.slice(at + 1).trim()];
}

// "High Bay Series" → ["High Bay", "Series"]
export function splitLastWord(text) {
  const clean = String(text ?? "").trim();
  const at = clean.lastIndexOf(" ");
  return at === -1 ? [clean, ""] : [clean.slice(0, at).trim(), clean.slice(at + 1)];
}

/* ---------------------------------------------------------------
   Hero — fallback (admin এ কিছু save না হলে, বা server না পেলে)
   এগুলো আগের Hero.jsx এর হুবহু একই জিনিস
   --------------------------------------------------------------- */
const CLOUD = "https://res.cloudinary.com/dzi3u164c/image/upload/";

export const DEFAULT_HERO_URL = `${CLOUD}v1789466783/hero-optimised_dtyrew.webp`;

export const HERO_FALLBACK_CARDS = [
  {
    id: "high-bay",
    // High Bay গুলো Lamp/Fixture category তে — আগের /products/high-bay নামে কোনো product নেই
    to: "/products?category=lamp-fixture",
    image: `${CLOUD}v1789539354/image_7_ep6gnv.png`,
  },
  {
    id: "build-fixture",
    // নিজের মতো fixture বানানো = Luminaire Configurator category
    to: "/products?category=luminaire-configurator",
    image: `${CLOUD}v1789461131/card2_dxyfhj.webp`,
  },
  {
    id: "optional-parts",
    // আলাদা অংশ (cord, cable, ring …) = Lamp Accessory category
    to: "/products?category=lamp-accessory",
    image: `${CLOUD}v1789461212/card3_rcubwu.webp`,
  },
];

const HERO_FALLBACK_BADGES = ["energy", "warranty", "madeIn", "certified", "listed"];

/* ---------------------------------------------------------------
   Hero এর দেখানোর রূপ

   hero  — content.hero (বা undefined)
   tools — { t, en, has }
             t    বর্তমান ভাষার অনুবাদ
             en   ইংরেজি অনুবাদ
             has  (key) => এই key ইংরেজি ফাইলে আছে কি না

   ভাষার নিয়ম: admin এর লেখা শুধু ইংরেজিতে. তাই
     • admin এর লেখা যদি ইংরেজি আসল লেখার হুবহু এক থাকে → বর্তমান
       ভাষার অনুবাদ (ja / zh-Hant এ জাপানি / চীনা লেখাই থাকে)
     • admin যে লেখা বদলেছে → সেই লেখাই, সব ভাষায়

   এখন সব slide ই আসে (view.slides). badge আর card সব slide এ এক
   --------------------------------------------------------------- */
export function buildHeroView(hero, { t, en, has }) {
  const local = (value, key) => {
    const own = typeof value === "string" ? value.trim() : "";
    const known = Boolean(key) && has(key);
    if (!own) return known ? t(key) : "";
    if (!known) return own;
    return own === en(key) ? t(key) : own;
  };

  /* ---- বড় অংশ: ছবি + লেখা — প্রতিটা slide এর জন্য একটা ----
     admin এ কোনো slide না থাকলে (বা server না পেলে) আগের একটাই slide */
  const rawSlides = Array.isArray(hero?.slides) && hero.slides.length > 0 ? hero.slides : [null];
  const englishTitle = `${en("hero.titleAccent")} ${en("hero.titleRest")}`;

  const slides = rawSlides.map((slide, index) => {
    const imageUrl = slide?.image?.url || DEFAULT_HERO_URL;
    const title = typeof slide?.title === "string" ? slide.title.trim() : "";
    const [accent, rest] =
      !title || title === englishTitle
        ? [t("hero.titleAccent"), t("hero.titleRest")]
        : splitFirstWord(title);

    return {
      id: String(slide?.id ?? index),
      imageUrl,
      // ছবি বদলানো হলে পুরনো alt ("RH1 Series ...") ভুল হতো — তখন শিরোনামই alt
      alt: imageUrl === DEFAULT_HERO_URL ? t("hero.imageAlt") : title || t("hero.imageAlt"),
      eyebrow: local(slide?.label, "hero.eyebrow"),
      accent,
      rest,
      subhead: local(slide?.description, "hero.subhead"),
    };
  });

  /* ---- Key Features (পাঁচ badge) ---- */
  const badges = Array.isArray(hero?.features)
    ? hero.features.map((feature) => ({
        id: String(feature.id),
        icon: feature.icon,
        value: local(feature.title, `hero.badges.${feature.id}.value`),
        label: local(feature.subtitle, `hero.badges.${feature.id}.label`),
      }))
    : HERO_FALLBACK_BADGES.map((id) => ({
        id,
        icon: id,
        value: t(`hero.badges.${id}.value`),
        label: t(`hero.badges.${id}.label`),
      }));

  /* ---- নিচের কার্ড (Featured Products) ---- */
  const cards = Array.isArray(hero?.products)
    ? hero.products.map((product) => {
        const id = String(product.id);
        const topKey = `hero.cards.${id}.titleTop`;
        const bottomKey = `hero.cards.${id}.titleBottom`;
        const textKey = `hero.cards.${id}.text`;

        const cardTitle = typeof product.title === "string" ? product.title.trim() : "";
        const known = has(topKey) && has(bottomKey);
        const [top, bottom] =
          known && cardTitle === `${en(topKey)} ${en(bottomKey)}`
            ? [t(topKey), t(bottomKey)]
            : splitLastWord(cardTitle);

        return {
          id,
          to: product.link || "/products",
          image: product.image?.url || "",
          top,
          bottom,
          text: local(product.subtitle, textKey),
        };
      })
    : HERO_FALLBACK_CARDS.map((card) => ({
        id: card.id,
        to: card.to,
        image: card.image,
        top: t(`hero.cards.${card.id}.titleTop`),
        bottom: t(`hero.cards.${card.id}.titleBottom`),
        text: t(`hero.cards.${card.id}.text`),
      }));

  return {
    slides,
    // আগের কোডের জন্য — প্রথম slide এর মানগুলো সরাসরিও পাওয়া যায়
    ...slides[0],
    badges,
    cards,
  };
}

/* ---------------------------------------------------------------
   Comparison এর দেখানোর রূপ

   comparison — content.comparison (বা undefined)
   tools      — { t, en, has } (Hero র মতোই)

   ভাষার নিয়ম Hero র মতো: admin এর লেখা ইংরেজি আসল লেখার হুবহু এক
   থাকলে বর্তমান ভাষার অনুবাদ, বদলালে admin এর লেখাই সব ভাষায়.
   নতুন যোগ করা সারির অনুবাদ নেই, তাই সেটা admin এর লেখাই দেখায়
   --------------------------------------------------------------- */
const COMPARISON_FALLBACK_ROWS = ["energy", "dimming", "glare", "lifetime", "warranty", "design"];

export function buildComparisonView(comparison, { t, en, has }) {
  const local = (value, key) => {
    const own = typeof value === "string" ? value.trim() : "";
    const known = Boolean(key) && has(key);
    if (!own) return known ? t(key) : "";
    if (!known) return own;
    return own === en(key) ? t(key) : own;
  };

  const rows = Array.isArray(comparison?.rows)
    ? comparison.rows.map((row) => {
        const id = String(row.id);
        return {
          id,
          label: local(row.metric, `comparison.rows.${id}.label`),
          traditional: local(row.traditional, `comparison.rows.${id}.traditional`),
          filamento: local(row.filamento, `comparison.rows.${id}.filamento`),
        };
      })
    : COMPARISON_FALLBACK_ROWS.map((id) => ({
        id,
        label: t(`comparison.rows.${id}.label`),
        traditional: t(`comparison.rows.${id}.traditional`),
        filamento: t(`comparison.rows.${id}.filamento`),
      }));

  return {
    title: comparison ? local(comparison.title, "comparison.title") : t("comparison.title"),
    text: comparison ? local(comparison.description, "comparison.text") : t("comparison.text"),
    rows,
  };
}