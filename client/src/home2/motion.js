import { useEffect, useRef, useState } from "react";

/* ===============================================================
   নতুন Home পাতার animation এর ছোট সাহায্যকারী

   lag না হওয়ার নিয়মগুলো এখানেই:
     • পুরো পাতায় একটাই IntersectionObserver — প্রতিটা element এর
       জন্য আলাদা observer বা scroll listener নয়
     • একবার দেখা দিলে observer ওটা ছেড়ে দেয় — পরে আর কোনো কাজ নেই
     • animation শুধু transform আর opacity তে (CSS এ) — এ দুটো
       GPU তে চলে, পাতার layout আবার হিসাব করতে হয় না
   =============================================================== */

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------------
   useReveal — root এর ভেতরের সব [data-reveal] element পর্দায় এলে
   তাতে data-shown বসায়, CSS বাকিটা করে (HomeTwo.css এ "reveal").

   class নয়, data-shown — কারণ React কোনো element এর className বদলালে
   (যেমন active হলে) হাতে যোগ করা class মুছে দিত, আর element টা আবার
   লুকিয়ে যেত. data-shown React চেনে না, তাই ছোঁয়ও না.

   ⚠️ পাতা খোলার পরে নতুন [data-reveal] যোগ হলে (যেমন tab বদলে) সেটা
   ধরা হয় না — এখনকার সব অংশ শুরু থেকেই পাতায় থাকে, তাই দরকার নেই
   --------------------------------------------------------------- */
export function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const targets = root.querySelectorAll("[data-reveal]");
    const show = (el) => el.setAttribute("data-shown", "");

    // পুরনো ব্রাউজার বা কম-নড়াচড়া চাওয়া দর্শক — সাথে সাথে সব দেখা
    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      targets.forEach(show);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      /* নিচের 8% পার হলে শুরু — একদম কিনারায় এসেই চালু হলে দর্শক
         animation এর শুরুটা দেখতেই পায় না */
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);
}

/* ---------------------------------------------------------------
   useInView — একটা element পর্দায় আছে কিনা (বারবার বদলায়).
   hero র card ঘোরানো বা counter এর মতো কাজ পর্দার বাইরে গেলে থামাতে
   --------------------------------------------------------------- */
export function useInView(ref, { once = false, rootMargin = "0px" } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      const id = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, once, rootMargin]);

  return inView;
}

/* ---------------------------------------------------------------
   useSwipe — mouse বা আঙুল দিয়ে ডানে-বাঁয়ে টানা

   onMove(dx)          — টানার সময় প্রতি নড়াচড়ায়, dx = কত px সরেছে
   onEnd(dx, velocity) — ছেড়ে দিলে; velocity = px/ms (ঝটকা দিয়ে
                         ছুড়লে বড় হয়). মাঝপথে বাতিল হলে dx = 0

   নিয়মগুলো:
     • 6px না সরা পর্যন্ত টানা শুরু হয় না — সাধারণ ক্লিক আগের মতোই
       কাজ করে (link খোলে, play চলে)
     • আঙুল খাড়া দিকে বেশি গেলে এটা scroll — তখন ছেড়ে দেওয়া হয়,
       পাতা স্বাভাবিকভাবে scroll হয় (CSS এ touch-action: pan-y)
     • টানা শেষে যে click আসে সেটা আটকানো হয় — নাহলে card টানলেই
       link খুলে যেত
     • টানার সময় element এ data-dragging বসে — CSS তখন transition
       বন্ধ রাখে, card আঙুলের সাথে সাথে নড়ে

   listener গুলো সরাসরি DOM এ, React এর state এ নয় — প্রতি নড়াচড়ায়
   React কে আবার আঁকতে হয় না, তাই টানা মসৃণ থাকে
   --------------------------------------------------------------- */
const DRAG_START_PX = 6;

export function useSwipe(ref, { enabled = true, onMove, onEnd }) {
  const handlers = useRef({ onMove, onEnd });

  // সর্বশেষ function গুলো রাখা — listener আবার বসাতে হয় না
  useEffect(() => {
    handlers.current = { onMove, onEnd };
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;

    let start = null;
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;

    const blockClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const onDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      dragging = false;
      lastX = event.clientX;
      lastT = event.timeStamp;
      velocity = 0;
    };

    const onPointerMove = (event) => {
      if (!start || event.pointerId !== start.id) return;

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;

      if (!dragging) {
        if (Math.abs(dx) < DRAG_START_PX && Math.abs(dy) < DRAG_START_PX) return;
        // খাড়া দিকে বেশি — এটা scroll, টানা নয়
        if (Math.abs(dy) > Math.abs(dx)) {
          start = null;
          return;
        }
        dragging = true;
        el.setPointerCapture?.(event.pointerId);
        el.setAttribute("data-dragging", "");
      }

      const dt = event.timeStamp - lastT;
      if (dt > 0) velocity = (event.clientX - lastX) / dt;
      lastX = event.clientX;
      lastT = event.timeStamp;

      handlers.current.onMove?.(dx);
    };

    const finish = (event) => {
      if (!start || event.pointerId !== start.id) return;

      const dx = event.clientX - start.x;
      const wasDragging = dragging;
      start = null;
      dragging = false;
      if (!wasDragging) return;

      el.removeAttribute("data-dragging");

      // ঠিক পরের click টা (যদি আসে) আটকানো, তারপর listener সরানো
      el.addEventListener("click", blockClick, { capture: true, once: true });
      setTimeout(() => el.removeEventListener("click", blockClick, { capture: true }), 0);

      const cancelled = event.type === "pointercancel";
      handlers.current.onEnd?.(cancelled ? 0 : dx, cancelled ? 0 : velocity);
    };

    // mouse দিয়ে ছবি বা link টানলে ব্রাউজারের নিজের "drag" শুরু হতো
    const stopNativeDrag = (event) => event.preventDefault();

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", finish);
    el.addEventListener("dragstart", stopNativeDrag);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", finish);
      el.removeEventListener("pointercancel", finish);
      el.removeEventListener("dragstart", stopNativeDrag);
      el.removeAttribute("data-dragging");
    };
  }, [ref, enabled]);
}

/* কতটা টানলে বা কত জোরে ছুড়লে পরের card এ যাবে */
export const isSwipe = (dx, velocity, distance = 80) =>
  Math.abs(dx) > distance || (Math.abs(velocity) > 0.45 && Math.abs(dx) > 24);
