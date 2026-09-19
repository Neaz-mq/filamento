import { getDB } from "../config/db.js";

/* ===============================================================
   Activity log — কে, কখন, কী করল.
   Figma র "Activity Logs" পাতা আর Dashboard এর "Recent Activity"
   এখান থেকেই দেখাবে.

   action এর নাম ছোট আর স্থির রাখুন ("auth.login", "product.create"),
   পরে filter করা সহজ হয়.

   log লিখতে ব্যর্থ হলে আসল কাজ (login, product save) আটকায় না —
   শুধু console এ সতর্কবার্তা
   =============================================================== */

const LOGS = "activity_logs";

export async function logActivity(admin, action, details = {}) {
  try {
    await getDB()
      .collection(LOGS)
      .insertOne({
        action,
        adminId: admin?._id ?? null,
        adminEmail: admin?.email ?? null,
        details,
        createdAt: new Date(),
      });
  } catch (error) {
    console.warn("⚠️ Activity log failed:", error.message);
  }
}