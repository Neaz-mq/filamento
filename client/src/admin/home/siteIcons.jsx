/* ===============================================================
   Key Features / Featured Points এর icon — সাইটে যে আঁকা দেখায়,
   admin এও হুবহু সেটাই (client/src/components/Hero.jsx এর BADGE_ICONS
   এর সাথে মেলানো). তাই admin এ যেটা বাছা হয় সাইটে সেটাই আসে।

   viewBox 24, stroke 2px, currentColor. size prop আগের icon গুলোর মতোই
   =============================================================== */

function Svg({ size = 20, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const SITE_ICONS = {
  energy: ({ size }) => (
    <Svg size={size}>
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
    </Svg>
  ),
  warranty: ({ size }) => (
    <Svg size={size}>
      <path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.7 7.5 10 4.4-1.3 7.5-5.4 7.5-10v-6L12 2.5Z" />
      <path d="M9 12.2l2.2 2.2L15.4 10" />
    </Svg>
  ),
  madeIn: ({ size }) => (
    <Svg size={size}>
      <path d="M5 21V3.5" />
      <path d="M5 4.2h12.5l-2.4 4 2.4 4H5" />
    </Svg>
  ),
  certified: ({ size }) => (
    <Svg size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.2 12.2l2.5 2.5 5.1-5.1" />
    </Svg>
  ),
  listed: ({ size }) => (
    <Svg size={size}>
      <path d="M7.5 3.5h9v5a4.5 4.5 0 0 1-9 0v-5Z" />
      <path d="M7.5 5.5H5a2.5 2.5 0 0 0 2.5 2.5M16.5 5.5H19A2.5 2.5 0 0 1 16.5 8" />
      <path d="M12 13v4M8.5 20.5h7M10 17h4l1.5 3.5h-7L10 17Z" />
    </Svg>
  ),
  maintenance: ({ size }) => (
    <Svg size={size}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
    </Svg>
  ),
  visibility: ({ size }) => (
    <Svg size={size}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  glare: ({ size }) => (
    <Svg size={size}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  ),
  installation: ({ size }) => (
    <Svg size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  ),
  roi: ({ size }) => (
    <Svg size={size}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </Svg>
  ),
  spark: ({ size }) => (
    <Svg size={size}>
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
    </Svg>
  ),
};

// picker এ দেখানোর নাম আর ক্রম
export const SITE_ICON_CHOICES = [
  ["energy", "Energy"],
  ["warranty", "Warranty"],
  ["madeIn", "Made in / Origin"],
  ["certified", "Certified"],
  ["listed", "Listed / Award"],
  ["maintenance", "Maintenance"],
  ["visibility", "Visibility"],
  ["glare", "Glare / Light"],
  ["installation", "Installation / Time"],
  ["roi", "Savings / ROI"],
  ["spark", "General"],
];