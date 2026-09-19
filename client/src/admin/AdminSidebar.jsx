import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import filamentoLogo from "../assets/logo/filamento.png";
import { useAdminAuth } from "./AdminAuth";
import { homeSections } from "./dashboardData";
import { DASHBOARD, NAV_GROUPS } from "./navItems";
import { IconChevron, IconHome, IconLogout, IconPanel } from "./icons";

/* ===============================================================
   বাঁ পাশের মেনু

   Figma তে "Home" দুইবার আছে — একবার সাধারণ link, আরেকবার খোলা
   অবস্থায় ভেতরের অংশগুলো সহ. দুইটা একই জিনিস, তাই একটাই রাখা
   হয়েছে: সারিতে চাপলে নিচের তালিকা খোলে/বন্ধ হয়.

   এখনো শুধু Dashboard পাতাটা আসল. বাকি সব link "তৈরি হচ্ছে" পাতায়
   নিয়ে যায় (AdminSoon) — ধাপে ধাপে সেগুলো আসল পাতা হবে
   =============================================================== */

/* NavLink এর className — চালু পাতায় হলুদ */
const navClass = ({ isActive }) =>
  isActive ? "adm-nav adm-nav--on" : "adm-nav";

/* title — সরু অবস্থায় শুধু icon দেখা যায়, তাই মাউস রাখলে নামটা ভেসে
   ওঠে. লেখাগুলো CSS এ চোখের আড়াল করা হয়, মুছে ফেলা হয় না — screen
   reader তখনো পুরো নাম পড়ে শোনায় */
function NavRow({ to, label, Icon, badge, end }) {
  return (
    <NavLink to={to} className={navClass} end={end} title={label}>
      <span className="adm-nav-icon">
        <Icon />
      </span>
      <span className="adm-nav-label">{label}</span>
      {badge !== undefined && <span className="adm-nav-badge">{badge}</span>}
      <span className="adm-nav-mark" aria-hidden="true" />
    </NavLink>
  );
}

function AdminSidebar({ railed, onToggle, onExpand }) {
  const { signOut } = useAdminAuth();
  const location = useLocation();

  /* Home এর ভেতরের কোনো অংশে থাকলে তালিকাটা খোলা অবস্থায় শুরু হয় */
  const insideHome = location.pathname.startsWith("/admin/home");
  const [homeOpen, setHomeOpen] = useState(insideHome);

  /* সরু অবস্থায় Home এ চাপলে ভেতরের তালিকা দেখানোর জায়গা নেই —
     তাই আগে মেনুটা চওড়া হয়, তারপর তালিকা খোলে */
  const handleHome = () => {
    if (railed) {
      onExpand();
      setHomeOpen(true);
      return;
    }
    setHomeOpen((open) => !open);
  };

  return (
    <nav className="adm-side" aria-label="Admin">
      <div className="adm-side-top">
        <img
          className="adm-side-logo"
          src={filamentoLogo}
          alt="Filamento"
          width="175"
          height="32"
        />
        <button
          type="button"
          className="adm-side-close"
          onClick={onToggle}
          aria-label={railed ? "Expand menu" : "Minimise menu"}
          title={railed ? "Expand menu" : "Minimise menu"}
        >
          <IconPanel />
        </button>
      </div>

      <NavRow {...DASHBOARD} />

      <div className="adm-side-group">
        <p className="adm-side-label">{NAV_GROUPS[0].label}</p>

        {/* Home — চাপলে নিচের অংশগুলো খোলে */}
        <button
          type="button"
          className={homeOpen ? "adm-nav adm-nav--open" : "adm-nav"}
          onClick={handleHome}
          aria-expanded={railed ? false : homeOpen}
          aria-controls="adm-home-sections"
          title="Home"
        >
          <span className="adm-nav-icon">
            <IconHome />
          </span>
          <span className="adm-nav-label">Home</span>
          <span
            className={
              homeOpen ? "adm-nav-caret adm-nav-caret--up" : "adm-nav-caret"
            }
            aria-hidden="true"
          >
            <IconChevron size={20} />
          </span>
          <span className="adm-nav-mark" aria-hidden="true" />
        </button>

        {homeOpen && !railed && (
          <ul className="adm-subnav" id="adm-home-sections">
            {homeSections.map((section) => (
              <li key={section.slug}>
                <NavLink
                  to={`/admin/home/${section.slug}`}
                  className={({ isActive }) =>
                    isActive ? "adm-sub adm-sub--on" : "adm-sub"
                  }
                >
                  <span className="adm-sub-dot" aria-hidden="true" />
                  {section.name}
                </NavLink>
              </li>
            ))}
          </ul>
        )}

        {NAV_GROUPS[0].items.map((item) => (
          <NavRow key={item.to} {...item} />
        ))}
      </div>

      {NAV_GROUPS.slice(1).map((group) => (
        <div className="adm-side-group" key={group.id}>
          <p className="adm-side-label">{group.label}</p>
          {group.items.map((item) => (
            <NavRow key={item.to} {...item} />
          ))}
        </div>
      ))}

      <div className="adm-side-group">
        {/* Logout — link নয়, কাজ করে. তাই button */}
        <button
          type="button"
          className="adm-nav"
          onClick={signOut}
          title="Logout"
        >
          <span className="adm-nav-icon">
            <IconLogout />
          </span>
          <span className="adm-nav-label">Logout</span>
          <span className="adm-nav-mark" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export default AdminSidebar;