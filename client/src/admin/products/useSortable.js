import { useState } from "react";

/* ===============================================================
   টেনে সাজানো (drag and drop) — তালিকা, টেবিলের সারি, video, ফাইল

   HTML এর নিজের drag-and-drop ফোনে চলে না, তাই pointer event দিয়ে
   নিজে বানানো — mouse, আঙুল আর pen সব এক কোডে.

   ব্যবহার:
     const sort = useSortable(onMove);
     <div {...sort.list}>
       {items.map((item, i) => (
         <div data-sort-row className={sort.rowClass(i)}>
           <button {...sort.handle(i, items.length)} />   ← হাতল

   কীভাবে: হাতল ধরে টানলে pointer যে সারির ঘরের ভেতরে যায়, জিনিসটা
   সেই জায়গায় সরে (onMove(from, to)). উপর-নিচ নয়, ঘরের ভেতরে কি না
   দেখা হয় — তাই দুই কলামের তালিকাতেও চলে.

   সারিগুলো খোঁজা হয় হাতল থেকে DOM ধরে উপরে উঠে ([data-sort-list]) —
   ref লাগে না, তাই render এর সময় কিছু পড়তে হয় না.

   keyboard: হাতলে focus করে ↑ / ↓ চাপলে এক ঘর সরে

   ⚠️ onMove এর ভেতরে setState সবসময় function দিয়ে (prev => …) —
   টানার পুরো সময় একই onMove ধরা থাকে, পুরনো state দেখলে ভুল হতো
   =============================================================== */

const EDGE = 64; // পর্দার কিনারার এত কাছে গেলে পাতা নিজে থেকে সরে

const rowsOf = (element) => {
  const list = element?.closest("[data-sort-list]");
  return list ? [...list.querySelectorAll("[data-sort-row]")].filter(
    (row) => row.closest("[data-sort-list]") === list,
  ) : [];
};

export function useSortable(onMove) {
  const [dragIndex, setDragIndex] = useState(null);

  const handle = (index, total) => ({
    type: "button",
    "data-sort-handle": "",
    className: "pd-grip",
    "aria-label": `Move item ${index + 1}. Drag, or use the arrow keys.`,
    title: "Drag to reorder",

    onPointerDown(event) {
      if (event.button !== 0) return;
      event.preventDefault();

      const target = event.currentTarget;
      target.setPointerCapture?.(event.pointerId);

      let current = index;
      setDragIndex(current);

      const move = (moveEvent) => {
        const { clientX, clientY } = moveEvent;
        const list = rowsOf(target);

        let next = list.findIndex((row) => {
          const box = row.getBoundingClientRect();
          return (
            clientX >= box.left &&
            clientX <= box.right &&
            clientY >= box.top &&
            clientY <= box.bottom
          );
        });

        // তালিকার উপরে বা নিচে বেরিয়ে গেলে প্রথম বা শেষ ঘর
        if (next === -1 && list.length) {
          const top = list[0].getBoundingClientRect().top;
          const bottom = list.at(-1).getBoundingClientRect().bottom;
          if (clientY < top) next = 0;
          else if (clientY > bottom) next = list.length - 1;
        }

        if (next > -1 && next !== current) {
          onMove(current, next);
          current = next;
          setDragIndex(next);
        }

        if (clientY < EDGE) window.scrollBy(0, -12);
        else if (clientY > window.innerHeight - EDGE) window.scrollBy(0, 12);
      };

      const end = () => {
        target.removeEventListener("pointermove", move);
        target.removeEventListener("pointerup", end);
        target.removeEventListener("pointercancel", end);
        setDragIndex(null);
      };

      target.addEventListener("pointermove", move);
      target.addEventListener("pointerup", end);
      target.addEventListener("pointercancel", end);
    },

    onKeyDown(event) {
      const last = (total ?? rowsOf(event.currentTarget).length) - 1;
      const to =
        event.key === "ArrowUp" && index > 0
          ? index - 1
          : event.key === "ArrowDown" && index < last
            ? index + 1
            : -1;
      if (to === -1) return;

      event.preventDefault();
      const target = event.currentTarget;
      onMove(index, to);

      // নতুন জায়গার হাতলে focus — render শেষ হলে
      window.requestAnimationFrame(() => {
        rowsOf(target)[to]?.querySelector("[data-sort-handle]")?.focus();
      });
    },
  });

  const rowClass = (index) => (dragIndex === index ? "is-dragging" : "");

  return {
    list: { "data-sort-list": "" },
    handle,
    rowClass,
    dragging: dragIndex !== null,
  };
}

// তালিকার একটা জিনিস from থেকে to তে সরানো — নতুন তালিকা ফেরত
export const moveItem = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};
