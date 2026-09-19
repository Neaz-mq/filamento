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

  /* Technologies section এর video view.
     GET  → { views: { thermal: 12, optical: 40, driver: 3 } }
     POST → { id, count, counted } — counted false মানে server এই
            বারটা গোনেনি (একই জায়গা থেকে খুব ঘন ঘন), count তবু
            সর্বশেষ সংখ্যা */
  getVideoViews: () => request("/api/video-views"),
  addVideoView: (id) =>
    request(`/api/video-views/${encodeURIComponent(id)}`, { method: "POST" }),
};