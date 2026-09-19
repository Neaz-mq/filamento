/* ===============================================================
   Admin panel এর সব icon — এক ফাইলে

   Figma তে vuesax (Iconsax) এর line icon ব্যবহার করা হয়েছে. CSS
   export এ icon এর শুধু মাপ আসে, আসল path আসে না — তাই একই ধাঁচে
   (24×24 ঘর, 1.5px রেখা, গোল মাথা) হাতে আঁকা হয়েছে. দেখতে প্রায়
   এক, কিন্তু হুবহু Iconsax নয়.

   👉 হুবহু চাইলে Figma থেকে icon গুলো SVG export করে দিন, আমি
   এখানকার path গুলো বদলে দেব — বাকি কোডের কিছুই বদলাতে হবে না
   =============================================================== */

function Svg({ size = 24, width = 1.5, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* --- sidebar --------------------------------------------------- */

export const IconPanel = (p) => (
  <Svg {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M9 2v20" />
  </Svg>
);

export const IconDashboard = (p) => (
  <Svg {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M12 2v20" />
    <path d="M2 11.5h10" />
    <path d="M12 15.5h10" />
  </Svg>
);

export const IconHome = (p) => (
  <Svg {...p}>
    <path d="M3 9.6 12 3l9 6.6V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M12 15v3" />
  </Svg>
);

export const IconBox = (p) => (
  <Svg {...p}>
    <path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7z" />
    <path d="m3.7 7.2 8.3 4.6 8.3-4.6" />
    <path d="M12 11.8v9.4" />
  </Svg>
);

export const IconTickSquare = (p) => (
  <Svg {...p}>
    <rect x="2" y="2" width="20" height="20" rx="6" />
    <path d="m7.8 12 2.8 2.8 5.6-5.6" />
  </Svg>
);

export const IconCard = (p) => (
  <Svg {...p}>
    <rect x="2" y="3" width="20" height="18" rx="5" />
    <path d="M14 8h5" />
    <path d="M15 12h4" />
    <path d="M17 16h2" />
    <circle cx="8.6" cy="10" r="2" />
    <path d="M5 16.4c.4-1.8 1.8-2.8 3.6-2.8s3.2 1 3.6 2.8" />
  </Svg>
);

export const IconBag = (p) => (
  <Svg {...p}>
    <path d="M7.5 7.5V6a4.5 4.5 0 0 1 9 0v1.5" />
    <path d="M3.3 8h17.4l-.9 11a2.4 2.4 0 0 1-2.4 2.2H6.6A2.4 2.4 0 0 1 4.2 19z" />
    <path d="M15.6 11.5h.01" />
    <path d="M8.4 11.5h.01" />
  </Svg>
);

export const IconVideo = (p) => (
  <Svg {...p}>
    <path d="M8.9 2h6.2l6.9 6.9v6.2L15.1 22H8.9L2 15.1V8.9z" />
    <path d="M10.2 9.5v5l4.3-2.5z" />
  </Svg>
);

export const IconPages = (p) => (
  <Svg {...p}>
    <path d="M8 2v3" />
    <path d="M16 2v3" />
    <rect x="3" y="4" width="18" height="18" rx="5" />
    <path d="M12 12.5v4" />
    <path d="M10 14.5h4" />
  </Svg>
);

export const IconUserOctagon = (p) => (
  <Svg {...p}>
    <path d="M8.9 2h6.2l6.9 6.9v6.2L15.1 22H8.9L2 15.1V8.9z" />
    <circle cx="12" cy="10" r="2.2" />
    <path d="M8.2 17c.4-1.9 1.9-3 3.8-3s3.4 1.1 3.8 3" />
  </Svg>
);

export const IconHeart = (p) => (
  <Svg {...p}>
    <path d="M12 20.4c-.6 0-1.3-.2-1.8-.6C6.4 17 2 13.9 2 9.2 2 6.3 4.2 4 7 4c1.9 0 3.7 1 5 2.6C13.3 5 15.1 4 17 4c2.8 0 5 2.3 5 5.2 0 1.5-.4 2.8-1.1 4" />
    <path d="M15.5 21.3v-2.1l3.9-3.9a1.3 1.3 0 0 1 1.9 1.9l-3.9 3.9z" />
  </Svg>
);

export const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9.5" cy="7.5" r="3.5" />
    <path d="M2.5 20.5c.4-3.4 3.4-5.6 7-5.6s6.6 2.2 7 5.6" />
    <path d="M17.2 5.2a3.2 3.2 0 0 1 0 6.1" />
    <path d="M19 14.7c2 .4 3.4 1.6 3.5 3.3" />
  </Svg>
);

export const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 7.5V12l3 1.8" />
  </Svg>
);

export const IconSettings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.6 19.2 6.8v8.4L12 19.4 4.8 15.2V6.8z" />
  </Svg>
);

export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M9 7.6V6.5c0-2 1-3 3-3h4c2 0 3 1 3 3v11c0 2-1 3-3 3h-4c-2 0-3-1-3-3v-1.1" />
    <path d="M3.4 12H15" />
    <path d="M6.3 8.6 2.9 12l3.4 3.4" />
  </Svg>
);

/* --- header ---------------------------------------------------- */

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-2.5-2.5" />
  </Svg>
);

export const IconBell = (p) => (
  <Svg {...p}>
    <path d="M12 3v2" />
    <path d="M5.5 9.5a6.5 6.5 0 0 1 13 0v3.2l1.4 2.6c.4.8-.1 1.7-1 1.7H5.1c-.9 0-1.4-.9-1-1.7l1.4-2.6z" />
    <path d="M9.3 20.3a3 3 0 0 0 5.4 0" />
  </Svg>
);

export const IconProfile = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c.6-3.9 3.9-6 8-6s7.4 2.1 8 6" />
  </Svg>
);

/* Figma র profile icon — designer এর দেওয়া path হুবহু.
   ১৮×১৮ ঘরে আঁকা, তাই viewBox আলাদা. রং currentColor, তাই যে
   জায়গায় বসবে তার রংই নেয় (হলুদ গোলে সাদা) */
export function IconPerson({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9.11992 8.1525C9.04492 8.145 8.95492 8.145 8.87242 8.1525C7.08742 8.0925 5.66992 6.63 5.66992 4.83C5.66992 2.9925 7.15492 1.5 8.99992 1.5C10.8374 1.5 12.3299 2.9925 12.3299 4.83C12.3224 6.63 10.9049 8.0925 9.11992 8.1525Z" />
      <path d="M5.36906 10.92C3.55406 12.135 3.55406 14.115 5.36906 15.3225C7.43156 16.7025 10.8141 16.7025 12.8766 15.3225C14.6916 14.1075 14.6916 12.1275 12.8766 10.92C10.8216 9.5475 7.43906 9.5475 5.36906 10.92Z" />
    </svg>
  );
}

export const IconClose = (p) => (
  <Svg width="1.8" {...p}>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </Svg>
);

/* Figma র calendar — ভেতরে দুই সারিতে তিনটা করে মোট ছয়টা বিন্দু,
   আর বিন্দুগুলোর দাগ 2px (বাইরের ঘরটা 1.5px) */
export const IconCalendar = (p) => (
  <Svg {...p}>
    <path d="M8 2v3" />
    <path d="M16 2v3" />
    <rect x="3" y="4" width="18" height="18" rx="5" />
    <path d="M3.5 9.1h17" />
    <path d="M7.8 13.2h.01" strokeWidth="2" />
    <path d="M11.9 13.2h.01" strokeWidth="2" />
    <path d="M15.9 13.2h.01" strokeWidth="2" />
    <path d="M7.8 16.2h.01" strokeWidth="2" />
    <path d="M11.9 16.2h.01" strokeWidth="2" />
    <path d="M15.9 16.2h.01" strokeWidth="2" />
  </Svg>
);

// বাইরের কোথাও নিয়ে যায় — কোণা থেকে বেরিয়ে যাওয়া তির
export const IconShare = (p) => (
  <Svg {...p}>
    <path d="M13.5 3.5H20.5V10.5" />
    <path d="m20 4-8.5 8.5" />
    <path d="M20.5 14.5v3c0 2-1 3-3 3h-11c-2 0-3-1-3-3v-11c0-2 1-3 3-3h3" />
  </Svg>
);

export const IconUserPlus = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="7.5" r="3.8" />
    <path d="M3 20.5c.4-3.5 3.4-5.7 7-5.7 1.3 0 2.5.3 3.5.8" />
    <path d="M18 14.5v6" />
    <path d="M15 17.5h6" />
  </Svg>
);

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 6.5h16" />
    <path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
    <path d="M6.5 6.5 7.3 19a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12.5" />
    <path d="M10.5 10.5v6" />
    <path d="M13.5 10.5v6" />
  </Svg>
);

export const IconMenu = (p) => (
  <Svg {...p}>
    <path d="M3.5 7h17" />
    <path d="M3.5 12h17" />
    <path d="M3.5 17h17" />
  </Svg>
);

/* --- ছোট চিহ্ন -------------------------------------------------- */

export const IconChevron = (p) => (
  <Svg width="2" {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
);

export const IconArrowRight = (p) => (
  <Svg width="1.8" {...p}>
    <path d="M4 12h15" />
    <path d="m13.5 6.5 5.5 5.5-5.5 5.5" />
  </Svg>
);

// ওঠা/নামার তির — ভরাট, সংখ্যার পাশে ছোট করে বসে
export function IconTrend({ down = false, size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={down ? { transform: "rotate(180deg)" } : undefined}
    >
      <path d="M12 4.6a1 1 0 0 1 .77.36l5.2 6.2a1 1 0 0 1-1.54 1.28L13 8.6v10.4a1 1 0 0 1-2 0V8.6l-3.43 3.84a1 1 0 0 1-1.54-1.28l5.2-6.2A1 1 0 0 1 12 4.6" />
    </svg>
  );
}

/* --- panel এর মাথার icon --------------------------------------- */

export const IconLayers = (p) => (
  <Svg {...p}>
    <path d="m12 2.8 8.5 4.3L12 11.4 3.5 7.1z" />
    <path d="m3.5 12 8.5 4.3 8.5-4.3" />
    <path d="m3.5 16.9 8.5 4.3 8.5-4.3" />
  </Svg>
);

export const IconChart = (p) => (
  <Svg {...p}>
    <path d="M3 3v16.5a1.5 1.5 0 0 0 1.5 1.5H21" />
    <path d="M7.5 16V11" />
    <path d="M12 16V7.5" />
    <path d="M16.5 16v-3" />
  </Svg>
);

export const IconBolt = (p) => (
  <Svg {...p}>
    <path d="M13.2 2.5 5.3 12.4c-.4.5 0 1.2.6 1.2h4.6l-.7 7.9 7.9-9.9c.4-.5 0-1.2-.6-1.2h-4.6z" />
  </Svg>
);

/* --- table র ভেতরের ছোট জিনিস ---------------------------------- */

export const IconPencil = (p) => (
  <Svg {...p}>
    <path d="M14.9 4.2 6 13.1a2 2 0 0 0-.5 1l-.6 3.1c-.1.6.3 1 .9.9l3.1-.6a2 2 0 0 0 1-.5l8.9-8.9a2.4 2.4 0 0 0-3.4-3.4z" />
    <path d="M13.6 5.6 18 10" />
  </Svg>
);

export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5.5v13" />
    <path d="M5.5 12h13" />
  </Svg>
);

export const IconImage = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="3.5" width="19" height="17" rx="5" />
    <circle cx="8.5" cy="9.5" r="1.8" />
    <path d="m3.5 17.5 4.2-3.9a2 2 0 0 1 2.7 0l3.2 3" />
    <path d="m12.8 15 1.9-1.8a2 2 0 0 1 2.7 0l3.1 2.9" />
  </Svg>
);

export const IconChat = (p) => (
  <Svg {...p}>
    <path d="M4.5 18.5 3 21.3l.6-3.5A8.3 8.3 0 0 1 2.5 13c0-4.7 4.3-8.2 9.5-8.2s9.5 3.5 9.5 8.2-4.3 8.2-9.5 8.2a11 11 0 0 1-3.4-.5" />
    <path d="M8.5 12.8h.01" />
    <path d="M12 12.8h.01" />
    <path d="M15.5 12.8h.01" />
  </Svg>
);

export const IconFolder = (p) => (
  <Svg {...p}>
    <path d="M2.5 9.5V7.2c0-2 1-3 3-3h2.6c.8 0 1.2.2 1.8.7l1.4 1.3c.3.3.4.3.8.3h4.4c2 0 3 1 3 3v1" />
    <path d="M2.5 11.5c0-2 1-3 3-3h13c2 0 3 1 3 3v5.3c0 2-1 3-3 3h-13c-2 0-3-1-3-3z" />
  </Svg>
);

// টানার হাতল আর "⋮" — এখনো কোনো কাজ করে না, শুধু নকশার জন্য
export function IconGrip() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="1" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="0" y="5" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="0" y="9" width="12" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export function IconMore() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="5.5" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="18.5" r="1.6" fill="currentColor" />
    </svg>
  );
}