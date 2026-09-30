/* ===============================================================
   যে category র আসল ছবি এখনো নেই, সেখানে হাতে আঁকা ছোট ছবি

   Figma র Choose a Category তে পুরনো সাইটের product photo আছে,
   কিন্তু সেগুলো আমাদের Cloudinary তে নেই. তাই ততদিন একই ধাঁচের
   (ধূসর-সাদা, হলুদ ছোঁয়া) ছোট ছবি. designer ছবি দিলে catalog.js এ
   ওই category তে image বসালেই এটা আর দেখাবে না
   =============================================================== */

import { useState } from "react";

const SILVER = "#d5d7d9";
const LINE = "#9ea2a6";
const YELLOW = "#f7be00";

function MountingBase() {
  return (
    <>
      <path d="M40 6c-5 0-8 3-8 7 0 3 2 5 5 5" fill="none" stroke={LINE} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40 6v14" stroke={LINE} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="33" y="19" width="14" height="6" rx="2" fill={SILVER} />
      <rect x="27" y="25" width="26" height="40" rx="7" fill="#f4f5f6" stroke="#c7c9cc" strokeWidth="1.5" />
      <path d="M31 30v30" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <rect x="27" y="44" width="26" height="4" fill={YELLOW} opacity="0.85" />
      <rect x="33" y="65" width="14" height="8" rx="2" fill={SILVER} stroke={LINE} strokeWidth="1" />
      <path d="M36 73v3M44 73v3" stroke={LINE} strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

function Reflector() {
  return (
    <>
      <defs>
        <linearGradient id="pd-art-dome" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#b9bcbf" />
          <stop offset="0.45" stopColor="#f3f4f5" />
          <stop offset="1" stopColor="#a9adb1" />
        </linearGradient>
      </defs>
      <rect x="33" y="10" width="14" height="10" rx="2" fill={SILVER} stroke={LINE} strokeWidth="1" />
      <path d="M31 20h18c3 12 13 26 25 34H6c12-8 22-22 25-34" fill="url(#pd-art-dome)" stroke={LINE} strokeWidth="1.2" />
      <ellipse cx="40" cy="55" rx="34" ry="6" fill="#e9eaeb" stroke={LINE} strokeWidth="1.2" />
      <ellipse cx="40" cy="55" rx="24" ry="3.6" fill="#fff8d6" />
    </>
  );
}

function ControlCap() {
  return (
    <>
      <circle cx="40" cy="42" r="30" fill="#f4f5f6" stroke="#c7c9cc" strokeWidth="1.5" />
      <circle cx="40" cy="42" r="22" fill="#2f7d4f" />
      <circle cx="40" cy="42" r="22" fill="none" stroke="#256440" strokeWidth="1.5" />
      <rect x="33" y="35" width="14" height="14" rx="2" fill="#1f2a2f" />
      <path d="M26 30h6M26 36h4M48 30h6M50 36h4M26 50h5M49 54h5M36 25v5M44 25v5" stroke="#c9e7d2" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="40" cy="42" r="2.2" fill={YELLOW} />
    </>
  );
}

function Lens() {
  return (
    <>
      <ellipse cx="40" cy="44" rx="34" ry="12" fill="#f4f5f6" stroke="#c7c9cc" strokeWidth="1.5" />
      <ellipse cx="40" cy="41" rx="27" ry="8" fill="#ffffff" stroke="#dadcde" strokeWidth="1.2" />
      <path d="M22 40c5-3 11-4 18-4" stroke="#e3e5e7" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M6 44c0 5 15 10 34 10s34-5 34-10" fill="none" stroke={LINE} strokeWidth="1.2" />
      <circle cx="58" cy="39" r="2" fill={YELLOW} />
    </>
  );
}

function Parts() {
  return (
    <>
      <rect x="12" y="30" width="16" height="36" rx="5" fill="#f4f5f6" stroke="#c7c9cc" strokeWidth="1.5" />
      <rect x="15" y="22" width="10" height="9" rx="2" fill={SILVER} />
      <rect x="34" y="18" width="16" height="48" rx="5" fill="#f4f5f6" stroke="#c7c9cc" strokeWidth="1.5" />
      <rect x="37" y="11" width="10" height="8" rx="2" fill={SILVER} />
      <rect x="34" y="40" width="16" height="3" fill={YELLOW} opacity="0.85" />
      <rect x="56" y="44" width="14" height="22" rx="4" fill="#f4f5f6" stroke="#c7c9cc" strokeWidth="1.5" />
      <rect x="59" y="38" width="8" height="7" rx="2" fill={SILVER} />
    </>
  );
}

const ART = {
  mounting: MountingBase,
  reflector: Reflector,
  cap: ControlCap,
  lens: Lens,
  box: Parts,
};

function CategoryArt({ name, size = 80 }) {
  const Drawing = ART[name] ?? Parts;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-hidden="true"
      focusable="false"
    >
      <Drawing />
    </svg>
  );
}

export default CategoryArt;

/* category র ছবি — আসল ছবি থাকলে সেটা, না থাকলে বা নামতে ব্যর্থ
   হলে (internet সমস্যা, ছবি মুছে ফেলা) আঁকা ছবি */
export function CategoryPicture({ category, size = 80 }) {
  const [broken, setBroken] = useState(false);

  if (category.image && !broken) {
    return (
      <img
        src={category.image}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
      />
    );
  }

  return <CategoryArt name={category.art ?? "box"} size={size} />;
}
