/* ===============================================================
   Home পাতার অংশগুলোর তালিকা

   আগে এখানে Dashboard এর সব নমুনা সংখ্যাও ছিল (card, lead,
   activity, মেনুর 156/15). এখন Dashboard এর সব সংখ্যা server থেকে
   আসে — GET /api/admin/overview (server/routes/overviewRoutes.js).
   তাই এখানে শুধু Home পাতার অংশগুলো থাকল
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
