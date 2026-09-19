import { useState } from "react";
import filamentoLogo from "../assets/logo/filamento.png";
import { useAdminAuth, useDocumentTitle } from "./AdminAuth";

/* ⚠️ অস্থায়ী পাতা — ধাপ ৩ এ এর জায়গায় Figma র পুরো Dashboard
   (sidebar, উপরের সংখ্যার card, Home Page Sections এর তালিকা,
   Recent Leads, Activity) বসবে.

   এখন শুধু দেখাচ্ছে login ব্যবস্থাটা মাথা থেকে পা পর্যন্ত কাজ করছে:
   কে ঢুকেছে, কোন ভূমিকায়, আর বেরিয়ে যাওয়া যায় */
function AdminHome() {
  const { admin, signOut } = useAdminAuth();
  const [leaving, setLeaving] = useState(false);

  useDocumentTitle("Dashboard");

  const handleSignOut = async () => {
    setLeaving(true);
    await signOut();
    /* signOut এর পর status "out" হয়ে যায়, তাই RequireAdmin নিজেই
       login পাতায় পাঠিয়ে দেয় — এখানে navigate করার দরকার নেই */
  };

  return (
    <main className="admin-shell">
      <div className="admin-panel">
        <img
          className="admin-panel-logo"
          src={filamentoLogo}
          alt="Filamento"
          width="175"
          height="32"
        />

        <h1 className="admin-panel-title">Welcome back, {admin?.name}</h1>
        <p className="admin-panel-text">
          You are signed in. The dashboard is being built next.
        </p>

        <dl className="admin-facts">
          <div className="admin-fact">
            <dt>Email</dt>
            <dd>{admin?.email}</dd>
          </div>
          <div className="admin-fact">
            <dt>Role</dt>
            <dd>
              <span className="admin-badge">{admin?.role}</span>
            </dd>
          </div>
        </dl>

        <button
          type="button"
          className="admin-signout"
          onClick={handleSignOut}
          disabled={leaving}
          aria-busy={leaving}
        >
          {leaving ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </main>
  );
}

export default AdminHome;