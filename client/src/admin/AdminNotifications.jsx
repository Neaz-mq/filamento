import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IconBell, IconReceipt } from "./icons";
import { interestOf, timeAgo } from "./leadFormat";

/* ===============================================================
   উপরের 🔔 — নতুন quote request এর খবর

   হলুদ সংখ্যা = শেষবার 🔔 খোলার পরে যে নতুন (এখনো উত্তর না দেওয়া)
   request এসেছে. 🔔 খুললেই সংখ্যা মুছে যায় — "দেখা হয়েছে" এই
   browser এ মনে রাখা হয়. অন্য কম্পিউটারে খুললে সেখানে আলাদা হিসাব.

   editor গ্রাহকের তথ্য দেখেন না, তাই তাঁর 🔔 এ সংখ্যা আসে না —
   খুললে শুধু সেটাই লেখা থাকে.

   data আসে AdminProtected থেকে (useLeadAlerts) — বাঁ মেনুর Leads
   এর সংখ্যাও একই উত্তর থেকে, তাই দুই জায়গায় আলাদা request লাগে না
   =============================================================== */

const SEEN_KEY = "fil_admin_leads_seen";

const readSeen = () => {
  try {
    return window.localStorage.getItem(SEEN_KEY) || "";
  } catch {
    return ""; // ব্যক্তিগত window তে localStorage বন্ধ থাকতে পারে
  }
};

function AdminNotifications({ data }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(readSeen);

  const wrapRef = useRef(null);
  const buttonRef = useRef(null);

  const items = data?.items ?? [];
  const seenTime = seen ? new Date(seen).getTime() : 0;
  const unread = items.filter(
    (item) => item.status === "new" && new Date(item.createdAt).getTime() > seenTime,
  ).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    // খোলার সাথে সাথে "দেখা হয়েছে" — server এর সময় ধরে, যাতে এই
    // কম্পিউটারের ঘড়ি ভুল থাকলেও হিসাব না গোলায়
    if (next && data?.generatedAt) {
      setSeen(data.generatedAt);
      try {
        window.localStorage.setItem(SEEN_KEY, data.generatedAt);
      } catch {
        // রাখা গেল না — পরের বার আবার সংখ্যা দেখাবে, ক্ষতি নেই
      }
    }
  };

  // বাইরে চাপলে বা Esc চাপলে বন্ধ
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

  const label = unread
    ? `Notifications: ${unread} new quote request${unread === 1 ? "" : "s"}`
    : "Notifications";

  return (
    <div className="adm-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        ref={buttonRef}
        className="adm-icon-btn adm-bell"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label}
        title="Notifications"
      >
        <IconBell size={18} />
        {unread > 0 && (
          <span className="adm-bell-count" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="adm-menu adm-notes">
          <div className="adm-notes-head">
            <p className="adm-notes-title">Notifications</p>
            {data?.canSeeLeads && data.newCount > 0 && (
              <span className="adm-notes-new">{data.newCount} awaiting reply</span>
            )}
          </div>

          {!data ? (
            <p className="adm-notes-empty">Checking for new leads…</p>
          ) : !data.canSeeLeads ? (
            <p className="adm-notes-empty">
              New lead alerts go to owners and admins.
            </p>
          ) : items.length === 0 ? (
            <p className="adm-notes-empty">
              No quote requests yet. They’ll show up here as soon as someone
              sends the contact form.
            </p>
          ) : (
            <ul className="adm-notes-list">
              {items.map((item) => {
                const fresh =
                  item.status === "new" && new Date(item.createdAt).getTime() > seenTime;
                return (
                  <li key={item.id}>
                    <Link
                      to="/admin/leads"
                      className={fresh ? "adm-note is-fresh" : "adm-note"}
                      onClick={() => setOpen(false)}
                    >
                      <span className="adm-note-icon" aria-hidden="true">
                        <IconReceipt size={18} />
                      </span>
                      <span className="adm-note-text">
                        <span className="adm-note-title">
                          {item.name || "Someone"} sent a quote request
                        </span>
                        <span className="adm-note-sub">
                          {[item.company, interestOf(item.facilityType)]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="adm-note-time">
                        {timeAgo(item.createdAt, data.generatedAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {data?.canSeeLeads && (
            <Link
              to="/admin/leads"
              className="adm-notes-all"
              onClick={() => setOpen(false)}
            >
              View all leads
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;
