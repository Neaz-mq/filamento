import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AdminAuthProvider, AdminLoading } from "./AdminAuth";
import "./admin.css";

/* /admin/... সব পাতার বাইরের খোল.

   এখানে public সাইটের Navbar বা Footer নেই — admin panel আলাদা
   জগৎ, তাই App.jsx এ এটা ভাষার route গুলোর বাইরে বসানো.

   পুরো admin অংশ আলাদা chunk এ থাকে (App.jsx এ lazy), তাই সাধারণ
   দর্শকের browser এ এই কোড বা admin.css কখনো নামে না */
function AdminRoot() {
  /* অসম্পূর্ণ বা ব্যক্তিগত পাতা Google এ index হওয়ার কিছু নেই.
     এটা লুকিয়ে রাখা কোনো সুরক্ষা নয় — আসল পাহারা server এ */
  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);

    return () => robots.remove();
  }, []);

  return (
    <AdminAuthProvider>
      {/* ভেতরের পাতাগুলোও lazy — সেগুলো নামার ফাঁকে এই পর্দা */}
      <Suspense fallback={<AdminLoading />}>
        <Outlet />
      </Suspense>
    </AdminAuthProvider>
  );
}

export default AdminRoot;