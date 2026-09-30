import { closeDB, connectDB } from "../config/db.js";
import { cleanProduct, slugify } from "../lib/productSchema.js";

/* ===============================================================
   নমুনা product — Figma র LA1 High Bay, ADP Base (Mounting Base)
   Cylinder Reflector আর Avi-On Control Cap এর সব তথ্য সহ

   server ফোল্ডারে:
     npm run seed-products            নমুনাগুলো যোগ করে
     npm run seed-products -- --reset আগের নমুনা মুছে আবার যোগ করে

   একই নামের product আগে থেকে থাকলে সেটা ছোঁয়া হয় না — তাই বারবার
   চালালেও দ্বিগুণ হয় না.

   ছবিগুলো Cloudinary তে আগে থেকেই থাকা সাইটের ছবি (মূল পাতার
   Fixtures অংশের). video গুলো পুরনো WordPress সাইটের — নমুনা হিসেবে.

   ⚠️ --reset শুধু এই script এর বানানো product মোছে (seed: true),
   কিন্তু সেগুলো পরে admin panel এ বদলে থাকলেও মুছে যাবে
   =============================================================== */

const IMG = "https://res.cloudinary.com/dzi3u164c/image/upload/";
const image = (path) => ({ url: `${IMG}${path}`, publicId: "" });

const LA1 = image("v1789621178/image_7_wqtldv.png");
const LS1 = image("v1789621338/Additional_0001_1779697023_1_taubuk.png");
const RH1 = image("v1789471643/fix3_yeppeq.webp");
const HIGH_BAY = image("v1789539354/image_7_ep6gnv.png");

const WP = "https://www.filamento.com/wp-content/";

const list = (...items) => ({ items, tables: [], description: "" });

const amps = (caption, columns, rows) => ({
  title: "Amps @ Line Voltage (VAC)",
  caption,
  rowHeader: "Watt",
  columns,
  rows: rows.map(([label, ...cells]) => ({ label, cells })),
});

const LA1_SPECS = {
  applications: list("Aisle Lighter", "High Racks", "Corridors", "Retail"),
  general: list(
    "50% energy saving at same spacing",
    "50% energy saving & 50% fewer fixture at wider spacing",
  ),
  features: list(
    "17,226 to 32,604 Lumens",
    "50% energy saving & 50% fewer fixture at wider spacing",
    "5 selectable power levels",
    "100W, 118W, 140W, 167W, 200W",
    "201W, 236W, 280W, 334W, 400W",
    "100-277 VAC or 277-480 VAC",
    "UGR<26",
    "80 CRI Standard",
    "4000K or 5000K CCT",
    "Wireless and non-wireless control options",
    "Five Years Warranty",
  ),
  certifications: list("UL", "DLC Premium"),
  controlOptions: list("Wireless: Synapse, Silvair, GEBC", "Dims to 10% then to off"),
  mechanical: list(
    "100W-200W: 4.9 lbs / 2.24 kg",
    "201W-400W: 9.8 lbs / 4.48 kg",
    "Available separately: Power cord, aircraft cable or safety cable",
  ),
  emergencyBattery: list("40W"),
  lumenMaintenance: {
    items: [],
    description: "",
    tables: [
      {
        title: "Lumen Maintenance",
        caption: "",
        rowHeader: "Hours (Hrs)",
        columns: ["Lumen Maintenance (%)"],
        rows: [
          ["0", "100"],
          ["30,000", "95"],
          ["45,000", "92"],
          ["60,000", "90"],
          ["100,000", "84"],
          [">100,000", "70"],
        ].map(([label, value]) => ({ label, cells: [value] })),
      },
    ],
  },
  electrical: {
    items: [
      "VS: 100-277 VAC, 50-60Hz, V4: 277-480 VAC, 50-60 Hz",
      "<1% Flicker",
      "PF > 0.9, THD<20%",
      "Surge: 6 kV (L-N), 10kV (L-G, N-G)",
    ],
    description: "",
    tables: [
      amps(
        "VS",
        ["100V", "120V", "220V", "240V", "277V"],
        [
          ["100W", "1.00A", "0.83A", "0.45A", "0.42A", "0.36A"],
          ["118W", "1.18A", "0.98A", "0.54A", "0.49A", "0.43A"],
          ["140W", "1.40A", "1.17A", "0.64A", "0.58A", "0.51A"],
          ["167W", "1.67A", "1.39A", "0.76A", "0.70A", "0.60A"],
          ["200W", "2.00A", "1.67A", "0.91A", "0.83A", "0.72A"],
          ["201W", "2.01A", "1.68A", "0.91A", "0.84A", "0.73A"],
          ["236W", "2.36A", "1.97A", "1.07A", "0.98A", "0.85A"],
          ["280W", "2.80A", "2.33A", "1.27A", "1.17A", "1.01A"],
          ["334W", "3.34A", "2.78A", "1.52A", "1.39A", "1.21A"],
          ["400W", "4.00A", "3.33A", "1.82A", "1.67A", "1.44A"],
        ],
      ),
      amps(
        "V4",
        ["347V", "480V"],
        [
          ["100W", "0.29A", "0.21A"],
          ["118W", "0.34A", "0.25A"],
          ["140W", "0.40A", "0.29A"],
          ["167W", "0.48A", "0.35A"],
          ["200W", "0.58A", "0.42A"],
          ["201W", "0.58A", "0.42A"],
          ["236W", "0.68A", "0.49A"],
          ["280W", "0.81A", "0.58A"],
          ["334W", "0.96A", "0.70A"],
          ["400W", "1.15A", "0.83A"],
        ],
      ),
    ],
  },
  ballastCompatibility: {
    items: [],
    description:
      "The Hybrid series is compatible with HID magnetic ballast between 45-250W. Such ballast types include probe start, pulse start, CWA, or reactive. The table below shows compatible ballast that have been tested. Input to ballast may be up to 480V. Optical distribution and lumen output are constant regardless of Ballast type or wattage. Ballast operation is not compatible with controls.",
    tables: [
      {
        title: "HID Ballast Compatibility",
        caption: "",
        rowHeader: "Type",
        columns: ["45-70W", "100W", "150W", "175W", "200W", "250W"],
        rows: [
          {
            label: "Metal Halide",
            cells: ["M90", "-", "-", "M98\nM110\nM143", "M57\nM137\nM152\nMH175", "M138\nM153\nMH250"],
          },
          {
            label: "HPS",
            cells: ["NG100", "NG150", "-", "S66", "NG50\nNG70", "S50\nNG250"],
          },
          { label: "MV", cells: ["-", "-", "-", "H175", "-", "-"] },
        ],
      },
    ],
  },
};

const SAMPLES = [
  {
    name: "LA1 High Bay: Linear Distribution",
    shortDescription: "Up to 50% Less Energy and 50% fewer fixtures",
    category: "lamp-fixture",
    series: "High Bay Lights",
    stock: 284,
    status: "published",
    images: [LA1, HIGH_BAY],
    videoUrls: [],
    keyFeatures: [
      { icon: "bolt", title: "Up to 50%", subtitle: "energy savings" },
      { icon: "award", title: "UL, DLC", subtitle: "Certified" },
      { icon: "shield", title: "5 Year", subtitle: "warranty" },
      { icon: "factory", title: "Built for", subtitle: "Industrial" },
    ],
    specs: LA1_SPECS,
    videos: [
      {
        title: "Product Overview",
        description: "How the fixture is built and where it fits.",
        url: `${WP}uploads/2026/07/RH1_Animation_Final_02_compressed.mp4`,
        thumbnail: LA1.url,
      },
      {
        title: "Installation Guide",
        description: "Mounting and wiring, step by step.",
        url: `${WP}uploads/2026/06/10467854031752108853_compressed.mp4`,
        thumbnail: HIGH_BAY.url,
      },
      {
        title: "Light Distribution",
        description: "Linear distribution along racked aisles.",
        url: `${WP}plugins/Tot/upload/resources/VIDEOS/INSV_ACC-005-PT1-000-FL_230907.mp4`,
        thumbnail: RH1.url,
      },
    ],
    documents: [],
  },
  {
    name: "LS1 High Bay Series",
    shortDescription: "Symmetric high bay for open warehouse floors",
    category: "lamp-fixture",
    series: "High Bay Lights",
    stock: 196,
    status: "published",
    images: [LS1],
    keyFeatures: [
      { icon: "bolt", title: "Up to 50%", subtitle: "energy savings" },
      { icon: "award", title: "UL, DLC", subtitle: "Certified" },
    ],
    specs: {
      applications: list("Warehouses", "Manufacturing", "Gymnasiums"),
      certifications: list("UL", "DLC"),
    },
  },
  {
    name: "RH1 High Bay Series",
    shortDescription: "Retrofit high bay that keeps your existing reflector",
    category: "lamp-fixture",
    series: "High Bay Lights",
    stock: 412,
    status: "published",
    images: [RH1],
    keyFeatures: [{ icon: "shield", title: "5 Year", subtitle: "warranty" }],
    specs: { certifications: list("UL", "DLC") },
  },
  {
    name: "Aisle Lighter",
    shortDescription: "Narrow beam fixture for tall racked aisles",
    category: "lamp-fixture",
    series: "Aisle Lighting",
    stock: 388,
    status: "draft",
    images: [],
    specs: { certifications: list("UL", "DLC") },
  },
  /* Figma র Mounting Base — এর ছবি এখনো Cloudinary তে নেই, তাই
     draft হিসেবে থাকে আর তালিকায় category র নমুনা ছবি দেখায়.
     ছবি তুলে দিলেই publish করা যাবে */
  {
    name: "ADP Base - Hook Mount",
    shortDescription: "ADP Mounting Base - White",
    category: "mounting-base",
    color: "White/Black",
    stock: 120,
    status: "draft",
    images: [],
    keyFeatures: [
      { icon: "bolt", title: "Up to 50%", subtitle: "energy savings" },
      { icon: "award", title: "UL, DLC", subtitle: "Certified" },
      { icon: "shield", title: "5 Year", subtitle: "warranty" },
      { icon: "factory", title: "Built for", subtitle: "Industrial" },
    ],
    specs: {
      general: list(
        "50% energy saving at same spacing",
        "50% energy saving & 50% fewer fixture at wider spacing",
      ),
      certifications: list("UL", "DLC Premium"),
      mechanical: list(
        "1.25 lb / 0.57kg",
        'Ø 4.65" (118mm) x 5.125" (130mm)',
        "Powder-coated matte finish",
        "Solid aluminum body",
      ),
      electrical: list("100-277 VAC, 50-60 Hz"),
    },
    videos: [
      {
        title: "Product Overview",
        description: "What the hook mount base is and where it fits.",
        url: `${WP}uploads/2026/07/RH1_Animation_Final_02_compressed.mp4`,
        thumbnail: "",
      },
      {
        title: "Installation Guide",
        description: "Hanging the base and connecting the lamp.",
        url: `${WP}uploads/2026/06/10467854031752108853_compressed.mp4`,
        thumbnail: "",
      },
    ],
  },
  /* Figma র Reflector — ছবি নেই, তাই draft */
  {
    name: 'Cylinder 7"/18cm Reflector',
    shortDescription: "Cosmetic Reflector - White/Black",
    category: "reflector",
    color: "White/Black",
    stock: 85,
    status: "draft",
    images: [],
    keyFeatures: [
      { icon: "bolt", title: "Up to 50%", subtitle: "energy savings" },
      { icon: "award", title: "UL, DLC", subtitle: "Certified" },
      { icon: "shield", title: "5 Year", subtitle: "warranty" },
      { icon: "factory", title: "Built for", subtitle: "Industrial" },
    ],
    specs: {
      general: {
        description:
          "The optional reflector is available to create a traditional high-bay aesthetic. However, these reflectors are not needed and its installation does not substantially alter the light distribution. The Filamento lamp has integral optics that create a cutoff at 50°, eliminating glare so an external reflector is not required.",
        items: [
          "Solid aluminum reflector",
          "Reflectors are vented to allow for airflow",
          "Compatible with all ADP mounting bases",
          "Compatible with all VA6 mogul base lamps",
          "Easy to Install - Simply twist and lock assembly to ADP mounting bases, no tools required",
          "ADP mounting bases are sold separately",
        ],
        tables: [],
      },
      certifications: list("UL", "DLC Premium"),
      mechanical: list(
        "0.54 kg / 1.2 lb",
        'Ø 7.51" (191mm) x 10.78" (274mm)',
        "Solid aluminum body",
        "White Exterior/Black Interior",
        "Inquire for custom colors",
      ),
    },
    videos: [
      {
        title: "Product Overview",
        description: "What the reflector adds and how it fits the lamp.",
        url: `${WP}uploads/2026/07/RH1_Animation_Final_02_compressed.mp4`,
        thumbnail: "",
      },
    ],
  },
  /* Figma র Control Cap — ছবি নেই, তাই draft. Figma র General এর
     বিবরণে Reflector এর লেখা কপি হয়ে ছিল, তাই এখানে তালিকা থেকে
     বানানো ছোট একটা বিবরণ */
  {
    name: "Avi-On Bluetooth Control Cap",
    shortDescription: "Control Cap",
    category: "control-cap",
    stock: 60,
    status: "draft",
    images: [],
    keyFeatures: [
      { icon: "bolt", title: "Up to 50%", subtitle: "energy savings" },
      { icon: "award", title: "UL, DLC", subtitle: "Certified" },
      { icon: "shield", title: "5 Year", subtitle: "warranty" },
      { icon: "factory", title: "Built for", subtitle: "Industrial" },
    ],
    specs: {
      general: {
        description:
          "Bluetooth control cap that adds Avi-on wireless dimming and control to the Filamento lamp. It snaps into the front connector and is managed from a smartphone app.",
        items: [
          "Compatible with Avi-on wireless control system",
          "Enables wireless dimming level controls over secure Bluetooth mesh network",
          "Self-managed through a simple smartphone application",
          "Optional Bridge for remote access and cloud connectivity",
          "Optional wireless sensors and wall switches",
          "Easy to Install - Simply snap into front connector",
          "https://avi-on.com/solutions/",
        ],
        tables: [],
      },
      certifications: list("UL", "DLC Premium"),
      mechanical: list(
        'With tabs: Ø 3.50" (89mm) x 0.65" (16.5mm)',
        'Without tabs: Ø 2.95" (75mm) x 0.65" (16.5mm)',
      ),
    },
    videos: [
      {
        title: "Product Overview",
        description: "What the control cap adds to the lamp.",
        url: `${WP}uploads/2026/07/RH1_Animation_Final_02_compressed.mp4`,
        thumbnail: "",
      },
    ],
  },
];

async function main() {
  const reset = process.argv.includes("--reset");
  const db = await connectDB();
  const products = db.collection("products");

  if (reset) {
    const { deletedCount } = await products.deleteMany({ seed: true });
    console.log(`🧹 Removed ${deletedCount} sample product(s).`);
  }

  let added = 0;
  const base = Date.now();

  for (const [index, sample] of SAMPLES.entries()) {
    const { value, error } = cleanProduct(sample);
    if (error) throw new Error(`${sample.name}: ${error}`);

    const slug = slugify(value.name);
    if (await products.findOne({ slug })) {
      console.log(`↷ ${value.name} already exists — skipped.`);
      continue;
    }

    // তালিকায় Figma র ক্রমে আসুক — প্রথমটা সবচেয়ে নতুন
    const time = new Date(base - index * 60_000);
    await products.insertOne({
      ...value,
      slug,
      views: 0,
      seed: true,
      createdAt: time,
      updatedAt: time,
      createdBy: { id: null, name: "Sample data" },
      updatedBy: { id: null, name: "Sample data" },
    });
    added += 1;
    console.log(`✅ ${value.name}`);
  }

  console.log(`\nDone — ${added} sample product(s) added.`);
}

main()
  .catch((error) => {
    console.error("❌", error.message);
    process.exitCode = 1;
  })
  .finally(() => closeDB());
