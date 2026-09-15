import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// App এর আগেই import করতে হবে — Navbar render হওয়ার সময় i18n
// ইতিমধ্যে init হয়ে থাকতে হবে, নাহলে প্রথম frame এ key দেখাবে
import "./i18n";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
