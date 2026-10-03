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

    // কয়েক মিনিট CDN এ জমা থাকতে পারে — save এর ৫ মিনিটের মধ্যে সাইটে আসে
    res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
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
