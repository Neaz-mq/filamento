import { useEffect, useState } from "react";
import logoDark from "../assets/logo/logo-dark.png";
import logoRings from "../assets/logo/logo-rings.png";
import logoAccent from "../assets/logo/logo-accent.png";
import "./Loader.css";

// ধাপগুলো (ঠিক এই order এ, ইউজারের চাওয়া অনুযায়ী):
// ১. DARK   -> শুধু dark logo দেখা যায়
// ২. COLOR  -> yellow accent (তীর্যক bar) logo এর ভেতরেই ফুটে ওঠে
// ৩. BAR    -> শুধু dark rings/chevron অংশটা fade out হয়ে যায়, yellow bar
//              ঠিক আগের জায়গাতেই (তীর্যক অবস্থায়) থেকে যায়
// ৪. ROTATE -> সেই yellow bar ঘুরে horizontal হয়ে যায়
// ৫. FILL   -> horizontal bar টা বড় হতে হতে পুরো স্ক্রিন ভরে ফেলে
// ৬. FADE   -> home page content দেখা যায়, loader মিলিয়ে যায়
const STAGE = {
  DARK: "dark",
  COLOR: "color",
  BAR: "bar",
  ROTATE: "rotate",
  FILL: "fill",
  FADE: "fade",
};

function Loader({ onRevealContent, onComplete }) {
  const [stage, setStage] = useState(STAGE.DARK);
  const [fillScale, setFillScale] = useState(24);

  useEffect(() => {
    // viewport যত বড়, yellow bar টাকেও ঠিক ততটাই বড় হতে হবে যাতে
    // পুরো স্ক্রিন কোনো ফাঁকা জায়গা ছাড়াই ঢেকে যায়
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    const diagonal = Math.sqrt(vw * vw + vh * vh);
    setFillScale(Math.max(20, (diagonal * 2.4) / 90));
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      onRevealContent?.();
      onComplete?.();
      return;
    }

    document.body.style.overflow = "hidden";

    const timers = [
      // dark logo হোল্ড শেষে yellow accent ফুটে ওঠা শুরু
      setTimeout(() => setStage(STAGE.COLOR), 800),

      // accent সম্পূর্ণ ফুটে ওঠার পরে (+সামান্য hold) শুধু dark rings fade out
      setTimeout(() => setStage(STAGE.BAR), 1500),

      // dark rings পুরোপুরি অদৃশ্য হয়ে যাওয়ার পরেই bar horizontal হওয়া শুরু করবে
      setTimeout(() => setStage(STAGE.ROTATE), 1950),

      // horizontal হওয়া শেষ হওয়ার পরেই grow শুরু
      setTimeout(() => setStage(STAGE.FILL), 2500),

      // পুরো স্ক্রিন yellow দিয়ে ভরে যাওয়ার পরেই content reveal + fade
      setTimeout(() => {
        onRevealContent?.();
        setStage(STAGE.FADE);
      }, 3300),

      // overlay fade শেষ হওয়ার পরেই loader remove
      setTimeout(() => {
        document.body.style.overflow = "";
        onComplete?.();
      }, 3750),
    ];

    return () => {
      timers.forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, [onRevealContent, onComplete]);

  return (
    <div className={`loader loader--${stage}`} aria-hidden="true">
      <div className="loader-mark">
        <img
          src={logoDark}
          alt=""
          className="loader-logo-img loader-logo-img--dark"
        />
        <img
          src={logoRings}
          alt=""
          className="loader-logo-img loader-logo-img--rings"
        />
        <img
          src={logoAccent}
          alt=""
          className="loader-accent"
          style={{ "--fill-scale": fillScale }}
        />
      </div>
    </div>
  );
}

export default Loader;
