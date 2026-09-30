/* ===============================================================
   নতুন Home পাতার icon — Figma র vuesax "linear" সেটের মতো করে আঁকা.

   সব icon এ stroke বা fill = currentColor, তাই রঙ CSS থেকে বদলায়.
   aria-hidden — পাশে লেখা বা aria-label আছে, screen reader এ
   icon টা আলাদা করে পড়ার দরকার নেই
   =============================================================== */

const line = (size, strokeWidth = 1.5) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
});

const solid = (size, viewBox = "0 0 24 24") => ({
  width: size,
  height: size,
  viewBox,
  fill: "currentColor",
  "aria-hidden": true,
  focusable: false,
});

/* ---------- তীর ---------- */

// vuesax arrow-right — "More Info →", Submit, Newsletter
export function ArrowRight({ size = 18, strokeWidth = 1.5 }) {
  return (
    <svg {...line(size, strokeWidth)}>
      <path d="M14.43 5.93 20.5 12l-6.07 6.07M3.5 12h16.83" />
    </svg>
  );
}

// ↗ — hero card এর কালো চৌকো বোতাম
export function ArrowUpRight({ size = 14 }) {
  return (
    <svg {...line(size, 1.6)}>
      <path d="M7 17 17 7M8.5 7H17v8.5" />
    </svg>
  );
}

// vuesax arrow-down — dropdown আর ভাষার বোতামে
export function ChevronDown({ size = 14 }) {
  return (
    <svg {...line(size, 1.5)}>
      <path d="m19.92 8.95-6.52 6.52c-.77.77-2.03.77-2.8 0L4.08 8.95" />
    </svg>
  );
}

// vuesax arrow-right (chevron) — testimonial এর তীর
export function ChevronRight({ size = 24 }) {
  return (
    <svg {...line(size, 1.5)}>
      <path d="m8.91 19.92 6.52-6.52c.77-.77.77-2.03 0-2.8L8.91 4.08" />
    </svg>
  );
}

export function ChevronLeft({ size = 24 }) {
  return (
    <svg {...line(size, 1.5)}>
      <path d="m15.09 19.92-6.52-6.52c-.77-.77-.77-2.03 0-2.8l6.52-6.52" />
    </svg>
  );
}

/* ">>" — Request Quote বোতামের ভেতরের সাদা/হলুদ বাক্সে.
   Figma: দুইটা 16px chevron, মাঝে -6px margin দিয়ে গায়ে গায়ে */
export function DoubleChevron() {
  return (
    <span className="nh-dchev" aria-hidden="true">
      <ChevronRight size={16} />
      <ChevronRight size={16} />
    </span>
  );
}

/* ---------- Technology ---------- */

// vuesax play — Figma: 40px, stroke 3 (24 এর ঘরে 1.8)
export function PlayIcon({ size = 40 }) {
  return (
    <svg {...line(size, 1.8)}>
      <path d="M4 12V8.44c0-4.42 3.13-6.23 6.96-4.02l3.09 1.78 3.09 1.78c3.83 2.21 3.83 5.83 0 8.04l-3.09 1.78-3.09 1.78C7.13 21.79 4 19.98 4 15.56V12Z" />
    </svg>
  );
}

export function ClockIcon({ size = 24 }) {
  return (
    <svg {...line(size, 1.5)}>
      <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10Z" />
      <path d="m15.71 15.18-3.1-1.85c-.54-.32-.98-1.09-.98-1.72v-4.1" />
    </svg>
  );
}

export function EyeIcon({ size = 24 }) {
  return (
    <svg {...line(size, 1.5)}>
      <path d="M15.58 12c0 1.98-1.6 3.58-3.58 3.58S8.42 13.98 8.42 12s1.6-3.58 3.58-3.58 3.58 1.6 3.58 3.58Z" />
      <path d="M12 20.27c3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19-2.29-3.6-5.58-5.68-9.11-5.68-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19 2.29 3.6 5.58 5.68 9.11 5.68Z" />
    </svg>
  );
}

/* ---------- Why Choose Us — 32px, stroke 2 ---------- */

export function WrenchIcon() {
  return (
    <svg {...line(32, 2)}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94Z" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg {...line(32, 2)}>
      <path d="M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" />
      <path d="m19.14 19.14-.13-.13m0-14.02.13-.13M4.86 19.14l.13-.13M12 2.08V2m0 20v-.08M2.08 12H2m20 0h-.08M4.99 4.99l-.13-.13" />
    </svg>
  );
}

export function RocketIcon() {
  return (
    <svg {...line(32, 2)}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export function DollarIcon() {
  return (
    <svg {...line(32, 2)}>
      <path d="M8.67 14.33c0 1.29.99 2.33 2.22 2.33h2.51c1.07 0 1.94-.91 1.94-2.03 0-1.22-.53-1.65-1.32-1.93l-4.03-1.4c-.79-.28-1.32-.71-1.32-1.93 0-1.12.87-2.03 1.94-2.03h2.51c1.23 0 2.22 1.04 2.22 2.33M12 6v12" />
      <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10Z" />
    </svg>
  );
}

/* ---------- Testimonial এর +/− ---------- */

export function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M3 6h6M6 9V3" />
    </svg>
  );
}

export function MinusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M3 6h6" />
    </svg>
  );
}

/* ---------- মোবাইলের মেনু ---------- */

export function MenuIcon() {
  return (
    <svg {...line(22, 1.8)}>
      <path d="M3 7h18M3 12h18M3 17h18" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...line(22, 1.8)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/* ---------- Social (Footer) ---------- */

export function FacebookIcon() {
  return (
    <svg {...solid(24)}>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.33-.04-1.56-.14-2.86-.14C11.93 2 10 3.66 10 6.7v2.8H7v4h3V22h4v-8.5Z" />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg {...solid(16)}>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">
      <rect x="2.5" y="2.5" width="15" height="15" rx="4.5" />
      <circle cx="10" cy="10" r="2.5" />
      <circle cx="13.9" cy="6.1" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedInIcon() {
  return (
    <svg {...solid(20)}>
      <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68Z" />
    </svg>
  );
}

export const SOCIAL_ICONS = {
  facebook: FacebookIcon,
  x: XIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
};
