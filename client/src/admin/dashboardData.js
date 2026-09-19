/* ===============================================================
   Dashboard এর নমুনা তথ্য

   ⚠️ এখনকার সব সংখ্যা Figma র নকশা থেকে নেওয়া — স্থির. database এ
   এখনো একটাও product বা lead নেই, তাই গোনার মতো কিছু নেই.

   👉 ধাপ ৪ এ এই ফাইলটাই বদলে যাবে: এখান থেকে export হওয়া নামগুলো
   একই থাকবে, শুধু মান আসবে server থেকে (GET /api/admin/overview).
   তাই AdminHome.jsx এ তখন প্রায় কিছুই বদলাতে হবে না
   =============================================================== */

/* Home পাতার অংশগুলো — sidebar এর তালিকা, dashboard এর টেবিল আর
   উপরের search, তিন জায়গাতেই এটাই ব্যবহার হয়.

   ⚠️ এই তালিকাটা আসল পাতার সাথে মিলিয়ে লেখা — src/pages/Home.jsx
   যে component গুলো দেখায় আর src/i18n/locales/*.json এ যে key
   গুলো আছে, ঠিক সেগুলো. slug গুলোও ওই key এর নাম, যাতে পরে
   সম্পাদনার পাতা বানানোর সময় একটার সাথে আরেকটা মেলাতে না হয়.

   status — এখন সাতটাই সত্যিই সাইটে আছে, তাই সবগুলোই "Published".
   কোনো অংশ বন্ধ/চালু করার ব্যবস্থা তৈরি হলে এই মানটা database
   থেকে আসবে, তখন "Hidden" ও দেখা যাবে.

   ✅ Home.jsx এ নতুন অংশ যোগ বা সরালে এখানেও বদলাবেন */
export const homeSections = [
  {
    slug: "hero",
    name: "Hero Section",
    note: "Headline, tagline, CTA buttons and the hero image",
    status: "Published",
  },
  {
    slug: "brands",
    name: "Trusted By Section",
    note: "Customer logo strip under the hero",
    status: "Published",
  },
  {
    slug: "fixtures",
    name: "Product Showcase",
    note: "LA1, LS1 and RH1 fixture cards",
    status: "Published",
  },
  {
    slug: "comparison",
    name: "Comparison Section",
    note: "Traditional LED vs Filamento table",
    status: "Published",
  },
  {
    slug: "technologies",
    name: "Technology Section",
    note: "Thermal, optical and driver videos",
    status: "Published",
  },
  {
    slug: "testimonials",
    name: "Testimonials Section",
    note: "Client reviews and project links",
    status: "Published",
  },
  {
    slug: "contact",
    name: "Contact Section",
    note: "Quote request form and lead capture",
    status: "Published",
  },
];

/* উপরের আটটা card.

   tone — রঙের নাম, admin.css এ .adm-tone-* ক্লাসে বসানো
   spark — নিচের ছোট লেখচিত্রের বিন্দু (0 = নিচ, 100 = উপর) */
export const stats = [
  {
    id: "sections",
    label: "Total Section",
    // হাতে লেখা "12" ভুল ছিল — এখন তালিকা যত, সংখ্যাও তত
    value: String(homeSections.length),
    /* delta নেই: "20% last month" বানানো ছিল. সত্যিকারের তুলনা
       করতে হলে আগের মাসের হিসাব রাখতে হবে, সেটা ধাপ ৪ এর কাজ */
    delta: null,
    tone: "yellow",
    icon: "layers",
    spark: [30, 42, 38, 55, 48, 66, 60, 78],
  },
  {
    id: "published",
    label: "Published",
    value: String(
      homeSections.filter((section) => section.status === "Published").length,
    ),
    delta: null,
    tone: "green",
    icon: "tick",
    spark: [25, 35, 32, 50, 62, 55, 70, 74],
  },
  {
    id: "products",
    label: "Total Products",
    value: "24",
    delta: "20% last month",
    tone: "purple",
    icon: "box",
    spark: [40, 36, 52, 46, 60, 72, 66, 80],
  },
  {
    id: "leads",
    label: "Total Leads",
    value: "156",
    delta: "16% last month",
    /* Figma তে এই লেখাটা লাল (#EF4444) কিন্তু তির উপরের দিকে.
       লাল মানে কমে যাওয়া, তাই তিরটা নিচের দিকে দিলাম — নাহলে
       রঙ আর তির দুইটা দুই কথা বলত */
    direction: "down",
    tone: "red",
    icon: "users",
    spark: [70, 64, 68, 55, 58, 46, 50, 38],
  },
  {
    id: "quotes",
    label: "Quote Requests",
    value: "184",
    delta: "12.4% last month",
    tone: "plain",
    icon: "chat",
    spark: [32, 44, 40, 58, 52, 64, 70, 76],
  },
  {
    id: "configs",
    label: "Configurations Saved",
    value: "1,062",
    delta: "8.1% configurator sessions",
    tone: "plain",
    icon: "settings",
    spark: [38, 46, 44, 56, 62, 58, 68, 72],
  },
  {
    id: "fixtures",
    label: "Avg. fixtures / quote",
    value: "38",
    delta: "2.6% units per request",
    tone: "plain",
    icon: "bolt",
    spark: [44, 48, 42, 54, 50, 60, 58, 66],
  },
  {
    id: "rate",
    label: "Quote → Order Rate",
    value: "31.5%",
    delta: "4.2% closed in period",
    tone: "plain",
    icon: "chart",
    spark: [35, 40, 52, 48, 60, 56, 70, 75],
  },
];

export const demandBySeries = [
  { name: "LA1 High Bay", percent: 42 },
  { name: "LS1 High Bay", percent: 33 },
  { name: "RH1 High Bay", percent: 25 },
];

export const recentLeads = [
  {
    id: "l1",
    name: "Marcus L.",
    email: "marcus.l@goldstorage.com",
    company: "Gold Storage",
    interest: "Warehouse Lighting",
    location: "New York, USA",
    time: "2m ago",
    status: "New",
  },
  {
    id: "l2",
    name: "Frank S.",
    email: "frank.s@goldstorage.com",
    company: "Gold Storage",
    interest: "High Bay Lighting",
    location: "Texas, USA",
    time: "15m ago",
    status: "Contacted",
  },
  {
    id: "l3",
    name: "Daniel K.",
    email: "daniel.k@warehouseltd.com",
    company: "Warehouse Ltd.",
    interest: "Industrial Lighting",
    location: "California, USA",
    time: "1h ago",
    status: "Qualified",
  },
  {
    id: "l4",
    name: "Sarah J.",
    email: "sarah.j@logistics.com",
    company: "Logistics Corp.",
    interest: "Facility Upgrade",
    location: "Florida, USA",
    time: "2h ago",
    status: "New",
  },
];

export const recentActivity = [
  {
    id: "a1",
    title: "Hero Section Updated",
    note: "Changed headline and background image",
    time: "2h ago",
    icon: "pencil",
  },
  {
    id: "a2",
    title: "Added New Product RH1 High Bay Series",
    note: "High occupancy lighting solution",
    time: "5h ago",
    icon: "box",
  },
  {
    id: "a3",
    title: "Updated Comparison Table",
    note: "Added new metrics and improved data",
    time: "1d ago",
    icon: "chart",
  },
  {
    id: "a4",
    title: "New Testimonial Added",
    note: "From Marcus Li, Gold Storage",
    time: "2d ago",
    icon: "chat",
  },
];

// sidebar এর পাশের ছোট সংখ্যা
export const counts = {
  leads: 156,
  testimonials: 15,
};