import express from "express";
import { requireAdmin, requireRole, requireSameOrigin } from "../lib/auth.js";
import {
  cloudinaryConfig,
  cloudinaryReady,
  signParams,
} from "../lib/cloudinary.js";
import { UPLOAD_ROOT } from "../lib/productSchema.js";

/* ===============================================================
   POST /api/uploads/sign — Cloudinary তে ফাইল তোলার অনুমতিপত্র

   body: { kind: "image" | "video" | "document" }

   উত্তরে যা আসে সেটা নিয়ে browser সরাসরি Cloudinary তে ফাইল পাঠায়
   (client/src/admin/products/upload.js). সই এর মেয়াদ Cloudinary
   নিজেই ১ ঘণ্টা রাখে.

   কোন ধরনের ফাইল চলবে সেটাও সই এর ভেতরে (allowed_formats) — তাই
   browser এ কেউ কোড বদলে .exe তুলতে চাইলেও Cloudinary ফিরিয়ে দেয়
   =============================================================== */

const router = express.Router();

const KINDS = {
  image: {
    resourceType: "image",
    folder: `${UPLOAD_ROOT}/images`,
    formats: "jpg,jpeg,png,webp,avif",
  },
  video: {
    resourceType: "video",
    folder: `${UPLOAD_ROOT}/videos`,
    formats: "mp4,mov,webm,m4v",
  },
  /* document গুলো "raw" — Cloudinary ফাইলটা যেমন আছে তেমনই রাখে,
     PDF কে ছবি বানানোর চেষ্টা করে না. raw এ allowed_formats চলে না,
     তাই ধরন দেখা হয় browser এ (upload.js) */
  document: {
    resourceType: "raw",
    folder: `${UPLOAD_ROOT}/documents`,
    formats: "",
  },
};

router.post(
  "/sign",
  requireSameOrigin,
  requireAdmin,
  requireRole("owner", "admin"),
  (req, res) => {
    const kind = KINDS[req.body?.kind];
    if (!kind) {
      return res.status(400).json({ message: "Unknown upload type." });
    }

    if (!cloudinaryReady()) {
      return res.status(503).json({
        message:
          "Uploads are not set up yet. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the API's environment variables.",
      });
    }

    const { cloudName, apiKey } = cloudinaryConfig();

    /* use_filename — Cloudinary তে ফাইলের নাম চেনা যায়
       ("LA1_install_guide_x7k2.pdf"), unique_filename শেষে এলোমেলো
       অংশ জুড়ে দেয়, তাই একই নামের দুইটা ফাইল একে অপরকে মুছে দেয় না */
    const params = {
      folder: kind.folder,
      timestamp: Math.floor(Date.now() / 1000),
      use_filename: "true",
      unique_filename: "true",
    };
    if (kind.formats) params.allowed_formats = kind.formats;

    res.json({
      cloudName,
      apiKey,
      resourceType: kind.resourceType,
      params,
      signature: signParams(params),
    });
  },
);

export default router;
