/* ===============================================================
   /home/application এর তালিকা — সব তথ্য এখানেই (static)

   Backend এ Application এর কোনো form/API নেই, তাই কিছুই সার্ভার থেকে
   আসে না. নতুন Application যোগ করতে এই তালিকায় একটা সারি দিন আর
   তিনটা locale ফাইলে (home2.applicationPage.list.items.<id>) নাম
   আর শিরোনাম লিখুন — ব্যস, chip, filter আর পাতা নিজে থেকেই ঠিক হবে.

   id    — locale key আর chip এর পরিচয় (ছোট হাতের, - ছাড়া)
   image — Cloudinary র path (data.js এর cloud() এর পরের অংশ)
   power — card এর ছোট লেখায় ("100-200W Version")
   env   — কোন কোন environment এ পড়ে (ENVIRONMENTS এর id)
   query — card চাপলে Products পাতায় কোন শব্দে খোঁজা হবে (না থাকলে
           শুধু Products পাতা খোলে)

   ⚠️ env আর power এখন আন্দাজে বসানো (Figma তে নেই) — আসল তথ্য পেলে
   বদলে নেবেন
   =============================================================== */

export const PAGE_SIZE = 9;

// "All environments" মেনুর তালিকা — লেখা locale এ home2.applicationPage.list.env.<id>
export const ENVIRONMENTS = [
  "warehouse",
  "retail",
  "outdoor",
  "office",
  "manufacturing",
  "sports",
];

export const APPLICATIONS = [
  {
    id: "la1",
    image: "v1794380250/LA1New-Photoroom_1_mqlvhv.png",
    power: "100-200W",
    env: ["warehouse"],
    query: "LA1",
  },
  {
    id: "rh1",
    image: "v1794380211/Recessed-1-Photoroom_1_r8po3c.png",
    power: "100-200W",
    env: ["warehouse", "retail"],
    query: "RH1",
  },
  {
    id: "teardrop",
    image: "v1794380285/image_9_xpspbr.png",
    power: "100-200W",
    env: ["warehouse", "manufacturing"],
  },
  {
    id: "darksky",
    image: "v1794380341/4_eg2ngy.png",
    power: "100-200W",
    env: ["outdoor"],
  },
  {
    id: "recessed",
    image: "v1794380378/5_dmzm2g.png",
    power: "100-200W",
    env: ["office", "retail"],
  },
  {
    id: "retail",
    image: "v1794380428/6_jlq2po.png",
    power: "100-200W",
    env: ["retail"],
  },
  {
    id: "ballast",
    image: "v1794380468/7_q6fkjn.png",
    power: "100-200W",
    env: ["manufacturing", "warehouse"],
  },
  {
    id: "sports",
    image: "v1794380510/8_lgvpta.png",
    power: "100-200W",
    env: ["sports"],
  },
  {
    id: "manufacturing",
    image: "v1794380558/9_bsfbpu.png",
    power: "100-200W",
    env: ["manufacturing"],
  },
];