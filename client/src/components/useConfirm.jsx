import { useCallback, useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

/* ===============================================================
   useConfirm — window.confirm() এর বদলে

   const { confirm, dialog } = useConfirm();

   const ok = await confirm({
     title: "Delete representative?",
     message: "…",
     confirmLabel: "Delete",
     cancelLabel: "Cancel",      // ঐচ্ছিক
     tone: "danger",             // "danger" | "default"
   });
   if (!ok) return;

   আর JSX এর ভেতরে কোথাও একবার: {dialog}
   =============================================================== */
export function useConfirm() {
  const [options, setOptions] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback(
    (next) =>
      new Promise((resolve) => {
        // আগের ডায়ালগ খোলা থাকলে সেটা "না" ধরে বন্ধ
        resolverRef.current?.(false);
        resolverRef.current = resolve;
        setOptions(next);
      }),
    [],
  );

  const close = useCallback((result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const dialog = options ? <ConfirmDialog {...options} onClose={close} /> : null;

  return { confirm, dialog };
}