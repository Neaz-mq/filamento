import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { logActivity } from "../lib/activity.js";
import { destroyAsset } from "../lib/cloudinary.js";
import { CATEGORIES as PRODUCT_CATEGORIES } from "../lib/productSchema.js";
import {
  LIVE_STATUSES,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  cleanProject,
  countryOf,
  isLive,
  missingForPublish,
  projectAssets,
  projectSlug,
} from "../lib/projectSchema.js";

/* ===============================================================
   Project — database এর কাজ

   দুই ধরনের পাঠক:
     public সাইট  — শুধু Completed আর In Progress project, draft না.
                    ভেতরের product গুলোর মধ্যেও শুধু published টা
     admin panel  — draft সহ সব, খোঁজা/ছাঁকা/পাতা ভাগ, উপরের চারটা
                    সংখ্যা, Project Overview আর Projects by Location

   প্রতিটা project এর একটা ক্রমিক নম্বর থাকে (#PRJ-001). নম্বরটা
   "counters" collection থেকে আসে — একসাথে দুইজন project বানালেও
   একই নম্বর পায় না, আর মুছে ফেলা project এর নম্বর আর ফেরে না
   =============================================================== */

const projects = () => getDB().collection("projects");
const products = () => getDB().collection("products");
const counters = () => getDB().collection("counters");

let indexesReady;

const ensureIndexes = () => {
  if (!indexesReady) {
    indexesReady = Promise.all([
      projects().createIndex({ slug: 1 }, { unique: true, sparse: true }),
      projects().createIndex({ code: 1 }, { unique: true, sparse: true }),
      projects().createIndex({ status: 1, createdAt: -1 }),
    ]).catch((error) => {
      console.warn("⚠️ Project indexes:", error.message);
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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const projectRef = (code) =>
  typeof code === "number" && code > 0 ? `PRJ-${String(code).padStart(3, "0")}` : "";

/* পরের ক্রমিক নম্বর. আগে counter কে অন্তত সবচেয়ে বড় নম্বরের সমান
   করা হয় — হাতে বা script দিয়ে project ঢোকানো থাকলেও নম্বর মিলে
   যায় না */
export async function nextProjectCode() {
  const [top] = await projects()
    .find({ code: { $gt: 0 } }, { projection: { code: 1 } })
    .sort({ code: -1 })
    .limit(1)
    .toArray();

  await counters().updateOne(
    { _id: "project" },
    { $max: { seq: top?.code ?? 0 } },
    { upsert: true },
  );

  const result = await counters().findOneAndUpdate(
    { _id: "project" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  const doc = result?.value !== undefined ? result.value : result;
  return doc.seq;
}

/* পুরনো বা অর্ধেক project এ কিছু ঘর না থাকলেও admin panel যেন না
   ভাঙে — সবগুলোর একটা নিরাপদ মান */
const withDefaults = (doc) => {
  const cta = doc.cta && typeof doc.cta === "object" ? doc.cta : {};
  return {
    id: doc._id.toString(),
    code: typeof doc.code === "number" ? doc.code : null,
    ref: projectRef(doc.code),
    title: doc.title ?? "",
    slug: doc.slug ?? "",
    company: doc.company ?? "",
    shortDescription: doc.shortDescription ?? "",
    projectType: Object.hasOwn(PROJECT_TYPES, doc.projectType ?? "") ? doc.projectType : "",
    category: Object.hasOwn(PROJECT_CATEGORIES, doc.category ?? "") ? doc.category : "",
    location: doc.location ?? "",
    date: doc.date ?? "",
    status: PROJECT_STATUSES.includes(doc.status) ? doc.status : "draft",
    views: typeof doc.views === "number" ? doc.views : 0,
    images: Array.isArray(doc.images) ? doc.images : [],
    videoUrls: Array.isArray(doc.videoUrls) ? doc.videoUrls : [],
    keyFeatures: Array.isArray(doc.keyFeatures) ? doc.keyFeatures : [],
    challenge: doc.challenge ?? "",
    solutionIntro: doc.solutionIntro ?? "",
    solution: Array.isArray(doc.solution) ? doc.solution : [],
    results: doc.results ?? "",
    highlights: Array.isArray(doc.highlights) ? doc.highlights : [],
    cta: {
      text: cta.text ?? "",
      link: cta.link ?? "",
      newTab: cta.newTab === true,
    },
    products: Array.isArray(doc.products) ? doc.products.map(String) : [],
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? doc.createdAt ?? null,
    publishedAt: doc.publishedAt ?? null,
  };
};

/* ---------------------------------------------------------------
   Product Used — database এ শুধু product এর id. পড়ার সময় নাম,
   ছবি … জুড়ে দেওয়া হয় (একটাই query). তাই product এর নাম বা ছবি
   বদলালে project এ নিজে থেকেই নতুনটা দেখায়
   --------------------------------------------------------------- */
const PRODUCT_FIELDS = {
  name: 1,
  slug: 1,
  category: 1,
  series: 1,
  color: 1,
  status: 1,
  images: 1,
  shortDescription: 1,
};

const productItem = (doc) => ({
  id: doc._id.toString(),
  name: doc.name ?? "",
  slug: doc.slug ?? "",
  category: doc.category ?? "other",
  series: doc.series ?? "",
  color: doc.color ?? "",
  status: doc.status === "published" ? "published" : "draft",
  image: doc.images?.[0]?.url ?? "",
  shortDescription: doc.shortDescription ?? "",
});

async function productsById(ids) {
  const objectIds = [...new Set(ids)].map(toObjectId).filter(Boolean);
  if (!objectIds.length) return new Map();
  const docs = await products()
    .find({ _id: { $in: objectIds } }, { projection: PRODUCT_FIELDS })
    .toArray();
  return new Map(docs.map((doc) => [doc._id.toString(), productItem(doc)]));
}

// admin panel — সব, মুছে ফেলা product এ { id, missing: true }
async function adminShape(doc) {
  const project = withDefaults(doc);
  const byId = await productsById(project.products);
  return {
    ...project,
    productItems: project.products.map((id) => byId.get(id) ?? { id, missing: true }),
    updatedBy: doc.updatedBy?.name ?? null,
  };
}

/* public সাইট — শুধু published product, admin এর তথ্য ছাড়া.
   byId আগে থেকে দেওয়া যায় (তালিকায় সব project এর জন্য একটাই query) */
async function publicShape(doc, byId) {
  const {
    views: _views,
    createdAt: _createdAt,
    code: _code,
    products: ids,
    ...project
  } = withDefaults(doc);

  const known = byId ?? (await productsById(ids));
  return {
    ...project,
    categoryLabel: PROJECT_CATEGORIES[project.category] ?? "",
    projectTypeLabel: PROJECT_TYPES[project.projectType] ?? "",
    products: ids
      .map((id) => known.get(id))
      .filter((item) => item?.status === "published")
      .map(({ status: _status, ...item }) => item),
  };
}

/* লেখার আগে — যে product গুলো আর নেই সেগুলো চুপচাপ বাদ (admin
   panel এ সেগুলো আগেই "Removed" দেখায়). ক্রম ঠিক থাকে */
async function existingProducts(ids) {
  if (!ids.length) return ids;
  const byId = await productsById(ids);
  return ids.filter((id) => byId.has(id));
}

const who = (admin) => ({
  id: admin._id,
  name: admin.name ?? admin.email,
});

/* নতুন slug — নাম থেকে. আগে থেকে থাকলে শেষে -2, -3 … */
async function uniqueSlug(title, exceptId = null) {
  const base = projectSlug(title);
  const taken = await projects()
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

/* Cloudinary থেকে মোছা — শুধু যেগুলো আর কোনো project এ নেই
   ("Duplicate" করা project আসলটার ছবিই ব্যবহার করে) */
async function removeUnusedAssets(assets) {
  const unique = [...new Map(assets.map((a) => [a.publicId, a])).values()];

  await Promise.allSettled(
    unique.map(async (asset) => {
      const stillUsed = await projects().countDocuments(
        { "images.publicId": asset.publicId },
        { limit: 1 },
      );
      if (!stillUsed) await destroyAsset(asset);
    }),
  );
}

const publishCheck = (project) => {
  if (!isLive(project.status)) return null;
  const missing = missingForPublish(project);
  return missing.length ? `To publish, add: ${missing.join(", ")}.` : null;
};

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  updated: { updatedAt: -1, _id: -1 },
  date: { date: -1, _id: -1 },
  "title-asc": { title: 1, _id: 1 },
  "title-desc": { title: -1, _id: -1 },
};

const PAGE_SIZES = [5, 10, 20, 50];

/* ===============================================================
   Public
   =============================================================== */

/* GET /api/projects?type=warehouse&category=industrial */
export async function getProjects(req, res, next) {
  try {
    const filter = { status: { $in: LIVE_STATUSES } };
    if (Object.hasOwn(PROJECT_TYPES, req.query.type ?? "")) filter.projectType = req.query.type;
    if (Object.hasOwn(PROJECT_CATEGORIES, req.query.category ?? "")) {
      filter.category = req.query.category;
    }

    const docs = await projects()
      .find(filter)
      .sort({ date: -1, createdAt: -1, _id: -1 })
      .limit(500)
      .toArray();

    const byId = await productsById(docs.flatMap((doc) => doc.products ?? []));
    res.json({
      projects: await Promise.all(docs.map((doc) => publicShape(doc, byId))),
    });
  } catch (error) {
    next(error);
  }
}

/* GET /api/projects/:idOrSlug */
export async function getProject(req, res, next) {
  try {
    const { id } = req.params;
    const objectId = /^[a-f\d]{24}$/i.test(id) ? toObjectId(id) : null;

    const doc = await projects().findOne({
      status: { $in: LIVE_STATUSES },
      ...(objectId ? { _id: objectId } : { slug: String(id).toLowerCase() }),
    });

    if (!doc) return res.status(404).json({ message: "Project not found" });
    res.json({ project: await publicShape(doc) });
  } catch (error) {
    next(error);
  }
}

/* ===============================================================
   Admin
   =============================================================== */

/* GET /api/projects/admin/list
     ?q=warehouse &status=draft &category=industrial
     &sort=newest &page=1 &limit=10 */
export async function adminListProjects(req, res, next) {
  try {
    await ensureIndexes();

    const query = req.query;
    const filter = {};

    if (PROJECT_STATUSES.includes(query.status)) {
      filter.status = query.status === "draft" ? { $nin: LIVE_STATUSES } : query.status;
    }
    if (Object.hasOwn(PROJECT_CATEGORIES, query.category ?? "")) filter.category = query.category;

    if (typeof query.q === "string" && query.q.trim()) {
      const term = query.q.trim().slice(0, 100);
      const pattern = escapeRegex(term);
      filter.$or = [
        { title: { $regex: pattern, $options: "i" } },
        { company: { $regex: pattern, $options: "i" } },
        { location: { $regex: pattern, $options: "i" } },
        { slug: { $regex: pattern, $options: "i" } },
      ];
      // "#PRJ-004" বা "prj4" লিখলে নম্বর দিয়েও খোঁজা
      const code = term.match(/^#?prj-?0*(\d{1,6})$/i);
      if (code) filter.$or.push({ code: Number(code[1]) });
    }

    const sort = SORTS[query.sort] ?? SORTS.newest;
    const limit = PAGE_SIZES.includes(Number(query.limit)) ? Number(query.limit) : 10;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [matched, statusGroups, newThisMonth, locationDocs] = await Promise.all([
      projects().countDocuments(filter),
      projects()
        .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
        .toArray(),
      projects().countDocuments({ createdAt: { $gte: monthStart } }),
      projects().find({}, { projection: { location: 1 } }).limit(5000).toArray(),
    ]);

    const byStatus = Object.fromEntries(statusGroups.map((group) => [group._id, group.count]));
    const total = statusGroups.reduce((sum, group) => sum + group.count, 0);
    const completed = byStatus.completed ?? 0;
    const inProgress = byStatus["in-progress"] ?? 0;

    /* Projects by Location — দেশ ধরে গোনা, বড় চারটা আলাদা, বাকি
       সব "Other" এ */
    const countries = new Map();
    let unknown = 0;
    for (const doc of locationDocs) {
      const country = countryOf(doc.location);
      if (!country) unknown += 1;
      else countries.set(country, (countries.get(country) ?? 0) + 1);
    }
    const ranked = [...countries.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const top = ranked.slice(0, 4);
    const rest = ranked.slice(4).reduce((sum, item) => sum + item.count, 0) + unknown;
    const locations = rest ? [...top, { name: "Other", count: rest, other: true }] : top;

    const pages = Math.max(1, Math.ceil(matched / limit));
    const page = Math.min(pages, Math.max(1, Number(query.page) || 1));

    const docs = await projects()
      .find(filter, {
        projection: {
          code: 1,
          title: 1,
          slug: 1,
          company: 1,
          category: 1,
          location: 1,
          date: 1,
          status: 1,
          images: 1,
          products: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // PRODUCT কলাম — প্রতিটা project এর প্রথম product এর নাম
    const byId = await productsById(docs.map((doc) => doc.products?.[0]).filter(Boolean));

    res.json({
      items: docs.map((doc) => {
        const project = withDefaults(doc);
        const first = byId.get(project.products[0]);
        return {
          id: project.id,
          ref: project.ref,
          title: project.title,
          slug: project.slug,
          company: project.company,
          category: project.category,
          location: project.location,
          date: project.date,
          status: project.status,
          image: project.images[0]?.url ?? "",
          product: first ? first.name : "",
          productCount: project.products.length,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      }),
      page,
      pages,
      limit,
      matched,
      stats: {
        total,
        completed,
        inProgress,
        drafts: total - completed - inProgress,
        newThisMonth,
        locations,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* GET /api/projects/admin/products?q=&category=&page=
   Product Used ধাপের তালিকা — draft সহ সব product, বাঁ পাশের
   category গুলোর সংখ্যা সহ (খোঁজার লেখা মেনে) */
export async function adminProductOptions(req, res, next) {
  try {
    const query = req.query;
    const base = {};
    if (typeof query.q === "string" && query.q.trim()) {
      const pattern = escapeRegex(query.q.trim().slice(0, 100));
      base.$or = [
        { name: { $regex: pattern, $options: "i" } },
        { series: { $regex: pattern, $options: "i" } },
        { shortDescription: { $regex: pattern, $options: "i" } },
      ];
    }

    const filter = PRODUCT_CATEGORIES.includes(query.category)
      ? { ...base, category: query.category }
      : base;

    const limit = 30;
    const page = Math.max(1, Math.min(200, Number(query.page) || 1));

    const [groups, docs] = await Promise.all([
      products()
        .aggregate([{ $match: base }, { $group: { _id: "$category", count: { $sum: 1 } } }])
        .toArray(),
      products()
        .find(filter, { projection: PRODUCT_FIELDS })
        .sort({ name: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit + 1)
        .toArray(),
    ]);

    const counts = { all: 0 };
    for (const group of groups) {
      counts.all += group.count;
      if (PRODUCT_CATEGORIES.includes(group._id)) counts[group._id] = group.count;
    }

    res.json({
      items: docs.slice(0, limit).map(productItem),
      page,
      hasMore: docs.length > limit,
      counts,
    });
  } catch (error) {
    next(error);
  }
}

/* GET /api/projects/admin/:id — সম্পাদনার জন্য পুরোটা */
export async function adminGetProject(req, res, next) {
  try {
    const _id = toObjectId(req.params.id);
    const doc = _id ? await projects().findOne({ _id }) : null;
    if (!doc) return res.status(404).json({ message: "Project not found" });

    res.json({ project: await adminShape(doc) });
  } catch (error) {
    next(error);
  }
}

/* POST /api/projects */
export async function createProject(req, res, next) {
  try {
    await ensureIndexes();

    const { value, error } = cleanProject(req.body);
    if (error) return res.status(400).json({ message: error });

    const problem = publishCheck(value);
    if (problem) return res.status(400).json({ message: problem });

    value.products = await existingProducts(value.products);

    const now = new Date();
    const doc = {
      ...value,
      code: await nextProjectCode(),
      slug: await uniqueSlug(value.title),
      views: 0,
      publishedAt: isLive(value.status) ? now : null,
      createdAt: now,
      updatedAt: now,
      createdBy: who(req.admin),
      updatedBy: who(req.admin),
    };

    const result = await projects().insertOne(doc);
    doc._id = result.insertedId;

    await logActivity(req.admin, "project.create", {
      projectId: doc._id.toString(),
      name: doc.title,
      status: doc.status,
    });

    res.status(201).json({ project: await adminShape(doc) });
  } catch (error) {
    next(error);
  }
}

/* PATCH /api/projects/:id — শুধু পাঠানো ঘরগুলো বদলায় */
export async function updateProject(req, res, next) {
  try {
    const _id = toObjectId(req.params.id);
    const existing = _id ? await projects().findOne({ _id }) : null;
    if (!existing) return res.status(404).json({ message: "Project not found" });

    const { value, error } = cleanProject(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });

    const merged = { ...withDefaults(existing), ...value };
    const problem = publishCheck(merged);
    if (problem) return res.status(400).json({ message: problem });

    if (value.products) value.products = await existingProducts(value.products);

    const now = new Date();
    const changes = { ...value, updatedAt: now, updatedBy: who(req.admin) };

    // প্রথমবার সাইটে গেলে কবে গেল সেটা রাখা
    if (isLive(merged.status) && !existing.publishedAt) changes.publishedAt = now;

    /* slug না থাকলে এখন দেওয়া হয়. যার আছে তার ঠিকানা বদলানো হয় না —
       বাইরে কেউ link রেখে থাকলে ভেঙে যেত */
    if (!existing.slug) changes.slug = await uniqueSlug(merged.title, _id);
    if (typeof existing.code !== "number") changes.code = await nextProjectCode();

    const updated = await projects().findOneAndUpdate(
      { _id },
      { $set: changes },
      { returnDocument: "after" },
    );
    const doc = updated?.value !== undefined ? updated.value : updated;

    const kept = new Set(projectAssets(doc).map((asset) => asset.publicId));
    const removed = projectAssets(existing).filter((asset) => !kept.has(asset.publicId));
    if (removed.length) await removeUnusedAssets(removed);

    const becameLive = !isLive(existing.status) && isLive(doc.status);
    await logActivity(req.admin, becameLive ? "project.publish" : "project.update", {
      projectId: doc._id.toString(),
      name: doc.title,
      status: doc.status,
    });

    res.json({ project: await adminShape(doc) });
  } catch (error) {
    next(error);
  }
}

/* DELETE /api/projects/:id */
export async function deleteProject(req, res, next) {
  try {
    const _id = toObjectId(req.params.id);
    const existing = _id ? await projects().findOne({ _id }) : null;
    if (!existing) return res.status(404).json({ message: "Project not found" });

    await projects().deleteOne({ _id });
    await removeUnusedAssets(projectAssets(existing));

    await logActivity(req.admin, "project.delete", {
      projectId: _id.toString(),
      name: existing.title,
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

/* POST /api/projects/:id/duplicate — সবসময় draft, নতুন নম্বর, ছবি
   আসলটার সাথেই ভাগ করে */
export async function duplicateProject(req, res, next) {
  try {
    await ensureIndexes();

    const _id = toObjectId(req.params.id);
    const existing = _id ? await projects().findOne({ _id }) : null;
    if (!existing) return res.status(404).json({ message: "Project not found" });

    const {
      id: _oldId,
      code: _oldCode,
      ref: _oldRef,
      slug: _oldSlug,
      views: _views,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      publishedAt: _publishedAt,
      ...source
    } = withDefaults(existing);

    const title = `${source.title} (Copy)`.slice(0, 100);
    const now = new Date();
    const doc = {
      ...source,
      title,
      status: "draft",
      products: await existingProducts(source.products),
      code: await nextProjectCode(),
      slug: await uniqueSlug(title),
      views: 0,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      createdBy: who(req.admin),
      updatedBy: who(req.admin),
    };

    const result = await projects().insertOne(doc);
    doc._id = result.insertedId;

    await logActivity(req.admin, "project.duplicate", {
      projectId: doc._id.toString(),
      from: _id.toString(),
      name: doc.title,
    });

    res.status(201).json({ project: await adminShape(doc) });
  } catch (error) {
    next(error);
  }
}
