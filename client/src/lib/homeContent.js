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
        // product থেকে আসা card এ server আগেই শিরোনাম দুই লাইনে ভেঙে দেয় (titleTop/titleBottom)
        const [top, bottom] = product.titleTop
          ? [String(product.titleTop), String(product.titleBottom ?? "")]
          : known && cardTitle === `${en(topKey)} ${en(bottomKey)}`
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

/* ---------------------------------------------------------------
   Fixtures (Featured Products ধাপ) এর দেখানোর রূপ

   featured — content.featured (বা undefined)
   tools    — { t, en, has } (Hero র মতোই)

   • কার্ড: admin এ বাছা product (server শুধু published গুলো পাঠায়),
     ক্রম admin এর ক্রম. নাম আর ছবি product থেকে, "Best For" আর
     Description admin এ লেখা. ৩টার কম পেলে যতগুলো আছে ততগুলোই.
     একটাও না পেলে (বা server না পেলে) আগের হুবহু ৩টা কার্ড
   • মাঝের (২য়) কার্ডটা বড় — Figma র নকশা যেমন
   • ভাষার নিয়ম Hero র মতোই: admin এর লেখা ইংরেজি আসল লেখার হুবহু
     এক থাকলে বর্তমান ভাষার অনুবাদ, বদলালে admin এর লেখাই সব ভাষায়
   --------------------------------------------------------------- */

// কার্ডের জায়গা অনুযায়ী মাপ (Fixtures.css এর data-fixture). বাইরের
// দুটো একই মাপের, মাঝেরটা বড়
const FIXTURE_SLOTS = ["la1", "ls1", "la1"];

// fallback — আগের Fixtures.jsx এর হুবহু তিনটা
const FIXTURES_FALLBACK = [
  { id: "la1", slot: "la1", to: "/products/la1-high-bay", path: "v1789621178/image_7_wqtldv.png" },
  {
    id: "ls1",
    slot: "ls1",
    to: "/products/ls1-high-bay",
    path: "v1789621338/Additional_0001_1779697023_1_taubuk.png",
  },
  // এই ছবির চারপাশে স্বচ্ছ ফাঁকা অংশ — e_trim দিয়ে ছেঁটে নিতে হয়
  { id: "rh1", slot: "rh1", to: "/products/rh1-high-bay", path: "v1789471643/fix3_yeppeq.webp", trim: true },
];

const FIXTURES_FALLBACK_POINTS = ["energy", "maintenance", "visibility", "glare", "installation", "roi"];

export function buildFixturesView(featured, { t, en, has }) {
  const local = (value, key) => {
    const own = typeof value === "string" ? value.trim() : "";
    const known = Boolean(key) && has(key);
    if (!own) return known ? t(key) : "";
    if (!known) return own;
    return own === en(key) ? t(key) : own;
  };

  /* ---- শিরোনাম: admin এ একটাই লেখা, সাইটে দুই লাইন ----
     বদলানো লেখা প্রথম বাক্যের শেষে ভাঙে ("Three Fixtures." / "One …") */
  const englishTitle = `${en("fixtures.titleTop")} ${en("fixtures.titleBottom")}`;
  const ownTitle = typeof featured?.title === "string" ? featured.title.trim() : "";
  let titleTop = t("fixtures.titleTop");
  let titleBottom = t("fixtures.titleBottom");
  if (ownTitle && ownTitle !== englishTitle) {
    const match = ownTitle.match(/^(.+?[.!?。！？])\s+(.+)$/);
    [titleTop, titleBottom] = match ? [match[1], match[2]] : [ownTitle, ""];
  }

  /* ---- কার্ড ---- */
  const rows = Array.isArray(featured?.fixtures)
    ? featured.fixtures.filter((row) => row?.product?.slug).slice(0, FIXTURE_SLOTS.length)
    : [];

  const cards =
    rows.length > 0
      ? rows.map((row, index) => {
          const id = String(row.id);
          const name = row.product.name || "";
          return {
            id,
            slot: FIXTURE_SLOTS[index],
            featured: index === 1,
            number: String(index + 1).padStart(2, "0"),
            to: `/products/${row.product.slug}`,
            image: { url: row.product.image || "", trim: false },
            alt: name,
            title: name,
            scope: local(row.scope, `fixtures.items.${id}.scope`),
            description: local(row.description, `fixtures.items.${id}.description`),
          };
        })
      : FIXTURES_FALLBACK.map((card, index) => ({
          id: card.id,
          slot: card.slot,
          featured: card.slot === "ls1",
          number: String(index + 1).padStart(2, "0"),
          to: card.to,
          image: { url: CLOUD + card.path, trim: Boolean(card.trim) },
          alt: t(`fixtures.items.${card.id}.title`),
          title: t(`fixtures.items.${card.id}.title`),
          scope: t(`fixtures.items.${card.id}.scope`),
          description: t(`fixtures.items.${card.id}.description`),
        }));

  /* ---- নিচের Featured Points ---- */
  const points = Array.isArray(featured?.points)
    ? featured.points.map((point) => {
        const id = String(point.id);
        return {
          id,
          icon: point.icon,
          title: local(point.title, `fixtures.benefits.${id}.title`),
          text: local(point.text, `fixtures.benefits.${id}.text`),
        };
      })
    : FIXTURES_FALLBACK_POINTS.map((id) => ({
        id,
        icon: id,
        title: t(`fixtures.benefits.${id}.title`),
        text: t(`fixtures.benefits.${id}.text`),
      }));

  return {
    watermark: featured ? local(featured.behindText, "fixtures.watermark") : t("fixtures.watermark"),
    titleTop,
    titleBottom,
    subhead: featured ? local(featured.description, "fixtures.subhead") : t("fixtures.subhead"),
    cards,
    points,
  };
}

/* ---------------------------------------------------------------
   Videos (Technologies section) এর দেখানোর রূপ

   videos — content.videos (বা undefined)
   tools  — { t, en, has } (Hero র মতোই)

   • তালিকা আর ক্রম admin এর. প্রতিটা: শিরোনাম, লেখা, video link, cover
   • cover এর fit: আগের তিনটা video র নিজস্ব মাপ ছিল ("product" = স্বচ্ছ
     লাইটের ছবি, ধূসর পটভূমি আর হলুদ বৃত্তের উপর; "photo" = পুরো ছবি).
     admin ওই তিনটার আগের cover রেখে দিলে সেই fit-ই থাকে; নতুন ছবি
     দিলে বা নতুন video যোগ করলে "photo" (পুরো ছবি) — কারণ সেটা
     যেকোনো ছবিতেই ঠিক দেখায়
   • baseViews (শুরুর সংখ্যা) শুধু আগের তিনটার; নতুন video র 0, তাই
     সেখানে শুধু আসল play এর সংখ্যা দেখায়
   • server না পেলে বা তালিকা না থাকলে আগের হুবহু তিনটা
   --------------------------------------------------------------- */
const VIDEO_KNOWN = {
  thermal: {
    path: "v1789621338/Additional_0001_1779697023_1_taubuk.png",
    fit: "product",
    baseViews: 544,
  },
  optical: {
    path: "v1789628672/8f7e17c86d7e55308fb2c4aa5e59b763e23cc115_zcjucz.png",
    fit: "photo",
    baseViews: 1200,
  },
  driver: {
    path: "v1789471643/fix3_yeppeq.webp",
    fit: "product",
    trim: true,
    baseViews: 768,
  },
};

const VIDEOS_FALLBACK = [
  {
    id: "thermal",
    video:
      "https://www.filamento.com/wp-content/uploads/2026/07/RH1_Animation_Final_02_compressed.mp4",
  },
  {
    id: "optical",
    video:
      "https://www.filamento.com/wp-content/uploads/2026/06/10467854031752108853_compressed.mp4",
  },
  {
    id: "driver",
    video:
      "https://www.filamento.com/wp-content/plugins/Tot/upload/resources/VIDEOS/INSV_ACC-005-PT1-000-FL_230907.mp4",
  },
];

export function buildVideosView(videos, { t, en, has }) {
  const local = (value, key) => {
    const own = typeof value === "string" ? value.trim() : "";
    const known = Boolean(key) && has(key);
    if (!own) return known ? t(key) : "";
    if (!known) return own;
    return own === en(key) ? t(key) : own;
  };

  const coverFor = (id, url) => {
    if (!url) return null;
    const known = VIDEO_KNOWN[id];
    const sameAsDefault = Boolean(known) && url.endsWith(known.path);
    return {
      url,
      fit: sameAsDefault ? known.fit : "photo",
      trim: sameAsDefault && Boolean(known.trim),
    };
  };

  const rawItems =
    Array.isArray(videos?.items) && videos.items.length > 0 ? videos.items : null;

  const items = rawItems
    ? rawItems.map((item) => {
        const id = String(item.id);
        return {
          id,
          title: local(item.title, `technologies.items.${id}.title`),
          text: local(item.description, `technologies.items.${id}.text`),
          video: item.video?.url || null,
          cover: coverFor(id, item.cover?.url),
          baseViews: VIDEO_KNOWN[id]?.baseViews ?? 0,
        };
      })
    : VIDEOS_FALLBACK.map((item) => {
        const known = VIDEO_KNOWN[item.id];
        return {
          id: item.id,
          title: t(`technologies.items.${item.id}.title`),
          text: t(`technologies.items.${item.id}.text`),
          video: item.video,
          cover: coverFor(item.id, CLOUD + known.path),
          baseViews: known.baseViews,
        };
      });

  return {
    title: videos ? local(videos.heading, "technologies.title") : t("technologies.title"),
    text: videos ? local(videos.subtext, "technologies.text") : t("technologies.text"),
    items,
  };
}

/* ---------------------------------------------------------------
   Testimonials এর দেখানোর রূপ

   testimonials — content.testimonials (বা undefined)
   tools        — { t, en, has } (Hero র মতোই)

   • তালিকা আর ক্রম admin এর. প্রতিটা: ছবি, নাম, পদবি + company,
     rating, quote, Project link ("Project" বোতামের গন্তব্য)
   • পদবির লাইন = "<Designation>, <Company>" (যেমন "Facility Manager,
     Cold Storage")
   • ভাষার নিয়ম Hero র মতোই: admin এর লেখা ইংরেজি আসল লেখার হুবহু
     এক থাকলে বর্তমান ভাষার অনুবাদ, বদলালে admin এর লেখাই সব ভাষায়.
     নতুন যোগ করা testimonial এর অনুবাদ নেই, তাই admin এর লেখাই
   • section এর শিরোনাম আর নিচের লেখা admin এ নেই — সেগুলো
     অনুবাদ ফাইল থেকেই (Testimonial.jsx)
   • server না পেলে বা তালিকা না থাকলে আগের হুবহু চারটা
   --------------------------------------------------------------- */
const TESTIMONIAL_AVATAR =
  "https://res.cloudinary.com/dzi3u164c/image/upload/v1789637818/a73e9b59e7a15dc477a605d52bd4add7b91a67a9_pewd5s.jpg";

const TESTIMONIALS_FALLBACK = [
  { id: "marcus", rating: 4.5, projectTo: "/projects?category=coldStorage" },
  { id: "frank", rating: 4.0, projectTo: "/projects?category=distributionCenter" },
  { id: "david", rating: 4.8, projectTo: "/projects?category=manufacturing" },
  { id: "elena", rating: 4.6, projectTo: "/projects?category=warehouse" },
];

export function buildTestimonialsView(testimonials, { t, en, has }) {
  const local = (value, key) => {
    const own = typeof value === "string" ? value.trim() : "";
    const known = Boolean(key) && has(key);
    if (!own) return known ? t(key) : "";
    if (!known) return own;
    return own === en(key) ? t(key) : own;
  };

  // ছোট ছবি যথেষ্ট — avatar সর্বোচ্চ ~120px
  const avatarUrl = (url) =>
    url ? cloudinaryUrl(url, "c_limit,w_240,f_auto,q_auto") : "";

  const rawItems =
    Array.isArray(testimonials?.items) && testimonials.items.length > 0
      ? testimonials.items
      : null;

  const items = rawItems
    ? rawItems.map((item) => {
        const id = String(item.id);
        const roleText = [item.designation, item.company]
          .map((part) => (typeof part === "string" ? part.trim() : ""))
          .filter(Boolean)
          .join(", ");
        const rating = Number(item.rating);

        return {
          id,
          rating: Number.isFinite(rating) ? Math.min(Math.max(rating, 0), 5) : 0,
          projectTo: item.projectLink || "/projects",
          avatar: avatarUrl(item.image?.url),
          name: local(item.name, `testimonials.items.${id}.name`),
          role: local(roleText, `testimonials.items.${id}.role`),
          quote: local(item.quote, `testimonials.items.${id}.quote`),
        };
      })
    : TESTIMONIALS_FALLBACK.map((item) => ({
        id: item.id,
        rating: item.rating,
        projectTo: item.projectTo,
        avatar: TESTIMONIAL_AVATAR,
        name: t(`testimonials.items.${item.id}.name`),
        role: t(`testimonials.items.${item.id}.role`),
        quote: t(`testimonials.items.${item.id}.quote`),
      }));

  return { items };
}