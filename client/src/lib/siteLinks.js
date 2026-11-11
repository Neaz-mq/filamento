/* ===============================================================
   siteLinks — card আর CTA র link গুলোর মাস্টার সুইচ (src/lib/ এ রাখুন)

   false — আগে: SoftLink এর link গুলো "#" (কোথাও যায় না, পাতাও
           লাফায় না). যে পাতাগুলো এখনো তৈরি হয়নি তাদের জন্য.

   true  — এখন: আসল route এ যায় (/products/…, /projects/… ইত্যাদি).
           পাতা তৈরি হলে শুধু এই এক জায়গায় true করলেই সব জায়গায়
           আগের মতো চালু হয়ে যাবে
   =============================================================== */
export const LINKS_LIVE = true;

/* ===============================================================
   HOME2_PRODUCT_LINKS_LIVE — শুধু দ্বিতীয় সংস্করণের (/home/*) product link

   false — এখন: /home, /home/products এর product card আর header এর
           Products dropdown এর product link গুলো "#" (কোথাও যায় না).
           মূল সাইটের (/products) product link অক্ষত, আগের মতোই যায়.

   true  — মূল সাইটের product পাতায় (/products/:slug) যাবে

   LINKS_LIVE এর সাথে আলাদা রাখা হয়েছে, কারণ LINKS_LIVE বদলালে
   মূল সাইটের সব SoftLink বদলে যেত
   =============================================================== */
export const HOME2_PRODUCT_LINKS_LIVE = false;

/* ===============================================================
   HOME2_PROJECT_LINKS_LIVE — শুধু দ্বিতীয় সংস্করণের (/home/projects)
   project card এর link

   false — এখন: card গুলো "#" (কোথাও যায় না). মূল সাইটের
           (/projects) card অক্ষত, আগের মতোই project এর পাতায় যায়
   true  — মূল সাইটের project পাতায় (/projects/:slug) যাবে
   =============================================================== */
export const HOME2_PROJECT_LINKS_LIVE = false;