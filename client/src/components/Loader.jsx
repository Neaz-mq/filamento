import { useEffect, useRef, useState } from "react";
import logoDark from "../assets/logo/logo-dark.png";
import logoRings from "../assets/logo/logo-rings.png";
import logoAccent from "../assets/logo/logo-accent.png";
import "./Loader.css";

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

    document.body.style.overflow = "hidden";

    const timers = [
      // dark logo hold শেষে color crossfade (rings + accent fade-in, 600ms) শুরু
      setTimeout(() => setStage(STAGE.COLOR), 800),

      // crossfade শেষ হওয়ার পরে (+100ms buffer) rings fade-out (350ms) শুরু
      setTimeout(() => setStage(STAGE.BAR), 1500),

      // rings পুরোপুরি হাইড হওয়ার পরে (+100ms buffer) accent rotate (550ms) শুরু
      setTimeout(() => setStage(STAGE.ROTATE), 1950),

      // rotate শেষ হওয়ার পরে (+100ms buffer) fill-bar grow (1100ms, smooth) শুরু
      setTimeout(() => setStage(STAGE.FILL), 2600),

      // fill grow সম্পূর্ণ শেষ হওয়ার পরে (+100ms buffer) fade + content reveal
      setTimeout(() => {
        callbacksRef.current.onRevealContent?.();
        setStage(STAGE.FADE);
      }, 3800),

      // overlay fade (500ms) সম্পূর্ণ শেষ হওয়ার পরে (+100ms buffer) loader remove
      setTimeout(() => {
        document.body.style.overflow = "";
        callbacksRef.current.onComplete?.();
      }, 4400),
    ];

    return () => {
      timers.forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, []); // খালি dependency — mount এ একবারই setup, StrictMode নিজে থেকেই handle করবে

  return (
    <div className={`loader loader--${stage}`} aria-hidden="true">
      <div className="loader-mark">
        <img src={logoDark} alt="" className="loader-logo-img loader-logo-img--dark" />
        <img src={logoRings} alt="" className="loader-logo-img loader-logo-img--rings" />
        <img src={logoAccent} alt="" className="loader-accent" />
        <div className="loader-fill-bar" />
      </div>
    </div>
  );
}

export default Loader;