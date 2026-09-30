import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { logActivity } from "../lib/activity.js";
import { destroyAsset } from "../lib/cloudinary.js";
import {
  CATEGORIES,
  assetsOf,
  cleanProduct,
  missingForPublish,
  slugify,
} from "../lib/productSchema.js";

/* ===============================================================
   Product — database এর কাজ

   দুই ধরনের পাঠক:
     public সাইট  — শুধু published product, admin এর তথ্য ছাড়া
     admin panel  — draft সহ সব, খোঁজা/ছাঁকা/পাতা ভাগ, আর উপরের
                    চারটা সংখ্যা (Total, Published, Drafts, Views)

   যা লেখা হয় তা আগে lib/productSchema.js এ পরিষ্কার হয়ে আসে
   =============================================================== */

const PRODUCTS = "products";
const products = () => getDB().collection(PRODUCTS);

/* ---------------------------------------------------------------
   index — প্রতি server instance এ একবার

   slug এ unique + sparse: একই ঠিকানার দুইটা product হতে পারে না.
   sparse — পুরনো যে product এ slug নেই সেগুলো একে অপরের সাথে
   "মিলে গেছে" ধরা হয় না, নাহলে index তৈরিই ব্যর্থ হতো
   --------------------------------------------------------------- */
let indexesReady;

const ensureIndexes = () => {
  if (!indexesReady) {
    indexesReady = Promise.all([
      products().createIndex({ slug: 1 }, { unique: true, sparse: true }),
      products().createIndex({ status: 1, createdAt: -1 }),
      products().createIndex({ category: 1 }),
    ]).catch((error) => {
      // index না হলেও product এর কাজ চলবে — শুধু সতর্কবার্তা
      console.warn("⚠️ Product indexes:", error.message);
    });
  }
  return indexesReady;
};

/* ---------------------------------------------------------------
   সাহায্যকারী
   --------------------------------------------------------------- */
const toObjectId = (value) => {
  try {
    return new ObjectId(String(value));
  } catch {
    return null;
  }
};

// খোঁজার লেখায় . * ( এর মতো চিহ্ন থাকলে সেগুলো সাধারণ অক্ষর ধরা
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* পুরনো product এ অনেক ঘর নেই — তাই সবগুলোর একটা নিরাপদ মান.
   এতে admin panel এর কোথাও undefined.map() এ পাতা ভাঙে না */
const withDefaults = (doc) => ({
  id: doc._id.toString(),
  name: doc.name ?? "",
  slug: doc.slug ?? "",
  category: CATEGORIES.includes(doc.category) ? doc.category : "other",
  series: doc.series ?? "",
  color: doc.color ?? "",
  shortDescription: doc.shortDescription ?? "",
  status: doc.status === "published" ? "published" : "draft",
  stock: typeof doc.stock === "number" ? doc.stock : null,
  views: typeof doc.views === "number" ? doc.views : 0,
  images: Array.isArray(doc.images) ? doc.images : [],
  videoUrls: Array.isArray(doc.videoUrls) ? doc.videoUrls : [],
  keyFeatures: Array.isArray(doc.keyFeatures) ? doc.keyFeatures : [],
  specs: doc.specs && typeof doc.specs === "object" ? doc.specs : {},
  videos: Array.isArray(doc.videos) ? doc.videos : [],
  documents: Array.isArray(doc.documents) ? doc.documents : [],
  createdAt: doc.createdAt ?? null,
  updatedAt: doc.updatedAt ?? doc.createdAt ?? null,
});

// admin panel এ — সবকিছু, সাথে কে শেষ বদলেছে
const adminShape = (doc) => ({
  ...withDefaults(doc),
  updatedBy: doc.updatedBy?.name ?? null,
});

// public সাইটে — admin এর নাম, stock, views, draft এর কিছুই না
const publicShape = (doc) => {
  const {
    status: _status,
    stock: _stock,
    views: _views,
    createdAt: _createdAt,
    ...rest
  } = withDefaults(doc);
  return rest;
};

// তালিকার সারি — পুরো specs বা video পাঠানোর দরকার নেই
const rowShape = (doc) => {
  const product = withDefaults(doc);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    series: product.series,
    status: product.status,
    stock: product.stock,
    image: product.images[0]?.url ?? "",
    certifications: (product.specs.certifications?.items ?? []).slice(0, 4),
    updatedAt: product.updatedAt,
  };
};

const who = (admin) => ({
  id: admin._id,
  name: admin.name ?? admin.email,
});

/* নতুন slug — নাম থেকে. আগে থেকে থাকলে শেষে -2, -3 … */
async function uniqueSlug(name, exceptId = null) {
  const base = slugify(name);
  const taken = await products()
    .find(
      { slug: { $regex: `^${escapeRegex(base)}(-\\d+)?$` } },
      { projection: { slug: 1 } },
    )
    .toArray();

  const used = new Set(
    taken
      .filter((doc) => !exceptId || !doc._id.equals(exceptId))
      .map((doc) => doc.slug),
  );

  if (!used.has(base)) return base;
  let number = 2;
  while (used.has(`${base}-${number}`)) number += 1;
  return `${base}-${number}`;
}

/* Cloudinary থেকে মোছা — কিন্তু শুধু যেগুলো আর কোনো product এ নেই.
   "Duplicate" করা product আসলটার ছবিই ব্যবহার করে; কপি মুছলে
   আসলটার ছবি হারিয়ে যাওয়া চলবে না */
async function removeUnusedAssets(assets) {
  const unique = [...new Map(assets.map((a) => [a.publicId, a])).values()];

  await Promise.allSettled(
    unique.map(async (asset) => {
      const stillUsed = await products().countDocuments(
        {
          $or: [
            { "images.publicId": asset.publicId },
            { "videos.publicId": asset.publicId },
            { "documents.publicId": asset.publicId },
          ],
        },
        { limit: 1 },
      );
      if (!stillUsed) await destroyAsset(asset);
    }),
  );
}

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  updated: { updatedAt: -1, _id: -1 },
  "name-asc": { name: 1, _id: 1 },
  "name-desc": { name: -1, _id: -1 },
};

const PAGE_SIZES = [5, 10, 20, 50];

/* ===============================================================
   Public
   =============================================================== */

/* GET /api/products?category=lamp-fixture */
export async function getAllProducts(req, res, next) {
  try {
    const filter = { status: "published" };
    if (CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    const docs = await products()
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(500)
      .toArray();

    res.json({ products: docs.map(publicShape) });
  } catch (error) {
    next(error);
  }
}

/* GET /api/products/:idOrSlug — /products/la1-high-bay এর মতো
   ঠিকানা থেকেও খোঁজা যায় */
export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const objectId = /^[a-f\d]{24}$/i.test(id) ? toObjectId(id) : null;

    const doc = await products().findOne({
      status: "published",
      ...(objectId ? { _id: objectId } : { slug: String(id).toLowerCase() }),
    });

    if (!doc) return res.status(404).json({ message: "Product not found" });
    res.json({ product: publicShape(doc) });
  } catch (error) {
    next(error);
  }
}

/* ===============================================================
   Admin
   =============================================================== */

/* GET /api/products/admin/list
     ?q=la1 &status=draft &category=reflector &series=High Bay Lights
     &sort=newest &page=1 &limit=10 */
export async function adminListProducts(req, res, next) {
  try {
    await ensureIndexes();

    const query = req.query;
    const filter = {};

    if (query.status === "published") filter.status = "published";
    if (query.status === "draft") filter.status = { $ne: "published" };
    if (CATEGORIES.includes(query.category)) filter.category = query.category;

    if (typeof query.series === "string" && query.series.trim()) {
      filter.series = query.series.trim().slice(0, 60);
    }

    if (typeof query.q === "string" && query.q.trim()) {
      const pattern = escapeRegex(query.q.trim().slice(0, 100));
      filter.$or = [
        { name: { $regex: pattern, $options: "i" } },
        { series: { $regex: pattern, $options: "i" } },
        { slug: { $regex: pattern, $options: "i" } },
      ];
    }

    const sort = SORTS[query.sort] ?? SORTS.newest;
    const limit = PAGE_SIZES.includes(Number(query.limit))
      ? Number(query.limit)
      : 10;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [matched, total, published, newThisMonth, viewSum, seriesList] =
      await Promise.all([
        products().countDocuments(filter),
        products().countDocuments({}),
        products().countDocuments({ status: "published" }),
        products().countDocuments({ createdAt: { $gte: monthStart } }),
        products()
          .aggregate([{ $group: { _id: null, views: { $sum: "$views" } } }])
          .toArray(),
        products().distinct("series"),
      ]);

    // পাতা নম্বর সীমার বাইরে গেলে শেষ পাতা দেখানো
    const pages = Math.max(1, Math.ceil(matched / limit));
    const page = Math.min(pages, Math.max(1, Number(query.page) || 1));

    const docs = await products()
      .find(filter, {
        projection: {
          name: 1,
          slug: 1,
          category: 1,
          series: 1,
          status: 1,
          stock: 1,
          images: 1,
          "specs.certifications": 1,
          createdAt: 1,
          updatedAt: 1,
        },
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      items: docs.map(rowShape),
      page,
      pages,
      limit,
      matched,
      stats: {
        total,
        published,
        drafts: total - published,
        views: viewSum[0]?.views ?? 0,
        newThisMonth,
      },
      series: seriesList.filter((item) => typeof item === "string" && item).sort(),
    });
  } catch (error) {
    next(error);
  }
}

/* GET /api/products/admin/:id — সম্পাদনার জন্য পুরোটা */
export async function adminGetProduct(req, res, next) {
  try {
    const _id = toObjectId(req.params.id);
    const doc = _id ? await products().findOne({ _id }) : null;
    if (!doc) return res.status(404).json({ message: "Product not found" });

    res.json({ product: adminShape(doc) });
  } catch (error) {
    next(error);
  }
}

/* POST /api/products */
export async function createProduct(req, res, next) {
  try {
    await ensureIndexes();

    const { value, error } = cleanProduct(req.body);
    if (error) return res.status(400).json({ message: error });

    if (value.status === "published") {
      const missing = missingForPublish(value);
      if (missing.length) {
        return res
          .status(400)
          .json({ message: `To publish, add: ${missing.join(", ")}.` });
      }
    }

    const now = new Date();
    const doc = {
      ...value,
      slug: await uniqueSlug(value.name),
      views: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: who(req.admin),
      updatedBy: who(req.admin),
    };

    const result = await products().insertOne(doc);
    doc._id = result.insertedId;

    await logActivity(req.admin, "product.create", {
      productId: doc._id.toString(),
      name: doc.name,
      status: doc.status,
    });

    res.status(201).json({ product: adminShape(doc) });
  } catch (error) {
    next(error);
  }
}

/* PATCH /api/products/:id — শুধু পাঠানো ঘরগুলো বদলায় */
export async function updateProduct(req, res, next) {
  try {
    const _id = toObjectId(req.params.id);
    const existing = _id ? await products().findOne({ _id }) : null;
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const { value, error } = cleanProduct(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });

    const merged = { ...withDefaults(existing), ...value };

    if (merged.status === "published") {
      const missing = missingForPublish(merged);
      if (missing.length) {
        return res
          .status(400)
          .json({ message: `To publish, add: ${missing.join(", ")}.` });
      }
    }

    const changes = {
      ...value,
      updatedAt: new Date(),
      updatedBy: who(req.admin),
    };

    /* পুরনো product এ slug না থাকলে এখন একটা দেওয়া হয়.
       যার আছে তার ঠিকানা বদলানো হয় না — বাইরে কেউ link রেখে
       থাকলে সেটা ভেঙে যেত */
    if (!existing.slug) changes.slug = await uniqueSlug(merged.name, _id);

    const updated = await products().findOneAndUpdate(
      { _id },
      { $set: changes },
      { returnDocument: "after" },
    );

    /* v6 driver সরাসরি document দেয়; পুরনো কিছু setup এ { value }
       আসে — দুইটাই সামলানো */
    const doc = updated?.value !== undefined ? updated.value : updated;

    // যে ছবি / video / ফাইল সরানো হয়েছে, Cloudinary থেকেও মোছা
    const kept = new Set(assetsOf(doc).map((asset) => asset.publicId));
    const removed = assetsOf(existing).filter((asset) => !kept.has(asset.publicId));
    if (removed.length) await removeUnusedAssets(removed);

    const becamePublished =
      existing.status !== "published" && doc.status === "published";

    await logActivity(
      req.admin,
      becamePublished ? "product.publish" : "product.update",
      { productId: doc._id.toString(), name: doc.name, status: doc.status },
    );

    res.json({ product: adminShape(doc) });
  } catch (error) {
    next(error);
  }
}

/* DELETE /api/products/:id */
export async function deleteProduct(req, res, next) {
  try {
    const _id = toObjectId(req.params.id);
    const existing = _id ? await products().findOne({ _id }) : null;
    if (!existing) return res.status(404).json({ message: "Product not found" });

    await products().deleteOne({ _id });
    await removeUnusedAssets(assetsOf(existing));

    await logActivity(req.admin, "product.delete", {
      productId: _id.toString(),
      name: existing.name,
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

/* POST /api/products/:id/duplicate — একই রকম আরেকটা product বানাতে
   শুরুর বিন্দু. সবসময় draft হয়ে আসে, আর ছবি/ফাইল আসলটার সাথেই
   ভাগ করে (Cloudinary তে নতুন করে তোলা হয় না) */
export async function duplicateProduct(req, res, next) {
  try {
    await ensureIndexes();

    const _id = toObjectId(req.params.id);
    const existing = _id ? await products().findOne({ _id }) : null;
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const source = withDefaults(existing);
    const name = `${source.name} (Copy)`.slice(0, 100);
    const now = new Date();

    const doc = {
      name,
      slug: await uniqueSlug(name),
      category: source.category,
      series: source.series,
      shortDescription: source.shortDescription,
      status: "draft",
      stock: source.stock,
      images: source.images,
      videoUrls: source.videoUrls,
      keyFeatures: source.keyFeatures,
      specs: source.specs,
      videos: source.videos,
      documents: source.documents,
      views: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: who(req.admin),
      updatedBy: who(req.admin),
    };

    const result = await products().insertOne(doc);
    doc._id = result.insertedId;

    await logActivity(req.admin, "product.duplicate", {
      productId: doc._id.toString(),
      from: _id.toString(),
      name: doc.name,
    });

    res.status(201).json({ product: adminShape(doc) });
  } catch (error) {
    next(error);
  }
}

