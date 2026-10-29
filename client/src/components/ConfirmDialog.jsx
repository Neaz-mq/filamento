import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./ConfirmDialog.css";

/* ===============================================================
   ConfirmDialog — window.confirm() এর বদলে সাইটের নিজস্ব ডায়ালগ

   সরাসরি ব্যবহার না করে useConfirm() হুক দিয়ে ব্যবহার করুন
   (useConfirm.jsx). এই ফাইলে শুধু কম্পোনেন্ট — যাতে fast refresh
   আর react-hooks lint ঠিক থাকে
   =============================================================== */

function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default", // "default" | "danger"
  onClose,
}) {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // ভুল করে Enter চাপলে যেন কিছু মুছে না যায় — তাই শুরুতে Cancel এ ফোকাস
    cancelRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose(false);
        return;
      }

      // Tab ডায়ালগের ভেতরেই ঘোরে
      if (event.key === "Tab") {
        const buttons = dialogRef.current?.querySelectorAll("button");
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="cd-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose(false)}
    >
      <div
        ref={dialogRef}
        className={`cd-dialog cd-${tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cd-title"
        aria-describedby="cd-message"
      >
        <div className="cd-icon" aria-hidden="true">
          {tone === "danger" ? (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16h.01" />
            </svg>
          )}
        </div>

        <h2 id="cd-title" className="cd-title">
          {title}
        </h2>
        <p id="cd-message" className="cd-message">
          {message}
        </p>

        <div className="cd-actions">
          <button ref={cancelRef} type="button" className="cd-btn cd-btn-cancel" onClick={() => onClose(false)}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`cd-btn cd-btn-confirm${tone === "danger" ? " is-danger" : ""}`}
            onClick={() => onClose(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ConfirmDialog;