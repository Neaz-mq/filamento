import { Link, useLocation, useParams } from "react-router-dom";
import { useDocumentTitle } from "./AdminAuth";
import { homeSections } from "./dashboardData";
import { IconArrowRight, IconLayers } from "./icons";

/* admin এর যে পাতাগুলো এখনো বানানো হয়নি, তারা সবাই এটা দেখায়.

   ফাঁকা পাতা বা ভাঙা link এর বদলে পরিষ্কার করে বলা হচ্ছে কী আসছে —
   admin যেন বুঝতে পারে জায়গাটা আছে, কাজটা এখনো হয়নি.

   ✅ কোনো পাতা তৈরি হলে App.jsx এর ADMIN_SOON তালিকা থেকে নামটা
   মুছে আসল component দিয়ে route যোগ করবেন */

const NAMES = {
  products: "Products",
  projects: "Projects",
  application: "Application",
  company: "Company",
  shop: "Shop",
  media: "Media Library",
  pages: "Pages",
  leads: "Leads",
  testimonials: "Testimonials",
  users: "Users & Roles",
  activity: "Activity Logs",
  settings: "Settings",
};

function AdminSoon() {
  const { section } = useParams();
  const location = useLocation();

  let name = "This page";

  if (section) {
    const match = homeSections.find((item) => item.slug === section);
    name = match ? match.name : "This section";
  } else {
    const slug = location.pathname.replace("/admin/", "");
    name = NAMES[slug] || "This page";
  }

  useDocumentTitle(name);

  return (
    <section className="adm-panel adm-soon">
      <span className="adm-soon-icon">
        <IconLayers />
      </span>
      <h2 className="adm-soon-title">{name}</h2>
      <p className="adm-soon-text">
        This part of the admin panel is being built. Product upload comes first,
        then the rest of the pages.
      </p>
      <Link className="adm-soon-link" to="/admin">
        Back to dashboard
        <IconArrowRight size={18} />
      </Link>
    </section>
  );
}

export default AdminSoon;