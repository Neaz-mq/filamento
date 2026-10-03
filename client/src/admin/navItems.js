import { homeSections } from "./dashboardData";
import {
  IconBag,
  IconBox,
  IconCard,
  IconClock,
  IconDashboard,
  IconFolder,
  IconHeart,
  IconHome,
  IconLayers,
  IconPages,
  IconSettings,
  IconTickSquare,
  IconUserOctagon,
  IconUsers,
  IconVideo,
} from "./icons";

/* ===============================================================
   admin এর সব পাতার তালিকা — এক জায়গায়

   বাঁ পাশের মেনু আর উপরের search দুইটাই এখান থেকেই পড়ে. আলাদা
   দুই জায়গায় লিখলে একটায় পাতা যোগ করে অন্যটায় ভুলে যাওয়া হতো,
   তখন search এ পাতাটা খুঁজেই পাওয়া যেত না.

   ✅ নতুন admin পাতা যোগ করলে শুধু এখানে একটা সারি লিখবেন
   =============================================================== */

export const DASHBOARD = {
  to: "/admin",
  label: "Dashboard",
  Icon: IconDashboard,
  end: true,
  keywords: "overview home stats numbers summary",
};

export const NAV_GROUPS = [
  {
    id: "content",
    label: "Content",
    items: [
      /* Home — একটাই পাতা (Home Page Content), ভেতরে পাঁচ ট্যাব.
         আগে এখানে নিচে নামা তালিকা ছিল, Figma তে এখন সরাসরি link */
      {
        to: "/admin/home",
        label: "Home",
        Icon: IconHome,
        keywords: "home page landing content hero homepage edit website",
      },
      {
        to: "/admin/products",
        label: "Products",
        Icon: IconBox,
        keywords: "fixture series high bay la1 ls1 rh1 catalogue upload add product",
      },
      {
        to: "/admin/projects",
        label: "Projects",
        Icon: IconFolder,
        keywords: "case study installation customer site gallery",
      },
      {
        to: "/admin/application",
        label: "Application",
        Icon: IconTickSquare,
        keywords: "warehouse factory use case industry",
      },
      {
        to: "/admin/company",
        label: "Company",
        Icon: IconCard,
        keywords: "about us team story",
      },
      {
        to: "/admin/shop",
        label: "Shop",
        Icon: IconBag,
        keywords: "store buy cart price",
      },
      {
        to: "/admin/media",
        label: "Media Library",
        Icon: IconVideo,
        keywords: "image photo logo video file upload",
      },
      {
        to: "/admin/pages",
        label: "Pages",
        Icon: IconPages,
        keywords: "privacy policy spec sheet ies files guides",
      },
    ],
  },
  {
    id: "crm",
    label: "Leads & CRM",
    items: [
      {
        to: "/admin/leads",
        label: "Leads",
        Icon: IconUserOctagon,
        keywords: "enquiry contact quote request customer",
      },
      {
        to: "/admin/testimonials",
        label: "Testimonials",
        Icon: IconHeart,
        keywords: "review rating client feedback",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        to: "/admin/users",
        label: "Users & Roles",
        Icon: IconUsers,
        keywords: "admin owner editor staff permission account add",
      },
      {
        to: "/admin/activity",
        label: "Activity Logs",
        Icon: IconClock,
        keywords: "history audit who changed",
      },
      {
        to: "/admin/settings",
        label: "Settings",
        Icon: IconSettings,
        keywords: "config preference options password",
      },
    ],
  },
];

/* search এ যা যা খুঁজে পাওয়া যাবে — মেনুর সব পাতা, সাথে Home Page
   Content এর পাঁচটা ট্যাবও */
export const SEARCH_ITEMS = [
  { ...DASHBOARD, group: "Overview" },

  ...homeSections.map((section) => ({
    to: `/admin/home/${section.slug}`,
    label: section.name,
    Icon: IconLayers,
    group: "Home page",
    // ট্যাবের বর্ণনাই ভালো keyword — "hero image" লিখলেও পাওয়া যায়
    keywords: section.note,
  })),

  ...NAV_GROUPS.flatMap((group) =>
    group.items.map((item) => ({ ...item, group: group.label })),
  ),
];