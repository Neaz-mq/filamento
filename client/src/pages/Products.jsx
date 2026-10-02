import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import ProductCard from "../components/products/ProductCard";
import { CategoryPicture } from "../components/products/CategoryArt";
import {
  Chevron,
  CheckIcon,
  CloseIcon,
  PageArrow,
  ResetIcon,
  SearchIcon,
  SlidersIcon,
  Triangle,
} from "../components/products/ProductIcons";
import {
  ALL_CATEGORY,
  CATEGORIES,
  FILTER_GROUPS,
  SORTS,
  compareDefault,
  optionLabel,
  useCatalog,
  useMediaQuery,
  usePageTitle,
} from "./productCatalog";
import "./Products.css";

/* ===============================================================
   PRODUCTS — তালিকার পাতা (Figma "Frame 285")

     category slider (1240 x 170, radius 40) — All Products + ৮টা category
        │ gap 48
     ┌ Filters খোলা: বাঁয়ে 250 চওড়া Filters ── gap 32 ── ডানে grid (958)
     └ Filters বন্ধ:  উপরে "Filters ▸ · All Products · Sort by", নিচে
                      পুরো চওড়া grid (3 কলাম, card 400 x 358, gap 20)
        │ gap 32
     pagination (Previous 1 2 … 5 Next)

   কীভাবে কাজ করে (industry standard):
     • সব published product একবারে নামে (হালকা তালিকা). খোঁজা, filter,
       সাজানো আর পাতা ভাগ browser এ — তাই click এ সাথে সাথে বদলায়
     • যা বাছা হয় সব ঠিকানায় থাকে (?category=…&cct=4000k,5000k&sort=…
       &page=2) — link share করা, reload বা Back চাপলে একই অবস্থা
     • এক group এর ভেতরে "অথবা" (4000K অথবা 5000K), আলাদা group এর
       মধ্যে "এবং" (CCT এবং CRI)
     • প্রতিটা মানের পাশের সংখ্যা = ওটা বাছলে কয়টা product আসবে
       (ওই group বাদে বাকি সব বাছাই ধরে হিসাব)
     • যে মান এই category র কোনো product এই নেই, সেটা দেখায় না;
       কোনো মানই না থাকলে পুরো group টাই লুকানো
     • ফোন/tablet এ Filters পাশ থেকে ঢাকা পর্দা (drawer) হয়ে আসে
   =============================================================== */

const PAGE_SIZE = 9;
const SEARCH_DELAY_MS = 250;
const MOBILE_QUERY = "(max-width: 1023px)";

const GROUP_KEYS = FILTER_GROUPS.map((group) => group.key);
const SORT_KEYS = SORTS.map((sort) => sort.key);
const CATEGORY_KEYS = CATEGORIES.map((category) => category.key);

/* ---------------------------------------------------------------
   ঠিকানা ⇄ অবস্থা. অচেনা মান চুপচাপ বাদ — কেউ হাতে ভুল লিখলেও
   পাতা ভাঙে না
   --------------------------------------------------------------- */
function readParams(params) {
  const category = CATEGORY_KEYS.includes(params.get("category")) ? params.get("category") : "";
  const filters = {};
  for (const group of FILTER_GROUPS) {
    const allowed = group.options.map((option) => option.value);
    const picked = (params.get(group.key) ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => allowed.includes(value));
    if (picked.length) filters[group.key] = allowed.filter((value) => picked.includes(value));
  }
  const sort = SORT_KEYS.includes(params.get("sort")) ? params.get("sort") : "default";
  const page = Math.max(1, Number.parseInt(params.get("page"), 10) || 1);
  const q = (params.get("q") ?? "").slice(0, 100);
  return { category, filters, sort, page, q };
}

function writeParams({ category, filters, sort, page, q }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q.trim()) params.set("q", q.trim());
  for (const key of GROUP_KEYS) {
    if (filters[key]?.length) params.set(key, filters[key].join(","));
  }
  if (sort !== "default") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return params;
}

/* ---------------------------------------------------------------
   খোঁজা — প্রতিটা শব্দ নাম, series বা বিবরণের কোথাও থাকতে হবে.
   বড়/ছোট হাতের অক্ষর আর accent এর পার্থক্য ধরা হয় না
   --------------------------------------------------------------- */
const normalize = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function matchesSearch(product, terms, categoryLabel) {
  if (!terms.length) return true;
  const haystack = normalize(
    [product.name, product.series, product.shortDescription, categoryLabel].join(" "),
  );
  return terms.every((term) => haystack.includes(term));
}

const hasValue = (product, group, value) =>
  Array.isArray(product.filters?.[group]) && product.filters[group].includes(value);

const matchesGroup = (product, group, picked) =>
  !picked?.length || picked.some((value) => hasValue(product, group, value));

const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const SORTERS = {
  default: compareDefault,
  featured: (a, b) =>
    Number(b.featured === true) - Number(a.featured === true) || compareDefault(a, b),
  newest: (a, b) =>
    String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")) || compareDefault(a, b),
  popular: (a, b) => (b.views ?? 0) - (a.views ?? 0) || compareDefault(a, b),
  "name-asc": (a, b) => nameCollator.compare(a.name, b.name),
  "name-desc": (a, b) => nameCollator.compare(b.name, a.name),
};

/* pagination এর সংখ্যা: প্রথম, শেষ আর বর্তমানের দুইপাশ.
   ৫ পাতার প্রথম পাতায়: 1 2 … 5 (Figma) */
function buildPageItems(current, total) {
  if (total <= 4) return Array.from({ length: total }, (_, index) => index + 1);
  const keep = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const items = [];
  keep.forEach((page, index) => {
    if (index > 0) {
      const gap = page - keep[index - 1];
      if (gap === 2) items.push(page - 1);
      else if (gap > 2) items.push(`gap-${page}`);
    }
    items.push(page);
  });
  return items;
}

/* ---------------------------------------------------------------
   Category slider (Figma "Frame 405")
   --------------------------------------------------------------- */
function CategorySlider({ active, hrefFor }) {
  const { t } = useTranslation();
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const items = [ALL_CATEGORY, ...CATEGORIES];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const measure = () => {
      const start = track.scrollLeft <= 2;
      const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    track.addEventListener("scroll", measure, { passive: true });
    // ResizeObserver প্রথমবার নিজেই একবার মাপে
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

  /* বাছা category টা চোখের সামনে আনা — শুধু slider এর ভেতরে সরে,
     পুরো পাতা নড়ে না */
  useEffect(() => {
    const track = trackRef.current;
    const current = track?.querySelector('[aria-current="page"]');
    if (!track || !current) return;
    const left = current.offsetLeft - track.offsetLeft;
    const right = left + current.offsetWidth;
    if (left < track.scrollLeft || right > track.scrollLeft + track.clientWidth) {
      track.scrollTo({ left: left - (track.clientWidth - current.offsetWidth) / 2 });
    }
  }, [active]);

  const scrollBy = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.75, behavior: "smooth" });
  };

  return (
    <nav className="products-categories" aria-label={t("productsPage.categoriesLabel")}>
      <button
        type="button"
        className="products-categories-arrow"
        onClick={() => scrollBy(-1)}
        disabled={edges.start}
        aria-label={t("productsPage.categoriesPrev")}
      >
        <Chevron direction="left" />
      </button>

      <ul className="products-categories-track" ref={trackRef}>
        {items.map((category) => {
          const isActive = category.key === active;
          return (
            <li key={category.key || "all"}>
              <Link
                to={hrefFor(category.key)}
                preventScrollReset
                className={`products-category${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="products-category-image">
                  <CategoryPicture category={category} size={72} loading="eager" />
                </span>
                <span className="products-category-label">{t(category.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="products-categories-arrow"
        onClick={() => scrollBy(1)}
        disabled={edges.end}
        aria-label={t("productsPage.categoriesNext")}
      >
        <Chevron direction="right" />
      </button>
    </nav>
  );
}

/* ---------------------------------------------------------------
   Sort by — নিজের বানানো dropdown (Figma র নকশায় browser এর
   <select> আঁকা যায় না). keyboard: ↑ ↓ Home End Enter Esc
   --------------------------------------------------------------- */
function SortMenu({ value, onChange, variant }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const current = SORTS.find((sort) => sort.key === value) ?? SORTS[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    listRef.current?.focus();
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const openMenu = () => {
    setHighlight(Math.max(0, SORTS.indexOf(current)));
    setOpen(true);
  };

  const choose = (key) => {
    setOpen(false);
    buttonRef.current?.focus();
    if (key !== value) onChange(key);
  };

  const onListKey = (event) => {
    const last = SORTS.length - 1;
    const moves = {
      ArrowDown: Math.min(last, highlight + 1),
      ArrowUp: Math.max(0, highlight - 1),
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      setHighlight(moves[event.key]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(SORTS[highlight].key);
    } else if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      setOpen(false);
      if (event.key === "Escape") buttonRef.current?.focus();
    }
  };

  /* বন্ধ অবস্থার Figma: শুধু "Sort by ⌄" লেখা. Default ছাড়া অন্য
     কিছু বাছা থাকলে সেটাও দেখায়, নাহলে দর্শক বুঝত না কী চলছে */
  const plainLabel =
    current.key === "default"
      ? t("productsPage.sort.label")
      : `${t("productsPage.sort.label")}: ${t(current.labelKey)}`;

  return (
    <div className={`products-sort products-sort--${variant}`} ref={rootRef}>
      {variant === "box" && (
        <span className="products-sort-caption" aria-hidden="true">
          {t("productsPage.sort.labelColon")}
        </span>
      )}
      <button
        ref={buttonRef}
        type="button"
        className="products-sort-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${t("productsPage.sort.label")}: ${t(current.labelKey)}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        <span className="products-sort-value">
          {variant === "box" ? t(current.labelKey) : plainLabel}
        </span>
        <span className={`products-sort-chevron${open ? " is-open" : ""}`}>
          <Chevron direction="down" size={20} />
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className="products-sort-menu"
          aria-label={t("productsPage.sort.label")}
          aria-activedescendant={`${listId}-${SORTS[highlight].key}`}
          onKeyDown={onListKey}
        >
          {SORTS.map((sort, index) => (
            <li
              key={sort.key}
              id={`${listId}-${sort.key}`}
              role="option"
              aria-selected={sort.key === value}
              className={`products-sort-option${index === highlight ? " is-highlighted" : ""}${
                sort.key === value ? " is-selected" : ""
              }`}
              onPointerEnter={() => setHighlight(index)}
              onClick={() => choose(sort.key)}
            >
              {t(sort.labelKey)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Filters এর একটা group (Figma "Frame 116") — মাথায় ক্লিক করলে
   খোলে/বন্ধ হয়, ভেতরে গোল checkbox, নাম আর সংখ্যা
   --------------------------------------------------------------- */
function FilterGroup({ group, options, picked, counts, open, onToggleOpen, onToggleValue }) {
  const { t } = useTranslation();
  const panelId = useId();

  return (
    <section className={`products-filter-group${open ? " is-open" : ""}`}>
      <h3 className="products-filter-group-title">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggleOpen}
        >
          <span>{t(group.labelKey)}</span>
          {picked.length > 0 && <span className="products-filter-picked">{picked.length}</span>}
          <span className="products-filter-group-chevron">
            <Chevron direction={open ? "up" : "down"} size={20} />
          </span>
        </button>
      </h3>

      <div id={panelId} className="products-filter-options" hidden={!open}>
        {options.map((option) => {
          const checked = picked.includes(option.value);
          const count = counts[option.value] ?? 0;
          return (
            <label
              key={option.value}
              className={`products-filter-option${count === 0 && !checked ? " is-empty" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleValue(option.value)}
              />
              <span className="products-filter-check" aria-hidden="true">
                <CheckIcon size={12} />
              </span>
              <span className="products-filter-option-label">{optionLabel(t, option)}</span>
              <span
                className="products-filter-count"
                aria-label={t("productsPage.filters.countLabel", { count })}
              >
                {count}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   পাতা
   --------------------------------------------------------------- */
function Products() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => readParams(searchParams), [searchParams]);
  const { category, filters, sort, page, q } = state;
  const { status, products, retry } = useCatalog();
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const activeCategory = CATEGORIES.find((item) => item.key === category) ?? ALL_CATEGORY;
  const heading = t(activeCategory.labelKey);
  usePageTitle(category ? `${heading} — ${t("nav.products")}` : t("nav.products"));

  /* Filters খোলা কি না — বড় পর্দায় Figma র প্রথম frame এর মতো
     শুরুতে বন্ধ, তবে ঠিকানায় আগে থেকেই filter থাকলে খোলা (নাহলে
     দর্শক বুঝত না তালিকা কেন ছোট) */
  const pickedCount = Object.values(filters).reduce((sum, list) => sum + list.length, 0);
  const [sidebarOpen, setSidebarOpen] = useState(() => pickedCount > 0 || Boolean(q));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => {
    const picked = FILTER_GROUPS.filter((group) => filters[group.key]?.length).map(
      (group) => group.key,
    );
    return new Set(picked.length ? picked : ["cri", "cct"]);
  });

  /* খোঁজার ঘর — লেখার সাথে সাথে ঠিকানা না বদলে একটু থেমে বদলায়,
     নাহলে প্রতিটা অক্ষরে history আর হিসাব হতো.

     বাইরে থেকে (Back বোতাম, Reset) q বদলালে ঘরটাও মিলিয়ে নেওয়া —
     render এর সময় আগের মানের সাথে তুলনা করে (React এর নিয়ম মেনে,
     effect ছাড়া) */
  const [searchText, setSearchText] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (q !== syncedQ) {
    setSyncedQ(q);
    setSearchText(q);
  }

  /* ঠিকানা বদলানো — সবসময় সর্বশেষ ঠিকানা থেকে হিসাব (খোঁজার দেরি
     করা বদলের সময় এর মধ্যে অন্য filter বদলালেও কিছু হারায় না).
     page না বললে প্রথম পাতায় ফেরে — নতুন বাছাইয়ে পুরনো পাতা নম্বরের
     মানে থাকে না */
  const update = (changes, { push = false } = {}) => {
    setSearchParams(
      (previous) => {
        const next = { ...readParams(previous), ...changes };
        if (!("page" in changes)) next.page = 1;
        return writeParams(next);
      },
      /* preventScrollReset — নাহলে App এর ScrollRestoration প্রতিটা
         filter click এ পাতাটা একদম উপরে তুলে দিত */
      { replace: !push, preventScrollReset: true },
    );
  };

  const searchTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(searchTimer.current), []);
  const onSearchChange = (value) => {
    setSearchText(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setSyncedQ(value.trim());
      update({ q: value });
    }, SEARCH_DELAY_MS);
  };

  const categoryHref = (key) => {
    // category বদলালে আগের filter মুছে যায় (অন্য category তে ওই মান
    // প্রায়ই থাকে না), কিন্তু খোঁজা আর সাজানো থাকে
    const params = writeParams({ category: key, filters: {}, sort, page: 1, q });
    const query = params.toString();
    return localeLink(`/products${query ? `?${query}` : ""}`);
  };

  /* ---------- হিসাব ---------- */
  const categoryLabels = useMemo(
    () => Object.fromEntries(CATEGORIES.map((item) => [item.key, t(item.labelKey)])),
    [t],
  );

  const terms = useMemo(() => normalize(q).split(/\s+/).filter(Boolean), [q]);

  // এই category র সব product (খোঁজা/filter ছাড়া) — কোন মান দেখাবে
  const inCategory = useMemo(
    () => products.filter((product) => !category || product.category === category),
    [products, category],
  );

  // category + খোঁজা মেলে এমন
  const base = useMemo(
    () =>
      inCategory.filter((product) =>
        matchesSearch(product, terms, categoryLabels[product.category]),
      ),
    [inCategory, terms, categoryLabels],
  );

  const results = useMemo(() => {
    const matched = base.filter((product) =>
      GROUP_KEYS.every((key) => matchesGroup(product, key, filters[key])),
    );
    return matched.sort(SORTERS[sort] ?? SORTERS.default);
  }, [base, filters, sort]);

  /* প্রতিটা মানের পাশের সংখ্যা — ওই group এর নিজের বাছাই বাদে বাকি
     সব বাছাই ধরে (disjunctive facet count). তাই 4000K বাছার পরও
     5000K এর পাশে ঠিক সংখ্যা দেখায় */
  const facets = useMemo(
    () =>
      FILTER_GROUPS.map((group) => {
        const pool = base.filter((product) =>
          GROUP_KEYS.every(
            (key) => key === group.key || matchesGroup(product, key, filters[key]),
          ),
        );
        const counts = {};
        for (const option of group.options) {
          counts[option.value] = pool.filter((product) =>
            hasValue(product, group.key, option.value),
          ).length;
        }
        const picked = filters[group.key] ?? [];
        const options = group.options.filter(
          (option) =>
            picked.includes(option.value) ||
            inCategory.some((product) => hasValue(product, group.key, option.value)),
        );
        return { group, counts, picked, options };
      }).filter((facet) => facet.options.length > 0),
    [base, filters, inCategory],
  );

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(() => buildPageItems(safePage, pageCount), [safePage, pageCount]);
  const visible = results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* পাতা বদলালে তালিকার মাথায় ফেরা — শুধু মাথাটা চোখের বাইরে থাকলে */
  const resultsRef = useRef(null);
  const goToPage = (next) => {
    if (next < 1 || next > pageCount || next === safePage) return;
    update({ page: next }, { push: true });
    const top = resultsRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) {
      resultsRef.current.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    }
  };

  const toggleValue = (groupKey, value) => {
    const current = filters[groupKey] ?? [];
    const allowed = FILTER_GROUPS.find((group) => group.key === groupKey).options.map(
      (option) => option.value,
    );
    const nextValues = current.includes(value)
      ? current.filter((item) => item !== value)
      : allowed.filter((item) => item === value || current.includes(item));
    update({ filters: { ...filters, [groupKey]: nextValues } });
  };

  const toggleGroup = (key) =>
    setOpenGroups((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const resetFilters = () => {
    window.clearTimeout(searchTimer.current);
    setSearchText("");
    setSyncedQ("");
    update({ filters: {}, q: "" });
  };

  /* ---------- ফোনের drawer: খোলা থাকলে পেছনের পাতা scroll হয় না,
     Esc চাপলে বন্ধ, বন্ধ হলে focus আবার Filters বোতামে ---------- */
  const drawerRef = useRef(null);
  const drawerTriggerRef = useRef(null);
  const showDrawer = isMobile && drawerOpen;

  useEffect(() => {
    if (!showDrawer) return undefined;
    const trigger = drawerTriggerRef.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector("button, input")?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [showDrawer]);

  const panelVisible = isMobile ? drawerOpen : sidebarOpen;
  const openFilters = () => (isMobile ? setDrawerOpen(true) : setSidebarOpen(true));
  const closeFilters = () => (isMobile ? setDrawerOpen(false) : setSidebarOpen(false));
  const hasAnyFilter = pickedCount > 0 || Boolean(q);

  /* ---------- অংশগুলো ---------- */
  const filterPanel = (
    <aside
      ref={drawerRef}
      id="products-filters"
      className={`products-filters${showDrawer ? " is-drawer" : ""}`}
      aria-label={t("productsPage.filters.title")}
      {...(showDrawer ? { role: "dialog", "aria-modal": true } : {})}
    >
      <div className="products-filters-head">
        <div className="products-filters-head-start">
          <h2 className="products-filters-title">{t("productsPage.filters.title")}</h2>
          <button
            type="button"
            className="products-filters-reset"
            onClick={resetFilters}
            disabled={!hasAnyFilter}
          >
            {t("productsPage.filters.reset")}
            <ResetIcon />
          </button>
        </div>
        <button
          type="button"
          className="products-filters-close"
          onClick={closeFilters}
          aria-label={t("productsPage.filters.hide")}
          aria-controls="products-filters"
          aria-expanded="true"
        >
          {isMobile ? <CloseIcon /> : <Triangle direction="left" />}
        </button>
      </div>

      <div className="products-filters-body">
        <label className="products-search">
          <SearchIcon />
          <span className="sr-only">{t("productsPage.filters.searchLabel")}</span>
          <input
            type="search"
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("productsPage.filters.searchPlaceholder")}
            maxLength={100}
            enterKeyHint="search"
          />
        </label>

        {facets.map(({ group, counts, picked, options }) => (
          <FilterGroup
            key={group.key}
            group={group}
            options={options}
            picked={picked}
            counts={counts}
            open={openGroups.has(group.key)}
            onToggleOpen={() => toggleGroup(group.key)}
            onToggleValue={(value) => toggleValue(group.key, value)}
          />
        ))}

        {status === "ready" && facets.length === 0 && (
          <p className="products-filters-none">{t("productsPage.filters.none")}</p>
        )}
      </div>

      {showDrawer && (
        <div className="products-filters-apply">
          <button type="button" onClick={() => setDrawerOpen(false)}>
            {t("productsPage.filters.show", { count: results.length })}
          </button>
        </div>
      )}
    </aside>
  );

  const countBadge = status === "ready" && (
    <span className="products-count" aria-hidden="true">
      {results.length}
    </span>
  );

  const titleBlock = (
    <div className="products-heading">
      <h1 className="products-title">{heading}</h1>
      {countBadge}
      <span className="sr-only" aria-live="polite">
        {status === "ready" ? t("productsPage.resultCount", { count: results.length }) : ""}
      </span>
    </div>
  );

  const filtersButton = (
    <button
      ref={drawerTriggerRef}
      type="button"
      className="products-filters-toggle"
      onClick={openFilters}
      aria-controls="products-filters"
      aria-expanded={panelVisible}
    >
      <span className="products-filters-toggle-mobile" aria-hidden="true">
        <SlidersIcon />
      </span>
      {t("productsPage.filters.title")}
      {pickedCount > 0 && <span className="products-filter-picked">{pickedCount}</span>}
      <span className="products-filters-toggle-desktop" aria-hidden="true">
        <Triangle direction="right" />
      </span>
    </button>
  );

  return (
    <section className="section products-page">
      <div className="container products-inner">
        <CategorySlider active={category} hrefFor={categoryHref} />

        <div className={`products-body${sidebarOpen && !isMobile ? " has-sidebar" : ""}`}>
          {(isMobile ? drawerOpen : sidebarOpen) && filterPanel}
          {showDrawer && (
            <div
              className="products-backdrop"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
          )}

          <div className="products-main" ref={resultsRef}>
            <div
              className={`products-toolbar${
                sidebarOpen && !isMobile ? " products-toolbar--open" : ""
              }`}
            >
              {sidebarOpen && !isMobile ? (
                <>
                  {titleBlock}
                  <SortMenu value={sort} onChange={(key) => update({ sort: key })} variant="box" />
                </>
              ) : (
                <>
                  {filtersButton}
                  {titleBlock}
                  <SortMenu value={sort} onChange={(key) => update({ sort: key })} variant="plain" />
                </>
              )}
            </div>

            {status === "loading" && (
              <ul className="products-grid" aria-busy="true" aria-label={t("productsPage.loading")}>
                {Array.from({ length: PAGE_SIZE }, (_, index) => (
                  <li key={index} className="products-skeleton" />
                ))}
              </ul>
            )}

            {status === "error" && (
              <div className="products-message" role="alert">
                <p className="products-message-title">{t("productsPage.error")}</p>
                <button type="button" className="products-message-button" onClick={retry}>
                  {t("productsPage.retry")}
                </button>
              </div>
            )}

            {status === "ready" && results.length === 0 && (
              <div className="products-message">
                <p className="products-message-title">{t("productsPage.empty")}</p>
                <p className="products-message-hint">{t("productsPage.emptyHint")}</p>
                {hasAnyFilter ? (
                  <button type="button" className="products-message-button" onClick={resetFilters}>
                    {t("productsPage.clearFilters")}
                  </button>
                ) : (
                  category && (
                    <Link to={categoryHref("")} className="products-message-button">
                      {t("productsPage.seeAll")}
                    </Link>
                  )
                )}
              </div>
            )}

            {status === "ready" && results.length > 0 && (
              <ul className="products-grid">
                {visible.map((product, index) => (
                  <li key={product.id}>
                    <ProductCard
                      product={product}
                      to={localeLink(`/products/${product.slug || product.id}`)}
                      eager={index < 3}
                      headingLevel={2}
                    />
                  </li>
                ))}
              </ul>
            )}

            {status === "ready" && pageCount > 1 && (
              <nav className="products-pagination" aria-label={t("productsPage.pagination.label")}>
                <button
                  type="button"
                  className="products-pagination-side"
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 1}
                >
                  <PageArrow direction="left" />
                  <span>{t("productsPage.pagination.previous")}</span>
                </button>
                <ol className="products-pagination-pages">
                  {pageItems.map((item) =>
                    typeof item === "number" ? (
                      <li key={item}>
                        <button
                          type="button"
                          className={`products-pagination-page${
                            item === safePage ? " is-active" : ""
                          }`}
                          onClick={() => goToPage(item)}
                          aria-current={item === safePage ? "page" : undefined}
                          aria-label={t("productsPage.pagination.page", { page: item })}
                        >
                          {item}
                        </button>
                      </li>
                    ) : (
                      <li key={item} className="products-pagination-gap" aria-hidden="true">
                        …
                      </li>
                    ),
                  )}
                </ol>
                <button
                  type="button"
                  className="products-pagination-side"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage === pageCount}
                >
                  <span>{t("productsPage.pagination.next")}</span>
                  <PageArrow direction="right" />
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Products;
