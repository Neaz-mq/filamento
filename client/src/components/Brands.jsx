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

function Brands() {
  const { t } = useTranslation();

  return (
    /* Figma তে কোনো দৃশ্যমান শিরোনাম নেই, তাই aria-label — screen
       reader ব্যবহারকারী বুঝবেন এই লোগোগুলো কীসের */
    <section className="brands" aria-label={t("brands.label")}>
      <div className="brands-inner">
        <ul className="brands-list">
          {BRANDS.map((brand) => (
            <li key={brand.name} className="brands-item">
              <img
                src={brand.src}
                alt={brand.name}
                width="128"
                height="64"
                loading="lazy"
                decoding="async"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Brands;
