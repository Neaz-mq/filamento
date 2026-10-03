import { closeDB, connectDB } from "../config/db.js";
import { slugify } from "../lib/productSchema.js";
import { cleanProject, projectSlug } from "../lib/projectSchema.js";
import { nextProjectCode } from "../controllers/projectController.js";

/* ===============================================================
   নমুনা project — সাইটের Figma র তিনটা project (Salvation Army Kroc
   Center, Hong Kong Asia World Expo, Barn XO — পুরো গল্প সহ), Figma র
   Project Library র সারিগুলো, আর "Sports Arena Lighting" এ Add New
   Project পাতার গল্প

   server ফোল্ডারে:
     npm run seed-projects            নমুনাগুলো যোগ করে
     npm run seed-projects -- --reset আগের নমুনা মুছে আবার যোগ করে

   "Product Used" এ নমুনা product গুলো বসে — তাই আগে
   npm run seed-products চালানো থাকলে ভালো (না থাকলে ফাঁকা থাকে).

   একই নামের project আগে থেকে থাকলে ছোঁয়া হয় না.
   ⚠️ --reset শুধু এই script এর বানানো project মোছে (seed: true)
   =============================================================== */

const CLOUD = "https://res.cloudinary.com/dzi3u164c/image/upload/";
const own = (path) => ({ url: `${CLOUD}${path}`, publicId: "" });
// Unsplash — public Projects পাতার একই ছবি (Unsplash License)
const unsplash = (id) => ({
  url: `https://images.unsplash.com/${id}?auto=format&fit=crop&q=75&w=1600`,
  publicId: "",
});

const ARENA = own("v1789985331/be5360cb5806dd39ba58c23000d7201a66b3447a_wl2fwe.jpg");
const BARN = own("v1789985339/3041207c74d5ee01e3921128797d9c9614c8156d_adbdcq.jpg");
const FITNESS = own("v1789985350/55103d210a35d777640fc5b5351acecee6d9580e_uvrmn1.jpg");
const WAREHOUSE = unsplash("photo-1684695749267-233af13276d0");
const FACTORY = unsplash("photo-1496247749665-49cf5b1022e9");
const DISTRIBUTION = unsplash("photo-1721937718756-3bfec49f42a2");
const STREET = unsplash("photo-1743369673059-cae28a9a8c9c");
const GYM = unsplash("photo-1559369064-c4d65141e408");
const RETAIL = unsplash("photo-1761207300250-a71b2ff68b99");
const CONFERENCE = unsplash("photo-1652084868625-2d1a886f4189");

/* সাইটের Project Details এর Figma র হলুদ বোতাম */
const PLAN_CTA = { text: "Plan a similar project", link: "/contact", newTab: false };

const CTA = { text: "Explore Products", link: "/products", newTab: false };

const SAMPLES = [
  /* ---- সাইটের Figma র তিনটা project (Projects Details পাতা) ----
     ক্রম: Kroc → Hong Kong → Barn XO (তারিখ নতুন থেকে পুরনো), তাই
     সাইটে "Previous / Next" Figma র মতোই মেলে */
  {
    title: "Salvation Army Kroc Center",
    company: "The Salvation Army Kroc Center",
    shortDescription:
      "Gyms, pools and fitness areas moved to Filamento LED — uniform, glare-free light with up to 50% less energy.",
    projectType: "gymnasium",
    category: "sports",
    location: "Salem, OR",
    date: "2026-06-20",
    status: "completed",
    images: [FITNESS, GYM, ARENA],
    keyFeatures: [
      { icon: "area", title: "50,000", subtitle: "SQ FT Facility" },
      { icon: "gauge", title: "50%", subtitle: "Energy savings" },
      { icon: "timer", title: "100,000+ hrs", subtitle: "LED lifetime" },
    ],
    challenge:
      "The Kroc Center required a lighting solution that could deliver exceptional visibility for a variety of activities while helping to reduce energy use and maintenance costs.\n\nThe facility needed uniform illumination for gymnasiums, aquatic fitness spaces and common areas.",
    solutionIntro:
      "Filamento provided a complete LED lighting solution designed to meet the center's performance and efficiency goals.",
    solution: [
      {
        icon: "sun",
        title: "Uniform, Glare-Free Light",
        description:
          "High-performance LED high bays and panels deliver consistent, comfortable light across all spaces.",
      },
      {
        icon: "bolt",
        title: "Energy Efficient",
        description: "Up to 50% energy savings compared to previous lighting.",
      },
      {
        icon: "settings",
        title: "Low Maintenance",
        description: "Long-life LEDs and robust design reduce maintenance and operating costs.",
      },
      {
        icon: "grid",
        title: "Versatile Application",
        description: "Ideal for gymnasiums, fitness areas, pools, offices and public spaces.",
      },
    ],
    results:
      "The Kroc Center now enjoys excellent visibility, a better experience for visitors, and significantly lower energy and maintenance costs.\n\nThe lighting system supports the center's mission to serve the community with a safe, welcoming and sustainable environment.\n\nThe result: efficient, reliable lighting that makes a difference.",
    highlights: [
      "Consistent illumination for large spaces",
      "Uniform lighting for better visibility and appeal",
      "Lower energy consumption",
      "Fewer bulb replacements and lower costs",
      "Easy and simple maintenance",
    ],
    cta: PLAN_CTA,
    products: ["High Bay Configurator", '16"/41cm UGR Diffuser', "ADP Base - Hook Mount"],
  },
  {
    title: "Hong Kong Asia World Expo",
    company: "AsiaWorld-Expo",
    shortDescription:
      "A 50,000-seat expo venue swapped its old HID system for high-CRI LED with easy bulb-level maintenance.",
    projectType: "conventionCenter",
    category: "commercial",
    location: "Hong Kong",
    date: "2026-06-18",
    status: "completed",
    images: [ARENA, CONFERENCE, WAREHOUSE],
    keyFeatures: [
      { icon: "users", title: "50,000", subtitle: "Event capacity" },
      { icon: "gauge", title: "50%", subtitle: "Energy savings" },
      { icon: "timer", title: "100,000+ hrs", subtitle: "LED lifetime" },
    ],
    challenge:
      "Asia World Expo faced inconsistent lighting, high maintenance demands, and limited control flexibility with its outdated HID system.\n\nWith capacity for up to 50,000 attendees, the venue needed uniform, high-quality lighting for large-scale events.\n\nFrequent bulb replacements and costly maintenance also created unnecessary downtime between events.",
    solutionIntro:
      "Filamento upgraded the venue with high-performance LED lighting designed for uniform illumination, easy maintenance, and flexible control.",
    solution: [
      {
        icon: "sun",
        title: "Excellent Quality of Light",
        description:
          "High-CRI LED lighting delivers consistent, accurate illumination across the venue.",
      },
      {
        icon: "settings",
        title: "Short Maintenance Downtime",
        description:
          "Individual bulb replacement reduces maintenance time and operational disruption.",
      },
      {
        icon: "grid",
        title: "Flexible Control Upgrades",
        description:
          "Flexible controls make future system upgrades easier without replacing entire fixtures.",
      },
    ],
    results:
      "The LED upgrade delivered more uniform lighting, lower energy use, and faster maintenance across the venue.\n\nIndividual bulb replacement reduced downtime, while flexible controls improved long-term operational efficiency.\n\nThe result: a reliable, efficient, and future-ready lighting system.",
    highlights: [
      "Uniform illumination across large spaces",
      "Improved visual clarity and coverage",
      "Up to 50% energy savings",
      "Reduced maintenance downtime",
      "Easy bulb-level replacement",
    ],
    cta: PLAN_CTA,
    products: ["LS1 High Bay Series", "LA1 High Bay: Linear Distribution"],
  },
  {
    title: "Barn XO",
    company: "Barn XO",
    shortDescription:
      "A warm, low-glare LED scheme for a dining and events space that wanted to look as good as it feels.",
    projectType: "retail",
    category: "hospitality",
    location: "Chicago, Illinois",
    date: "2026-06-16",
    status: "completed",
    images: [BARN, RETAIL],
    keyFeatures: [
      { icon: "users", title: "10,000", subtitle: "Event capacity" },
      { icon: "gauge", title: "50%", subtitle: "Energy savings" },
      { icon: "timer", title: "100,000+ hrs", subtitle: "LED lifetime" },
    ],
    challenge:
      "Barn XO needed a lighting solution that could enhance the aesthetic of their unique space while providing excellent illumination for dining, events, and entertainment.\n\nThe goal was to create a warm, inviting atmosphere while minimizing energy consumption and maintenance requirements.",
    solutionIntro:
      "Filamento delivered a custom LED lighting solution that complements the design while ensuring superior performance.",
    solution: [
      {
        icon: "sun",
        title: "Warm & Inviting Ambiance",
        description:
          "Carefully selected LED fixtures create a welcoming atmosphere perfect for any occasion.",
      },
      {
        icon: "bolt",
        title: "Energy Efficient",
        description: "Up to 50% energy savings compared to previous lighting.",
      },
      {
        icon: "settings",
        title: "Low Maintenance",
        description: "Long-life LEDs reduce maintenance needs and operational costs.",
      },
      {
        icon: "grid",
        title: "Versatile Lighting",
        description: "Flexible lighting for dining, events, stage and architectural highlights.",
      },
    ],
    results:
      "Barn XO now enjoys beautiful, reliable lighting that enhances every experience while reducing energy use and maintenance.\n\nThe lighting solution supports their mission to deliver memorable experiences in a space that stands out.\n\nThe result: a space that shines as bright as the experiences it creates.",
    highlights: ["Uniform lighting", "Low-glare", "Easy installation"],
    cta: PLAN_CTA,
    products: [
      "High Bay Configurator",
      'Cylinder 7"/18cm Reflector',
      "ADP Base - Hook Mount",
      "VA6 Post Top House Side Shield",
    ],
  },

  /* ---- admin এর Project Library র Figma র সারিগুলো ---- */
  {
    title: "Warehouse Lighting Upgrade",
    company: "Lone Star Logistics",
    shortDescription:
      "A 120,000 sq ft warehouse moved to LA1 high bays — brighter aisles, half the fixtures and much lower energy bills.",
    projectType: "warehouse",
    category: "industrial",
    location: "Texas, USA",
    date: "2026-05-28",
    status: "completed",
    images: [WAREHOUSE, DISTRIBUTION],
    keyFeatures: [
      { icon: "area", title: "120,000", subtitle: "SQ FT Facility" },
      { icon: "gauge", title: "50%", subtitle: "Energy savings" },
      { icon: "timer", title: "100,000+ hrs", subtitle: "LED lifetime" },
    ],
    challenge:
      "Old metal halide fixtures left dark spots between the racks and took minutes to warm up after every power cut.",
    solution: [
      {
        icon: "sun",
        title: "Even light in every aisle",
        description: "LA1 linear optics push light down the racks instead of onto the roof.",
      },
      {
        icon: "leaf",
        title: "Half the energy",
        description: "Fewer, more efficient fixtures cut the lighting load by 50%.",
      },
    ],
    results:
      "Pickers now see every label clearly, and the site saves about $38,000 a year on electricity.",
    highlights: ["Brighter aisles", "50% fewer fixtures", "Instant-on after power cuts"],
    cta: CTA,
    products: ["LA1 High Bay: Linear Distribution", "Aisle Lighter"],
  },
  {
    title: "Parking Garage Lighting",
    company: "Pacific Park Holdings",
    shortDescription: "Four-level parking garage with motion-dimmed LED lighting.",
    projectType: "other",
    category: "commercial",
    location: "California, USA",
    date: "2026-05-20",
    status: "draft",
    images: [STREET],
    products: ["LS1 High Bay Series"],
  },
  {
    title: "Sports Arena Lighting",
    company: "The Salvation Army Kroc Center",
    shortDescription:
      "The Kroc Center switched its gyms, pools and fitness areas to Filamento LED — uniform light, lower energy and almost no maintenance.",
    projectType: "gymnasium",
    category: "sports",
    location: "New York, USA",
    date: "2026-05-14",
    status: "completed",
    images: [FITNESS, ARENA, GYM],
    videoUrls: [],
    keyFeatures: [
      { icon: "area", title: "50,000", subtitle: "SQ FT Facility" },
      { icon: "gauge", title: "50%", subtitle: "Energy savings" },
      { icon: "timer", title: "100,000+ hrs", subtitle: "LED lifetime" },
    ],
    challenge:
      "The Kroc Center required a lighting solution that could deliver exceptional visibility for a variety of activities while helping to reduce energy use and maintenance costs.\n\nThe facility needed uniform illumination for gymnasiums, aquatic fitness spaces and common areas.",
    solution: [
      {
        icon: "sun",
        title: "Uniform, Glare-Free Light",
        description:
          "High-performance LED high bays and panels deliver consistent, comfortable light across all spaces.",
      },
      {
        icon: "leaf",
        title: "Energy Efficient",
        description: "Up to 50% energy savings compared to previous lighting.",
      },
      {
        icon: "settings",
        title: "Low Maintenance",
        description:
          "Long-life LEDs and robust design reduce maintenance and operating costs.",
      },
      {
        icon: "grid",
        title: "Versatile Application",
        description: "Ideal for gymnasiums, fitness areas, pools, offices and public spaces.",
      },
    ],
    results:
      "The Kroc Center now enjoys excellent visibility, a better experience for visitors, and significantly lower energy and maintenance costs.\n\nThe lighting system supports the center's mission to serve the community with a safe, welcoming and sustainable environment.\n\nThe result: efficient, reliable lighting that makes a difference.",
    highlights: [
      "Consistent illumination for large spaces",
      "Uniform lighting for better visibility and appeal",
      "Lower energy consumption",
      "Fewer bulb replacements and lower costs",
      "Easy and simple maintenance",
    ],
    cta: CTA,
    products: [
      "High Bay Configurator",
      '16"/41cm UGR Diffuser',
      "ADP Base - Hook Mount",
    ],
  },
  {
    title: "Manufacturing Facility",
    company: "Great Lakes Fabrication",
    shortDescription:
      "Production floor retrofit with RH1 high bays rated for heat, dust and vibration.",
    projectType: "manufacturing",
    category: "industrial",
    location: "Ohio, USA",
    date: "2026-04-30",
    status: "completed",
    images: [FACTORY],
    keyFeatures: [
      { icon: "factory", title: "3 shifts", subtitle: "24/7 production" },
      { icon: "gauge", title: "42%", subtitle: "Energy savings" },
    ],
    highlights: ["Rated for high ambient heat", "Wireless dimming per zone"],
    cta: CTA,
    products: ["RH1 High Bay Series", "Avi-On Bluetooth Control Cap"],
  },
  {
    title: "Retail Store Lighting",
    company: "Barn XO",
    shortDescription: "Warm, even light for a rustic retail barn and its outdoor market.",
    projectType: "retail",
    category: "retail",
    location: "Florida, USA",
    date: "2026-04-18",
    status: "draft",
    images: [BARN],
    products: ['Cylinder 7"/18cm Reflector'],
  },
  {
    title: "Outdoor Area Lighting",
    company: "Bayou Port Authority",
    shortDescription:
      "Yard and loading-area lighting with house-side shields to keep light off the neighbours.",
    projectType: "streetLights",
    category: "industrial",
    location: "Louisiana, USA",
    date: "2026-03-26",
    status: "completed",
    images: [STREET],
    keyFeatures: [{ icon: "shield", title: "IP66", subtitle: "Weather rated" }],
    cta: CTA,
    products: ["VA6 Post Top House Side Shield", "Safety Cable 2M with Grip"],
  },
  {
    title: "Distribution Center",
    company: "Silver State Freight",
    shortDescription: "Cross-dock distribution center lit for fast, safe forklift traffic.",
    projectType: "distributionCenter",
    category: "commercial",
    location: "Nevada, USA",
    date: "2026-03-10",
    status: "draft",
    images: [DISTRIBUTION],
    products: ["LA1 High Bay: Linear Distribution"],
  },
  {
    title: "Cold Storage Facility",
    company: "Northern Harvest Foods",
    shortDescription:
      "Freezer-rated LED high bays for a −30 °C cold store — second phase still being installed.",
    projectType: "coldStorage",
    category: "industrial",
    location: "Toronto, Canada",
    date: "2026-06-12",
    status: "in-progress",
    images: [WAREHOUSE],
    keyFeatures: [{ icon: "timer", title: "Phase 2", subtitle: "Installing now" }],
    products: ["LS1 High Bay Series"],
  },
];

async function main() {
  const reset = process.argv.includes("--reset");
  const db = await connectDB();
  const projects = db.collection("projects");
  const products = db.collection("products");

  if (reset) {
    const { deletedCount } = await projects.deleteMany({ seed: true });
    console.log(`🧹 Removed ${deletedCount} sample project(s).`);
  }

  let added = 0;
  const base = Date.now();

  for (const [index, sample] of SAMPLES.entries()) {
    // product এর নাম → id (নমুনা product না থাকলে বাদ)
    const ids = [];
    for (const name of sample.products ?? []) {
      const doc = await products.findOne({ slug: slugify(name) }, { projection: { _id: 1 } });
      if (doc) ids.push(doc._id.toString());
    }

    const { value, error } = cleanProject({ ...sample, products: ids });
    if (error) throw new Error(`${sample.title}: ${error}`);

    const slug = projectSlug(value.title);
    if (await projects.findOne({ slug })) {
      console.log(`↷ ${value.title} already exists — skipped.`);
      continue;
    }

    // তালিকায় Figma র ক্রমে আসুক — প্রথমটা সবচেয়ে নতুন
    const time = new Date(base - index * 60_000);
    await projects.insertOne({
      ...value,
      code: await nextProjectCode(),
      slug,
      views: 0,
      seed: true,
      publishedAt: value.status === "draft" ? null : time,
      createdAt: time,
      updatedAt: time,
      createdBy: { id: null, name: "Sample data" },
      updatedBy: { id: null, name: "Sample data" },
    });
    added += 1;
    console.log(`✅ ${value.title}`);
  }

  console.log(`\nDone — ${added} sample project(s) added.`);
}

main()
  .catch((error) => {
    console.error("❌", error.message);
    process.exitCode = 1;
  })
  .finally(() => closeDB());
 