import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { RequireAdmin, useAdminAuth } from "./AdminAuth";
import AdminSidebar from "./AdminSidebar";
import AdminSearch from "./AdminSearch";
import AdminUserMenu from "./AdminUserMenu";
import { homeSections } from "./dashboardData";
import { IconBell, IconMenu } from "./icons";

/* ===============================================================
   Admin এর বাইরের কাঠামো — বাঁয়ে মেনু, উপরে header, ডানে পাতা

   এর ভেতরের সব পাতা login ছাড়া দেখা যায় না. নতুন admin পাতা
   App.jsx এ এটার children হিসেবে যোগ করলেই নিজে থেকেই পাহারার
   ভেতরে চলে আসে.

   বড় পর্দায় মেনু পাশে থাকে; ছোট পর্দায় সেটা পাশ থেকে বেরিয়ে আসা
   drawer হয়ে যায় (উপরের ☰ বোতাম)
   =============================================================== */

/* এর উপরে মেনু পাতার ভেতরেই থাকে (পুরো বা সরু পট্টি),
   এর নিচে পাশ থেকে বেরিয়ে আসা drawer */
const WIDE = "(min-width: 1024px)";

// minimize অবস্থাটা মনে রাখা হয় — পরের বার খুললেও যেমন রেখেছিলেন
const RAIL_KEY = "fil_admin_rail";

const readRail = () => {
  try {
    return window.localStorage.getItem(RAIL_KEY) === "1";
  } catch {
    // ব্যক্তিগত window তে localStorage বন্ধ থাকতে পারে
    return false;
  }
};

// ঠিকানা → header এর লেখা
const TITLES = {
  "/admin/products": "Products",
  "/admin/application": "Application",
  "/admin/company": "Company",
  "/admin/shop": "Shop",
  "/admin/media": "Media Library",
  "/admin/pages": "Pages",
  "/admin/leads": "Leads",
  "/admin/testimonials": "Testimonials",
  "/admin/users": "Users & Roles",
  "/admin/activity": "Activity Logs",
  "/admin/settings": "Settings",
};

function pageTitle(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];

  if (pathname.startsWith("/admin/home/")) {
    const slug = pathname.slice("/admin/home/".length);
    const section = homeSections.find((item) => item.slug === slug);
    return section ? section.name : "Home";
  }

  return null; // dashboard — তখন অভিবাদন দেখানো হয়
}

function AdminShell() {
  const { admin } = useAdminAuth();
  const location = useLocation();

  /* দুইটা আলাদা অবস্থা, কারণ বড় আর ছোট পর্দায় মেনুর আচরণ আলাদা:

       railed    — বড় পর্দায় মেনু সরু হয়ে শুধু icon এর পট্টি.
                   মেনু কখনো হারিয়ে যায় না, তাই এক চাপেই ফেরত আসে
       drawerOpen — ছোট পর্দায় পাশ থেকে বেরিয়ে আসা মেনু */
  const [railed, setRailed] = useState(readRail);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // মনে রাখা
  useEffect(() => {
    try {
      window.localStorage.setItem(RAIL_KEY, railed ? "1" : "0");
    } catch {
      // রাখা গেল না — সমস্যা নেই, শুধু পরের বার মনে থাকবে না
    }
  }, [railed]);

  /* একই বোতাম দুই জায়গায়: বড় পর্দায় সরু/চওড়া, ছোট পর্দায় খোলা/বন্ধ */
  const toggleNav = () => {
    if (window.matchMedia(WIDE).matches) setRailed((value) => !value);
    else setDrawerOpen((value) => !value);
  };

  // পাতা বদলালে ছোট পর্দার drawer নিজে থেকে বন্ধ
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // drawer খোলা থাকলে পেছনের পাতা যেন না নড়ে
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Esc চাপলে drawer বন্ধ
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const title = pageTitle(location.pathname);

  const shellClass = [
    "adm-app",
    railed ? "adm-app--rail" : "",
    drawerOpen ? "adm-app--drawer" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      <div className="adm-side-wrap">
        <AdminSidebar
          railed={railed}
          onToggle={toggleNav}
          onExpand={() => setRailed(false)}
        />
      </div>

      {/* ছোট পর্দায় drawer এর পেছনের কালো পর্দা */}
      {drawerOpen && (
        <button
          type="button"
          className="adm-scrim"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        />
      )}

      <div className="adm-main">
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            {/* ☰ শুধু ছোট পর্দায় — বড় পর্দায় মেনুর নিজের বোতামই
                সরু/চওড়া করে, তাই দুইটা বোতামের দরকার নেই */}
            <button
              type="button"
              className="adm-icon-btn adm-menu-btn"
              onClick={() => setDrawerOpen((open) => !open)}
              aria-label={drawerOpen ? "Hide menu" : "Show menu"}
              aria-expanded={drawerOpen}
            >
              <IconMenu />
            </button>

            <h1 className="adm-greet">
              {title ? (
                title
              ) : (
                <>
                  Welcome Back, <strong>{admin?.name}</strong>
                </>
              )}
            </h1>
          </div>

          <div className="adm-topbar-right">
            <AdminSearch />

            {/* 🔔 এখনো কাজ করে না — বিজ্ঞপ্তি পরে */}
            <span className="adm-icon-btn adm-icon-btn--flat" aria-hidden="true">
              <IconBell size={18} />
            </span>

            {/* গোল বোতাম — চাপলে Dashboard / View site / Sign out */}
            <AdminUserMenu />
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}

function AdminProtected() {
  return (
    <RequireAdmin>
      <AdminShell />
    </RequireAdmin>
  );
}

export default AdminProtected;