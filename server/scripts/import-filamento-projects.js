import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { closeDB, connectDB } from "../config/db.js";
import { slugify } from "../lib/productSchema.js";
import {
  PROJECT_CATEGORIES,
  PROJECT_LIMITS,
  PROJECT_TYPES,
  cleanProject,
  projectSlug,
} from "../lib/projectSchema.js";
import { nextProjectCode } from "../controllers/projectController.js";

/* ===============================================================
   Main website (filamento.com) এর আসল project গুলো admin panel এ আনে

   ⚠️ npm দিয়ে না চালিয়ে সরাসরি node দিয়ে চালান (PowerShell এ npm
   flag খেয়ে ফেলে)

     node scripts/import-filamento-projects.js
         শুধু দেখায় (preview) — DB তে কিছুই লেখে না. প্রতিটা project এর
         Challenge/Solution/Results এর শেষ অংশ দেখায়, বাড়তি লেখা সন্দেহ হলে 🚩 দেয়

     node scripts/import-filamento-projects.js --debug=salvation-army-kroc-center
         একটা পাতার block তালিকা আর "Highlights" এর আশেপাশের HTML দেখায়
         (parser ঠিক করার জন্য). DB তে কিছু লেখে না

     node scripts/import-filamento-projects.js --apply
         DB তে আসল project যোগ / হালনাগাদ করে

     node scripts/import-filamento-projects.js --apply --reset
         আগে নমুনা (seed: true) project মোছে, তারপর যোগ করে

     node scripts/import-filamento-projects.js --only=city-of-vacaville
         শুধু ওই একটা project পড়ে দেখায় (preview), শেষে Challenge/Results এর
         শেষ অংশও দেখায় — DB তে কিছু লেখে না
     node scripts/import-filamento-projects.js --apply --only=city-of-vacaville
         শুধু ওই একটা project DB তে লেখে, বাকিগুলো ছোঁয়া হয় না.
         কমা দিয়ে একাধিক দেওয়া যায়: --only=slug-1,slug-2

   কোনো তথ্য বানানো হয় না. সাইটে যা নেই সেটা নিচের নিয়মে ভরা হয়
   আর preview তে "⚠" দিয়ে জানানো হয়
   =============================================================== */

const SITE = "https://www.filamento.com";
const LIST_URL = `${SITE}/projects/`;

/* সাইটের Project Type → এই app এর Category. সাইটে category নেই,
   তাই এটা আমাদের map — ভুল মনে হলে এখানে বদলান */
const CATEGORY_OF_TYPE = {
  airport: "municipal",
  automotiveDealership: "commercial",
  church: "commercial",
  conventionCenter: "commercial",
  gymnasium: "sports",
  manufacturing: "industrial",
  office: "commercial",
  retail: "retail",
  streetLights: "municipal",
  warehouse: "industrial",
};

/* সাইটে লেখা type এর অন্য নাম → আমাদের key */
const TYPE_ALIASES = {
  "school gym": "gymnasium",
  gym: "gymnasium",
  "street light": "streetLights",
  streetlights: "streetLights",
  "street lighting": "streetLights",
  dealership: "automotiveDealership",
};

/* type না পেলে শিরোনামের শব্দ থেকে অনুমান (⚠ দিয়ে জানানো হয়) */
const TYPE_FROM_TITLE = [
  [/church|chapel/i, "church"],
  [/airport/i, "airport"],
  [/gym/i, "gymnasium"],
  [/warehouse/i, "warehouse"],
  [/bmw|dealership|motors/i, "automotiveDealership"],
];

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const RESET = args.includes("--reset");
const DEBUG = args.find((a) => a.startsWith("--debug="))?.slice(8);
// --debug=<slug> --grep=<লেখা> : ওই লেখার চারপাশের আসল HTML দেখায় (বাদ পড়া শব্দ খুঁজতে)
const GREP = args.find((a) => a.startsWith("--grep="))?.slice(7);
// --only=slug-1,slug-2 — শুধু এই project গুলো (খালি থাকলে সবগুলো)
const ONLY = (args.find((a) => a.startsWith("--only="))?.slice(7) ?? "")
  .split(",")
  .map((x) => x.trim().replace(/^\/|\/$/g, "").toLowerCase())
  .filter(Boolean);

/* ---------------------------------------------------------------
   HTML সাহায্যকারী (বাইরের package ছাড়া)
   --------------------------------------------------------------- */
const ENTITIES = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#039;": "'", "&#8217;": "’",
  "&#8216;": "‘", "&#8220;": "“", "&#8221;": "”", "&#8211;": "–", "&#8212;": "—",
  "&nbsp;": " ", "&#8243;": "″", "&#215;": "×",
};
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (m, n) => ENTITIES[m] ?? String.fromCodePoint(Number(n)))
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => ENTITIES[m] ?? m);

const clean = (s) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": "FilamentoProjectImport/1.0" } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

const meta = (html, prop) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] ??
  html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, "i"))?.[1] ??
  "";

/* পাতাকে ক্রমানুসারে "block" এ ভাঙা: heading, paragraph, li — প্রতিটা একটা লাইন */
function blocks(html) {
  const body = html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, "");
  const marked = body
    .replace(/<\/(h[1-6]|p|div|section|li|ul|ol|figure|a)>/gi, "$&\n")
    .replace(/<li(\s[^>]*)?>/gi, "\n§LI§")
    .replace(/<br\s*\/?>/gi, "\n");
  return marked
    .split("\n")
    .map((line) => {
      const li = line.includes("§LI§");
      const text = clean(line.replace(/§LI§/g, ""));
      return text ? { text, li } : null;
    })
    .filter(Boolean);
}

/* সাইটে লেখা type → আমাদের key ("" হলে মেলেনি) */
const typeKey = (label) => {
  const norm = String(label ?? "").trim().toLowerCase();
  if (!norm) return "";
  if (TYPE_ALIASES[norm]) return TYPE_ALIASES[norm];
  return Object.entries(PROJECT_TYPES).find(([, name]) => name.toLowerCase() === norm)?.[0] ?? "";
};

/* Section এর heading চেনা: "Highlights", "The Challenge", "Challenge:" … */
const SECTION_PATTERNS = [
  ["Highlights", /^(key\s+)?highlights?\s*:?$/i],
  ["Products", /^products?(\s+used)?\s*:?$/i],
  ["Challenge", /^(the\s+)?challenges?\s*:?$/i],
  ["Solution", /^(the\s+)?solutions?\s*:?$/i],
  ["Results", /^(the\s+)?results?\s*:?$/i],
];
const sectionOf = (text) => SECTION_PATTERNS.find(([, re]) => re.test(text))?.[0] ?? "";

/* পাতার নিচের "Related …" তালিকার heading */
const RELATED_LINKS = /^related\s+(applications?|products?|projects?|solutions?)\s*:?$/i;

/* "The Challenge  লেখা…" বা "Solution: লেখা…" — heading আর লেখা একই block এ */
const INLINE = /^(?:The\s+(Challenge|Solution|Results?)\b[\s:–-]*|(Challenge|Solution|Results?)\s*:\s*)(.{20,})$/;

/* "Barrington, IL" / "Englewood, New Jersey" — ছোট, সংখ্যা নেই, শেষে দাঁড়ি নেই */
const PLACE_LINE = /^[A-Z][A-Za-z.'’ -]{1,40},\s*[A-Z][A-Za-z.'’ -]{0,30}[A-Za-z]$/;

/* Challenge/Solution/Results এ পাতার বাইরের লেখা ঢুকে গেছে কিনা সন্দেহ করা.
   ভুল ধরা পড়তে পারে (সন্দেহ মানেই ভুল নয়), তাই শুধু 🚩 দেখায়, কিছু বদলায় না */
const LEFTOVER = /related\s+(applications?|products?|projects?|solutions?)|seeing is believing|©|cookie|powered by|@filamento\.com|\+1\s*\(\d{3}\)|tisch way|privacy (overview|policy)|^(back|location|highlights|products)\s*:?$/im;
function leftover(text) {
  const hit = text.match(LEFTOVER);
  if (hit) return `পাতার বাইরের লেখা মনে হচ্ছে ("${hit[0].slice(0, 40)}")`;
  const last = text.split(/\n\n/).pop().trim();
  // শেষ অনুচ্ছেদ খুব ছোট আর দাঁড়ি ছাড়া — সম্ভবত লিংকের নাম বা শিরোনাম
  if (last.length < 60 && !last.startsWith("• ") && !/[.!?"”')]$/.test(last) && text.length > last.length)
    return `শেষ লাইনটা ছোট আর দাঁড়িহীন ("${last}") — লিংকের নাম হতে পারে`;
  return "";
}

/* ---------------------------------------------------------------
   একটা project পাতা → project object
   --------------------------------------------------------------- */
function parseProject(html, url) {
  const warnings = [];
  const title = decode(meta(html, "og:title")).replace(/\s*[-|–]\s*Filamento\s*$/i, "").trim();
  if (!title) throw new Error("title পাওয়া যায়নি");

  const list = blocks(html);
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  let start = list.findIndex((b) => b.text === title);
  if (start < 0) start = list.findIndex((b) => norm(b.text) === norm(title));
  if (start < 0) {
    // শিরোনাম হুবহু না মিললে "Location" লেবেলের ঠিক আগের block টাই শিরোনাম (পাতার গড়ন সব project এ এক)
    const loc = list.findIndex((b) => /^Location$/i.test(b.text));
    if (loc > 0) {
      start = loc - 1;
      warnings.push(`শিরোনাম হুবহু মেলেনি (পাতায়: "${list[start].text}") → "Location" এর আগের লাইন শিরোনাম ধরা হয়েছে`);
    }
  }
  if (start < 0) warnings.push("পাতায় শিরোনামের block মেলেনি — অনুমানে পড়া হয়েছে");
  const end = list.findIndex((b) => /^Seeing is Believing/i.test(b.text));
  const main = list.slice(start >= 0 ? start : 0, end > 0 ? end : undefined);

  // Project Type — শিরোনামের ঠিক আগের লাইন; না পেলে "Back" এর পরের অংশে খোঁজা
  // (menu র "Other" ধরা হয় না)
  let projectType = start > 0 ? typeKey(list[start - 1].text) : "";
  let typeLabel = start > 0 ? list[start - 1].text : "";
  if (projectType === "other") projectType = "";
  if (!projectType) {
    const back = list.findIndex((b) => b.text === "Back");
    const from = back >= 0 ? back : 0;
    const found = list
      .slice(from, from + 60)
      .find((b) => typeKey(b.text) && typeKey(b.text) !== "other");
    if (found) {
      projectType = typeKey(found.text);
      typeLabel = found.text;
    }
  }
  if (!projectType) {
    const guess = TYPE_FROM_TITLE.find(([re]) => re.test(title));
    if (guess) {
      projectType = guess[1];
      warnings.push(`project type সাইটে পাওয়া যায়নি → শিরোনাম থেকে অনুমান: ${PROJECT_TYPES[projectType]}`);
    } else {
      warnings.push(`project type মেলেনি ("${typeLabel}") → other`);
    }
  }

  // Section ভাগ করা
  const parts = { Highlights: [], Products: [], Challenge: [], Solution: [], Results: [] };
  let location = "";
  let current = null;
  let wantLocation = false;
  for (const block of main.slice(1)) {
    if (wantLocation) {
      wantLocation = false;
      // "Location" এর পরের লাইনটা যদি আরেকটা section হয়, location ফাঁকা
      if (!sectionOf(block.text)) {
        location = block.text;
        current = null;
        continue;
      }
    }
    const locMatch = block.text.match(/^Location\b\s*:?\s*(.*)$/i);
    if (locMatch && !location && !sectionOf(block.text)) {
      if (locMatch[1]) location = locMatch[1];
      else wantLocation = true;
      current = null;
      continue;
    }
    const section = sectionOf(block.text);
    if (section) {
      current = section;
      continue;
    }
    /* "Related Applications / Products / Projects" — পাতার নিচের লিংক তালিকা, project এর
       লেখা নয়. এখানে এসে থামতে হবে, নাহলে এর নিচের লিংকের নাম (যেমন "Dark Sky
       Friendly Post Top") আগের section এ (Challenge/Results) ঢুকে যায় */
    if (RELATED_LINKS.test(block.text)) {
      current = null;
      continue;
    }
    const inline = block.text.match(INLINE);
    if (inline) {
      const word = (inline[1] || inline[2]).toLowerCase();
      current = word.startsWith("result") ? "Results" : word === "challenge" ? "Challenge" : "Solution";
      parts[current].push({ text: inline[3], li: false });
      continue;
    }
    if (current) parts[current].push(block);
  }

  // Highlights — <li> হলে ঠিক আছে; না হলেও ছোট লাইনগুলো নেওয়া হয়
  const highlights = parts.Highlights.filter((b) => b.li || b.text.length <= 160).map((b) => b.text);

  // Product এর নাম — link এর লেখা
  const productsHtml = html.match(/>\s*Products\s*<[\s\S]*?(?=The Challenge|<h[1-6][^>]*>\s*The |Seeing is Believing)/i)?.[0] ?? "";
  const products = [...productsHtml.matchAll(/<a[^>]+href=["'][^"']*(?:product-details|configure-page)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => clean(m[1]))
    .filter(Boolean);

  /* Challenge/Results এর ভেতরের তালিকা (যেমন "লক্ষ্য:" এর নিচের পয়েন্ট) আগে বাদ পড়ত.
     এখন "• " দিয়ে আলাদা লাইনে রাখা হয়. Solution আলাদা নিয়মে চলে (নিচে), তাই সেটা অপরিবর্তিত */
  const asText = (b) => (b.li ? `• ${b.text}` : b.text);
  const text = (label) =>
    parts[label]
      .filter((b) => label === "Challenge" || label === "Results" || !b.li)
      .map(asText)
      .join("\n\n");
  const productSet = new Set(products);
  let challenge = text("Challenge");
  if (!challenge) {
    // কিছু পাতায় "The Challenge" heading নেই — Products এর পরের লেখাটাই Challenge
    challenge = parts.Products.filter((b) => !productSet.has(b.text))
      .map(asText)
      .join("\n\n");
    if (challenge) {
      const only = !parts.Solution.length && !parts.Results.length;
      warnings.push(
        only
          ? "পাতায় একটাই লেখা, কোনো heading নেই (শুধু project এর বর্ণনা) → Challenge ঘরে বসানো হলো, দরকারে admin এ সরান"
          : '"The Challenge" heading নেই → Products এর পরের লেখা Challenge ধরা হয়েছে',
      );
    }
  }
  /* কিছু পাতায় "Location" লেবেল নেই, আর লেখার প্রথম লাইনেই জায়গাটা থাকে
     ("Barrington, IL"). location ফাঁকা থাকলে আর প্রথম লাইনটা ছোট ও "শহর, রাজ্য/দেশ"
     ধরনের হলে সেটা location এ নেওয়া হয়, Challenge থেকে বাদ যায় */
  if (!location) {
    const [first, ...rest] = challenge.split("\n\n");
    if (rest.length && PLACE_LINE.test(first.trim())) {
      location = first.trim();
      challenge = rest.join("\n\n");
      warnings.push(`location সাইটে আলাদা লেবেল ছাড়া, লেখার প্রথম লাইনে ছিল ("${location}") → location এ নেওয়া হলো`);
    }
  }
  const results = text("Results");

  /* The Solution — "Title:" দিয়ে শেষ হওয়া ছোট লাইন = feature এর শিরোনাম, তার
     নিচের লেখা = description. তার আগের লেখা = উপরের সংক্ষিপ্ত বিবরণ */
  const introParts = [];
  const features = [];
  for (const b of parts.Solution.filter((x) => !x.li)) {
    if (/:$/.test(b.text) && b.text.length <= 70) {
      features.push({ title: b.text.replace(/:$/, "").trim(), description: [] });
    } else if (features.length) {
      features.at(-1).description.push(b.text);
    } else {
      introParts.push(b.text);
    }
  }
  const solutionFull = introParts.join("\n\n");

  // ছবি — gallery link আর hero, ক্রম ঠিক রেখে, একই ফাইল একবার
  const seen = new Set();
  let images = [];
  const imageUrls = [
    ...[...html.matchAll(/(?:href|src)=["'](https?:\/\/[^"']*\/wp-content\/uploads\/[^"']+\.(?:jpe?g|png|webp))["']/gi)].map((m) => m[1]),
    meta(html, "og:image"),
  ].filter(Boolean);
  for (const src of imageUrls) {
    if (/filamento_logo|\/cropped-|-\d+x\d+\.(?:jpe?g|png|webp)$/i.test(src)) continue;
    const key = src.split("/").pop().replace(/-scaled/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    images.push({ url: src, publicId: "" });
  }
  // schema তে সর্বোচ্চ ১২ টা ছবি — বেশি হলে প্রথম ১২ টা
  const maxImages = PROJECT_LIMITS.images;
  if (images.length > maxImages) {
    warnings.push(`ছবি ${images.length} টা → প্রথম ${maxImages} টা রাখা হলো`);
    images = images.slice(0, maxImages);
  }

  const videoUrls = [...html.matchAll(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([\w-]{11})/gi)]
    .map((m) => `https://www.youtube.com/watch?v=${m[1]}`)
    .filter((v, i, a) => a.indexOf(v) === i);

  const firstSentence = (s, max) => {
    const sentence = s.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] ?? s;
    return sentence.length <= max ? sentence : `${sentence.slice(0, max - 1).trimEnd()}…`;
  };
  const words = (s, max) => {
    if (s.length <= max) return s;
    const head = s.slice(0, max - 1);
    return `${head.slice(0, Math.max(head.lastIndexOf(" "), max * 0.6)).trimEnd()}…`;
  };
  const ICON_BY_WORD = [
    [/light|quality|bright|illuminat/i, "sun"],
    [/maint|downtime|repair|replace/i, "settings"],
    [/control|flexib|upgrade|versatil/i, "grid"],
    [/energy|saving|efficien|power/i, "bolt"],
    [/safe|secur|durab/i, "shield"],
  ];
  let trimmedFeatures = 0;
  const solution = features.slice(0, PROJECT_LIMITS.solutionFeatures).map((f) => {
    const description = f.description.join(" ");
    if (description.length > PROJECT_LIMITS.solutionText) trimmedFeatures += 1;
    return {
      icon: ICON_BY_WORD.find(([re]) => re.test(f.title))?.[1] ?? "bolt",
      title: words(f.title, PROJECT_LIMITS.solutionTitle),
      description: words(description, PROJECT_LIMITS.solutionText),
    };
  });
  if (trimmedFeatures) warnings.push(`${trimmedFeatures} টা Solution feature এর বর্ণনা ২০০ অক্ষরে ছোট করা হয়েছে`);
  const cut = (s, max) => {
    if (s.length <= max) return s;
    const head = s.slice(0, max);
    const stop = Math.max(head.lastIndexOf(". "), head.lastIndexOf(".\n"));
    return stop > max * 0.5 ? head.slice(0, stop + 1) : head;
  };

  /* সাইটে না থাকা ঘর — বানানো তথ্য নয়, শুধু নিরাপদ বিকল্প */
  const modified = meta(html, "meta-article:modified_time") || meta(html, "article:modified_time");
  const date = /^\d{4}-\d{2}-\d{2}/.test(modified) ? modified.slice(0, 10) : "";
  warnings.push("company সাইটে নেই → project এর নাম বসানো হলো");
  warnings.push(`date সাইটে নেই → পাতা শেষ বদলানোর তারিখ (${date || "নেই"})`);

  let shortDescription = firstSentence(results || challenge || solutionFull, 200);
  if (shortDescription) {
    warnings.push("short description সাইটে নেই → লেখার প্রথম বাক্য");
  } else {
    const typeName = PROJECT_TYPES[projectType] ?? "Lighting";
    shortDescription = `${typeName} lighting project${location ? ` in ${location}` : ""}.`;
    warnings.push("পাতায় কোনো লেখা নেই → short description টা type আর location থেকে বানানো (সাধারণ বাক্য)");
  }
  if (!location) warnings.push("location পাওয়া যায়নি — admin এ হাতে দিতে হবে");
  if (!highlights.length) warnings.push("highlights পাওয়া যায়নি");
  if (solutionFull.length > PROJECT_LIMITS.solutionIntro)
    warnings.push(`Solution এর উপরের বিবরণ ${solutionFull.length} অক্ষর → ${PROJECT_LIMITS.solutionIntro} এ কাটা হয়েছে (schema limit বাড়ালে আর কাটবে না)`);
  if (challenge.length > 2000 || results.length > 2000) warnings.push("Challenge/Results ২০০০ অক্ষরের বেশি — কাটা হয়েছে");

  return {
    project: {
      title,
      company: title,
      shortDescription,
      projectType: projectType || "other",
      category: CATEGORY_OF_TYPE[projectType] ?? "commercial",
      location,
      date,
      status: "completed",
      images,
      videoUrls,
      keyFeatures: [],
      challenge: cut(challenge, 2000),
      solutionIntro: cut(solutionFull, PROJECT_LIMITS.solutionIntro),
      solution,
      results: cut(results, 2000),
      highlights,
      cta: { text: "Plan a similar project", link: "/contact", newTab: false },
    },
    productNames: products,
    sourceUrl: url,
    warnings,
  };
}

/* ---------------------------------------------------------------
   --debug=<slug> : একটা পাতার ভেতরটা দেখায়
   --------------------------------------------------------------- */
async function debugPage(slug) {
  const url = `${SITE}/projects/${slug.replace(/^\/|\/$/g, "")}/`;
  const html = await get(url);
  const list = blocks(html);
  const title = decode(meta(html, "og:title")).replace(/\s*[-|–]\s*Filamento\s*$/i, "").trim();
  let from = list.findIndex((b) => b.text === title);
  if (from < 0) from = 0;
  console.log(`URL: ${url}\nTitle: ${title}\n\n--- blocks (শিরোনামের ২ টা আগে থেকে ৮০ টা) ---`);
  list.slice(Math.max(0, from - 2), from + 80).forEach((b, i) =>
    console.log(`${String(i).padStart(2)} ${b.li ? "LI " : "   "}${b.text.slice(0, 110)}`),
  );
  const at = html.search(/>\s*(Key\s+)?Highlights?\s*</i);
  console.log(`\n--- "Highlights" এর আশেপাশের HTML (${at < 0 ? "পাওয়া যায়নি" : `index ${at}`}) ---`);
  if (at >= 0) console.log(html.slice(Math.max(0, at - 400), at + 900));
  if (GREP) {
    const pos = html.toLowerCase().indexOf(GREP.toLowerCase());
    console.log(`\n--- "${GREP}" এর আশেপাশের HTML (${pos < 0 ? "পাওয়া যায়নি" : `index ${pos}`}) ---`);
    if (pos >= 0) console.log(html.slice(Math.max(0, pos - 300), pos + 700));
  }
}

/* ---------------------------------------------------------------
   মূল কাজ
   --------------------------------------------------------------- */
let connected = false;

async function main() {
  if (!(PROJECT_CATEGORIES.industrial && PROJECT_TYPES.warehouse)) throw new Error("schema বদলে গেছে");

  if (DEBUG) {
    await debugPage(DEBUG);
    return;
  }

  console.log(
    APPLY
      ? `⚠️  APPLY mode — DB তে লেখা হবে${RESET ? " (নমুনা project মুছে)" : ""}\n`
      : "👀 PREVIEW mode — DB তে কিছুই লেখা হবে না (লিখতে --apply দিন)\n",
  );

  const listHtml = await get(LIST_URL);
  let links = [...new Set(
    [...listHtml.matchAll(/href=["'](https?:\/\/www\.filamento\.com\/projects\/([\w-]+)\/?)["']/gi)].map((m) => m[1]),
  )];
  console.log(`🔎 ${links.length} টা project পাতা পাওয়া গেল\n`);

  if (ONLY.length) {
    if (RESET) throw new Error("--only আর --reset একসাথে চলে না (--reset সব নমুনা মোছে)");
    const slugOf = (url) => url.replace(/\/$/, "").split("/").pop().toLowerCase();
    const unknown = ONLY.filter((slug) => !links.some((url) => slugOf(url) === slug));
    if (unknown.length) {
      throw new Error(
        `--only এর slug সাইটে পাওয়া যায়নি: ${unknown.join(", ")}\n   আছে: ${links.map(slugOf).join(", ")}`,
      );
    }
    links = links.filter((url) => ONLY.includes(slugOf(url)));
    console.log(`🎯 --only: শুধু ${links.length} টা project নেওয়া হলো (${ONLY.join(", ")})\n`);
  }

  const parsed = [];
  for (const url of links) {
    try {
      parsed.push(parseProject(await get(url), url));
    } catch (error) {
      console.log(`❌ ${url}: ${error.message}`);
    }
  }

  if (!APPLY) {
    for (const p of parsed) {
      const v = p.project;
      console.log(`• ${v.title} [${v.projectType}/${v.category}] — ${v.location || "location নেই"}`);
      console.log(
        `    ছবি ${v.images.length}, highlights ${v.highlights.length}, solution features ${v.solution.length}, challenge ${v.challenge.length} / solution ${v.solutionIntro.length} / results ${v.results.length} অক্ষর`,
      );
      console.log(`    products: ${p.productNames.join(" | ") || "নেই"}`);
      for (const w of p.warnings) console.log(`    ⚠ ${w}`);
      // লেখার শেষ অংশ — বাড়তি লেখা (যেমন "Related Applications") ঢুকেছে কিনা চোখে দেখার জন্য
      for (const [label, text] of [["Challenge", v.challenge], ["Solution", v.solutionIntro], ["Results", v.results]]) {
        if (!text) continue;
        if (label === "Challenge") console.log(`    ${label} এর শুরু: ${JSON.stringify(text.slice(0, 100))}…`);
        console.log(`    ${label} এর শেষ: …${JSON.stringify(text.slice(-100))}`);
        const problem = leftover(text);
        if (problem) console.log(`    🚩 ${label}: ${problem} — --apply এর আগে দেখুন`);
      }
    }
    console.log("\n(preview — DB তে কিছু লেখা হয়নি)");
    return;
  }

  const db = await connectDB();
  connected = true;
  const projects = db.collection("projects");
  const products = db.collection("products");

  /* লেখার আগে এখনকার সব project একটা JSON ফাইলে রাখা — হাতে বদলানো কিছু হারালে ফিরে দেখা যাবে */
  {
    const dir = fileURLToPath(new URL("../backups/", import.meta.url));
    mkdirSync(dir, { recursive: true });
    const file = `${dir}projects-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const snapshot = await projects.find({}).toArray();
    writeFileSync(file, JSON.stringify(snapshot, null, 2));
    console.log(`💾 backup: ${snapshot.length} টা project → ${file}\n`);
  }

  if (RESET) {
    const { deletedCount } = await projects.deleteMany({ seed: true });
    console.log(`🧹 ${deletedCount} টা নমুনা project মোছা হলো`);
  }

  const base = Date.now();
  let added = 0;
  let updated = 0;
  for (const [index, p] of parsed.entries()) {
    const ids = [];
    for (const name of p.productNames) {
      const doc = await products.findOne({ slug: slugify(name) }, { projection: { _id: 1 } });
      if (doc) ids.push(doc._id.toString());
      else console.log(`   ↳ "${p.project.title}": product library তে নেই → "${name}"`);
    }

    const { value, error } = cleanProject({ ...p.project, products: ids });
    if (error) {
      console.log(`❌ ${p.project.title}: ${error}`);
      continue;
    }

    const slug = projectSlug(value.title);
    const existing = await projects.findOne({ slug });
    if (existing) {
      await projects.updateOne(
        { _id: existing._id },
        { $set: { ...value, source: "filamento.com", sourceUrl: p.sourceUrl, updatedAt: new Date() } },
      );
      updated += 1;
      console.log(`♻️  ${value.title}`);
      continue;
    }

    const time = new Date(base - index * 60_000);
    await projects.insertOne({
      ...value,
      code: await nextProjectCode(),
      slug,
      views: 0,
      source: "filamento.com",
      sourceUrl: p.sourceUrl,
      publishedAt: time,
      createdAt: time,
      updatedAt: time,
      createdBy: { id: null, name: "Website import" },
      updatedBy: { id: null, name: "Website import" },
    });
    added += 1;
    console.log(`✅ ${value.title}`);
  }
  console.log(`\nDone — ${added} টা নতুন, ${updated} টা হালনাগাদ.`);
}

main()
  .catch((error) => {
    console.error("❌", error.message);
    process.exitCode = 1;
  })
  .finally(() => (connected ? closeDB() : undefined));