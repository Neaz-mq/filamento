/* ---------------------------------------------------------------
   Backend এর সাথে কথা বলার একটাই জায়গা

   ঠিকানা ইচ্ছে করে ফাঁকা — "/api/..." মানে সাইটের নিজের ঠিকানা:

     dev এ         vite.config.js এর proxy সেটা localhost:5000 এ পাঠায়
     production এ  vercel.json এর rewrite সেটা filamento-api তে পাঠায়

   অন্য domain এ সরাসরি না পাঠানোর কারণ admin login. Chrome আর
   Safari এখন অন্য সাইটের cookie আটকে দেয় — তাহলে login করার পরের
   request এই logout হয়ে যেত. একই সাইট বলে cookie নির্বিঘ্নে চলে,
   আর CORS এরও দরকার পড়ে না.

   ⚠️ VITE_API_URL আর ব্যবহার হয় না. Vercel এ ওটা থেকে গেলেও ক্ষতি
   নেই, কোড আর পড়ে না — চাইলে মুছে দিতে পারেন
   --------------------------------------------------------------- */

/* admin এর session মাঝপথে শেষ হলে (8 ঘণ্টা পেরোলে, অন্য owner
   ভূমিকা বদলালে বা সরিয়ে দিলে) server 401 দেয়. তখন এই event টা
   ছোড়া হয়, আর AdminAuth.jsx সেটা শুনে login পাতায় পাঠায় — নাহলে
   পাতা খোলা থাকত আর প্রতিটা বোতামে শুধু "Not signed in" লেখা আসত.

   login আর /me বাদ: login এ 401 মানে ভুল password, আর /me এর 401
   AdminAuth নিজেই সামলায় */
export const SIGNED_OUT_EVENT = "filamento:admin-signed-out";
const OWN_401 = ["/api/auth/login", "/api/auth/me"];

async function request(path, options = {}) {
  const response = await fetch(path, {
    // login এর cookie যেন প্রতিটা request এর সাথে যায়
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  /* fetch শুধু network fail এ throw করে — 404 বা 500 এও resolve
     করে। তাই status নিজে থেকে দেখতে হয়, নাহলে error response টাই
     সফল data হিসেবে চলে যেত */
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // response টা JSON না — উপরের default message ই থাক
    }

    /* status টাও সাথে দেওয়া হচ্ছে — login পাতা এটা দেখে ঠিক করে
       কী দেখাবে (401 = ভুল password, 429 = অনেকবার চেষ্টা,
       status নেই = server এ পৌঁছানোই যায়নি) */
    if (response.status === 401 && !OWN_401.includes(path)) {
      window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  /* ---------- Admin login ----------
     cookie টা server বসায় আর browser নিজে রাখে — এখানে কোনো
     token ধরে রাখার দরকার নেই */
  login: (email, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request("/api/auth/logout", { method: "POST" }),

  // "আমি কে" — login না থাকলে 401 দেয়
  me: () => request("/api/auth/me"),

  /* ---------- Admin দের তালিকা (Users & Roles) ----------
     পড়া যে কোনো admin পারে, কিন্তু বানানো/বদলানো/মোছা শুধু owner.
     আসল পাহারা server এ — এখানে শুধু কী দেখানো হবে সেটা ঠিক হয় */
  listAdmins: () => request("/api/admins"),

  createAdmin: (data) =>
    request("/api/admins", { method: "POST", body: JSON.stringify(data) }),

  updateAdmin: (id, data) =>
    request(`/api/admins/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteAdmin: (id) => request(`/api/admins/${id}`, { method: "DELETE" }),

  /* ---------- Product ---------- */
  getProducts: () => request("/api/products"),
  getProduct: (id) => request(`/api/products/${id}`),
  createProduct: (data) =>
    request("/api/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id, data) =>
    request(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProduct: (id) =>
    request(`/api/products/${id}`, { method: "DELETE" }),

  /* admin panel — draft সহ সব product.
     params: { q, status, series, category, sort, page, limit } —
     ফাঁকা মানগুলো ঠিকানায় যায় না */
  adminListProducts: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    ).toString();
    return request(`/api/products/admin/list${query ? `?${query}` : ""}`);
  },
  adminGetProduct: (id) => request(`/api/products/admin/${id}`),
  duplicateProduct: (id) =>
    request(`/api/products/${id}/duplicate`, { method: "POST" }),

  /* Cloudinary তে ফাইল তোলার অনুমতিপত্র.
     kind: "image" | "video" | "document" */
  signUpload: (kind) =>
    request("/api/uploads/sign", {
      method: "POST",
      body: JSON.stringify({ kind }),
    }),

  /* ---------- Quote request (Home এর Contact form) ----------
     পাঠানো সবার জন্য খোলা; তালিকা শুধু owner/admin (Leads পাতা) */
  createQuoteRequest: (data) =>
    request("/api/quote-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listQuoteRequests: () => request("/api/quote-requests"),

  /* ---------- Newsletter (নতুন Home এর footer) ---------- */
  subscribeNewsletter: (email, locale) =>
    request("/api/newsletter", {
      method: "POST",
      body: JSON.stringify({ email, locale }),
    }),

  /* Technologies section এর video view.
     GET  → { views: { thermal: 12, optical: 40, driver: 3 } }
     POST → { id, count, counted } — counted false মানে server এই
            বারটা গোনেনি (একই জায়গা থেকে খুব ঘন ঘন), count তবু
            সর্বশেষ সংখ্যা */
  getVideoViews: () => request("/api/video-views"),
  addVideoView: (id) =>
    request(`/api/video-views/${encodeURIComponent(id)}`, { method: "POST" }),
};