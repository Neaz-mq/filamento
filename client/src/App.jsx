import { Suspense, lazy } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import LocaleLayout from "./routes/LocaleLayout";
import Home from "./pages/Home";
import ComingSoon from "./pages/ComingSoon";
import { useLocaleLink } from "./i18n/useLocaleLink";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./i18n";

/* ---------------------------------------------------------------
   Admin panel — lazy

   lazy() মানে এই ফাইলগুলো আলাদা chunk এ থাকে আর শুধু /admin এ
   ঢুকলেই নামে. সাধারণ দর্শকের browser এ admin এর একটা লাইনও আসে না,
   সাইটও ভারী হয় না.

   ⚠️ এখান থেকে admin এর কোনো কিছু সরাসরি import করবেন না
   (যেমন RequireAdmin) — করলেই পুরো admin মূল bundle এ ঢুকে যাবে */
const AdminRoot = lazy(() => import("./admin/AdminRoot"));
const AdminProtected = lazy(() => import("./admin/AdminProtected"));
const AdminLogin = lazy(() => import("./admin/AdminLogin"));
const AdminHome = lazy(() => import("./admin/AdminHome"));

/* admin এর কোড নামার ফাঁকের পর্দা — inline style, কারণ admin.css ও
   তখনো নামেনি */
function AdminBoot() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#f4f4f5",
        color: "#6e7377",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
      }}
    >
      Loading…
    </div>
  );
}

/* ---------------------------------------------------------------
   এখনো বানানো হয়নি এমন পাতা — navbar, footer, card এর link গুলো
   এখানে "Coming soon" পাতা দেখায়, ভাঙা error নয়.

   titleKey — পাতার নাম (locale এর key), শিরোনামে হলুদ হয়ে বসে.

   ✅ কোনো পাতা তৈরি হলে: এখান থেকে সারিটা মুছে নিচের PAGES এ
   আসল component দিয়ে যোগ করবেন
   --------------------------------------------------------------- */
const COMING_SOON = [
  { path: "products", titleKey: "nav.products" },
  { path: "projects", titleKey: "nav.projects" },
  // Testimonial এর "Project" link — /projects/marcus-cold-storage ইত্যাদি
  { path: "projects/:slug", titleKey: "nav.projects" },
  { path: "application", titleKey: "nav.application" },
  { path: "company", titleKey: "nav.company" },
  { path: "shop", titleKey: "nav.shop" },
  { path: "about-us", titleKey: "footer.links.aboutUs" },
  { path: "find-a-representative", titleKey: "footer.links.findRep" },
  { path: "videos", titleKey: "footer.links.videos" },
  { path: "spec-sheets", titleKey: "footer.links.specSheets" },
  { path: "ies-files", titleKey: "footer.links.iesFiles" },
  { path: "installation-guides", titleKey: "footer.links.installationGuides" },
  { path: "privacy-policy", titleKey: "footer.privacy" },
];

/* /contact — আলাদা পাতা নেই, form টা Home এ আছে. তাই Home এর
   Contact section এ পাঠানো হয় (একই ভাষায়). navbar এর "Contact",
   Hero র "Request Quote", footer এর "Contact Us" সবই এখানে আসে.
   replace — back চাপলে আবার /contact এ আটকে যাবে না */
function ContactRedirect() {
  const localeLink = useLocaleLink();
  return <Navigate to={{ pathname: localeLink("/"), hash: "#contact" }} replace />;
}

/* নতুন পাতা শুধু এখানে যোগ করবেন — তিনটা ভাষার জন্য তিনবার লেখার
   দরকার নেই, নিচের map নিজেই তিনটা বানিয়ে নেয় */
const PAGES = [
  { index: true, element: <Home /> },
  // { path: "products", element: <Products /> },
  // { path: "products/:slug", element: <ProductDetail /> },
  { path: "contact", element: <ContactRedirect /> },
  ...COMING_SOON.map(({ path, titleKey }) => ({
    path,
    element: <ComingSoon titleKey={titleKey} />,
  })),
  // বাকি সব ভুল ঠিকানা — 404
  { path: "*", element: <ComingSoon variant="notFound" /> },
];

/* ইংরেজি prefix ছাড়া ("/products"), বাকি দুইটা prefix সহ
   ("/ja/products", "/zh-Hant/products")।

   ইংরেজিকে prefix ছাড়া রাখছি কারণ ওটাই প্রধান বাজার — US-made
   industrial LED. এতে মূল URL গুলো পরিষ্কার থাকে আর root এ কোনো
   redirect লাগে না.

   errorElement — কোনো component এ অপ্রত্যাশিত সমস্যা হলে React
   Router এর নিজের সাদা error পাতার বদলে আমাদের নকশার পাতা দেখায় */
/* ---------------------------------------------------------------
   Admin panel এর route

   ভাষার prefix নেই (/ja/admin নেই) আর public সাইটের navbar/footer
   ও নেই — তাই এটা locale route গুলোর বাইরে, আলাদা করে বসানো.

   React Router নির্দিষ্ট পথকে * এর চেয়ে বেশি গুরুত্ব দেয়, তাই
   "/" এর ভেতরের 404 route টা /admin কে ধরে ফেলে না
   --------------------------------------------------------------- */
const ADMIN_ROUTE = {
  path: "/admin",
  element: (
    <Suspense fallback={<AdminBoot />}>
      <AdminRoot />
    </Suspense>
  ),
  errorElement: <AdminBoot />,
  children: [
    // login পাতা — এটাই একমাত্র পাতা যেটা login ছাড়া দেখা যায়
    { path: "login", element: <AdminLogin /> },

    /* এর নিচের সব পাতা পাহারার ভেতরে. নতুন admin পাতা এখানেই
       যোগ করবেন — নিজে থেকেই সুরক্ষিত হয়ে যাবে */
    {
      element: <AdminProtected />,
      children: [{ index: true, element: <AdminHome /> }],
    },

    // /admin এর ভেতরে অচেনা ঠিকানা → dashboard
    { path: "*", element: <Navigate to="/admin" replace /> },
  ],
};

const router = createBrowserRouter([
  ADMIN_ROUTE,
  ...LANGUAGES.map((language) => ({
    path: language.code === DEFAULT_LANGUAGE ? "/" : `/${language.code}`,
    element: <LocaleLayout lang={language.code} />,
    errorElement: (
      <div className="shell" style={{ paddingTop: "var(--page-gutter)" }}>
        <ComingSoon variant="error" />
      </div>
    ),
    children: PAGES,
  })),
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;