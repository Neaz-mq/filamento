import { useTranslation } from "react-i18next";
import { cloudinaryUrl, useHomeContent } from "../lib/homeContent";
import "./Brands.css";

/* ফাইলের নামে ফাঁকা জায়গা আছে ("Prologis_Logo 1.svg") — Figma থেকে
   download করলে এভাবেই আসে। Vite এটা সামলাতে পারে, তাই যেমন আছে
   তেমনই রাখা হয়েছে।

   পরিষ্কার রাখতে চাইলে ফাইলগুলোর নাম বদলে (যেমন prologis.svg) নিচের
   import গুলোও মিলিয়ে দেবেন — দুইটা একসাথে বদলাতে হবে */
import prologis from "../assets/logo/Prologis_Logo 1.svg";
import caterpillar from "../assets/logo/Caterpillar_Logo-1 1.svg";
import toshiba from "../assets/logo/Toshiba_Logo-1 1.svg";
import anheuserBusch from "../assets/logo/Anheuser_Busch_Logo-1 1.svg";
import airbus from "../assets/logo/Airbus_Logo-1 1.svg";
import bobs from "../assets/logo/Bobs_Logo-1 1.svg";

/* ক্রমটা Figma র Frame 204 অনুযায়ী (order 0..5).
   নামগুলো অনুবাদ হয় না — ব্র্যান্ডের নাম সব ভাষাতেই এক.

   এটা fallback — admin এর Home Page Content → Hero → Client Logos
   থেকে লোগো এলে সেগুলোই দেখায় (database). server না পেলে বা কিছু
   save না হলে এই ছয়টা */
const FALLBACK_BRANDS = [
  { id: "prologis", name: "Prologis", src: prologis },
  { id: "caterpillar", name: "Caterpillar", src: caterpillar },
  { id: "toshiba", name: "Toshiba", src: toshiba },
  { id: "anheuser-busch", name: "Anheuser-Busch", src: anheuserBusch },
  { id: "airbus", name: "Airbus", src: airbus },
  { id: "bobs", name: "Bob's Discount Furniture", src: bobs },
];

/* SVG যেমন আছে তেমন. Cloudinary র অন্য ছবি ছোট করে আর ভালো format এ */
const logoSrc = (url) =>
  /\.svg(\?|$)/i.test(url) ? url : cloudinaryUrl(url, "c_limit,w_320,f_auto,q_auto");

/* ---------------------------------------------------------------
   Marquee

   ছয়টা লোগোর এক সেট ~1150px — বড় পর্দায় (1920px+) এক সেটে পুরো
   প্রস্থ ভরে না, ফাঁক দেখা যেত. তাই সেটটা কয়েকবার বসানো হয়:
   ট্র্যাকের প্রথম অর্ধেক আর দ্বিতীয় অর্ধেক হুবহু এক, CSS ঠিক
   অর্ধেক (-50%) সরায় — তাই লুপ জোড়া লাগার জায়গা চোখে পড়ে না.

   লোগোর সংখ্যা admin এ বদলায়, তাই সেট কয়টা হবে সেটা হিসাব করে:
   প্রতি অর্ধেকে অন্তত ১৮টা লোগো (ছয়টা লোগোর ৩ সেট — আগের মতোই).
   সেট সবসময় জোড় সংখ্যা (অর্ধেক ভাগ করতে).

   গতি লোগো-প্রতি এক থাকে: ছয়টা লোগোয় হুবহু আগের মতো, কম বা
   বেশি হলে সময় আনুপাতিক বদলায়
   --------------------------------------------------------------- */
const LOGOS_PER_HALF = 18;

function Brands() {
  const { t } = useTranslation();

  /* settled: database এর উত্তর এসেছে (বা ১.৫ সেকেন্ড পেরিয়েছে).
     তার আগে লুকানো — নাহলে পুরনো লোগো দেখিয়ে পরে বদলাত.
     লুকানো অবস্থাতেও জায়গা নেয়, তাই পাতা লাফায় না */
  const { content, settled } = useHomeContent();

  const saved = content?.hero?.logos;
  const brands = Array.isArray(saved)
    ? saved
        .filter((logo) => logo?.image?.url)
        .map((logo) => ({
          id: String(logo.id),
          name: logo.name ?? "",
          src: logoSrc(logo.image.url),
        }))
    : FALLBACK_BRANDS;

  // admin সব লোগো মুছে দিলে পুরো অংশটাই নেই
  if (brands.length === 0) return null;

  const half = Math.ceil(LOGOS_PER_HALF / brands.length);
  const sets = half * 2;
  const speed = (half * brands.length) / LOGOS_PER_HALF;

  return (
    /* Figma তে কোনো দৃশ্যমান শিরোনাম নেই, তাই aria-label — screen
       reader ব্যবহারকারী বুঝবেন এই লোগোগুলো কীসের */
    <section
      className="brands"
      aria-label={t("brands.label")}
      style={settled ? undefined : { visibility: "hidden" }}
    >
      <div className="brands-marquee">
        <div
          className="brands-track"
          /* var(--brands-duration) আসে CSS থেকে (পর্দা অনুযায়ী আলাদা),
             তাই inline এ সেটাকেই গুণ করা — ছয়টা লোগোয় গুণক 1 */
          style={
            speed === 1
              ? undefined
              : { animationDuration: `calc(var(--brands-duration) * ${speed})` }
          }
        >
          {Array.from({ length: sets }, (_, setIndex) => (
            /* শুধু প্রথম সেট screen reader এর জন্য — বাকিগুলো কপি,
               aria-hidden না দিলে একই লোগো ছয়বার পড়ে শোনাত */
            <ul
              key={setIndex}
              className="brands-list"
              aria-hidden={setIndex === 0 ? undefined : true}
            >
              {brands.map((brand) => (
                <li key={brand.id} className="brands-item">
                  <img
                    src={brand.src}
                    alt={setIndex === 0 ? brand.name : ""}
                    width="128"
                    height="64"
                    /* প্রথম সেট lazy না — marquee সবসময় পর্দায় থাকে */
                    loading={setIndex === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable="false"
                    // ভাঙা link হলে alt লেখা না দেখিয়ে লোগোটাই লুকানো
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Brands;