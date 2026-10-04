import { useEffect, useId, useRef, useState } from "react";
import "./ProjectSelect.css";

/* ===============================================================
   Projects পাতার environment dropdown — admin এর AdminSelect এর
   মতো দেখতে: সাদা তালিকা, গোল কোণা, হালকা ছায়া, বাছা সারি ধূসর.

   ব্রাউজারের <select> এর খোলা তালিকা সাজানো যায় না (Windows এ নীল
   সারি আসে), তাই নিজে বানানো. keyboard আর screen reader এ
   <select> এর মতোই:
     Enter / Space / ↓ খোলে,  ↑ ↓ সারি বদলায,  Home / End প্রথম/শেষ,
     Enter / Space বেছে নেয়,  Esc / Tab / বাইরে ক্লিক বন্ধ করে
   =============================================================== */

function ChevronDown() {
  return (
    <svg width="10" height="5" viewBox="0 0 10 5" fill="none" aria-hidden="true">
      <path
        d="M1 .75 5 4.25 9 .75"
        stroke="#373A3C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProjectSelect({ value, options, onChange, ariaLabel }) {
  const id = useId();
  const listId = `${id}-list`;
  const rootRef = useRef(null);
  const listRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];

  const openList = () => {
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (index) => {
    onChange(options[index].value);
    setOpen(false);
  };

  // বাইরে চাপলে বন্ধ
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // চিহ্নিত সারিটা যেন চোখের সামনে থাকে
  useEffect(() => {
    if (!open || highlight < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  const onKeyDown = (event) => {
    const last = options.length - 1;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlight((current) => Math.min(current + 1, last));
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlight((current) => Math.max(current - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setHighlight(0);
        break;
      case "End":
        event.preventDefault();
        setHighlight(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (highlight >= 0) choose(highlight);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={rootRef}
      className="projects-env-select"
      data-open={open ? "" : undefined}
    >
      <button
        type="button"
        className="projects-env-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-activedescendant={
          open && highlight >= 0 ? `${id}-opt-${highlight}` : undefined
        }
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className="projects-env-value">{selected?.label}</span>
        <span className="projects-env-chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="projects-env-menu"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-opt-${index}`}
              data-index={index}
              role="option"
              aria-selected={option.value === value}
              className={`projects-env-option${
                option.value === value ? " is-selected" : ""
              }${index === highlight ? " is-active" : ""}`}
              onPointerEnter={() => setHighlight(index)}
              /* pointerdown এ বাছা — click পর্যন্ত অপেক্ষা করলে বোতাম
                 থেকে focus সরে যেত */
              onPointerDown={(event) => {
                event.preventDefault();
                choose(index);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProjectSelect;