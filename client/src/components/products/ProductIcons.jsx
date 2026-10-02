/* ===============================================================
   Products পাতা আর Product Details পাতার ছোট icon গুলো

   সবগুলোর রং currentColor — CSS এর color বদলালেই icon এর রং বদলায়.
   শুধু সাজসজ্জা, তাই aria-hidden; মানে বোঝানোর লেখা বোতামের
   aria-label বা পাশের লেখায় থাকে
   =============================================================== */

const base = {
  fill: "none",
  "aria-hidden": true,
  focusable: "false",
};

/* ‹ › — direction: left | right | up | down */
const CHEVRON_TURN = { left: 0, up: 90, right: 180, down: 270 };

export function Chevron({ direction = "left", size = 24, stroke = 2 }) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: `rotate(${CHEVRON_TURN[direction] ?? 0}deg)` }}
    >
      <path
        d="M15 4 7 12l8 8"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Figma র ভরাট ত্রিভুজ — "Filters ▸" আর খোলা অবস্থায় "◂" */
export function Triangle({ direction = "right", size = 24 }) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: direction === "left" ? "scaleX(-1)" : undefined }}
    >
      <path d="M8 3.5 17 12l-9 8.5z" fill="currentColor" />
    </svg>
  );
}

/* → (Contact the Seller, Compare these, Talk to an engineer) */
export function ArrowRight({ size = 12, stroke = 1.5 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 12 12">
      <path
        d="M1 6h10M7 2l4 4-4 4"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* লম্বা ↑ ↓ — আগের/পরের product (Figma: 26px লম্বা দাগ) */
export function LongArrow({ direction = "up" }) {
  return (
    <svg
      {...base}
      width="12"
      height="28"
      viewBox="0 0 12 28"
      style={{ transform: direction === "down" ? "scaleY(-1)" : undefined }}
    >
      <path
        d="M6 27V1.5M1.5 6 6 1.5 10.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* pagination এর "← Previous" / "Next →" */
export function PageArrow({ direction = "right" }) {
  return (
    <svg
      {...base}
      width="10"
      height="10"
      viewBox="0 0 10 10"
      style={{ transform: direction === "left" ? "scaleX(-1)" : undefined }}
    >
      <path
        d="M1 5h8M5.6 1.6 9 5 5.6 8.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ size = 24 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Reset এর পাশের ঘোরানো তীর (Figma: 14px) */
export function ResetIcon({ size = 14 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 14 14">
      <path
        d="M1.75 7a5.25 5.25 0 1 0 1.54-3.71L1.75 4.83"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.75 1.75v3.08h3.08"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ size = 12 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 12 12">
      <path
        d="m2.5 6.2 2.3 2.3 4.7-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 20 20">
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Figma র slider/filter এর চিহ্ন — ফোনে "Filters" বোতামে */
export function SlidersIcon({ size = 18 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 16 16">
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 3.33h4.67M9.33 3.33H14M9.33 2v2.67" />
        <path d="M2 8h3.33M8 8h6M5.33 6.67v2.67" />
        <path d="M2 12.67h6M10.67 12.67H14M10.67 11.33V14" />
      </g>
    </svg>
  );
}

/* Resources এর হলুদ document icon (Figma: 14px, #F7BE00) */
export function DocIcon({ size = 14 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 14 14">
      <path
        d="M8.17 1.17H3.5a1.17 1.17 0 0 0-1.17 1.16v9.34a1.17 1.17 0 0 0 1.17 1.16h7a1.17 1.17 0 0 0 1.17-1.16v-7z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M8.17 1.17v3.5h3.5M4.67 5.25h1.16M4.67 7.58h4.66M4.67 9.92h4.66"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlayIcon({ size = 14 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 14 14">
      <rect x="1.17" y="2.33" width="11.67" height="9.33" rx="2" stroke="currentColor" />
      <path d="M5.83 5.25v3.5L8.75 7z" fill="currentColor" />
    </svg>
  );
}

export function DownloadIcon({ size = 14 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 14 14">
      <path
        d="M7 1.75v7M4.08 5.83 7 8.75l2.92-2.92M1.75 8.75v2.33a1.17 1.17 0 0 0 1.17 1.17h8.16a1.17 1.17 0 0 0 1.17-1.17V8.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExternalIcon({ size = 14 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 14 14">
      <path
        d="M8.17 1.75h4.08v4.08M12.25 1.75 6.42 7.58M10.5 8.17v2.91a1.17 1.17 0 0 1-1.17 1.17H2.92a1.17 1.17 0 0 1-1.17-1.17V4.67A1.17 1.17 0 0 1 2.92 3.5h2.91"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------
   Key Features এর icon — admin এ বাছা নাম (bolt, award …) থেকে.
   Figma: 40px, stroke 2px #373A3C
   --------------------------------------------------------------- */
const FEATURE_PATHS = {
  bolt: <path d="M13.2 2.5 5.3 12.4c-.4.5 0 1.2.6 1.2h4.6l-.7 7.9 7.9-9.9c.4-.5 0-1.2-.6-1.2h-4.6z" />,
  award: (
    <>
      <circle cx="12" cy="8.5" r="6.5" />
      <path d="M8.2 13.9 7 22l5-3 5 3-1.2-8.1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 4 5.5v6.1c0 4.6 3.4 8.6 8 9.9 4.6-1.3 8-5.3 8-9.9V5.5z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.3" />
    </>
  ),
  factory: (
    <>
      <path d="M2.5 21.5h19" />
      <path d="M3.5 21.5V11l5 3V11l5 3V11l5 3V5.5a1.5 1.5 0 0 1 3 0v16" />
      <path d="M7 17.5h2M12 17.5h2" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15" />
      <path d="M5 19c3-4 6-6.5 9.5-8.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  thermometer: (
    <>
      <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0" />
      <path d="M12 9v7" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.6 19.2 6.8v8.4L12 19.4 4.8 15.2V6.8z" />
    </>
  ),
  box: (
    <>
      <path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7z" />
      <path d="m3.7 7.2 8.3 4.6 8.3-4.6M12 11.8v9.4" />
    </>
  ),
};

export function FeatureIcon({ name, size = 40 }) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={(2 * 24) / size}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {FEATURE_PATHS[name] ?? FEATURE_PATHS.bolt}
    </svg>
  );
}
