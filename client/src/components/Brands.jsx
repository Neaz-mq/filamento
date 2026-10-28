import { useTranslation } from "react-i18next";
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
   নামগুলো অনুবাদ হয় না — ব্র্যান্ডের নাম সব ভাষাতেই এক */
const BRANDS = [
  { name: "Prologis", src: prologis },
  { name: "Caterpillar", src: caterpillar },
  { name: "Toshiba", src: toshiba },
  { name: "Anheuser-Busch", src: anheuserBusch },
  { name: "Airbus", src: airbus },
  { name: "Bob's Discount Furniture", src: bobs },
];

/* ---------------------------------------------------------------
   Marquee

   ছয়টা লোগোর এক সেট ~1150px — বড় পর্দায় (1920px+) এক সেটে পুরো
   প্রস্থ ভরে না, ফাঁক দেখা যেত. তাই সেটটা SETS বার বসানো হয়:
   ট্র্যাকের প্রথম অর্ধেক আর দ্বিতীয় অর্ধেক হুবহু এক, CSS ঠিক
   অর্ধেক (-50%) সরায় — তাই লুপ জোড়া লাগার জায়গা চোখে পড়ে না.

   SETS জোড় সংখ্যা হতে হবে (অর্ধেক ভাগ করতে).
   --------------------------------------------------------------- */
const SETS = 6;

function Brands() {
  const { t } = useTranslation();

  return (
    /* Figma তে কোনো দৃশ্যমান শিরোনাম নেই, তাই aria-label — screen
       reader ব্যবহারকারী বুঝবেন এই লোগোগুলো কীসের */
    <section className="brands" aria-label={t("brands.label")}>
      <div className="brands-marquee">
        <div className="brands-track">
          {Array.from({ length: SETS }, (_, setIndex) => (
            /* শুধু প্রথম সেট screen reader এর জন্য — বাকিগুলো কপি,
               aria-hidden না দিলে একই লোগো ছয়বার পড়ে শোনাত */
            <ul
              key={setIndex}
              className="brands-list"
              aria-hidden={setIndex === 0 ? undefined : true}
            >
              {BRANDS.map((brand) => (
                <li key={brand.name} className="brands-item">
                  <img
                    src={brand.src}
                    alt={setIndex === 0 ? brand.name : ""}
                    width="128"
                    height="64"
                    /* প্রথম সেট lazy না — marquee সবসময় পর্দায় থাকে */
                    loading={setIndex === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable="false"
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