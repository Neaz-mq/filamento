import { Outlet } from "react-router-dom";
import { RequireAdmin } from "./AdminAuth";

/* এর ভেতরের সব পাতা login ছাড়া দেখা যায় না.

   route এ এটার নিজের কোনো path নেই — শুধু একটা মোড়ক. নতুন admin
   পাতা (Products, Leads, Settings …) App.jsx এ এটার children হিসেবে
   যোগ করলেই সেগুলোও নিজে থেকে পাহারার ভেতরে চলে আসে.

   ধাপ ৩ এ Figma র sidebar আর উপরের header ও এখানেই বসবে — তখন
   Outlet টা ডান পাশের অংশে যাবে */
function AdminProtected() {
  return (
    <RequireAdmin>
      <Outlet />
    </RequireAdmin>
  );
}

export default AdminProtected;