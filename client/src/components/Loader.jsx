import { useEffect, useState } from "react";
import logoDark from "../assets/logo/logo-dark.png";
import logoFull from "../assets/logo/logo-full.png";
import "./Loader.css";

const STAGE = {
  DARK: "dark", // ১. dark logo দেখা যায়
  COLOR: "color", // ২. yellow accent আসে
  BAR: "bar", // ৩. logo সরে গিয়ে ছোট yellow bar
  FILL: "fill", // ৪. bar পুরো স্ক্রিন জুড়ে বড় হয়
  FADE: "fade", // ৫. yellow fade হয়ে content দেখা যায়
};

function Loader({ onRevealContent, onComplete }) {
  const [stage, setStage] = useState(STAGE.DARK);

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
      // dark logo hold শেষে color crossfade শুরু
      setTimeout(() => setStage(STAGE.COLOR), 900),

      // color crossfade (dark 300ms out + color 300ms in, sequential) = 600ms
      // পুরোপুরি শেষ হওয়ার পরেই (+buffer) bar stage শুরু
      setTimeout(() => setStage(STAGE.BAR), 1600),

      // logo hide (300ms) + bar fade-in (300ms delay + 300ms duration) = 900ms
      // পুরোপুরি শেষ হওয়ার পরেই (+buffer) grow শুরু — black circle logo
      // 100% হাইড হয়ে যাওয়ার পরেই yellow shape বড় হওয়া শুরু করবে
      setTimeout(() => setStage(STAGE.FILL), 2300),

      // fill grow (700ms) সম্পূর্ণ শেষ হওয়ার পরেই (+buffer) fade + content reveal
      setTimeout(() => {
        onRevealContent?.();
        setStage(STAGE.FADE);
      }, 3100),

      // overlay fade (500ms) সম্পূর্ণ শেষ হওয়ার পরেই loader remove
      setTimeout(() => {
        document.body.style.overflow = "";
        onComplete?.();
      }, 3700),
    ];

    return () => {
      timers.forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, [onRevealContent, onComplete]);

  return (
    <div className={`loader loader--${stage}`} aria-hidden="true">
      <div className="loader-logo">
        <img
          src={logoDark}
          alt=""
          className="loader-logo-img loader-logo-img--dark"
        />
        <img
          src={logoFull}
          alt=""
          className="loader-logo-img loader-logo-img--color"
        />
      </div>
      <div className="loader-bar" />
    </div>
  );
}

export default Loader;