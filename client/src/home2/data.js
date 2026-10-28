/* ===============================================================
   নতুন Home পাতার সব ছবি আর তালিকা — এক জায়গায়

   লেখা (text) এখানে নেই — সেগুলো locales/*.json এর "home2" অংশে,
   আর যেগুলো মূল landing page এর সাথে হুবহু এক (product এর নাম,
   technology, testimonial) সেগুলো মূল পাতার key থেকেই আসে.

   ⚠️ product, video আর testimonial এর তালিকা মূল পাতার
   Fixtures.jsx / Technologies.jsx / Testimonial.jsx এর সাথে মিলিয়ে
   লেখা. একটায় বদলালে অন্যটাতেও বদলাবেন — boss একটা বেছে নিলে
   অন্য পাতাটা মুছে দিলেই এই দুই জায়গার ঝামেলা শেষ
   =============================================================== */

// Testimonial card এর company logo — Hero এর marquee র একই ফাইল
import prologis from "../assets/logo/Prologis_Logo 1.svg";
import caterpillar from "../assets/logo/Caterpillar_Logo-1 1.svg";
import toshiba from "../assets/logo/Toshiba_Logo-1 1.svg";
import airbus from "../assets/logo/Airbus_Logo-1 1.svg";

const CLOUD = "https://res.cloudinary.com/dzi3u164c/image/upload/";

/* Cloudinary র ছবি — নির্দিষ্ট প্রস্থে, ব্রাউজার অনুযায়ী সেরা format এ.
   c_limit — কখনো বড় করে না, উৎসে যা আছে তার বেশি পাঠায় না */
export const cloud = (path, width, { trim = false } = {}) =>
  `${CLOUD}${trim ? "e_trim/" : ""}c_limit,w_${width},f_auto,q_auto/${path}`;

export const srcSet = (path, widths, options) =>
  widths.map((w) => `${cloud(path, w, options)} ${w}w`).join(", ");

/* ---------- বড় ছবিগুলো (Figma থেকে) ---------- */
export const IMAGES = {
  hero: "v1790744022/be5360cb5806dd39ba58c23000d7201a66b3447a_cuoioe.jpg",
  about: "v1790744118/64cb7316e357341446fb8640616b46d07cb742bd_qmwab6.jpg",
  choose: "v1790744695/aead608161404e4f651003717b88dd4cf0334878_ivsuxa.png",
  contact: "v1790744799/5a8af14873ef598ccc72026799a5bacff82681c2_eps9ww.jpg",
};

/* ---------- Hero র ডান-নিচের card এর স্তূপ ----------
   মূল পাতার hero card এর ছবি আর লেখাই (hero.cards.* key) */
export const HERO_CARDS = [
  { id: "build-fixture", image: "v1789461131/card2_dxyfhj.webp" },
  { id: "high-bay", image: "v1789539354/image_7_ep6gnv.png" },
  { id: "optional-parts", image: "v1789461212/card3_rcubwu.webp" },
];

/* ---------- Fixtures ---------- */
export const FIXTURES = [
  { id: "la1", path: "v1789621178/image_7_wqtldv.png" },
  { id: "ls1", path: "v1789621338/Additional_0001_1779697023_1_taubuk.png" },
  // চারপাশে অনেক ফাঁকা — e_trim কেটে দেয়, নাহলে লাইট ছোট দেখায়
  { id: "rh1", path: "v1789471643/fix3_yeppeq.webp", trim: true },
];

/* ---------- Technology ----------
   video, cover আর baseViews মূল Technologies.jsx এর সাথে হুবহু এক —
   দুই পাতায় একই view সংখ্যা দেখায়.

   ⚠️ video গুলো এখনো পুরনো WordPress সাইট থেকে আসে
   (filamento.com/wp-content). নতুন সাইট ওই domain এ বসার আগে
   Cloudinary তে তুলে এখানে আর Technologies.jsx এ link বদলাতে হবে */
export const TECH = [
  {
    id: "thermal",
    cover: "v1789621338/Additional_0001_1779697023_1_taubuk.png",
    fit: "product",
    video:
      "https://www.filamento.com/wp-content/uploads/2026/07/RH1_Animation_Final_02_compressed.mp4",
    baseViews: 544,
  },
  {
    id: "optical",
    cover: "v1789628672/8f7e17c86d7e55308fb2c4aa5e59b763e23cc115_zcjucz.png",
    fit: "photo",
    video:
      "https://www.filamento.com/wp-content/uploads/2026/06/10467854031752108853_compressed.mp4",
    baseViews: 1200,
  },
  {
    id: "driver",
    cover: "v1789471643/fix3_yeppeq.webp",
    trim: true,
    fit: "product",
    video:
      "https://www.filamento.com/wp-content/plugins/Tot/upload/resources/VIDEOS/INSV_ACC-005-PT1-000-FL_230907.mp4",
    baseViews: 768,
  },
];

// Figma তে মাঝেরটা (Superior Optical Distribution) সামনে
export const TECH_START = 1;

/* ---------- Why Choose Us ----------
   লেখা মূল পাতার fixtures.benefits.* থেকে — Figma র লেখা হুবহু ওটাই */
export const BENEFITS = ["maintenance", "visibility", "installation", "roi"];

/* ---------- Testimonials ----------
   quote/নাম placeholder, ছবিও সবার একটা — কিন্তু প্রতিটা card এ আলাদা
   company logo (Figma তে খোলা card এর ডানে Prologis এর জায়গায়).

   logo.shift — প্রতিটা logo ফাইলের ভেতরে ডানে আলাদা পরিমাণ ফাঁকা জায়গা
   আছে (Prologis ৪.৩px, Caterpillar ২০.৫px ...). সেটা সমান করতে
   প্রতিটাকে ডানে এই px সরানো হয়, যাতে সব logo এর ডান ধার Figma র
   Prologis এর মতো একই লাইনে বসে. নতুন logo বসালে মান বের করার সূত্র:
   (ডানের ফাঁকা px, 92px প্রস্থে) − 4.3

   ⚠️ এগুলো এখনো বানানো quote — আসল testimonial এলে সেই কোম্পানির
   logo আর shift বসাবেন */
const AVATAR =
  "v1789637818/a73e9b59e7a15dc477a605d52bd4add7b91a67a9_pewd5s.jpg";

export const TESTIMONIALS = [
  {
    id: "marcus",
    avatar: AVATAR,
    logo: { name: "Caterpillar", src: caterpillar, shift: 16.2 },
  },
  {
    id: "frank",
    avatar: AVATAR,
    logo: { name: "Prologis", src: prologis, shift: 0 },
  },
  {
    id: "david",
    avatar: AVATAR,
    logo: { name: "Toshiba", src: toshiba, shift: 3.5 },
  },
  {
    id: "elena",
    avatar: AVATAR,
    logo: { name: "Airbus", src: airbus, shift: 5.2 },
  },
];

/* ---------- Contact form এর dropdown ----------
   ⚠️ server/routes/quoteRequestRoutes.js এর তালিকার সাথে মিলতে হবে */
export const FACILITY_TYPES = [
  "warehouse",
  "manufacturing",
  "gymnasium",
  "retail",
  "office",
  "parking",
  "other",
];

export const PROJECT_SIZES = ["under50", "from50to250", "from250to1000", "over1000"];

/* ---------- যোগাযোগ — অনুবাদ হয় না ---------- */
export const EMAIL = "Sales@Filamento.com";
export const PHONE_DISPLAY = "+1 (408) 475 - 0038";
export const PHONE_LINK = "+14084750038";
export const LOCATION = "Ella, Silicon Valley, USA";

/* ---------- Footer এর social ----------
   মূল Footer.jsx এর মতো: Instagram আর X এর link এখনো নেই */
export const SOCIAL = [
  { id: "facebook", name: "Facebook", href: "https://www.facebook.com/FilamentoLED/" },
  { id: "x", name: "X", href: null },
  { id: "instagram", name: "Instagram", href: null },
  { id: "linkedin", name: "LinkedIn", href: "https://www.linkedin.com/company/filamento.lighting/" },
];