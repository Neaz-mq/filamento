import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { logActivity } from "../lib/activity.js";
import { recordProductView } from "../lib/reporting.js";
import { destroyAsset } from "../lib/cloudinary.js";
import {
  CATEGORIES,
  COMPONENT_STEPS,
  CONFIGURATOR,
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
  featured: doc.featured === true,
  filters: doc.filters && typeof doc.filters === "object" ? doc.filters : {},
  stock: typeof doc.stock === "number" ? doc.stock : null,
  views: typeof doc.views === "number" ? doc.views : 0,
  images: Array.isArray(doc.images) ? doc.images : [],
  videoUrls: Array.isArray(doc.videoUrls) ? doc.videoUrls : [],
  keyFeatures: Array.isArray(doc.keyFeatures) ? doc.keyFeatures : [],
  specs: doc.specs && typeof doc.specs === "object" ? doc.specs : {},
  components:
    doc.category === CONFIGURATOR && doc.components && typeof doc.components === "object"
      ? doc.components
      : {},
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

/* ---------------------------------------------------------------
   Configurator এর option — database এ শুধু product এর id থাকে.
   পড়ার সময় প্রতিটা option এ সেই product এর নাম, ছবি … (item)
   জুড়ে দেওয়া হয়. সব product এর জন্য একটাই query.

   publicOnly — সাইটে শুধু published অংশ যায়. default অংশটা draft
   হলে প্রথম published টা default হয়, কোনো ধাপ ফাঁকা হলে বাদ.
   admin panel এ সব যায়, সাথে status — draft আর মুছে ফেলা অংশ
   (item: null) চিহ্নিত করে দেখানোর জন্য
   --------------------------------------------------------------- */
const componentIds = (components) =>
  Object.values(components ?? {}).flatMap((step) =>
    (step?.options ?? []).map((option) => option.product),
  );

async function withComponents(shapes, { publicOnly = false } = {}) {
  const list = Array.isArray(shapes) ? shapes : [shapes];
  const ids = [...new Set(list.flatMap((product) => componentIds(product.components)))]
    .map(toObjectId)
    .filter(Boolean);
  if (!ids.length) return shapes;

  const docs = await products()
    .find(
      { _id: { $in: ids } },
      { projection: { name: 1, slug: 1, category: 1, status: 1, images: 1, shortDescription: 1 } },
    )
    .toArray();
  const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]));

  for (const product of list) {
    const resolved = {};
    for (const [key, step] of Object.entries(product.components ?? {})) {
      let options = (step?.options ?? []).map((option) => {
        const doc = byId.get(option.product);
        return {
          ...option,
          item: doc
            ? {
                id: doc._id.toString(),
                name: doc.name ?? "",
                slug: doc.slug ?? "",
                category: doc.category,
                status: doc.status === "published" ? "published" : "draft",
                image: doc.images?.[0]?.url ?? "",
                shortDescription: doc.shortDescription ?? "",
              }
            : null,
        };
      });

      if (publicOnly) {
        options = options
          .filter((option) => option.item?.status === "published")
          .map(({ item: { status: _status, ...item }, ...option }) => ({ ...option, item }));
        if (!options.length) continue;
        if (!options.some((option) => option.isDefault)) {
          options[0] = { ...options[0], isDefault: true };
        }
      }

      resolved[key] = { required: step?.required === true, options };
    }
    product.components = resolved;
  }
  return shapes;
}

/* লেখার আগে — option এর product গুলো সত্যিই আছে আর ঠিক ধাপের
   category র কি না. মুছে ফেলা product চুপচাপ বাদ পড়ে (admin panel এ
   সেগুলো আগেই "Removed" দেখায়); ভুল category হলে save হয় না —
   ওটা শুধু হাতে বানানো request এ হতে পারে */
async function checkComponents(components) {
  const ids = [...new Set(componentIds(components))].map(toObjectId).filter(Boolean);
  if (!ids.length) return null;

  const docs = await products()
    .find({ _id: { $in: ids } }, { projection: { name: 1, category: 1 } })
    .toArray();
  const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]));

  for (const [key, step] of Object.entries(components)) {
    const info = COMPONENT_STEPS[key];
    for (const option of step.options) {
      const doc = byId.get(option.product);
      if (doc && doc.category !== info.category) {
        return `"${doc.name}" is not a ${info.label}. Remove it from the ${info.label} options.`;
      }
    }
    step.options = step.options.filter((option) => byId.has(option.product));
    if (step.options.length && !step.options.some((option) => option.isDefault)) {
      step.options[0].isDefault = true;
    }
  }
  return null;
}

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

    res.json({
      products: await withComponents(docs.map(publicShape), { publicOnly: true }),
    });
  } catch (error) {
    next(error);
  }
}

/* GET /api/products/catalog — সাইটের Products পাতার তালিকা.

   সব published product একবারে, কিন্তু হালকা করে: নাম, ছবি, category,
   filter এর মান … — specs, video, document ছাড়া. খোঁজা, filter,
   সাজানো আর পাতা ভাগ browser নিজেই করে, তাই প্রতিটা click এ server
   এ যেতে হয় না আর filter এর পাশের সংখ্যাগুলো সাথে সাথে বদলায়.
   (কয়েক শ product পর্যন্ত এটাই সবচেয়ে দ্রুত; অনেক হাজার হলে তখন
   server এ পাতা ভাগ করা লাগবে) */
export async function getCatalog(req, res, next) {
  try {
    const docs = await products()
      .find(
        { status: "published" },
        {
          projection: {
            name: 1,
            slug: 1,
            category: 1,
            series: 1,
            color: 1,
            shortDescription: 1,
            images: 1,
            filters: 1,
            featured: 1,
            views: 1,
            createdAt: 1,
            // Compare এর টেবিলে "Certifications" সারির জন্য — শুধু এই তালিকাটা
            "specs.certifications.items": 1,
          },
        },
      )
      .sort({ createdAt: 1, _id: 1 })
      .limit(2000)
      .toArray();

    // কয়েক মিনিট CDN এ জমা থাকতে পারে — নতুন publish ৫ মিনিটের মধ্যে আসে
    res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    res.json({
      products: docs.map((doc) => ({
        id: doc._id.toString(),
        name: doc.name ?? "",
        slug: doc.slug ?? "",
        category: CATEGORIES.includes(doc.category) ? doc.category : "other",
        series: doc.series ?? "",
        color: doc.color ?? "",
        shortDescription: doc.shortDescription ?? "",
        image: doc.images?.[0]?.url ?? "",
        filters: doc.filters && typeof doc.filters === "object" ? doc.filters : {},
        featured: doc.featured === true,
        views: typeof doc.views === "number" ? doc.views : 0,
        certifications: Array.isArray(doc.specs?.certifications?.items)
          ? doc.specs.certifications.items.slice(0, 6)
          : [],
        createdAt: doc.createdAt ?? null,
      })),
    });
  } catch (error) {
    next(error);
  }
}

/* GET /api/products/:idOrSlug — /products/la1-high-bay এর মতো
   ঠিকানা থেকেও খোঁজা যায়.

   ঠিক ওই slug না পেলে, ওই নাম দিয়ে শুরু হওয়া product খোঁজা হয়
   ("la1-high-bay" → "la1-high-bay-linear-distribution") — পুরনো বা
   ছোট করে লেখা link যেন ভেঙে না যায়. পাতা তখন ঠিকানাটা আসল slug এ
   বদলে নেয় */
export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const objectId = /^[a-f\d]{24}$/i.test(id) ? toObjectId(id) : null;
    const slug = String(id).toLowerCase().slice(0, 120);

    let doc = await products().findOne({
      status: "published",
      ...(objectId ? { _id: objectId } : { slug }),
    });

    if (!doc && !objectId && /^[a-z0-9-]+$/.test(slug)) {
      [doc] = await products()
        .find({ status: "published", slug: { $regex: `^${escapeRegex(slug)}-` } })
        .sort({ createdAt: 1, _id: 1 })
        .limit(1)
        .toArray();
    }

    if (!doc) return res.status(404).json({ message: "Product not found" });
    res.json({ product: await withComponents(publicShape(doc), { publicOnly: true }) });
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

    res.json({ product: await withComponents(adminShape(doc)) });
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

    const wrongPart = await checkComponents(value.components);
    if (wrongPart) return res.status(400).json({ message: wrongPart });

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

    res.status(201).json({ product: await withComponents(adminShape(doc)) });
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

    if (value.components) {
      const wrongPart = await checkComponents(value.components);
      if (wrongPart) return res.status(400).json({ message: wrongPart });
    }

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

    res.json({ product: await withComponents(adminShape(doc)) });
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
      color: source.color,
      shortDescription: source.shortDescription,
      status: "draft",
      featured: false,
      filters: source.filters,
      stock: source.stock,
      images: source.images,
      videoUrls: source.videoUrls,
      keyFeatures: source.keyFeatures,
      specs: source.specs,
      components: source.components,
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

    res.status(201).json({ product: await withComponents(adminShape(doc)) });
  } catch (error) {
    next(error);
  }
}

/* ---------------------------------------------------------------
   POST /api/products/:idOrSlug/view — সাইটে product এর পাতা খোলা
   হলে একবার গোনা. "Sort by: Most Popular" আর admin এর Total Views
   এখান থেকেই আসে.

   একই IP থেকে একই product ৩০ মিনিটে একবার — বারবার reload করে
   সংখ্যা বাড়ানো যায় না. (memory তে থাকে, তাই পুরো সুরক্ষা নয় —
   videoViewRoutes.js এর মতোই সহজ বাধা)
   --------------------------------------------------------------- */
const VIEW_WINDOW_MS = 30 * 60 * 1000;
const MAX_TRACKED_VIEWS = 5000;
const recentViews = new Map();

const clientIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip || "unknown";

const shouldCountView = (key, now) => {
  const last = recentViews.get(key);
  if (last && now - last < VIEW_WINDOW_MS) return false;
  if (recentViews.size >= MAX_TRACKED_VIEWS) {
    for (const [stored, time] of recentViews) {
      if (now - time >= VIEW_WINDOW_MS) recentViews.delete(stored);
    }
    if (recentViews.size >= MAX_TRACKED_VIEWS) {
      recentViews.delete(recentViews.keys().next().value);
    }
  }
  recentViews.set(key, now);
  return true;
};

export async function addProductView(req, res, next) {
  try {
    const { id } = req.params;
    const objectId = /^[a-f\d]{24}$/i.test(id) ? toObjectId(id) : null;
    const filter = {
      status: "published",
      ...(objectId ? { _id: objectId } : { slug: String(id).toLowerCase().slice(0, 120) }),
    };

    const doc = await products().findOne(filter, { projection: { _id: 1 } });
    if (!doc) return res.status(404).json({ message: "Product not found" });

    const counted = shouldCountView(`${clientIp(req)}:${doc._id}`, Date.now());
    if (counted) {
      await products().updateOne({ _id: doc._id }, { $inc: { views: 1 } });
      // Dashboard এর "Product Activity" আর "Top Performing" এর দিনের হিসাব
      await recordProductView(doc._id);
    }

    res.set("Cache-Control", "no-store");
    res.json({ counted });
  } catch (error) {
    next(error);
  }
}
