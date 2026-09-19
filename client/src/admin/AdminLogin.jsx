import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import filamentoLogo from "../assets/logo/filamento.png";
import { AdminLoading, useAdminAuth, useDocumentTitle } from "./AdminAuth";

/* ===============================================================
   /admin/login

   সাইটের কোথাও এই পাতার link নেই — admin নিজে ঠিকানাটা bookmark
   করে রাখবেন. গ্রাহকের কোনো account নেই, তাই sign up পাতাও নেই;
   নতুন admin তৈরি হয় terminal থেকে (server/scripts/create-admin.js).

   admin panel এর লেখা ইংরেজিতে — Figma র ডিজাইনও ইংরেজিতে, আর
   এটা শুধু ভেতরের কাজের জন্য, তাই তিন ভাষার দরকার নেই
   =============================================================== */

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10.7 5.1A10.9 10.9 0 0 1 12 5c5 0 8.6 3.3 9.9 6.6a1 1 0 0 1 0 .7 13 13 0 0 1-2.2 3.4" />
      <path d="M6.6 6.6A13.5 13.5 0 0 0 2.1 11.6a1 1 0 0 0 0 .7C3.4 15.7 7 19 12 19a10.8 10.8 0 0 0 5.4-1.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

function AdminLogin() {
  const { status, signIn } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useDocumentTitle("Sign in");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const emailRef = useRef(null);

  // পাতা খুললেই কার্সার ইমেইলের ঘরে
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  /* যে পাতায় যেতে চেয়ে আটকে গিয়েছিল সেখানেই ফেরত, নাহলে dashboard.
     "/admin" দিয়ে শুরু না হলে নেওয়া হয় না — কেউ যেন তৈরি করা link
     দিয়ে অন্য কোথাও পাঠাতে না পারে */
  const from = location.state?.from?.pathname;
  const target = from && from.startsWith("/admin") ? from : "/admin";

  if (status === "checking") return <AdminLoading />;

  // আগে থেকেই login থাকলে login পাতা দেখানোর মানে নেই
  if (status === "in") return <Navigate to={target} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSending(true);
    setError("");

    try {
      await signIn(trimmedEmail, password);
      // সফল হলে এই component সরে যায়, তাই আর কোনো state বদলানো হয় না
      navigate(target, { replace: true });
    } catch (requestError) {
      const status = requestError.status;

      /* server নিজে যা বলেছে সেটাই দেখানো হয় — ভুল password
         ("Invalid email or password", ইচ্ছে করে অস্পষ্ট, কোন ইমেইল
         আছে সেটা ফাঁস করে না) আর অনেকবার চেষ্টার বার্তা দুইটাই
         ওখান থেকে আসে.

         কিন্তু status না থাকলে (internet নেই) বা 500+ হলে (server
         বন্ধ, proxy ব্যর্থ) ওই বার্তাগুলো মানুষের কোনো কাজে লাগে না
         — "Request failed (502)" দেখে কেউ কিছু বুঝত না */
      setError(
        !status || status >= 500
          ? "The server is not responding right now. Please try again in a moment."
          : requestError.message,
      );
      setPassword("");
      setSending(false);
    }
  };

  return (
    <main className="admin-auth">
      <div className="admin-auth-card">
        <img
          className="admin-auth-logo"
          src={filamentoLogo}
          alt="Filamento"
          width="175"
          height="32"
        />

        <h1 className="admin-auth-title">Sign in</h1>
        <p className="admin-auth-text">
          Admin access to the Filamento website.
        </p>

        {/* noValidate — ব্রাউজারের নিজের bubble এর বদলে আমাদের বার্তা */}
        <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
          <div className="admin-field">
            <label className="admin-label" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              ref={emailRef}
              className="admin-input"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@filamento.com"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              maxLength={200}
              disabled={sending}
            />
          </div>

          <div className="admin-field">
            <label className="admin-label" htmlFor="admin-password">
              Password
            </label>
            <div className="admin-input-wrap">
              <input
                id="admin-password"
                className="admin-input has-button"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                maxLength={200}
                disabled={sending}
              />
              <button
                type="button"
                className="admin-reveal"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={sending}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* role="alert" — ভুল হলে screen reader সাথে সাথে পড়ে শোনায় */}
          {error && (
            <p className="admin-auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="admin-auth-submit"
            disabled={sending}
            aria-busy={sending}
          >
            {sending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="admin-auth-note">
          Authorised staff only. Ask an owner to create your account.
        </p>
      </div>
    </main>
  );
}

export default AdminLogin;