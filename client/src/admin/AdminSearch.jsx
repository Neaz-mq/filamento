import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEARCH_ITEMS } from "./navItems";
import { IconClose, IconSearch } from "./icons";

/* ===============================================================
   উপরের search

   গোল বোতামে চাপলে ঘরটা পাশে খুলে যায়, আর নিচে মিলে যাওয়া
   পাতাগুলোর তালিকা নামে. Enter চাপলে বা সারিতে চাপলে সেই পাতায়
   চলে যায়.

   এখন শুধু admin এর পাতাগুলো খোঁজে — মেনুতে যা যা আছে, সাথে Home
   পাতার আলাদা অংশগুলো. পরে product বা lead এর ভেতরে খোঁজা যোগ
   করতে হলে navItems.js এর তালিকাটা বড় করলেই হবে.

   keyboard: Ctrl/⌘ + K খোলে, ↑ ↓ নাড়ে, Enter যায়, Esc বন্ধ করে
   =============================================================== */

// কিছু না লিখলে যেগুলো আগে দেখানো হয়
const SUGGESTED = ["/admin", "/admin/products", "/admin/leads", "/admin/users"];

const startItems = SUGGESTED.map((to) =>
  SEARCH_ITEMS.find((item) => item.to === to),
).filter(Boolean);

/* মিল বের করা.

   লেখাটা শব্দে ভাগ করে প্রতিটা শব্দ আলাদা করে মেলানো হয় — তাই
   "hero image" লিখলেও Hero Section পাওয়া যায় (বর্ণনায় "image"
   আছে). সব শব্দ না মিললে সেই পাতা বাদ */
function rank(item, terms) {
  const label = item.label.toLowerCase();
  const hay = `${label} ${item.group} ${item.keywords || ""}`.toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (!hay.includes(term)) return 0;
    if (label.startsWith(term)) score += 3;
    else if (label.includes(term)) score += 2;
    else score += 1;
  }
  return score;
}

function search(query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return startItems;

  return SEARCH_ITEMS.map((item) => ({ item, score: rank(item, terms) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((row) => row.item);
}

function AdminSearch() {
  const navigate = useNavigate();
  const listId = useId();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);

  const results = useMemo(() => search(query), [query]);

  // লেখা বদলালে বাছাইটা আবার প্রথম সারিতে
  useEffect(() => {
    setActive(0);
  }, [query]);

  const close = (focusButton = false) => {
    setOpen(false);
    setQuery("");
    if (focusButton) buttonRef.current?.focus();
  };

  // খুললেই কার্সার ঘরে
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // বাইরে চাপলে বন্ধ
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Ctrl/⌘ + K — যেখান থেকেই হোক search খোলে
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (item) => {
    if (!item) return;
    navigate(item.to);
    close();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % Math.max(results.length, 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) =>
        index === 0 ? Math.max(results.length - 1, 0) : index - 1,
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]);
    }
  };

  return (
    <div className={open ? "adm-search is-open" : "adm-search"} ref={wrapRef}>
      <div className="adm-search-box">
        <span className="adm-search-icon" aria-hidden="true">
          <IconSearch size={20} />
        </span>

        <input
          ref={inputRef}
          className="adm-search-input"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search pages…"
          autoComplete="off"
          spellCheck="false"
          maxLength={60}
          /* বন্ধ অবস্থায় ঘরটা চোখে নেই, তাই Tab এ এখানে থামে না */
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && results[active] ? `${listId}-${active}` : undefined
          }
          aria-label="Search admin pages"
        />

        {open ? (
          <button
            type="button"
            className="adm-search-x"
            onClick={() => close(true)}
            aria-label="Close search"
          >
            <IconClose size={18} />
          </button>
        ) : (
          /* বন্ধ অবস্থায় পুরো গোলটার উপর একটা স্বচ্ছ বোতাম — এতে
             খোলা-বন্ধ হওয়ার সময় গঠন বদলায় না, তাই ঘরটা ঝাঁকি ছাড়া
             পাশে খুলতে পারে */
          <button
            type="button"
            ref={buttonRef}
            className="adm-search-open"
            onClick={() => setOpen(true)}
            aria-label="Search pages"
            aria-expanded={false}
          />
        )}
      </div>

      {open && (
        <div className="adm-search-panel">
          <p className="adm-search-head">
            {query.trim() ? "Pages" : "Jump to"}
          </p>

          <ul className="adm-search-list" id={listId} role="listbox">
            {results.map((item, index) => {
              const Icon = item.Icon;
              return (
                <li key={item.to}>
                  <button
                    type="button"
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    className={
                      index === active
                        ? "adm-search-row is-active"
                        : "adm-search-row"
                    }
                    onMouseMove={() => setActive(index)}
                    onClick={() => go(item)}
                  >
                    <span className="adm-search-row-icon">
                      <Icon size={18} />
                    </span>
                    <span className="adm-search-row-text">{item.label}</span>
                    <span className="adm-search-row-group">{item.group}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {!results.length && (
            <p className="adm-search-empty">
              No page matches “{query.trim()}”.
            </p>
          )}

          <p className="adm-search-foot">
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to
            close
          </p>
        </div>
      )}
    </div>
  );
}

export default AdminSearch;