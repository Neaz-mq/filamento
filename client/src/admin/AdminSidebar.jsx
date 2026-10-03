import { NavLink } from "react-router-dom";
import filamentoLogo from "../assets/logo/filamento.png";
import { useAdminAuth } from "./AdminAuth";
import { DASHBOARD, NAV_GROUPS } from "./navItems";
import { IconLogout, IconPanel } from "./icons";

/* ===============================================================
   বাঁ পাশের মেনু

   Home এখন একটাই link — "Home Page Content" পাতা (/admin/home),
   যার ভেতরে উপরে পাঁচটা ট্যাব (Figma). আগে এখানে নিচে নামা
   সাতটা অংশের তালিকা ছিল, সেটা আর নেই. Home এর ভেতরের যেকোনো
   ট্যাবে থাকলেও Home হলুদ থাকে (NavLink নিজেই /admin/home/… মেলায়).

   মেনুর সব সারি navItems.js থেকে আসে
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

function AdminSidebar({ railed, onToggle, badges = {} }) {
  const { signOut } = useAdminAuth();

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
        {NAV_GROUPS[0].items.map((item) => (
          <NavRow key={item.to} {...item} badge={badges[item.to]} />
        ))}
      </div>

      {NAV_GROUPS.slice(1).map((group) => (
        <div className="adm-side-group" key={group.id}>
          <p className="adm-side-label">{group.label}</p>
          {/* badges — বাইরে থেকে আসা আসল সংখ্যা (যেমন উত্তর না দেওয়া
              lead). সংখ্যা না থাকলে কিছু দেখায় না */}
          {group.items.map((item) => (
            <NavRow key={item.to} {...item} badge={badges[item.to]} />
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