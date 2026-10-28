/* ===============================================================
   smoothScroll — Lenis এর অবস্থা রাখার জায়গা (src/lib/ এ রাখুন)

   components/SmoothScroll.jsx Lenis বানায় আর এখানে জমা রাখে.
   অন্য ফাইল (যেমন Home) শুধু এখান থেকে নিয়ন্ত্রণ করে — component
   এর ফাইল থেকে নয়, কারণ component ফাইলে অন্য জিনিস export করলে
   dev এ hot-reload পুরো পাতা নতুন করে লোড করে (react-refresh)
   =============================================================== */

let instance = null;
let locked = false;

export const getSmoothScroll = () => instance;

export function setSmoothScroll(lenis) {
  instance = lenis;
  // Lenis তৈরির আগেই "আটকাও" বলা হয়ে থাকলে এখন সেটা প্রযোজ্য
  if (instance && locked) instance.stop();
}

/* Home এর intro (Loader) চলার সময় scroll বন্ধ রাখতে হয়.
   Lenis তৈরির আগে ডাকলেও অবস্থাটা মনে থাকে */
export function lockSmoothScroll(value) {
  locked = value;
  if (!instance) return;
  if (value) instance.stop();
  else instance.start();
}