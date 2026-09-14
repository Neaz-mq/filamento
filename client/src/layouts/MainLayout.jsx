import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

function MainLayout() {
  return (
    /* 100vh মোবাইলে address bar কে হিসাবে ধরে, তাই scroll এ layout
       লাফায় — dvh সেটা ঠিক করে */
    <div className="shell flex flex-col" style={{ minHeight: "100dvh" }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;