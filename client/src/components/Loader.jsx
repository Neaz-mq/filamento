import { useEffect, useRef, useState } from "react";
import logoDark from "../assets/logo/logo-dark.png";
import logoAccent from "../assets/logo/logo-accent.png";
import "./Loader.css";

const STAGE = {
  DARK: "dark",
  COLOR: "color",
  ROTATE: "rotate",
  BEAM: "beam",
  FILL: "fill",
  EXIT: "exit",
};

// fill-bar এর base মাপ — accent bar এর সাথে হুবহু মেলানো
const BAR_W = 72;
const BAR_H = 14;

function Loader({ onRevealContent, onComplete }) {
  const [stage, setStage] = useState(STAGE.DARK);

  /* scale factor CSS এ হিসাব করা যায় না — scaleX() unitless সংখ্যা চায়,
     calc(100vw / 72) একটা length দেয়, সংখ্যা নয়। তাই mount এ একবার
     মেপে CSS variable হিসেবে পাঠাচ্ছি। +40px overshoot কারণ bar এর
     center screen center থেকে ~6px সরে আছে */
  const [fillScale] = useState(() => ({
    "--fill-x": String((window.innerWidth + 40) / BAR_W),
    "--fill-y": String((window.innerHeight + 40) / BAR_H),
  }));

  // callback গুলো ref-এ রাখছি যাতে parent re-render হলেও effect restart না হয়
  const callbacksRef = useRef({ onRevealContent, onComplete });
  useEffect(() => {
    callbacksRef.current = { onRevealContent, onComplete };
  }, [onRevealContent, onComplete]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      callbacksRef.current.onRevealContent?.();
      callbacksRef.current.onComplete?.();
      return;
    }

    /* intro চলার সময় পাতা scroll হয় না — কিন্তু scrollbar লুকানো হয় না.

       আগে body তে overflow: hidden দেওয়া হতো. তাতে scrollbar চলে যেত,
       পাতা ~15px চওড়া হতো, আর intro শেষে scrollbar ফিরলে আবার সরু হতো.
       body তে padding দিয়ে ঢাকার চেষ্টা ছিল, কিন্তু fixed জিনিস (যেমন
       নতুন Home এর header) padding মানে না — তাই শেষে পুরো পাতা একটু
       পাশে সরে যাওয়ার মতো লাগত, scrollbar ও হঠাৎ হাজির হতো.

       এখন scrollbar সারাক্ষণ থাকে, পাতার প্রস্থ একবারও বদলায় না.
       scroll আটকানো হয় যেভাবে scroll হয় সেগুলো থামিয়ে: mouse wheel,
       আঙুলে টানা, আর keyboard এর Space / PageUp / PageDown / তীর /
       Home / End. (passive: false — নাহলে ব্রাউজার preventDefault মানে না) */
    const SCROLL_KEYS = new Set([
      " ",
      "PageUp",
      "PageDown",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ]);

    const blockScroll = (event) => event.preventDefault();
    const blockKeys = (event) => {
      if (SCROLL_KEYS.has(event.key)) event.preventDefault();
    };

    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });
    window.addEventListener("keydown", blockKeys);

    const unlockScroll = () => {
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
      window.removeEventListener("keydown", blockKeys);
    };

    const timers = [
      // 0-600     mark-in (scale + fade), তারপর 200ms dark logo hold
      // 800       accent fade-in (350ms) → 1150 এ full logo
      setTimeout(() => setStage(STAGE.COLOR), 800),

      // 1150-1250 full logo hold — এটাই brand moment
      // 1250      circle fade-out (350ms) + accent rotate (550ms) একসাথে।
      //           circle 1600 এ গায়েব, rotate শেষ 1800 এ
      setTimeout(() => setStage(STAGE.ROTATE), 1250),

      // 1880      শুধু আড়াআড়ি ছড়ায় (450ms) — 14px পুরু আলোর রেখা
      setTimeout(() => setStage(STAGE.BEAM), 1880),

      // 2300      রেখাটা উপর-নিচে খোলে (600ms) → 2900 এ পুরো screen হলুদ।
      //           50ms overlap রাখা হয়েছে, নাহলে দুইটা ধাপ আলাদা লাগত
      setTimeout(() => setStage(STAGE.FILL), 2300),

      // 3050      150ms hold এর পর curtain slide up (900ms)
      setTimeout(() => {
        callbacksRef.current.onRevealContent?.();
        setStage(STAGE.EXIT);
      }, 3050),

      // 4050      slide শেষ (3950) + 100ms buffer
      setTimeout(() => {
        unlockScroll();
        callbacksRef.current.onComplete?.();
      }, 4050),
    ];

    return () => {
      timers.forEach(clearTimeout);
      unlockScroll();
    };
  }, []);

  return (
    <div
      className={`loader loader--${stage}`}
      style={fillScale}
      aria-hidden="true"
    >
      <div className="loader-mark">
        <img src={logoDark} alt="" className="loader-logo-img" />
        <img src={logoAccent} alt="" className="loader-accent" />

        {/* এক transform property দিয়ে scaleX আর scaleY কে আলাদা timing
            দেওয়া যায় না — তাই দুইটা layer. বাইরেরটা X, ভেতরেরটা Y */}
        <div className="loader-fill-bar">
          <div className="loader-fill-inner" />
        </div>
      </div>
    </div>
  );
}

export default Loader;