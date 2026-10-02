import { useState } from "react";
import { Link } from "react-router-dom";
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

function ProductCard({ product, to, eager = false, headingLevel = 3 }) {
  const { title } = splitName(product.name);
  const Heading = `h${headingLevel}`;

  return (
    <Link to={to} className="product-card">
      <span className="product-card-media">
        <ProductImage product={product} eager={eager} />
      </span>
      <Heading className="product-card-name">{title}</Heading>
    </Link>
  );
}

export default ProductCard;
