import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import { getSmoothScroll, setSmoothScroll } from "../lib/smoothScroll";
import "./SmoothScroll.css";

/* ===============================================================
   SmoothScroll — পুরো public সাইটে মসৃণ (inertia) scroll

   Lenis দিয়ে: mouse wheel / trackpad ঘোরালে পাতা সঙ্গে সঙ্গে
   থেমে যায় না, একটু গড়িয়ে তারপর থামে.

   কোথায় বসে: LocaleLayout এ — তাই সব public পাতায় (Home, Products,
   Projects, /home …) চলে. Admin panel আলাদা route, LocaleLayout এর
   বাইরে — তাই admin এ এটা চলে না (ওখানে table, modal, ভেতরের
   scroll অনেক, সাধারণ scroll ই ভালো).

   যা ইচ্ছে করে বদলানো হয়নি:
     • ফোন/ট্যাবলেটের আঙুল-টানা scroll — native থাকে. ওটা আগে থেকেই
       মসৃণ, আর নিজের momentum আছে (syncTouch বন্ধ)
     • keyboard (Space, তীর, PageDown) — native
     • "animation কমান" চালু থাকলে Lenis নিজেই সাধারণ scroll এ ফেরে
   =============================================================== */

/* কতটা "ভাসবে" — ছোট হলে বেশি মসৃণ আর ধীর, বড় হলে ঝটপট.
   0.07 = অনেক ভাসমান, 0.1 = ভারসাম্য, 0.15 = প্রায় সাধারণ */
const SMOOTHNESS = 0.1;

/* wheel ঘোরালে কতটা এগোয় — 1 = ব্রাউজারের মতোই.
   বাড়ালে একই ঘোরায় বেশি নামে */
const WHEEL_SPEED = 1;

/* মোবাইল menu বা filter drawer খুললে সেই কোড body তে
   overflow: hidden বসায় (Navbar, NhHeader, Products) — তখন পেছনের
   পাতা নড়া চলবে না. Lenis নিজে এটা জানে না, তাই এখানে বলে দেওয়া:
   true ফেরালে ওই event Lenis ধরে না, ব্রাউজারের হাতে ছেড়ে দেয় */
const browserShouldHandle = () => document.body.style.overflow === "hidden";

/* ---------------------------------------------------------------
   পাতার ভেতরের #link (যেমন #contact) — মসৃণভাবে গড়িয়ে যায়

   ব্রাউজারের নিজের লাফ বন্ধ করে (preventDefault) Lenis কে দিয়ে
   গড়ানো হয়. html এর scroll-padding-top (navbar এর জায়গা) Lenis
   নিজে হিসাবে ধরে.

   URL এ #contact বসানো হয় replaceState দিয়ে, নতুন history entry
   না বানিয়ে — React Router এর নিজের history এর হিসাব যেন না ভাঙে
   --------------------------------------------------------------- */
function handleAnchorClick(event) {
  const instance = getSmoothScroll();

  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !instance
  ) {
    return;
  }

  const link = event.target.closest?.("a[href]");
  if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

  const url = new URL(link.href, window.location.href);
  const samePage =
    url.origin === window.location.origin &&
    url.pathname === window.location.pathname &&
    url.hash.length > 1;
  if (!samePage) return;

  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!target) return; // section নেই — ব্রাউজারের স্বাভাবিক আচরণই থাকুক

  event.preventDefault();
  instance.scrollTo(target);
  window.history.replaceState(window.history.state, "", url.hash);
}

function SmoothScroll() {
  const { key } = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: SMOOTHNESS,
      wheelMultiplier: WHEEL_SPEED,
      smoothWheel: true,
      syncTouch: false,

      /* ভেতরের scroll করা অংশ (dropdown, মোবাইল menu, album) —
         ওদের মাথায় wheel ঘোরালে ওই অংশটাই নড়ে, পুরো পাতা নয়.
         শেষ প্রান্তে পৌঁছালে পাতা নিজে থেকে নামতে শুরু করে */
      allowNestedScroll: true,
      prevent: browserShouldHandle,

      // অন্য পাতার link এ ক্লিক করার মুহূর্তে চলতি গড়ানো থামায় —
      // নাহলে নতুন পাতা খুলে আবার পুরনো জায়গায় ফিরে যেত
      stopInertiaOnNavigate: true,
    });

    // জমা রাখা + (আগে থেকে "আটকাও" বলা থাকলে) এখনই থামানো
    setSmoothScroll(lenis);

    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
      if (getSmoothScroll() === lenis) setSmoothScroll(null);
    };
  }, []);

  /* পাতা বদলালে React Router এর ScrollRestoration scroll বসায়
     (নতুন পাতা উপর থেকে, back চাপলে আগের জায়গায়). Lenis কে বলে
     দেওয়া দরকার "আসল জায়গা এখন এটা", নাহলে সে নিজের পুরনো হিসাবে
     আবার টেনে নিয়ে যেত.

     effect টা ScrollRestoration এর পরে চলে (ওটা layout effect) */
  useEffect(() => {
    getSmoothScroll()?.reset();
  }, [key]);

  return null;
}

export default SmoothScroll;