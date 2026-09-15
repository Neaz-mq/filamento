/* Vite এ শুধু VITE_ দিয়ে শুরু হওয়া variable গুলোই browser এ পৌঁছায়।
   এগুলো build এর সময় কোডে বসে যায়, তাই কোনো গোপন জিনিস (API key,
   password) এখানে রাখা যাবে না — browser এ দেখা যাবে */
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
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
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
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
};
