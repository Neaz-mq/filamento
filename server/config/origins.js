import "dotenv/config";

/* কোন কোন সাইট থেকে আসা request গ্রহণ করা হবে.

   CLIENT_URL এ কমা দিয়ে একাধিক origin দেওয়া যায় — Vercel এ preview
   deployment গুলোর URL আলাদা হয়, তাই সেগুলোও লাগতে পারে.
   যেমন: https://filamento-beta.vercel.app,https://www.filamento.com

   দুই জায়গায় ব্যবহার হয় (তাই আলাদা ফাইলে):
     app.js        — CORS
     lib/auth.js   — admin এর লেখার request (login, product যোগ ...)
                     অন্য সাইট থেকে এলে আটকানো (CSRF সুরক্ষা) */
export const allowedOrigins = (process.env.CLIENT_URL ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

/* CLIENT_URL সেট না থাকলে (local dev) সবাইকে ঢুকতে দেওয়া হয় —
   production এ অবশ্যই সেট থাকতে হবে */
export const isAllowedOrigin = (origin) =>
  allowedOrigins.length === 0 || allowedOrigins.includes(origin);