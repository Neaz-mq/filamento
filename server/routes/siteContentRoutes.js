import express from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { logActivity } from "../lib/activity.js";
import { requireAdmin, requireRole, requireSameOrigin } from "../lib/auth.js";
import { destroyAsset } from "../lib/cloudinary.js";
import {
  DEFAULT_HOME,
  HOME_STEPS,
  HOME_STEP_LABELS,
  cleanHomeStep,
  homeStepAssets,
} from "../lib/homeContentSchema.js";

/* ===============================================================
   Site Content — Home Page এর লেখা, ছবি, video

   GET  /api/site-content/home              সাইটের জন্য (সবার জন্য খোলা)
   GET  /api/site-content/admin/home        admin panel — সাথে কোন ধাপ
                                            কে কবে save করেছে
   PUT  /api/site-content/admin/home/:step  একটা ধাপ save

   database: "site_content" collection এ একটাই document
     { _id: "home", steps: { hero: { data, updatedAt, updatedBy }, … } }

   যে ধাপ কখনো save হয়নি সেখানে DEFAULT_HOME (এখনকার landing page).
   editor ও save করতে পারে — এটা শুধু লেখা আর ছবি
   =============================================================== */

const router = express.Router();

const content = () => getDB().collection("site_content");
const products = () => getDB().collection("products");

const PRODUCT_FIELDS = { name: 1, slug: 1, category: 1, series: 1, status: 1, images: 1 };

const productItem = (doc) => ({
  id: doc._id.toString(),
  name: doc.name ?? "",
  slug: doc.slug ?? "",
  category: doc.category ?? "other",
  series: doc.series ?? "",
  status: doc.status === "published" ? "published" : "draft",
  image: doc.images?.[0]?.url ?? "",
});

const toObjectId = (value) => {
  try {
    return new ObjectId(String(value));
  } catch {
    return null;
  }
};

const clone = (value) => structuredClone(value);

async function productsById(ids) {
  const objectIds = [...new Set(ids)].map(toObjectId).filter(Boolean);
  if (!objectIds.length) return new Map();
  const docs = await products()
    .find({ _id: { $in: objectIds } }, { projection: PRODUCT_FIELDS })
    .toArray();
  return new Map(docs.map((doc) => [doc._id.toString(), productItem(doc)]));
}

/* default এর তিনটা fixture — slug "la1-…", "ls1-…", "rh1-…" দিয়ে
   শুরু হওয়া প্রথম published product. না পেলে সেই সারি বাদ */
async function fillDefaultFixtures(featured) {
  const filled = [];
  for (const item of featured.fixtures) {
    const { series, ...rest } = item;
    if (rest.productId || !series) {
      filled.push(rest);
      continue;
    }
    const [doc] = await products()
      .find(
        { status: "published", slug: { $regex: `^${series}-` } },
        { projection: { _id: 1 } },
      )
      .sort({ createdAt: 1, _id: 1 })
      .limit(1)
      .toArray();
    if (doc) filled.push({ ...rest, productId: doc._id.toString() });
  }
  return { ...featured, fixtures: filled };
}

/* Hero র নিচের card — link যদি শুধু একটা category হয় (/products?category=lamp-fixture),
   সাইটে সেটা ওই category র সবচেয়ে প্রথম published product এর details পাতায়
   (/products/<slug>) নেয়. তালিকা database থেকেই আসে, তাই product যোগ/মোছা/publish
   করলে হাতে কিছু বদলাতে হয় না.

   • admin এ কোনো নির্দিষ্ট product বাছা থাকলে (/products/…) সেটা যেমন আছে তেমনই
   • category তে কোনো published product না থাকলে আগের category তালিকাই
   • শুধু সাইটের জন্য — admin এ (GET /admin/home) আসল বাছাই যেমন ছিল তেমনই দেখায় */
async function resolveHeroLinks(hero) {
  if (!Array.isArray(hero?.products)) return hero;

  const byCategory = new Map();
  const firstSlug = async (category) => {
    if (!byCategory.has(category)) {
      const [doc] = await products()
        .find({ status: "published", category }, { projection: { slug: 1 } })
        .sort({ featured: -1, createdAt: 1, _id: 1 })
        .limit(1)
        .toArray();
      byCategory.set(category, doc?.slug || "");
    }
    return byCategory.get(category);
  };

  const cards = [];
  for (const card of hero.products) {
    const match = /^\/products\?category=([\w-]+)$/.exec(card?.link ?? "");
    const slug = match ? await firstSlug(match[1]) : "";
    cards.push(slug ? { ...card, link: `/products/${slug}` } : card);
  }
  return { ...hero, products: cards };
}

/* Hero র নিচের তিনটা card — এখন সরাসরি Products থেকে আসে (সাইটের জন্য).

   কোন তিনটা: published product, যেগুলোর ছবি আছে — আগে "featured" চিহ্ন দেওয়া,
   তারপর বেশি দেখা (views), তারপর পুরনো আগে. product যোগ/মোছা/publish বা
   featured বদলালে card নিজে থেকে বদলায়.

   প্রতিটা card: ছবি = product এর প্রথম ছবি, শিরোনাম = নাম (দুই লাইনে), লেখা =
   ছোট বিবরণ, তীর/card = /products/<slug> (details পাতা).
   কোনো published product না থাকলে নিচের পুরনো (admin এর) card ই থাকে */
const HERO_CARD_COUNT = 3;

// "RH1 High Efficiency High Bay (Without Refractor and Uplight)" → ["RH1", "High Bay"]
function heroCardTitle(name) {
  const clean = String(name ?? "")
    .split(":")[0]
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = clean.split(" ").filter(Boolean);
  if (words.length <= 1) return [clean, ""];
  if (words.length <= 3) return [words[0], words.slice(1).join(" ")];
  return [words[0], words.slice(-2).join(" ")];
}

async function liveHeroCards() {
  const docs = await products()
    .find(
      { status: "published", "images.0": { $exists: true } },
      { projection: { name: 1, slug: 1, series: 1, shortDescription: 1, images: 1 } },
    )
    .sort({ featured: -1, views: -1, createdAt: 1, _id: 1 })
    .limit(HERO_CARD_COUNT * 3)
    .toArray();

  return docs
    .filter((doc) => doc.slug && doc.name && doc.images?.[0]?.url)
    .slice(0, HERO_CARD_COUNT)
    .map((doc) => {
      const [titleTop, titleBottom] = heroCardTitle(doc.name);
      return {
        id: doc._id.toString(),
        image: { url: doc.images[0].url, publicId: doc.images[0].publicId ?? "" },
        title: doc.name,
        titleTop,
        titleBottom,
        subtitle: String(doc.shortDescription || doc.series || "").trim(),
        link: `/products/${doc.slug}`,
      };
    });
}

/* সব ধাপ একসাথে — save করা থাকলে সেটা, নাহলে default */
async function loadHome() {
  const doc = await content().findOne({ _id: "home" });
  const data = {};
  const meta = {};

  for (const step of HOME_STEPS) {
    const saved = doc?.steps?.[step];
    data[step] = saved?.data ? saved.data : clone(DEFAULT_HOME[step]);
    meta[step] = {
      saved: Boolean(saved?.data),
      updatedAt: saved?.updatedAt ?? null,
      updatedBy: saved?.updatedBy?.name ?? null,
    };
  }

  if (!meta.featured.saved) data.featured = await fillDefaultFixtures(data.featured);
  return { data, meta };
}

/* ---------------------------------------------------------------
   GET /api/site-content/home — সাইটের জন্য.
   fixture এর product শুধু published হলে দেখানো হয়
   --------------------------------------------------------------- */
router.get("/home", async (req, res, next) => {
  try {
    const { data } = await loadHome();
    const byId = await productsById(data.featured.fixtures.map((item) => item.productId));

    data.featured.fixtures = data.featured.fixtures
      .map((item) => ({ ...item, product: byId.get(item.productId) }))
      .filter((item) => item.product?.status === "published");

    const liveCards = await liveHeroCards();
    data.hero =
      liveCards.length > 0
        ? { ...data.hero, products: liveCards }
        : await resolveHeroLinks(data.hero);

    /* no-cache = জমা রাখা যায়, কিন্তু ব্যবহারের আগে প্রতিবার server কে মিলিয়ে নিতে হয়।
       Express নিজেই ETag দেয়, তাই বদল না থাকলে শুধু ছোট 304 যায়।
       ফল: admin এ Save Change দিলে সাইটে সাথে সাথে আসে (CDN এর ৫ মিনিট দেরি নেই) */
    res.set("Cache-Control", "no-cache");
    res.json({ content: data });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------
   GET /api/site-content/admin/home — login করা যে কেউ
   --------------------------------------------------------------- */
router.get("/admin/home", requireSameOrigin, requireAdmin, async (req, res, next) => {
  try {
    const { data, meta } = await loadHome();
    const byId = await productsById(data.featured.fixtures.map((item) => item.productId));

    res.set("Cache-Control", "no-store");
    res.json({
      content: data,
      steps: meta,
      // fixture সারিতে product এর নাম আর ছবি দেখানোর জন্য
      products: Object.fromEntries(byId),
    });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------
   PUT /api/site-content/admin/home/:step — owner, admin, editor
   --------------------------------------------------------------- */
router.put(
  "/admin/home/:step",
  requireSameOrigin,
  requireAdmin,
  requireRole("owner", "admin", "editor"),
  async (req, res, next) => {
    try {
      const step = req.params.step;
      if (!HOME_STEPS.includes(step)) {
        return res.status(404).json({ message: "Unknown section." });
      }

      const { value, error } = cleanHomeStep(step, req.body);
      if (error) return res.status(400).json({ message: error });

      // Featured এর product গুলো আসলেই আছে আর published কি না
      if (step === "featured") {
        const byId = await productsById(value.fixtures.map((item) => item.productId));
        for (const item of value.fixtures) {
          const product = byId.get(item.productId);
          if (!product) {
            return res.status(400).json({ message: "A chosen product no longer exists." });
          }
          if (product.status !== "published") {
            return res
              .status(400)
              .json({ message: `"${product.name}" is a draft. Only published products can be featured.` });
          }
        }
      }

      const before = await content().findOne(
        { _id: "home" },
        { projection: { [`steps.${step}`]: 1 } },
      );

      const now = new Date();
      await content().updateOne(
        { _id: "home" },
        {
          $set: {
            [`steps.${step}`]: {
              data: value,
              updatedAt: now,
              updatedBy: { id: req.admin._id, name: req.admin.name ?? req.admin.email },
            },
          },
        },
        { upsert: true },
      );

      /* আগে ছিল কিন্তু এখন নেই — এমন Cloudinary ফাইল মুছে ফেলা
         (শুধু filamento/site/ এর ভেতরের, landing এর পুরনো ছবি না) */
      const keep = new Set(homeStepAssets(value).map((asset) => asset.publicId));
      const removed = homeStepAssets(before?.steps?.[step]?.data).filter(
        (asset) => !keep.has(asset.publicId),
      );
      await Promise.all(removed.map((asset) => destroyAsset(asset)));

      await logActivity(req.admin, "home.update", { name: HOME_STEP_LABELS[step], step });

      const { data, meta } = await loadHome();
      const byId = await productsById(data.featured.fixtures.map((item) => item.productId));
      res.json({ content: data, steps: meta, products: Object.fromEntries(byId) });
    } catch (error) {
      next(error);
    }
  },
);

export default router;