import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { closeDB, connectDB } from "../config/db.js";
import { cloudinaryConfig, cloudinaryReady, signParams } from "../lib/cloudinary.js";
import { PROJECT_UPLOAD_ROOT } from "../lib/projectSchema.js";

/* ===============================================================
   Project এর ছবি পুরোনো filamento.com থেকে নিজের Cloudinary তে আনে

   কেন দরকার:
     Import এর সময় ছবির ঠিকানা হিসেবে filamento.com এর আসল ফাইল রাখা
     হয়েছিল (2000px+ বড় ছবি). তাই
       • ছোট thumbnail (100x72) এর জন্যও browser পুরো বড় ছবি নামায় আর
         নিজে ছোট করে — এতে ছবি দাঁতের মতো "কাটা কাটা" দেখায়
       • পেজ ধীরে খোলে
       • পুরোনো website বন্ধ হলে সব ছবি হারাবে
     Cloudinary তে নিলে ঠিক মাপের (w_300, f_auto, q_auto) ছবি আসে.

   চালানো (PowerShell এ npm না, সরাসরি node):

     node scripts/migrate-project-images.js
         শুধু দেখায় (preview) — কিছুই আপলোড/বদল করে না

     node scripts/migrate-project-images.js --apply
         ১) আগে backups/ এ সব project এর JSON backup
         ২) প্রতিটা ছবি Cloudinary র নিজে নামিয়ে নেয় (Cloudinary সরাসরি
            ঠিকানা থেকে টানে, আপনার কম্পিউটার দিয়ে যায় না)
         ৩) project এর ছবির ঠিকানা + publicId + মাপ বদলায়

   • আবার চালালে নিরাপদ: যেগুলো আগেই Cloudinary তে আছে সেগুলো ছোঁয়া হয় না
   • কোনো ছবি ব্যর্থ হলে সেটা আগের ঠিকানাতেই থাকে, বাকিগুলো চলে
   • .env তে CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET লাগবে
   =============================================================== */

const APPLY = process.argv.includes("--apply");
const FOLDER = `${PROJECT_UPLOAD_ROOT}/images`;
const FORMATS = "jpg,jpeg,png,webp,avif";
const RETRIES = 2;

const isCloudinary = (url) => /^https:\/\/res\.cloudinary\.com\//i.test(String(url ?? ""));
const isRemote = (url) => /^https:\/\//i.test(String(url ?? ""));
const needsMove = (image) => isRemote(image?.url) && !isCloudinary(image.url);
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Cloudinary কে বলা হয় "এই ঠিকানা থেকে ছবিটা নিয়ে নাও" */
async function uploadFromUrl(remoteUrl) {
  const { cloudName, apiKey } = cloudinaryConfig();

  const params = {
    folder: FOLDER,
    timestamp: Math.floor(Date.now() / 1000),
    use_filename: "true",
    unique_filename: "true",
    allowed_formats: FORMATS,
  };

  const form = new FormData();
  form.set("file", remoteUrl);
  form.set("api_key", apiKey);
  form.set("signature", signParams(params));
  for (const [key, value] of Object.entries(params)) form.set(key, String(value));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.secure_url) {
    throw new Error(body?.error?.message || `Cloudinary ${response.status}`);
  }
  return {
    url: body.secure_url,
    publicId: body.public_id,
    width: Number.isFinite(body.width) ? body.width : undefined,
    height: Number.isFinite(body.height) ? body.height : undefined,
  };
}

async function uploadWithRetry(remoteUrl) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      return await uploadFromUrl(remoteUrl);
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) await pause(1500 * (attempt + 1));
    }
  }
  throw lastError;
}

let connected = false;

async function main() {
  const db = await connectDB();
  connected = true;
  const projects = db.collection("projects");

  const all = await projects.find({}).sort({ code: 1 }).toArray();
  const plan = all
    .map((doc) => ({
      doc,
      moves: (doc.images ?? []).filter(needsMove).length,
      done: (doc.images ?? []).filter((image) => isCloudinary(image?.url)).length,
    }))
    .filter((item) => item.doc.images?.length);

  const totalMoves = plan.reduce((sum, item) => sum + item.moves, 0);

  console.log("\nProject                                       আনতে হবে   আগেই Cloudinary তে");
  console.log("-".repeat(78));
  for (const { doc, moves, done } of plan) {
    console.log(
      `${String(doc.title ?? "").slice(0, 44).padEnd(46)}${String(moves).padStart(9)}${String(done).padStart(14)}`,
    );
  }
  console.log("-".repeat(78));
  console.log(`মোট ${totalMoves} টা ছবি Cloudinary তে নিতে হবে.`);

  if (!totalMoves) {
    console.log("\nআনার মতো কিছু নেই.");
    return;
  }

  if (!APPLY) {
    console.log("\n(preview — কিছুই বদলানো হয়নি. চালাতে --apply দিন)");
    return;
  }

  if (!cloudinaryReady()) {
    console.log(
      "\n❌ CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET পাওয়া যায়নি (.env দেখুন). কিছু বদলানো হয়নি.",
    );
    process.exitCode = 1;
    return;
  }

  /* ছোঁয়ার আগে backup */
  const dir = fileURLToPath(new URL("../backups/", import.meta.url));
  mkdirSync(dir, { recursive: true });
  const file = `${dir}projects-before-image-migration-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(all, null, 2));
  console.log(`\n💾 backup: ${all.length} টা project → ${file}\n`);

  let moved = 0;
  let failed = 0;

  for (const { doc, moves } of plan) {
    if (!moves) continue;
    console.log(`▶ ${doc.title}`);

    const images = [];
    let changed = false;

    for (const [index, image] of (doc.images ?? []).entries()) {
      if (!needsMove(image)) {
        images.push(image);
        continue;
      }
      try {
        const uploaded = await uploadWithRetry(image.url);
        images.push({ ...image, ...uploaded });
        changed = true;
        moved += 1;
        console.log(`   ✅ ছবি ${index + 1}  →  ${uploaded.publicId}`);
      } catch (error) {
        images.push(image); // ব্যর্থ হলে আগেরটাই থাকে
        failed += 1;
        console.log(`   ⚠️  ছবি ${index + 1} ব্যর্থ (আগের ঠিকানাতেই আছে): ${error.message}`);
      }
    }

    if (changed) {
      await projects.updateOne({ _id: doc._id }, { $set: { images, updatedAt: new Date() } });
    }
  }

  console.log(`\n🧹 শেষ: ${moved} টা আনা হলো${failed ? `, ${failed} টা ব্যর্থ (আবার চালালে শুধু ওগুলো চেষ্টা হবে)` : ""}.`);
}

main()
  .catch((error) => {
    console.error("❌", error.message);
    process.exitCode = 1;
  })
  .finally(() => (connected ? closeDB() : undefined));