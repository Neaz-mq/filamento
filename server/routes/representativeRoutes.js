import express from "express";
import {
  adminListRepresentatives,
  createRepresentative,
  deleteRepresentative,
  getRepresentatives,
  updateRepresentative,
} from "../controllers/representativeController.js";
import { requireAdmin, requireRole, requireSameOrigin } from "../lib/auth.js";

/* ===============================================================
   Representative — "Find a Representative" পাতার তথ্য

   পড়া (public) — সবার জন্য খোলা, শুধু active লোক
   admin পড়া    — /admin/list — login করা যে কেউ
   লেখা         — শুধু owner আর admin (projectRoutes এর মতোই).
                  editor এ পাবে না: এগুলো সাইটের গ্রাহক-মুখী যোগাযোগের
                  তথ্য, ভুল হলে গ্রাহক ভুল জায়গায় ফোন করবে
   =============================================================== */

const router = express.Router();

const canRead = [requireSameOrigin, requireAdmin];
const canEdit = [requireSameOrigin, requireAdmin, requireRole("owner", "admin")];

// "/admin/list" আগে — পরে "/:id" এ কেউ এটাকে id ধরে না ফেলে
router.get("/admin/list", ...canRead, adminListRepresentatives);

router.get("/", getRepresentatives);
router.post("/", ...canEdit, createRepresentative);

router.patch("/:id", ...canEdit, updateRepresentative);
router.delete("/:id", ...canEdit, deleteRepresentative);

export default router;