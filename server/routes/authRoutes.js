import { Router } from "express";
import bcrypt from "bcryptjs";
import { getDB } from "../config/db.js";
import {
  ADMINS,
  clientIp,
  createSession,
  destroySession,
  ensureAuthIndexes,
  normalizeEmail,
  publicAdmin,
  requireAdmin,
  requireSameOrigin,
} from "../lib/auth.js";
import {
  RETRY_AFTER_SECONDS,
  clearFailedLogins,
  isLoginBlocked,
  recordFailedLogin,
} from "../lib/loginLimiter.js";
import { logActivity } from "../lib/activity.js";

/* ===============================================================
   Admin login

   POST /api/auth/login   { email, password } → { admin }
   POST /api/auth/logout                       → 204
   GET  /api/auth/me                           → { admin }  (login না থাকলে 401)
   =============================================================== */

const router = Router();

// সব auth request এ: অন্য সাইট থেকে আসা লেখার request বাতিল
router.use(requireSameOrigin);

/* ইমেইল না পেলেও bcrypt চালানো হয় এই নকল hash দিয়ে — নাহলে উত্তর
   আসার সময় দেখে কেউ বুঝে ফেলত কোন ইমেইল আছে (timing attack).

   hash টা আগে থেকে বানিয়ে বসানো. আগে এটা file load এর সময়
   bcrypt.hashSync দিয়ে বানানো হতো — তাতে Vercel এর প্রতিটা cold
   start এ ~300ms server আটকে থাকত, শুধু login নয়, product আর video
   এর request ও (সব route একই app এ). "$2b$12$" মানে cost 12 —
   আসল password এর cost এর সাথে মিলতে হবে, নাহলে সময়ের পার্থক্য থেকে যায় */
const DUMMY_HASH =
  "$2b$12$1B7Uxl.f3XbQIT1vLN1PBOnBjAqI5RPSDe2pTA7e3xb8Sem2evEK2";

// ভুলের বার্তা সবসময় একই — কোনটা ভুল (ইমেইল নাকি password) বলা হয় না
const INVALID = { message: "Invalid email or password" };

router.post("/login", async (req, res, next) => {
  try {
    await ensureAuthIndexes();

    const email = normalizeEmail(req.body?.email);
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    const ip = clientIp(req);

    if (!email || !password || password.length > 200) {
      return res.status(400).json(INVALID);
    }

    if (await isLoginBlocked(ip, email)) {
      res.set("Retry-After", String(RETRY_AFTER_SECONDS));
      return res.status(429).json({
        message: "Too many attempts. Please try again in 15 minutes.",
      });
    }

    const admin = await getDB().collection(ADMINS).findOne({ email });

    const passwordOk = await bcrypt.compare(
      password,
      admin?.passwordHash ?? DUMMY_HASH,
    );

    if (!admin || !passwordOk || admin.status !== "active") {
      await recordFailedLogin(ip, email);
      return res.status(401).json(INVALID);
    }

    await clearFailedLogins(email);
    await createSession(res, admin, req);

    await getDB()
      .collection(ADMINS)
      .updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } });
    await logActivity(admin, "auth.login", { ip });

    res.json({ admin: publicAdmin(admin) });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    await destroySession(req, res);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

/* frontend পাতা খুললেই এটা জিজ্ঞেস করে — login আছে কিনা, কে */
router.get("/me", requireAdmin, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ admin: publicAdmin(req.admin) });
});

export default router;