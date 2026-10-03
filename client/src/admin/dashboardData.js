/* ===============================================================
   Home Page Content এর পাঁচটা ধাপ — এক জায়গায়

   আগে এখানে landing page এর সাতটা অংশের আলাদা তালিকা ছিল (sidebar
   এ Home খুললে নিচে নামত). Figma তে এখন একটাই পাতা — "Home Page
   Content" — উপরে পাঁচটা ট্যাব. তাই তালিকাটাও পাঁচটা:

     slug — ঠিকানার শেষ অংশ (/admin/home/featured-products)
     step — server এর নাম (PUT /api/site-content/admin/home/featured)
     name — ট্যাবের লেখা
     note — উপরের search এ খোঁজার জন্য (কী কী আছে এই ধাপে)

   sidebar এর Home, উপরের search আর Home Page Content পাতা — তিন
   জায়গাতেই এটা ব্যবহার হয়.

   ✅ server/lib/homeContentSchema.js এর HOME_STEPS এর সাথে মিল রাখবেন
   =============================================================== */
export const homeSections = [
  {
    slug: "hero",
    step: "hero",
    name: "Hero",
    note: "Hero image, headline, key features, featured product cards and client logos",
  },
  {
    slug: "featured-products",
    step: "featured",
    name: "Featured Products",
    note: "Three fixtures section — LA1, LS1, RH1 and the featured points",
  },
  {
    slug: "comparison",
    step: "comparison",
    name: "Comparison",
    note: "Traditional LED vs Filamento comparison table",
  },
  {
    slug: "videos",
    step: "videos",
    name: "Videos",
    note: "Technology videos — thermal, optical and driver",
  },
  {
    slug: "testimonials",
    step: "testimonials",
    name: "Testimonials",
    note: "Client reviews, ratings and project links",
  },
];

/* পুরনো ঠিকানা (আগের sidebar এর সাত অংশ) → নতুন ট্যাব.
   কারো bookmark বা পুরনো link থাকলেও ঠিক জায়গায় পৌঁছায় */
export const OLD_HOME_SLUGS = {
  brands: "hero",
  fixtures: "featured-products",
  technologies: "videos",
  contact: "hero",
};
