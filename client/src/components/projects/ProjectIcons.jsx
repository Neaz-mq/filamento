/* ===============================================================
   Project Details পাতার icon গুলো

   Key Features আর The Solution এর icon admin এ নাম দিয়ে বাছা হয়
   (area, gauge, timer …) — server এ শুধু নামটা থাকে, ছবি এখানে.
   ⚠️ নামগুলো server/lib/projectSchema.js এর PROJECT_ICONS এর সাথে
   মিলিয়ে রাখা

   রং currentColor — CSS এর color বদলালেই icon এর রং বদলায়.
   শুধু সাজসজ্জা, তাই aria-hidden
   =============================================================== */

const base = {
  fill: "none",
  "aria-hidden": true,
  focusable: "false",
};

const PATHS = {
  area: (
    <>
      <path d="M3 8V5a2 2 0 0 1 2-2h3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
      <path d="M8 16 16 8" />
      <path d="M11.5 8H16v4.5" />
    </>
  ),
  gauge: (
    <>
      <path d="M4.2 18.5a9.5 9.5 0 1 1 15.6 0" />
      <path d="m12 13.5 4-4.5" />
      <circle cx="12" cy="14" r="1.2" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.8" />
      <path d="M12 9v4.8l2.6 1.6" />
      <path d="M9.5 2.5h5" />
    </>
  ),
  bolt: <path d="M13.2 2.5 5.3 12.4c-.4.5 0 1.2.6 1.2h4.6l-.7 7.9 7.9-9.9c.4-.5 0-1.2-.6-1.2h-4.6z" />,
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
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.6 19.2 6.8v8.4L12 19.4 4.8 15.2V6.8z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 4 5.5v6.1c0 4.6 3.4 8.6 8 9.9 4.6-1.3 8-5.3 8-9.9V5.5z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.3" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="8.5" r="6.5" />
      <path d="M8.2 13.9 7 22l5-3 5 3-1.2-8.1" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="7.5" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
      <path d="M16 4.3a3.3 3.3 0 0 1 0 6.4" />
      <path d="M18.5 14.8c1.7.8 2.8 2.5 3 5.2" />
    </>
  ),
  factory: (
    <>
      <path d="M2.5 21.5h19" />
      <path d="M3.5 21.5V11l5 3V11l5 3V11l5 3V5.5a1.5 1.5 0 0 1 3 0v16" />
      <path d="M7 17.5h2M12 17.5h2" />
    </>
  ),
};

/* size — px; stroke — Figma র মাপে কত px মোটা দাগ (64px icon এ 4px,
   24px icon এ 1.5px). viewBox 24 এর হিসাবে বদলে নেওয়া হয় */
export function ProjectIcon({ name, size = 24, stroke = 1.5 }) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={(stroke * 24) / size}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name] ?? PATHS.bolt}
    </svg>
  );
}

/* ‹ › — direction: left | right */
export function Chevron({ direction = "left", size = 24, stroke = 2 }) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: direction === "right" ? "rotate(180deg)" : undefined }}
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

/* Highlights এর হলুদ ✓ বৃত্ত (Figma: 24px, stroke 2 #FFC107) */
export function CheckCircle({ size = 24 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="m8 12.2 2.7 2.7L16 9.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* জায়গার চিহ্ন (Figma: 24px, stroke 2) */
export function PinIcon({ size = 24 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 22s8-6.7 8-12.2A8 8 0 0 0 4 9.8C4 15.3 12 22 12 22Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.8" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/* বোতামের → (Figma "Arrow 2": 10px, stroke 1.5) */
export function ArrowRight({ size = 12 }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 12 12">
      <path
        d="M1 6h10M7 2l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
