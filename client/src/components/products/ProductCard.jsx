import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CategoryArt from "./CategoryArt";
import { categoryOf, imageSrcSet, sizedImage, splitName } from "../../pages/productCatalog";
import "./ProductCard.css";

/* ===============================================================
   Product এর ছবি আর card — Products পাতার grid, Related products
   আর Compare এর টেবিল, তিন জায়গাতেই একই জিনিস

   Figma (Frame 313): 400 x 358, padding 24, radius 20,
   background rgba(235,235,236,.25) — মাউস দিলে .75 (Frame 309).
   ছবি 352 x 288, নিচে নাম Space Grotesk 700 20px, মাঝখানে
   =============================================================== */

/* ছবি — না থাকলে বা নামতে ব্যর্থ হলে category র আঁকা ছবি, যাতে
   card কখনো ফাঁকা বা ভাঙা না দেখায় */
export function ProductImage({
  product,
  widths = [400, 704, 1056],
  sizes = "(max-width: 640px) 50vw, 352px",
  eager = false,
  className = "",
}) {
  const [broken, setBroken] = useState(false);
  const url = product?.image ?? "";

  if (!url || broken) {
    return (
      <span className={`product-image product-image--art ${className}`}>
        <CategoryArt name={categoryOf(product?.category).art ?? "box"} size={96} />
      </span>
    );
  }

  return (
    <img
      className={`product-image ${className}`}
      src={sizedImage(url, widths[1] ?? widths[0])}
      srcSet={imageSrcSet(url, widths)}
      sizes={sizes}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

/* Featured ব্যাজ — admin এ Featured চালু থাকলে card এর উপরের বাঁ কোণে.
   লেখা "Sort by: Featured" এর অনুবাদই (en / ja / zh-Hant তিনটাতেই আছে) */
function FeaturedBadge() {
  const { t } = useTranslation();
  return (
    <span className="product-card-badge">
      <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9L12 2.5Z"
        />
      </svg>
      {t("productsPage.sort.featured")}
    </span>
  );
}

function ProductCard({ product, to, eager = false, headingLevel = 3 }) {
  const { title } = splitName(product.name);
  const Heading = `h${headingLevel}`;

  return (
    <Link to={to} className="product-card">
      {product.featured === true && <FeaturedBadge />}
      <span className="product-card-media">
        <ProductImage product={product} eager={eager} />
      </span>
      <Heading className="product-card-name">{title}</Heading>
    </Link>
  );
}

export default ProductCard;