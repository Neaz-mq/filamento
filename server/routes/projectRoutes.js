import express from "express";
import {
  adminGetProject,
  adminListProjects,
  adminProductOptions,
  createProject,
  deleteProject,
  duplicateProject,
  getProject,
  getProjects,
  updateProject,
} from "../controllers/projectController.js";
import { requireAdmin, requireRole, requireSameOrigin } from "../lib/auth.js";

/* ===============================================================
   Project

   পড়া (public) — সবার জন্য খোলা, কিন্তু শুধু Completed আর
                  In Progress. draft কখনো বাইরে যায় না.
   admin পড়া    — /admin/... — login করা যে কেউ (editor ও দেখতে পারে)
   লেখা         — শুধু owner আর admin (productRoutes এর মতোই)
   =============================================================== */

const router = express.Router();

const canRead = [requireSameOrigin, requireAdmin];
const canEdit = [requireSameOrigin, requireAdmin, requireRole("owner", "admin")];

/* ⚠️ ক্রম জরুরি: "/admin/..." গুলো "/:id" এর উপরে. নিচে বসালে
   "/admin" কে project এর slug ধরে খুঁজত */
router.get("/admin/list", ...canRead, adminListProjects);
router.get("/admin/products", ...canRead, adminProductOptions);
router.get("/admin/:id", ...canRead, adminGetProject);

router.get("/", getProjects);
router.post("/", ...canEdit, createProject);

router.post("/:id/duplicate", ...canEdit, duplicateProject);

router.get("/:id", getProject);
router.patch("/:id", ...canEdit, updateProject);
router.delete("/:id", ...canEdit, deleteProject);

export default router;
