import express from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import {
  ADMINS,
  destroyAllSessions,
  normalizeEmail,
  publicAdmin,
  requireAdmin,
  requireRole,
  requireSameOrigin,
} from "../lib/auth.js";
import { logActivity } from "../lib/activity.js";

/* ===============================================================
   Users & Roles — একাধিক admin

   সবাই একই /admin panel এ ঢোকে, শুধু ভূমিকা আলাদা:

     owner   — super admin. নতুন admin বানাতে, ভূমিকা বদলাতে আর
               সরাতে পারে. একের বেশি owner থাকতে পারে.
     admin   — বিষয়বস্তু সামলায়, অন্য admin কে ছুঁতে পারে না
     editor  — শুধু লেখা আর ছবি

   কয়েকটা নিয়ম ইচ্ছে করে কড়া:
     • নিজের ভূমিকা নিজে বদলানো বা নিজেকে সরানো যায় না
     • শেষ owner কে নামানো বা সরানো যায় না — নাহলে আর কেউ কাউকে
       ফেরাতে পারত না, database এ হাত দেওয়া ছাড়া উপায় থাকত না
     • ভূমিকা বদলালে বা সরালে ওই admin এর সব session সাথে সাথে
       বাতিল — পুরোনো ক্ষমতা নিয়ে সে আর ঘুরতে পারে না
   =============================================================== */

const router = express.Router();

const ROLES = ["owner", "admin", "editor"];
const MIN_PASSWORD = 12;
const BCRYPT_ROUNDS = 12;

/* নতুন admin এর password hash কোন নামে বসবে.

   ⚠️ এটা authRoutes.js এর login যে নামে খোঁজে ঠিক সেটাই হতে হবে.
   না মিললে নতুন admin তৈরি হতো কিন্তু login করতে পারত না — তাই
   নিচে POST এ একটা পরীক্ষা আছে যেটা ভুল নাম ধরে ফেলে */
const PASSWORD_FIELD = "passwordHash";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ObjectId বানানো — ঠিকানায় আজেবাজে কিছু থাকলে throw না করে
   null দেয়, তাই ভুল id তে 500 এর বদলে 404 যায় */
const toObjectId = (value) => {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

// তালিকায় যা যা যায় — password hash কখনো নয়
const listShape = (admin) => ({
  ...publicAdmin(admin),
  createdAt: admin.createdAt ?? null,
});

// কতজন সচল owner আছে
const countOwners = () =>
  getDB().collection(ADMINS).countDocuments({ role: "owner", status: "active" });

/* সব route এ login লাগে. requireSameOrigin আগে — অন্য সাইট থেকে
   আসা POST/PATCH/DELETE ওখানেই আটকে যায় */
router.use(requireSameOrigin, requireAdmin);

/* ---------------------------------------------------------------
   GET /api/admins — তালিকা

   যে কেউ login করা থাকলে দেখতে পারে. কে কী করতে পারবে সেটা
   পরের route গুলোতে আটকানো
   --------------------------------------------------------------- */
router.get("/", async (req, res, next) => {
  try {
    const admins = await getDB()
      .collection(ADMINS)
      .find({ status: "active" })
      .sort({ createdAt: 1, _id: 1 })
      .toArray();

    res.json({ admins: admins.map(listShape) });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------
   POST /api/admins — নতুন admin (শুধু owner)
   --------------------------------------------------------------- */
router.post("/", requireRole("owner"), async (req, res, next) => {
  try {
    /* এই ঘরটা সত্যিই এই নামে আছে কি না, নিজের document দেখে
       মিলিয়ে নেওয়া. req.admin এ পুরো document আছে, আর যে login
       করে আছে তার password hash অবশ্যই আছে */
    if (!(PASSWORD_FIELD in req.admin)) {
      return res.status(500).json({
        message: `Server setup: admin documents do not have a "${PASSWORD_FIELD}" field. Fix PASSWORD_FIELD in adminUserRoutes.js.`,
      });
    }

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const role = req.body?.role;

    if (!name || name.length > 80) {
      return res.status(400).json({ message: "Enter a name (up to 80 characters)." });
    }

    if (!EMAIL_SHAPE.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (typeof password !== "string" || password.length < MIN_PASSWORD) {
      return res
        .status(400)
        .json({ message: `Use a password of at least ${MIN_PASSWORD} characters.` });
    }

    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: "Pick a role." });
    }

    const now = new Date();
    const document = {
      email,
      name,
      role,
      // requireAdmin শুধু "active" দের ঢুকতে দেয়
      status: "active",
      [PASSWORD_FIELD]: await bcrypt.hash(password, BCRYPT_ROUNDS),
      createdAt: now,
      createdBy: req.admin._id,
    };

    let result;
    try {
      result = await getDB().collection(ADMINS).insertOne(document);
    } catch (error) {
      /* email এ unique index আছে (ensureAuthIndexes). আগে খুঁজে
         দেখে তারপর বসানোর বদলে index কেই ধরতে দেওয়া হচ্ছে — দুইজন
         একসাথে একই email বসালেও তখন একজনই ঢোকে */
      if (error?.code === 11000) {
        return res.status(409).json({ message: "That email already has an account." });
      }
      throw error;
    }

    const created = { ...document, _id: result.insertedId };

    logActivity(req.admin, "admin.create", {
      targetId: created._id.toString(),
      email: created.email,
      role: created.role,
    });

    res.status(201).json({ admin: listShape(created) });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------
   PATCH /api/admins/:id — ভূমিকা বা নাম বদল (শুধু owner)
   --------------------------------------------------------------- */
router.patch("/:id", requireRole("owner"), async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(404).json({ message: "Admin not found" });

    if (id.equals(req.admin._id)) {
      return res.status(403).json({
        message: "You cannot change your own role. Ask another owner.",
      });
    }

    const db = getDB();
    const target = await db.collection(ADMINS).findOne({ _id: id, status: "active" });
    if (!target) return res.status(404).json({ message: "Admin not found" });

    const changes = {};

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name || name.length > 80) {
        return res.status(400).json({ message: "Enter a name (up to 80 characters)." });
      }
      changes.name = name;
    }

    if (req.body?.role !== undefined) {
      const role = req.body.role;
      if (!ROLES.includes(role)) {
        return res.status(400).json({ message: "Pick a role." });
      }

      // শেষ owner কে নামানো যাবে না
      if (target.role === "owner" && role !== "owner" && (await countOwners()) <= 1) {
        return res.status(409).json({
          message: "This is the only owner. Make someone else an owner first.",
        });
      }

      changes.role = role;
    }

    if (!Object.keys(changes).length) {
      return res.status(400).json({ message: "Nothing to change." });
    }

    changes.updatedAt = new Date();
    changes.updatedBy = req.admin._id;

    await db.collection(ADMINS).updateOne({ _id: id }, { $set: changes });

    /* ভূমিকা বদলালে তাকে আবার login করতে হবে. কারণ req.admin
       প্রতি request এ database থেকেই আসে, কিন্তু তার খোলা পাতায়
       পুরোনো ভূমিকার বোতামগুলো থেকে যেত — নতুন করে ঢুকলে সব
       মিলে যায়. নাম বদলালে এর দরকার নেই */
    if (changes.role && changes.role !== target.role) {
      await destroyAllSessions(id);
    }

    logActivity(req.admin, "admin.update", {
      targetId: id.toString(),
      email: target.email,
      from: target.role,
      to: changes.role ?? target.role,
    });

    res.json({ admin: listShape({ ...target, ...changes }) });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------------
   DELETE /api/admins/:id — সরানো (শুধু owner)
   --------------------------------------------------------------- */
router.delete("/:id", requireRole("owner"), async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(404).json({ message: "Admin not found" });

    if (id.equals(req.admin._id)) {
      return res.status(403).json({ message: "You cannot remove your own account." });
    }

    const db = getDB();
    const target = await db.collection(ADMINS).findOne({ _id: id });
    if (!target) return res.status(404).json({ message: "Admin not found" });

    if (target.role === "owner" && (await countOwners()) <= 1) {
      return res.status(409).json({
        message: "This is the only owner. Make someone else an owner first.",
      });
    }

    await db.collection(ADMINS).deleteOne({ _id: id });
    // খোলা থাকলে সাথে সাথেই বেরিয়ে যায়
    await destroyAllSessions(id);

    logActivity(req.admin, "admin.delete", {
      targetId: id.toString(),
      email: target.email,
      role: target.role,
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;