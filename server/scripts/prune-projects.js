import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { closeDB, connectDB } from "../config/db.js";

/* ===============================================================
   শুধু নির্দিষ্ট ৫টা project রাখে, বাকি সব project মোছে

     node scripts/prune-projects.js
         শুধু দেখায় (preview) — কোনটা থাকবে, কোনটা যাবে. DB তে কিছুই বদলায় না

     node scripts/prune-projects.js --apply
         আগে backups/ ফোল্ডারে সব project এর JSON backup রাখে,
         তারপর বাকিগুলো মোছে

   ⚠️ npm দিয়ে না চালিয়ে সরাসরি node দিয়ে চালান (PowerShell এ npm flag খেয়ে ফেলে)
   =============================================================== */

/* যেগুলো থাকবে — slug (website এর URL এর শেষ অংশ) */
const KEEP_SLUGS = [
  "city-of-vacaville",
  "csu-dominguez-hills-warehouse",
  "cadman-plaza",
  "edges-electrical-group",
  "barn-xo",
];

const APPLY = process.argv.includes("--apply");

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* slug ঠিক না মিললেও title থেকে বানানো slug দিয়ে চেনা হয় */
const isKept = (doc) => KEEP_SLUGS.includes(norm(doc.slug)) || KEEP_SLUGS.includes(norm(doc.title));

let connected = false;

async function main() {
  const db = await connectDB();
  connected = true;
  const projects = db.collection("projects");

  const all = await projects.find({}).sort({ createdAt: -1 }).toArray();
  const keep = all.filter(isKept);
  const remove = all.filter((doc) => !isKept(doc));

  const line = (doc) =>
    `  ${String(doc.code ?? "—").padEnd(9)} ${String(doc.title ?? "").padEnd(42)} ${doc.slug ?? ""}${
      doc.seed ? "  (নমুনা)" : ""
    }`;

  console.log(`\n✅ থাকবে (${keep.length}):`);
  keep.forEach((doc) => console.log(line(doc)));

  console.log(`\n🗑️  মোছা হবে (${remove.length}):`);
  remove.forEach((doc) => console.log(line(doc)));

  const missing = KEEP_SLUGS.filter(
    (slug) => !keep.some((doc) => norm(doc.slug) === slug || norm(doc.title) === slug),
  );
  if (missing.length) {
    console.log(`\n⚠️  এই project গুলো DB তে পাওয়া যায়নি: ${missing.join(", ")}`);
    console.log("    আগে import-filamento-projects.js চালিয়ে এগুলো আনুন, তারপর মুছুন.");
  }

  if (!APPLY) {
    console.log("\n(preview — DB তে কিছু বদলানো হয়নি. মুছতে --apply দিন)");
    return;
  }

  /* নিরাপত্তা: ৫টা না পেলে কিছু মোছা হবে না */
  if (missing.length) {
    console.log("\n❌ থামানো হলো — যেগুলো রাখার কথা সেগুলোর সবটা পাওয়া যায়নি, তাই কিছু মোছা হয়নি.");
    process.exitCode = 1;
    return;
  }
  if (!remove.length) {
    console.log("\nমোছার মতো কিছু নেই.");
    return;
  }

  /* মোছার আগে সব project এর backup */
  const dir = fileURLToPath(new URL("../backups/", import.meta.url));
  mkdirSync(dir, { recursive: true });
  const file = `${dir}projects-before-prune-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(all, null, 2));
  console.log(`\n💾 backup: ${all.length} টা project → ${file}`);

  const { deletedCount } = await projects.deleteMany({
    _id: { $in: remove.map((doc) => doc._id) },
  });
  console.log(`🧹 ${deletedCount} টা project মোছা হলো. এখন ${keep.length} টা আছে.`);
}

main()
  .catch((error) => {
    console.error("❌", error.message);
    process.exitCode = 1;
  })
  .finally(() => (connected ? closeDB() : undefined));