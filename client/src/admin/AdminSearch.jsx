import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { SEARCH_ITEMS } from "./navItems";
import { IconBox, IconClose, IconFolder, IconSearch } from "./icons";

/* ===============================================================
   উপরের search — Figma: "Search everything…" লেখা গোল ঘর (318 চওড়া)

   কী কী খোঁজে:
     Pages    — admin এর সব পাতা আর Home পাতার অংশগুলো (এই browser এ)
     Products — নাম, series বা slug মিললে (server থেকে, draft সহ)
     Projects — নাম বা company মিললে (server থেকে, draft সহ)

   ২ অক্ষরের কম লিখলে শুধু Pages — server এ অযথা request যায় না.
   টাইপ থামার 250ms পরে server এ খোঁজে.

   keyboard: Ctrl/⌘ + K যেখান থেকেই হোক এখানে আনে, ↑ ↓ নাড়ে,
   Enter খোলে, Esc বন্ধ করে
   =============================================================== */

// কিছু না লিখলে যেগুলো আগে দেখানো হয়
const SUGGESTED = ["/admin", "/admin/products", "/admin/projects", "/admin/leads"];

const startItems = SUGGESTED.map((to) => SEARCH_ITEMS.find((item) => item.to === to)).filter(
  Boolean,
);

const REMOTE_MIN = 2;
const REMOTE_DELAY = 250;
const PER_GROUP = 4;

/* মিল বের করা — লেখাটা শব্দে ভাগ করে প্রতিটা শব্দ আলাদা করে
   মেলানো হয়, তাই "hero image" লিখলেও Hero Section পাওয়া যায় */
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

function searchPages(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return startItems;

  return SEARCH_ITEMS.map((item) => ({ item, score: rank(item, terms) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((row) => row.item);
}

function AdminSearch() {
  const navigate = useNavigate();
  const listId = useId();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  // server এর উত্তর — কোন লেখার জন্য, সেটা সহ (পুরনো ধীর উত্তর নতুনটাকে ঢাকে না)
  const [remote, setRemote] = useState({ query: "", products: [], projects: [] });

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const term = query.trim();
  const wantsRemote = term.length >= REMOTE_MIN;

  /* ---------- server এ product আর project খোঁজা ---------- */
  useEffect(() => {
    if (!wantsRemote) return undefined;
    let alive = true;

    const timer = window.setTimeout(() => {
      Promise.all([
        api.adminListProducts({ q: term, limit: 5 }).catch(() => null),
        api.adminListProjects({ q: term, limit: 5 }).catch(() => null),
      ]).then(([products, projects]) => {
        if (!alive) return;
        setRemote({
          query: term,
          products: (products?.items ?? []).slice(0, PER_GROUP),
          projects: (projects?.items ?? []).slice(0, PER_GROUP),
        });
      });
    }, REMOTE_DELAY);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [term, wantsRemote]);

  const remoteReady = wantsRemote && remote.query === term;

  /* ---------- সব ফল এক তালিকায় — ↑ ↓ এক থেকে আরেক দলে যায় ---------- */
  const groups = useMemo(() => {
    const list = [
      {
        id: "pages",
        title: term ? "Pages" : "Jump to",
        rows: searchPages(term).map((item) => ({
          key: `page:${item.to}`,
          to: item.to,
          label: item.label,
          note: item.group,
          Icon: item.Icon,
        })),
      },
    ];

    if (remoteReady) {
      list.push({
        id: "products",
        title: "Products",
        rows: remote.products.map((item) => ({
          key: `product:${item.id}`,
          to: `/admin/products/${item.id}`,
          label: item.name || "Untitled product",
          note: item.status === "published" ? "Published" : "Draft",
          Icon: IconBox,
        })),
      });
      list.push({
        id: "projects",
        title: "Projects",
        rows: remote.projects.map((item) => ({
          key: `project:${item.id}`,
          to: `/admin/projects/${item.id}`,
          label: item.title || "Untitled project",
          note: item.status === "draft" ? "Draft" : "Live",
          Icon: IconFolder,
        })),
      });
    }

    return list.filter((group) => group.rows.length);
  }, [term, remoteReady, remote]);

  const rows = groups.flatMap((group) => group.rows);
  // প্রতিটা দলের প্রথম সারি পুরো তালিকার কত নম্বরে
  const starts = groups.map((_, at) =>
    groups.slice(0, at).reduce((sum, group) => sum + group.rows.length, 0),
  );
  const safeActive = Math.min(active, Math.max(rows.length - 1, 0));

  const close = ({ blur = false } = {}) => {
    setOpen(false);
    setQuery("");
    setActive(0);
    if (blur) inputRef.current?.blur();
  };

  // বাইরে চাপলে বন্ধ
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
        setActive(0);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Ctrl/⌘ + K — যেখান থেকেই হোক search এ
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (row) => {
    if (!row) return;
    navigate(row.to);
    close({ blur: true });
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close({ blur: true });
      return;
    }
    if (!open) setOpen(true);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((safeActive + 1) % Math.max(rows.length, 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(safeActive === 0 ? Math.max(rows.length - 1, 0) : safeActive - 1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      go(rows[safeActive]);
    }
  };

  return (
    <div className={open ? "adm-search is-open" : "adm-search"} ref={wrapRef} role="search">
      <div className="adm-search-box">
        <span className="adm-search-icon" aria-hidden="true">
          <IconSearch size={18} />
        </span>

        <input
          ref={inputRef}
          className="adm-search-input"
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search everything…"
          autoComplete="off"
          spellCheck="false"
          maxLength={60}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && rows[safeActive] ? `${listId}-${safeActive}` : undefined}
          aria-label="Search pages, products and projects"
          title="Search (Ctrl + K)"
        />

        {query && (
          <button
            type="button"
            className="adm-search-x"
            onClick={() => {
              setQuery("");
              setActive(0);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <IconClose size={16} />
          </button>
        )}
      </div>

      {open && (
        <div className="adm-search-panel">
          <div id={listId} role="listbox" aria-label="Search results">
            {groups.map((group, groupAt) => (
              <div className="adm-search-group" key={group.id} role="group" aria-label={group.title}>
                <p className="adm-search-head" aria-hidden="true">
                  {group.title}
                </p>
                <ul className="adm-search-list" role="presentation">
                  {group.rows.map((row, rowAt) => {
                    const at = starts[groupAt] + rowAt;
                    const Icon = row.Icon;
                    return (
                      <li key={row.key} role="presentation">
                        <button
                          type="button"
                          id={`${listId}-${at}`}
                          role="option"
                          aria-selected={at === safeActive}
                          tabIndex={-1}
                          className={at === safeActive ? "adm-search-row is-active" : "adm-search-row"}
                          onMouseMove={() => setActive(at)}
                          onClick={() => go(row)}
                        >
                          <span className="adm-search-row-icon">
                            <Icon size={18} />
                          </span>
                          <span className="adm-search-row-text">{row.label}</span>
                          <span className="adm-search-row-group">{row.note}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {wantsRemote && !remoteReady && <p className="adm-search-empty">Searching products and projects…</p>}

          {remoteReady && !rows.length && (
            <p className="adm-search-empty">Nothing matches “{term}”.</p>
          )}

          <p className="adm-search-foot">
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to close
          </p>
        </div>
      )}
    </div>
  );
}

export default AdminSearch;
