import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { ADMINS, requireAdmin } from "../lib/auth.js";
import { LIVE_STATUSES } from "../lib/projectSchema.js";
import {
  PRODUCT_VIEW_DAYS,
  REPORT_TIMEZONE,
  addDays,
  dayKey,
  weekdayOf,
} from "../lib/reporting.js";

/* ===============================================================
   Admin Dashboard এর সব সংখ্যা — এক request এ

   GET /api/admin/overview?days=30
     days — কত দিনের তুলনা (7 | 30 | 90 | 365). card এর "↑ 15% last
     month" এর মতো লেখা এই সময়ের হিসাব.

   GET /api/admin/notifications
     উপরের 🔔 আর বাঁ মেনুর Leads এর সংখ্যা — নতুন quote request.

   login করা যে কেউ পড়তে পারে. কিন্তু গ্রাহকের তথ্য (quote request,
   lead) শুধু owner আর admin — quoteRequestRoutes এর নিয়মের মতোই.
   editor এর জন্য সেই অংশগুলো null আসে, পাতা সেটা বুঝে লুকায়.

   সংখ্যাগুলো JavaScript এ গোনা, MongoDB র aggregate এ নয় — এখনকার
   পরিমাণে (কয়েকশো product/lead) এটা দ্রুত, আর সব database এ একইভাবে
   চলে
   =============================================================== */

const router = Router();

const PERIODS = [7, 30, 90, 365];
const DAY_MS = 24 * 60 * 60 * 1000;

// এক request এ কত সারি পড়া হবে — খুব বড় হলেও server আটকায় না
const MAX_ROWS = 20000;

const CAN_SEE_LEADS = ["owner", "admin"];

// Leads পাতায় যেগুলো "যোগাযোগ হয়েছে" ধরা হয়
const HANDLED = ["contacted", "qualified", "closed"];

/* ---------------------------------------------------------------
   শতাংশের হিসাব — দশমিকের পরে এক ঘর.
   আগের মান 0 হলে শতাংশ হয় না (0 থেকে কত % বাড়ল?) — তখন null,
   পাতায় ওই লেখাটা দেখায় না
   --------------------------------------------------------------- */
const percentChange = (before, after) => {
  if (!before) return null;
  return Math.round(((after - before) / before) * 1000) / 10;
};

const toDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const firstImage = (images) =>
  Array.isArray(images) ? (images.find((image) => image?.url)?.url ?? "") : "";

/* ---------------------------------------------------------------
   Product আর Project — মোট, published/draft, আর সময়ের মধ্যে কত বাড়ল.

   "↑ 15% last month" মানে: এক মাস আগে মোট যত ছিল, তার তুলনায় এখন
   কত বেশি. মুছে ফেলা জিনিসের হিসাব থাকে না, তাই এটা শুধু "নতুন
   যোগ" ধরে
   --------------------------------------------------------------- */
async function contentNumbers(db, since) {
  const products = db.collection("products");
  const projects = db.collection("projects");

  const [productTotal, productPublished, productRecent, projectTotal, projectLive, projectRecent] =
    await Promise.all([
      products.countDocuments({}),
      products.countDocuments({ status: "published" }),
      products.countDocuments({ createdAt: { $gte: since } }),
      projects.countDocuments({}),
      projects.countDocuments({ status: { $in: LIVE_STATUSES } }),
      projects.countDocuments({ createdAt: { $gte: since } }),
    ]);

  return {
    products: {
      total: productTotal,
      published: productPublished,
      draft: productTotal - productPublished,
      change: percentChange(productTotal - productRecent, productTotal),
    },
    projects: {
      total: projectTotal,
      published: projectLive,
      draft: projectTotal - projectLive,
      change: percentChange(projectTotal - projectRecent, projectTotal),
    },
  };
}

/* ---------------------------------------------------------------
   Quote request আর Lead

   Quote Requests — Contact form কতবার জমা হয়েছে. "↑ %" মানে এই
                    সময়ে কতগুলো, আগের সমান সময়ের তুলনায়.
   Total Leads    — আলাদা মানুষ (ইমেইল ধরে) — quote পাঠিয়েছেন অথবা
                    newsletter এ নাম লিখিয়েছেন. একজন তিনবার form
                    পাঠালেও lead একজনই.
                    New       = এখনো কেউ যোগাযোগ করেনি
                    Contacted = Leads পাতায় contacted/qualified/closed
   --------------------------------------------------------------- */
async function leadNumbers(db, since, previousSince) {
  const [requests, subscribers] = await Promise.all([
    db
      .collection("quote_requests")
      .find({}, { projection: { email: 1, status: 1, createdAt: 1 } })
      .limit(MAX_ROWS)
      .toArray(),
    db
      .collection("newsletter_subscribers")
      .find({}, { projection: { email: 1, createdAt: 1 } })
      .limit(MAX_ROWS)
      .toArray(),
  ]);

  const inPeriod = (date) => date && date >= since;
  const inPrevious = (date) => date && date >= previousSince && date < since;

  let fresh = 0;
  let closed = 0;
  let current = 0;
  let previous = 0;
  const people = new Map(); // email → { first, handled }

  const remember = (email, date, handled) => {
    const key = String(email ?? "").trim().toLowerCase();
    if (!key) return;
    const person = people.get(key) ?? { first: date, handled: false };
    if (date && (!person.first || date < person.first)) person.first = date;
    if (handled) person.handled = true;
    people.set(key, person);
  };

  for (const request of requests) {
    const date = toDate(request.createdAt);
    const status = request.status || "new";
    if (status === "new") fresh += 1;
    if (status === "closed") closed += 1;
    if (inPeriod(date)) current += 1;
    else if (inPrevious(date)) previous += 1;
    remember(request.email, date, HANDLED.includes(status));
  }

  for (const subscriber of subscribers) {
    remember(subscriber.email, toDate(subscriber.createdAt), false);
  }

  let contacted = 0;
  let leadsNow = 0;
  let leadsBefore = 0;
  for (const person of people.values()) {
    if (person.handled) contacted += 1;
    if (inPeriod(person.first)) leadsNow += 1;
    else if (inPrevious(person.first)) leadsBefore += 1;
  }

  return {
    quotes: {
      total: requests.length,
      new: fresh,
      closed,
      change: percentChange(previous, current),
    },
    leads: {
      total: people.size,
      new: people.size - contacted,
      contacted,
      change: percentChange(leadsBefore, leadsNow),
    },
  };
}

/* ---------------------------------------------------------------
   Product এর পাতা কতবার দেখা হয়েছে

   thisWeek / lastWeek — রবিবার থেকে শনিবার, প্রতিদিন একটা সংখ্যা.
                         আজকের পরের দিনগুলো null (এখনো আসেনি).
   top.all            — শুরু থেকে মোট (product এর নিজের views)
   top.month / week   — শেষ ৩০ / ৭ দিন (product_view_days থেকে)
   --------------------------------------------------------------- */
async function viewNumbers(db, today) {
  const weekStart = addDays(today, -weekdayOf(today));
  const lastWeekStart = addDays(weekStart, -7);
  const monthStart = addDays(today, -29);
  const sevenStart = addDays(today, -6);
  const from = lastWeekStart < monthStart ? lastWeekStart : monthStart;

  const rows = await db
    .collection(PRODUCT_VIEW_DAYS)
    .find({ day: { $gte: from } }, { projection: { day: 1, productId: 1, count: 1 } })
    .limit(MAX_ROWS)
    .toArray();

  const perDay = new Map();
  const month = new Map();
  const week = new Map();

  for (const row of rows) {
    const count = Number(row.count) || 0;
    const id = row.productId?.toString();
    perDay.set(row.day, (perDay.get(row.day) ?? 0) + count);
    if (!id) continue;
    if (row.day >= monthStart) month.set(id, (month.get(id) ?? 0) + count);
    if (row.day >= sevenStart) week.set(id, (week.get(id) ?? 0) + count);
  }

  const weekOf = (start) =>
    Array.from({ length: 7 }, (_, index) => {
      const day = addDays(start, index);
      return { day, views: day > today ? null : (perDay.get(day) ?? 0) };
    });

  /* শীর্ষ ৫ — নাম আর ছবি product থেকে. মুছে ফেলা product বাদ */
  const topOf = (counts) =>
    [...counts.entries()]
      .filter(([, views]) => views > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

  const topMonth = topOf(month);
  const topWeek = topOf(week);
  const ids = [...new Set([...topMonth, ...topWeek].map(([id]) => id))]
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const products = db.collection("products");
  const projection = { name: 1, slug: 1, images: 1, views: 1, status: 1 };

  const [named, allTime] = await Promise.all([
    ids.length ? products.find({ _id: { $in: ids } }, { projection }).toArray() : [],
    products.find({ views: { $gt: 0 } }, { projection }).sort({ views: -1 }).limit(5).toArray(),
  ]);

  const shape = (doc, views) => ({
    id: doc._id.toString(),
    name: doc.name ?? "",
    slug: doc.slug ?? "",
    image: firstImage(doc.images),
    status: doc.status === "published" ? "published" : "draft",
    views,
  });

  const byId = new Map(named.map((doc) => [doc._id.toString(), doc]));
  const fill = (list) =>
    list.filter(([id]) => byId.has(id)).map(([id, views]) => shape(byId.get(id), views));

  return {
    thisWeek: weekOf(weekStart),
    lastWeek: weekOf(lastWeekStart),
    top: {
      all: allTime.map((doc) => shape(doc, Number(doc.views) || 0)),
      month: fill(topMonth),
      week: fill(topWeek),
    },
  };
}

/* ---------------------------------------------------------------
   সর্বশেষ ৪টা quote request (Recent Leads এর টেবিল)
   --------------------------------------------------------------- */
async function recentLeads(db) {
  const rows = await db
    .collection("quote_requests")
    .find(
      {},
      {
        projection: {
          name: 1,
          email: 1,
          company: 1,
          facilityType: 1,
          projectSize: 1,
          location: 1,
          status: 1,
          createdAt: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .limit(4)
    .toArray();

  return rows.map((row) => ({
    id: row._id.toString(),
    name: row.name ?? "",
    email: row.email ?? "",
    company: row.company ?? "",
    facilityType: row.facilityType ?? "",
    projectSize: row.projectSize ?? "",
    location: row.location ?? null,
    status: row.status || "new",
    createdAt: row.createdAt ?? null,
  }));
}

/* ---------------------------------------------------------------
   সর্বশেষ ৪টা কাজ (Recent Activity). login বাদ — ওটা প্রতিদিন
   অনেকবার হয়, আসল কাজগুলো চাপা পড়ে যেত. পুরো তালিকা Activity Logs
   পাতায়
   --------------------------------------------------------------- */
async function recentActivity(db) {
  const logs = await db
    .collection("activity_logs")
    .find({ action: { $ne: "auth.login" } })
    .sort({ createdAt: -1 })
    .limit(4)
    .toArray();

  const adminIds = [
    ...new Set(logs.map((log) => log.adminId?.toString()).filter(Boolean)),
  ]
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const admins = adminIds.length
    ? await db
        .collection(ADMINS)
        .find({ _id: { $in: adminIds } }, { projection: { name: 1, email: 1 } })
        .toArray()
    : [];
  const names = new Map(admins.map((admin) => [admin._id.toString(), admin.name || admin.email]));

  return logs.map((log) => ({
    id: log._id.toString(),
    action: log.action ?? "",
    // admin মুছে ফেলা হলেও তার কাজের লেখা থাকে — তখন log এর ইমেইল
    actor: names.get(log.adminId?.toString()) || log.adminEmail || "Someone",
    subject: String(log.details?.name || log.details?.email || "").slice(0, 160),
    createdAt: log.createdAt ?? null,
  }));
}

/* ---------------------------------------------------------------
   GET /api/admin/overview
   --------------------------------------------------------------- */
router.get("/overview", requireAdmin, async (req, res, next) => {
  try {
    const db = getDB();
    const days = PERIODS.includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const now = new Date();
    const since = new Date(now.getTime() - days * DAY_MS);
    const previousSince = new Date(since.getTime() - days * DAY_MS);
    const today = dayKey(now);
    const canSeeLeads = CAN_SEE_LEADS.includes(req.admin.role);

    const [content, people, views, leads, activity] = await Promise.all([
      contentNumbers(db, since),
      canSeeLeads ? leadNumbers(db, since, previousSince) : null,
      viewNumbers(db, today),
      canSeeLeads ? recentLeads(db) : null,
      recentActivity(db),
    ]);

    res.set("Cache-Control", "no-store");
    res.json({
      generatedAt: now.toISOString(),
      timezone: REPORT_TIMEZONE,
      today,
      days,
      canSeeLeads,
      products: content.products,
      projects: content.projects,
      quotes: people?.quotes ?? null,
      leads: people?.leads ?? null,
      views: { thisWeek: views.thisWeek, lastWeek: views.lastWeek },
      topProducts: views.top,
      recentLeads: leads,
      recentActivity: activity,
    });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------
   GET /api/admin/notifications
     → { canSeeLeads, newCount, items: [সর্বশেষ ৮টা quote request] }

   🔔 এর লাল সংখ্যা browser নিজে হিসাব করে: শেষবার 🔔 খোলার পরে
   কতগুলো এসেছে. newCount — যেগুলোর এখনো উত্তর দেওয়া হয়নি (বাঁ
   মেনুর Leads এর পাশে)
   --------------------------------------------------------------- */
router.get("/notifications", requireAdmin, async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-store");

    if (!CAN_SEE_LEADS.includes(req.admin.role)) {
      return res.json({ canSeeLeads: false, newCount: 0, items: [], generatedAt: new Date().toISOString() });
    }

    const collection = getDB().collection("quote_requests");
    const [newCount, rows] = await Promise.all([
      collection.countDocuments({ status: "new" }),
      collection
        .find({}, { projection: { name: 1, company: 1, facilityType: 1, status: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray(),
    ]);

    res.json({
      canSeeLeads: true,
      newCount,
      generatedAt: new Date().toISOString(),
      items: rows.map((row) => ({
        id: row._id.toString(),
        name: row.name ?? "",
        company: row.company ?? "",
        facilityType: row.facilityType ?? "",
        status: row.status || "new",
        createdAt: row.createdAt ?? null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
