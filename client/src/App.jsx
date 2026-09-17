import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import LocaleLayout from "./routes/LocaleLayout";
import Home from "./pages/Home";
import ComingSoon from "./pages/ComingSoon";
import { useLocaleLink } from "./i18n/useLocaleLink";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./i18n";

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
const router = createBrowserRouter(
  LANGUAGES.map((language) => ({
    path: language.code === DEFAULT_LANGUAGE ? "/" : `/${language.code}`,
    element: <LocaleLayout lang={language.code} />,
    errorElement: (
      <div className="shell" style={{ paddingTop: "var(--page-gutter)" }}>
        <ComingSoon variant="error" />
      </div>
    ),
    children: PAGES,
  })),
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;