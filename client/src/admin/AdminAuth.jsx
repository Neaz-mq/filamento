import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";

/* ===============================================================
   Admin কে — এক জায়গায়

   /admin খোলার সময় একবার "/api/auth/me" জিজ্ঞেস করা হয়:
     সাড়া পেলে  → login আছে, কে সেটাও জানা গেল
     401 এলে     → login নেই

   status তিন রকম: "checking" | "in" | "out"

   "checking" আলাদা রাখা জরুরি. নাহলে জিজ্ঞেস করার ফাঁকেই status
   "out" ধরে নিয়ে login পাতায় ছুঁড়ে ফেলত, তারপর উত্তর এলে আবার
   ফিরিয়ে আনত — প্রতিবার refresh এ একটা ঝলকানি দেখা যেত.

   ⚠️ এই তথ্যটা শুধু কী দেখানো হবে সেটা ঠিক করে, পাহারা নয়.
   আসল পাহারা server এ (requireAdmin middleware) — browser এর
   কোনো কিছু বদলে কেউ সত্যিকারের কিছু করতে পারবে না
   =============================================================== */

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then((data) => {
        if (cancelled) return;
        setAdmin(data.admin);
        setStatus("in");
      })
      .catch(() => {
        // 401 (login নেই) আর server বন্ধ — দুই ক্ষেত্রেই ঢুকতে দেওয়া হয় না
        if (cancelled) return;
        setAdmin(null);
        setStatus("out");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    setAdmin(data.admin);
    setStatus("in");
    return data.admin;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      /* server এ কিছু ভুল হলেও এদিকে বের করে দেওয়া হয় — cookie
         মেয়াদ শেষে এমনিতেই বাতিল হবে, আর ব্যবহারকারী আটকে থাকবে না */
      setAdmin(null);
      setStatus("out");
    }
  }, []);

  const value = useMemo(
    () => ({ admin, status, signIn, signOut }),
    [admin, status, signIn, signOut],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) {
    throw new Error("useAdminAuth শুধু AdminAuthProvider এর ভেতরে চলে");
  }
  return value;
}

/* ---------------------------------------------------------------
   ব্রাউজার ট্যাবের শিরোনাম — admin পাতা ছেড়ে গেলে আগেরটা ফেরত
   --------------------------------------------------------------- */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | Filamento admin`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

/* ---------------------------------------------------------------
   অপেক্ষার পর্দা — "কে" জানার ফাঁকে, আর admin এর কোড নামার ফাঁকে
   --------------------------------------------------------------- */
export function AdminLoading() {
  return (
    <div className="admin-loading" role="status" aria-live="polite">
      <span className="admin-spinner" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

/* ---------------------------------------------------------------
   login ছাড়া ঢোকা যায় না — এমন পাতাগুলো এটা দিয়ে মোড়ানো
   --------------------------------------------------------------- */
export function RequireAdmin({ children }) {
  const { status } = useAdminAuth();
  const location = useLocation();

  if (status === "checking") return <AdminLoading />;

  if (status === "out") {
    /* কোন পাতায় যেতে চেয়েছিল সেটা মনে রাখা হচ্ছে — login এর পর
       সেখানেই ফিরিয়ে দেওয়া হয়.
       replace — back চাপলে আবার এই আটকে যাওয়া পাতায় পড়বে না */
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}