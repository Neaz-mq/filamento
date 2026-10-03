import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./AdminSelect.css";

/* ===============================================================
   admin এর dropdown — browser এর <select> এর বদলে

   কেন: <select> খুললে যে তালিকা নামে, সেটা browser নিজে আঁকে
   (Windows এ নীল দাগ, চৌকো কোণ) — CSS দিয়ে বদলানো যায় না. তাই
   ভাষা বদলের menu র মতো (সাদা, গোল কোণ, হালকা ছায়া, ধূসর
   hover) নিজে বানানো.

   ব্যবহার একদম <select> এর মতো — শুধু নামটা বদলান:

     <AdminSelect value={x} onChange={(e) => setX(e.target.value)}>
       <option value="">All Status</option>
       <option value="draft">Draft</option>
     </AdminSelect>

   onChange এ আগের মতোই event.target.value (সবসময় লেখা/string)
   আসে, তাই পুরনো কোড কিছুই বদলাতে হয় না. className, id, disabled,
   aria-label, name — সব আগের মতো কাজ করে.

   তালিকাটা পাতার একদম উপরে (portal) বসে — তাই modal বা টেবিলের
   ভেতরে থাকলেও কাটা পড়ে না. নিচে জায়গা না থাকলে উপরে খোলে.

   keyboard: ↑ ↓ Home End দিয়ে সরা, Enter/Space এ বাছা, Esc এ বন্ধ,
   অক্ষর টাইপ করলে সেই অক্ষরের প্রথমটায় যায়
   =============================================================== */

const GAP = 6; // ঘর আর তালিকার মাঝে ফাঁক
const EDGE = 8; // পর্দার কিনারা থেকে অন্তত এতটা দূরে

/* <option> গুলো থেকে { value, label, disabled } — শর্তসাপেক্ষে
   বসানো option (false/null) আর array নিজে থেকেই সামলায় */
function readOptions(children) {
  const list = [];
  Children.toArray(children).forEach((child) => {
    if (!isValidElement(child)) return;
    if (child.type === "option") {
      const { value, children: label, disabled } = child.props;
      const text = Children.toArray(label).join("");
      list.push({ value: String(value ?? text), label: text, disabled: Boolean(disabled) });
    } else if (child.type === "optgroup") {
      list.push(...readOptions(child.props.children));
    }
  });
  return list;
}

function AdminSelect({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
  id,
  name,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}) {
  const options = readOptions(children);
  const current = String(value ?? "");
  const selectedIndex = options.findIndex((option) => option.value === current);
  const selected = options[selectedIndex] ?? options[0];

  const listId = useId();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const typed = useRef({ text: "", timer: 0 });

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus({ preventScroll: true });
  };

  const openMenu = (start = selectedIndex) => {
    if (disabled || !options.length) return;
    setActive(start > -1 ? start : options.findIndex((option) => !option.disabled));
    setOpen(true);
  };

  const choose = (index) => {
    const option = options[index];
    if (!option || option.disabled) return;
    close();
    if (option.value !== current) {
      const target = { value: option.value, name };
      onChange?.({ target, currentTarget: target });
    }
  };

  /* তালিকার জায়গা ঠিক করা — ঘরের ঠিক নিচে, জায়গা না থাকলে উপরে.
     সরাসরি DOM এ বসানো হয় (render এর পরে মাপা লাগে). পাতা সরলে
     আবার ডাকা হয়, তাই তালিকা ঘরের সাথেই থাকে */
  const place = () => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return true;

    const box = trigger.getBoundingClientRect();
    // ঘরটাই পর্দা থেকে সরে গেলে তালিকা রাখার মানে নেই
    if (box.bottom < 0 || box.top > window.innerHeight) return false;

    const below = window.innerHeight - box.bottom - GAP - EDGE;
    const above = box.top - GAP - EDGE;
    const wanted = Math.min(menu.scrollHeight, 320);
    const upward = below < wanted && above > below;
    const room = Math.max(120, upward ? above : below);

    menu.style.minWidth = `${Math.max(box.width, 160)}px`;
    menu.style.maxHeight = `${Math.min(320, room)}px`;

    const width = menu.offsetWidth;
    const left = Math.min(Math.max(EDGE, box.left), window.innerWidth - width - EDGE);
    menu.style.left = `${Math.max(EDGE, left)}px`;

    const height = menu.offsetHeight;
    menu.style.top = `${upward ? box.top - GAP - height : box.bottom + GAP}px`;
    menu.style.visibility = "visible";
    return true;
  };

  useLayoutEffect(() => {
    if (open) place();
  });

  // খোলার সাথে সাথে তালিকায় focus — keyboard দিয়ে সরা যায়
  useEffect(() => {
    if (open) menuRef.current?.focus({ preventScroll: true });
  }, [open]);

  // keyboard এ সরলে চালু সারিটা চোখের সামনে রাখা
  useEffect(() => {
    if (!open || active < 0) return;
    menuRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  /* বাইরে চাপলে বন্ধ */
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (menuRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      close(false);
    };
    // পাতা সরলে তালিকাও সাথে সরে; ঘর পর্দার বাইরে গেলে বন্ধ
    const onScroll = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      if (!place()) close(false);
    };
    const onResize = () => {
      if (!place()) close(false);
    };
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(typed.current.timer), []);

  /* পরের বাছাযোগ্য সারি (disabled বাদ) */
  const step = (from, direction) => {
    for (let i = 1; i <= options.length; i += 1) {
      const next = (from + direction * i + options.length) % options.length;
      if (!options[next].disabled) return next;
    }
    return from;
  };

  /* অক্ষর টাইপ — "w" চাপলে "Warehouse" এ যায় */
  const typeAhead = (key) => {
    const memory = typed.current;
    window.clearTimeout(memory.timer);
    memory.text += key.toLowerCase();
    memory.timer = window.setTimeout(() => {
      memory.text = "";
    }, 600);
    return options.findIndex(
      (option) => !option.disabled && option.label.toLowerCase().startsWith(memory.text),
    );
  };

  const onTriggerKey = (event) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const found = typeAhead(event.key);
      if (found > -1) openMenu(found);
    }
  };

  const onMenuKey = (event) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((index) => step(index, 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => step(index, -1));
        break;
      case "Home":
        event.preventDefault();
        setActive(step(-1, 1));
        break;
      case "End":
        event.preventDefault();
        setActive(step(options.length, -1));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation(); // modal এর ভেতরে থাকলে modal টা যেন বন্ধ না হয়
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const found = typeAhead(event.key);
          if (found > -1) setActive(found);
        }
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        name={name}
        className={`as-trigger ${className}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKey}
      >
        <span className="as-value">{selected?.label ?? ""}</span>
      </button>

      {open &&
        createPortal(
          <ul
            ref={menuRef}
            id={listId}
            className="as-menu"
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-activedescendant={active > -1 ? `${listId}-${active}` : undefined}
            onKeyDown={onMenuKey}
          >
            {options.map((option, index) => (
              <li
                key={`${option.value}-${index}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                aria-disabled={option.disabled || undefined}
                className={`as-option${index === selectedIndex ? " is-selected" : ""}${
                  index === active ? " is-active" : ""
                }${option.disabled ? " is-disabled" : ""}`}
                onPointerEnter={() => !option.disabled && setActive(index)}
                onClick={() => choose(index)}
              >
                {option.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}

export default AdminSelect;
