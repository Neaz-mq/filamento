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
      setTimeout(() => setStage(STAGE.COLOR), 800),
      setTimeout(() => setStage(STAGE.BAR), 1500),
      setTimeout(() => setStage(STAGE.FILL), 2000),
      setTimeout(() => {
        onRevealContent?.();
        setStage(STAGE.FADE);
      }, 2700),
      setTimeout(() => {
        document.body.style.overflow = "";
        onComplete?.();
      }, 3200),
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
