import express from "express";
import {
  addProductView,
  adminGetProduct,
  adminListProducts,
  createProduct,
  deleteProduct,
  duplicateProduct,
  getAllProducts,
  getCatalog,
  getProductById,
  updateProduct,
} from "../controllers/productController.js";
import { requireAdmin, requireRole, requireSameOrigin } from "../lib/auth.js";

/* ===============================================================
   Product

   পড়া (public) — সবার জন্য খোলা, কিন্তু শুধু published product.
                  draft কখনো সাইটে বা API তে বাইরে যায় না.
   admin পড়া    — /admin/... — login করা যে কেউ (editor ও দেখতে পারে)
   লেখা         — শুধু owner আর admin:
     requireSameOrigin — অন্য সাইট থেকে আসা request বাতিল (CSRF)
     requireAdmin      — login না থাকলে 401
     requireRole       — editor product বদলাতে পারে না
   =============================================================== */

const router = express.Router();

const canRead = [requireSameOrigin, requireAdmin];
const canEdit = [requireSameOrigin, requireAdmin, requireRole("owner", "admin")];

/* ⚠️ ক্রম জরুরি: "/admin/..." আর অন্য নির্দিষ্ট ঠিকানা "/:id" এর
   উপরে. নিচে বসালে "/admin" কে product এর slug ধরে খুঁজত */
router.get("/admin/list", ...canRead, adminListProducts);
router.get("/admin/:id", ...canRead, adminGetProduct);

router.get("/", getAllProducts);
// সাইটের Products পাতার হালকা তালিকা — "/:id" এর উপরে থাকতেই হবে
router.get("/catalog", getCatalog);
router.post("/", ...canEdit, createProduct);

router.post("/:id/duplicate", ...canEdit, duplicateProduct);

// সাইটে পাতা খোলা হলে একবার গোনা — সবার জন্য খোলা, তবে IP ধরে সীমিত
router.post("/:id/view", addProductView);

router.get("/:id", getProductById);

/* PATCH — শুধু পাঠানো ঘরগুলো বদলায়. পুরনো frontend কোড যাতে না
   ভাঙে তাই PUT ও একই কাজ করে; নতুন কোডে PATCH */
router.patch("/:id", ...canEdit, updateProduct);
router.put("/:id", ...canEdit, updateProduct);

router.delete("/:id", ...canEdit, deleteProduct);

export default router;
