import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["react-router-dom"],
  },

  /* dev এ /api/... এর request গুলো নিজের server (5173) হয়ে
     backend (5000) এ যায়.

     সরাসরি localhost:5000 এ না পাঠানোর কারণ — তাহলে browser এর
     চোখে দুইটা আলাদা সাইট হতো আর admin login এর cookie আটকে যেত.
     production এ vercel.json ঠিক এই কাজটাই করে, তাই dev আর live
     এ আচরণ একই থাকে.

     backend অন্য port এ চালালে শুধু নিচের 5000 বদলাবেন */
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: false,
      },
    },
  },
});