import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

/* ⚠️ নতুন static route (যেমন /featured, /search, /slug/:slug) এখানে,
   "/:id" এর উপরে বসাবেন। নিচে বসালে /featured রিকোয়েস্ট
   getProductById এ চলে যাবে, "featured" কে ObjectId ধরে 400 দেবে। */

router.get("/", getAllProducts);
router.post("/", createProduct);

router.get("/:id", getProductById);

/* controller টা $set দিয়ে partial update করে — অর্থাৎ যে field গুলো
   পাঠাবেন শুধু সেগুলো বদলাবে। এটা PATCH এর semantics, PUT এর নয়।
   পুরনো frontend কোড যাতে না ভাঙে তাই দুইটাই রাখা হলো; নতুন কোডে
   PATCH ব্যবহার করবেন। */
router.patch("/:id", updateProduct);
router.put("/:id", updateProduct);

router.delete("/:id", deleteProduct);

export default router;
