import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { RequireAdmin } from "./AdminAuth";
import AdminSidebar from "./AdminSidebar";
import AdminSearch from "./AdminSearch";
import AdminUserMenu from "./AdminUserMenu";
import AdminNotifications from "./AdminNotifications";
import { useLeadAlerts } from "./useLeadAlerts";
import { IconMenu, IconSun } from "./icons";

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

/* যে পাতাগুলোর নিজের বড় শিরোনাম আছে — সেখানে header এর নিচে
   আলাদা শিরোনাম বসে না, একই নাম দুইবার দেখায় না.
   Dashboard ("Welcome Back"), Projects আর Home Page Content ও
   নিজের শিরোনাম আঁকে */
const OWN_HEADING = ["/admin/products", "/admin/home"];

function pageTitle(pathname) {
  if (OWN_HEADING.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return "";
  }

  if (TITLES[pathname]) return TITLES[pathname];

  return null; // dashboard আর projects — নিজের শিরোনাম নিজেই আঁকে
}

function AdminShell() {
  const location = useLocation();

  /* নতুন quote request — 🔔 আর বাঁ মেনুর Leads এর সংখ্যা.
     প্রতি মিনিটে একবার, শুধু tab চোখের সামনে থাকলে */
  const alerts = useLeadAlerts();
  const leadBadge =
    alerts?.canSeeLeads && alerts.newCount > 0 ? alerts.newCount : undefined;

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

  /* পাতা বদলালে ছোট পর্দার drawer নিজে থেকে বন্ধ.
     effect এর বদলে render এর সময়েই — effect এ করলে আগে পুরনো
     অবস্থায় একবার আঁকা হয়ে তারপর আবার আঁকা হতো */
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setDrawerOpen(false);
  }

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
          badges={{ "/admin/leads": leadBadge }}
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
        {/* Figma: বাঁয়ে search, ডানে ☀ 🔔 আর নিজের নাম — সব পাতায় একই */}
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

            <AdminSearch />
          </div>

          <div className="adm-topbar-right">
            {/* ☀ — dark mode এখনো তৈরি হয়নি. বোতাম না বানিয়ে শুধু
                icon, যাতে চাপলে কিছু না হওয়ার মতো ভুল না হয়.
                (পুরো admin এর প্রায় ৩০০টা রঙ বদলাতে হবে — আলাদা কাজ) */}
            <span
              className="adm-icon-btn adm-icon-btn--flat adm-theme"
              title="Dark mode — coming soon"
              aria-hidden="true"
            >
              <IconSun size={20} />
            </span>

            <AdminNotifications data={alerts} />

            {/* নাম + গোল ছবি — চাপলে Dashboard / View site / Sign out */}
            <AdminUserMenu />
          </div>
        </header>

        {/* পাতার শিরোনাম — যে পাতা নিজে শিরোনাম আঁকে না, শুধু সেখানে */}
        {title && <h1 className="adm-page-heading">{title}</h1>}

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