import { Suspense, lazy } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import LocaleLayout from "./routes/LocaleLayout";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
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
const AdminSoon = lazy(() => import("./admin/AdminSoon"));
const AdminUsers = lazy(() => import("./admin/AdminUsers"));

/* নতুন Home (Figma র দ্বিতীয় landing page) — এটাও lazy. মূল পাতার
   দর্শকের browser এ এর কোড, CSS আর Manrope font কিছুই নামে না */
const HomeTwo = lazy(() => import("./home2/HomeTwo"));

/* নতুন Home এর কোড নামার ফাঁকের পর্দা — এরপর যা আসবে তার রঙেই:
     intro এখনো হয়নি → সাদা (intro র পর্দা সাদা)
     intro আগেই হয়েছে → কালো (hero কালো)
   তাহলে কোনো রঙের ঝলক দেখা যায় না.
   key টা home2/HomeTwo.jsx এর INTRO_KEY এর সাথে মিলতে হবে */
const readHomeTwoIntroPlayed = () => {
  try {
    return sessionStorage.getItem("filamento_home2_intro_played") === "true";
  } catch {
    return false; // কিছু browser এ sessionStorage throw করে
  }
};

/* উচ্চতা পর্দার চেয়ে 1px বেশি — যাতে এই ফাঁকেও scrollbar থাকে.
   নাহলে পাতা নামার মুহূর্তে scrollbar হঠাৎ এসে পাতা 15px সরু করত */
function HomeTwoBoot() {
  const introPlayed = readHomeTwoIntroPlayed();
  return (
    <div
      style={{
        minHeight: "calc(100vh + 1px)",
        background: introPlayed ? "#000" : "#fff",
      }}
    />
  );
}

/* admin এর যে পাতাগুলো এখনো বানানো হয়নি — sidebar এ link আছে,
   কিন্তু ভেতরে "তৈরি হচ্ছে" লেখা.

   ✅ কোনোটা তৈরি হলে এখান থেকে নামটা মুছে নিচে ADMIN_ROUTE এর
   children এ আসল component দিয়ে সারি যোগ করবেন */
const ADMIN_SOON = [
  "products",
  "projects",
  "application",
  "company",
  "shop",
  "media",
  "pages",
  "leads",
  "testimonials",
  "activity",
  "settings",
];

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

/* admin এর কোনো পাতা ভাঙলে এটা দেখায়.

   আগে errorElement এ AdminBoot ("Loading…") বসানো ছিল — ভাঙলে পর্দা
   চিরকাল "Loading…" এ আটকে থাকত. সবচেয়ে সাধারণ কারণ: নতুন deploy এর
   পরে পুরনো tab থেকে কোনো admin পাতায় গেলে পুরনো chunk এর ফাইল আর
   server এ থাকে না. reload করলেই নতুন ফাইল নামে, তাই বোতামটা ওটাই করে.

   inline style — admin.css নামার আগেও ভাঙতে পারে */
function AdminCrash() {
  return (
    <div
      role="alert"
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        alignContent: "center",
        gap: "12px",
        padding: "24px",
        textAlign: "center",
        background: "#f4f4f5",
        color: "#0b121a",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
      }}
    >
      <p style={{ margin: 0 }}>
        Something went wrong while opening this page. Reloading usually fixes it.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          padding: "10px 20px",
          border: 0,
          borderRadius: "999px",
          background: "#f7be00",
          color: "#0b121a",
          font: "inherit",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Reload
      </button>
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
  // "projects" (তালিকা) এখন আসল পাতা — নিচে PAGES এ।
  // Testimonial এর "Project" link — /projects/marcus-cold-storage ইত্যাদি,
  // এই একক প্রজেক্ট বিস্তারিত পাতাটা এখনো বানানো হয়নি
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
  { path: "projects", element: <Projects /> },
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
  errorElement: <AdminCrash />,
  children: [
    // login পাতা — এটাই একমাত্র পাতা যেটা login ছাড়া দেখা যায়
    { path: "login", element: <AdminLogin /> },

    /* এর নিচের সব পাতা পাহারার ভেতরে. নতুন admin পাতা এখানেই
       যোগ করবেন — নিজে থেকেই সুরক্ষিত হয়ে যাবে */
    {
      element: <AdminProtected />,
      children: [
        { index: true, element: <AdminHome /> },
        // Home পাতার আলাদা আলাদা অংশ — /admin/home/hero ইত্যাদি
        { path: "home/:section", element: <AdminSoon /> },
        { path: "users", element: <AdminUsers /> },
        ...ADMIN_SOON.map((path) => ({ path, element: <AdminSoon /> })),
      ],
    },

    // /admin এর ভেতরে অচেনা ঠিকানা → dashboard
    { path: "*", element: <Navigate to="/admin" replace /> },
  ],
};

/* ভাষার route এর ভেতরে দুই রকম পাতা:

     MainLayout এর ভেতরে — মূল সাইটের Navbar আর Footer সহ (PAGES)
     /home              — নতুন Home, নিজের header আর footer (তাই
                          MainLayout এর বাইরে, কিন্তু ভাষার ভেতরে:
                          /ja/home, /zh-Hant/home ও চলে)

   React Router নির্দিষ্ট পথ ("home") কে "*" এর চেয়ে আগে ধরে, তাই
   PAGES এর 404 route টা /home কে ধরে ফেলে না */
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
    children: [
      { element: <MainLayout />, children: PAGES },
      {
        path: "home",
        element: (
          <Suspense fallback={<HomeTwoBoot />}>
            <HomeTwo />
          </Suspense>
        ),
      },
    ],
  })),
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;