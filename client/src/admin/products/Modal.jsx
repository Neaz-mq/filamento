import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

/* ===============================================================
   পপ-আপ জানালা (Choose a Category, Add Video, মোছার নিশ্চিতকরণ …)

   যা যা সামলায়:
     • Esc চাপলে বা বাইরের কালো অংশে চাপলে বন্ধ (busy থাকলে না —
       upload বা save চলার মাঝে হঠাৎ বন্ধ হয়ে গেলে কাজ হারাত)
     • খোলার সাথে সাথে ভেতরের প্রথম ঘরে focus, Tab ভেতরেই ঘোরে,
       বন্ধ হলে আগের বোতামে focus ফেরে — keyboard দিয়েও চলে
     • পেছনের পাতা নড়ে না. scrollbar লুকানোর সময় পাতা যাতে পাশে
       সরে না যায়, তার সমান জায়গা padding দিয়ে ধরে রাখা হয়
   =============================================================== */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// একসাথে একাধিক modal খোলা থাকলে (যেমন modal এর ভেতর থেকে আরেকটা)
let openCount = 0;

function lockScroll() {
  openCount += 1;
  if (openCount > 1) return;
  const gap = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = "hidden";
  if (gap > 0) document.body.style.paddingRight = `${gap}px`;
}

function unlockScroll() {
  openCount = Math.max(0, openCount - 1);
  if (openCount > 0) return;
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}

function Modal({
  title,
  onClose,
  children,
  footer,
  size = "md",
  busy = false,
  className = "",
  labelledBy,
  describedBy,
  initialFocus,
}) {
  const panelRef = useRef(null);
  const titleId = useId();

  /* onClose আর busy সবসময় সর্বশেষটা — effect গুলো শুধু একবার
     চলে, তাই ref ছাড়া পুরনো মান ধরে রাখত */
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  useEffect(() => {
    closeRef.current = onClose;
    busyRef.current = busy;
  });

  useEffect(() => {
    const previous = document.activeElement;
    lockScroll();

    const panel = panelRef.current;
    const target =
      (initialFocus && panel?.querySelector(initialFocus)) ||
      panel?.querySelector("[data-autofocus]") ||
      panel?.querySelector(FOCUSABLE);
    (target || panel)?.focus({ preventScroll: true });

    const onKey = (event) => {
      if (event.key === "Escape" && !busyRef.current) {
        event.stopPropagation();
        closeRef.current?.();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      );
      if (!items.length) return;

      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockScroll();
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true });
    };
    // শুধু খোলা আর বন্ধের সময়
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className="pd-modal-scrim"
      onMouseDown={(event) => {
        // শুধু কালো অংশে চাপলে — ভেতরে টেনে এনে ছাড়লে না
        if (event.target === event.currentTarget && !busyRef.current) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        className={`pd-modal pd-modal--${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || (title ? titleId : undefined)}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        {title && (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        )}
        {children}
        {footer && <div className="pd-modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;

/* ---------------------------------------------------------------
   হ্যাঁ/না জিজ্ঞেস করার ছোট modal — মোছা, না save করে বেরোনো
   --------------------------------------------------------------- */
export function ConfirmModal({
  title,
  children,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  error = "",
  onConfirm,
  onClose,
}) {
  const headId = useId();
  const bodyId = useId();

  return (
    <Modal
      size="sm"
      onClose={onClose}
      busy={busy}
      labelledBy={headId}
      describedBy={bodyId}
      footer={
        <>
          <button
            type="button"
            className="pd-btn pd-btn--line pd-btn--grow"
            onClick={onClose}
            disabled={busy}
            data-autofocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`pd-btn pd-btn--grow ${tone === "danger" ? "pd-btn--danger" : "pd-btn--yellow"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="pd-confirm">
        <h2 id={headId} className="pd-confirm-title">
          {title}
        </h2>
        <div id={bodyId} className="pd-confirm-text">
          {children}
        </div>
        {error && (
          <p className="adm-banner adm-banner--bad" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
