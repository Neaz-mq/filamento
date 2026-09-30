import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "./icons";

/* ===============================================================
   নিজের বানানো dropdown — Figma "Program Type popup" এর মতো দেখতে
   (সাদা, গোল কোণা, হালকা ছায়া, বাছা সারি ধূসর).

   ব্রাউজারের <select> এর খোলা তালিকা এভাবে সাজানো যায় না, তাই নিজে
   বানানো — কিন্তু keyboard আর screen reader এ <select> এর মতোই:
     Enter / Space / ↓ খোলে,  ↑ ↓ সারি বদলায়,  Home / End প্রথম/শেষ,
     Enter / Space বেছে নেয়,  Esc / Tab / বাইরে ক্লিক বন্ধ করে.
   focus সবসময় বোতামেই থাকে; কোন সারি চিহ্নিত সেটা
   aria-activedescendant দিয়ে জানানো হয়.

   renderValue / renderOption — ফোনের দেশ বাছাইয়ে পতাকা দেখাতে.
   না দিলে শুধু লেখা (option.label)
   =============================================================== */

function NhSelect({
  labelId,
  value,
  options,
  onChange,
  placeholder,
  className = "",
  renderValue,
  renderOption,
  ariaLabel,
}) {
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

  // লম্বা তালিকায় চিহ্নিত সারিটা যেন চোখের সামনে থাকে
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
      className={`nh-select ${className}`}
      data-open={open ? "" : undefined}
    >
      <button
        type="button"
        className="nh-select-button"
        data-empty={selected ? undefined : ""}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={ariaLabel ? undefined : `${labelId} ${id}-value`}
        aria-label={ariaLabel}
        aria-activedescendant={
          open && highlight >= 0 ? `${id}-opt-${highlight}` : undefined
        }
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span id={`${id}-value`} className="nh-select-value">
          {selected
            ? renderValue
              ? renderValue(selected)
              : selected.label
            : placeholder}
        </span>
        <ChevronDown />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="nh-select-list"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-opt-${index}`}
              data-index={index}
              role="option"
              aria-selected={option.value === value}
              className="nh-select-option"
              data-highlight={index === highlight ? "" : undefined}
              onPointerEnter={() => setHighlight(index)}
              /* pointerdown এ বাছা — click পর্যন্ত অপেক্ষা করলে বোতাম
                 থেকে focus সরে যেত */
              onPointerDown={(event) => {
                event.preventDefault();
                choose(index);
              }}
            >
              {renderOption ? renderOption(option) : option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NhSelect;
