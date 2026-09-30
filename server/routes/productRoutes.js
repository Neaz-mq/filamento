import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { requireAdmin, requireRole, requireSameOrigin } from "../lib/auth.js";

const router = express.Router();

/* ===============================================================
   Product

   পড়া (GET) — সবার জন্য খোলা, public সাইট এখান থেকেই product দেখায়.
   লেখা (POST / PATCH / PUT / DELETE) — শুধু login করা admin.

   ⚠️ আগে লেখার route গুলোতে কোনো পাহারা ছিল না — যে কেউ curl দিয়ে
   product বানাতে, বদলাতে বা মুছে ফেলতে পারত. এখন তিন ধাপ:
     requireSameOrigin — অন্য সাইট থেকে আসা request বাতিল (CSRF)
     requireAdmin      — login না থাকলে 401
     requireRole       — editor product ছুঁতে পারে না (শুধু লেখা আর ছবি),
                         owner আর admin পারে
   =============================================================== */

const canEditProducts = [
  requireSameOrigin,
  requireAdmin,
  requireRole("owner", "admin"),
];

/* ⚠️ নতুন static route (যেমন /featured, /search, /slug/:slug) এখানে,
   "/:id" এর উপরে বসাবেন। নিচে বসালে /featured রিকোয়েস্ট
   getProductById এ চলে যাবে, "featured" কে ObjectId ধরে 400 দেবে। */

router.get("/", getAllProducts);
router.post("/", ...canEditProducts, createProduct);

router.get("/:id", getProductById);

/* controller টা $set দিয়ে partial update করে — অর্থাৎ যে field গুলো
   পাঠাবেন শুধু সেগুলো বদলাবে। এটা PATCH এর semantics, PUT এর নয়।
   পুরনো frontend কোড যাতে না ভাঙে তাই দুইটাই রাখা হলো; নতুন কোডে
   PATCH ব্যবহার করবেন। */
router.patch("/:id", ...canEditProducts, updateProduct);
router.put("/:id", ...canEditProducts, updateProduct);

router.delete("/:id", ...canEditProducts, deleteProduct);

export default router;
