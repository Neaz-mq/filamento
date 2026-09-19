import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "./AdminAuth";
import { IconDashboard, IconLogout, IconPerson, IconShare } from "./icons";

/* ===============================================================
   উপরের ডান পাশের গোল বোতাম — চাপলে ছোট মেনু

   ভেতরে: কে ঢুকেছে, কোন ভূমিকায়, Dashboard এ ফেরা, সাইট দেখা,
   আর বেরিয়ে যাওয়া.

   বাইরে চাপলে বা Esc চাপলে মেনু বন্ধ হয় আর focus বোতামে ফেরত যায় —
   keyboard এ চালালেও হারিয়ে যায় না
   =============================================================== */

const ROLE_TEXT = {
  owner: "Owner · super admin",
  admin: "Admin",
  editor: "Editor",
};

function AdminUserMenu() {
  const { admin, signOut } = useAdminAuth();
  const [open, setOpen] = useState(false);

  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const firstItemRef = useRef(null);

  const name = admin?.name || "Admin";

  // মেনুর বাইরে চাপলে বন্ধ
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };

    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // খুললেই প্রথম সারিতে focus
  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  return (
    <div className="adm-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        ref={buttonRef}
        className="adm-avatar"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${name}`}
      >
        <IconPerson size={18} />
      </button>

      {open && (
        <div className="adm-menu" role="menu">
          <div className="adm-menu-head">
            <span className="adm-menu-avatar" aria-hidden="true">
              <IconPerson size={16} />
            </span>
            <span className="adm-menu-who">
              <span className="adm-menu-name">{name}</span>
              <span className="adm-menu-mail">{admin?.email}</span>
            </span>
          </div>

          <p className="adm-menu-role">
            {ROLE_TEXT[admin?.role] || admin?.role}
          </p>

          <div className="adm-menu-sep" />

          <Link
            to="/admin"
            className="adm-menu-item"
            role="menuitem"
            ref={firstItemRef}
            onClick={() => setOpen(false)}
          >
            <IconDashboard size={18} />
            Dashboard
          </Link>

          {/* সাইটের হোম পাতা — নতুন tab এ, যাতে admin panel খোলা থাকে */}
          <a
            href="/"
            className="adm-menu-item"
            role="menuitem"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <IconShare size={18} />
            View site
          </a>

          <div className="adm-menu-sep" />

          <button
            type="button"
            className="adm-menu-item adm-menu-item--out"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            <IconLogout size={18} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUserMenu;