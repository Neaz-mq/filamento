import { Link } from "react-router-dom";
import { LINKS_LIVE } from "../lib/siteLinks";

/* ---------------------------------------------------------------
   SoftLink — <Link> এর বদলি, যার "চালু/বন্ধ" এক জায়গা থেকে ঠিক হয়

   LINKS_LIVE true  → সাধারণ <Link to={to}>
   LINKS_LIVE false → <a href="#"> — ক্লিক করলে কিছুই হয় না

   শুধু "#" দিলে ব্রাউজার পাতার মাথায় লাফিয়ে যেত, আর React Router এর
   <Link to="#"> দিলে ScrollRestoration পাতা উপরে তুলে দিত — তাই
   preventDefault দিয়ে ক্লিকটাই থামানো হয়.

   বাকি সব prop (className, tabIndex, aria-*, draggable …) যেমন আছে
   তেমন যায়, তাই আগের <Link> এর জায়গায় সরাসরি বসানো যায়
   --------------------------------------------------------------- */
function SoftLink({ to, children, onClick, ...rest }) {
  if (LINKS_LIVE) {
    return (
      <Link to={to} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  const handleClick = (event) => {
    event.preventDefault();
    onClick?.(event);
  };

  return (
    <a href="#" onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export default SoftLink;