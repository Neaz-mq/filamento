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

/* ---------- Social (Footer) ----------
   Figma র SVG হুবহু — শুধু রঙ #FFFFFF এর বদলে currentColor, যাতে
   .nh-social-btn এর color (সাদা, hover এ কালো) icon এ খাটে.
   আকার Figma র মতোই: Facebook 24, X 16, Instagram 20, LinkedIn 20 */

export function FacebookIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M14 13.5H16.5L17.5 9.5H14V7.5C14 6.47 14 5.5 16 5.5H17.5V2.14C17.174 2.097 15.943 2 14.643 2C11.928 2 10 3.657 10 6.7V9.5H7V13.5H10V22H14V13.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12.6 0.75H15.0537L9.69372 6.89171L16 15.2506H11.0629L7.19314 10.182L2.77029 15.2506H0.314286L6.04686 8.67914L0 0.751143H5.06286L8.55543 5.38314L12.6 0.75ZM11.7371 13.7786H13.0971L4.32 2.14543H2.86171L11.7371 13.7786Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2.5 9.16667C2.5 6.02417 2.5 4.4525 3.47667 3.47667C4.45333 2.50083 6.02417 2.5 9.16667 2.5H10.8333C13.9758 2.5 15.5475 2.5 16.5233 3.47667C17.4992 4.45333 17.5 6.02417 17.5 9.16667V10.8333C17.5 13.9758 17.5 15.5475 16.5233 16.5233C15.5467 17.4992 13.9758 17.5 10.8333 17.5H9.16667C6.02417 17.5 4.4525 17.5 3.47667 16.5233C2.50083 15.5467 2.5 13.9758 2.5 10.8333V9.16667Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M13.75 7.5C14.4404 7.5 15 6.94036 15 6.25C15 5.55964 14.4404 5 13.75 5C13.0596 5 12.5 5.55964 12.5 6.25C12.5 6.94036 13.0596 7.5 13.75 7.5Z"
        fill="currentColor"
      />
      <path
        d="M12.5 10C12.5 11.3807 11.3807 12.5 10 12.5C8.61929 12.5 7.5 11.3807 7.5 10C7.5 8.61929 8.61929 7.5 10 7.5C11.3807 7.5 12.5 8.61929 12.5 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function LinkedInIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5.78451 4.1675C5.78428 4.60953 5.60848 5.03336 5.29576 5.34577C4.98304 5.65817 4.55903 5.83355 4.11701 5.83333C3.67498 5.83311 3.25114 5.65731 2.93874 5.34459C2.62633 5.03187 2.45095 4.60786 2.45117 4.16583C2.45139 3.72381 2.6272 3.29997 2.93992 2.98757C3.25263 2.67516 3.67664 2.49978 4.11867 2.5C4.5607 2.50022 4.98454 2.67603 5.29694 2.98874C5.60934 3.30146 5.78473 3.72547 5.78451 4.1675ZM5.83451 7.0675H2.50117V17.5008H5.83451V7.0675ZM11.1012 7.0675H7.78451V17.5008H11.0678V12.0258C11.0678 8.97583 15.0428 8.6925 15.0428 12.0258V17.5008H18.3345V10.8925C18.3345 5.75083 12.4512 5.9425 11.0678 8.4675L11.1012 7.0675Z"
        fill="currentColor"
      />
    </svg>
  );
}

export const SOCIAL_ICONS = {
  facebook: FacebookIcon,
  x: XIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
};