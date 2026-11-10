import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import { ProductImage } from "../components/products/ProductCard";
import { CategoryPicture } from "../components/products/CategoryArt";
import {
  CheckIcon,
  CloseIcon,
  PageArrow,
  ResetIcon,
  SearchIcon,
  SlidersIcon,
} from "../components/products/ProductIcons";
import {
  ALL_CATEGORY,
  CATEGORIES,
  FILTER_GROUPS,
  SORTS,
  compareDefault,
  optionLabel,
  splitName,
  useCatalog,
  usePageTitle,
} from "../pages/productCatalog";

/* Manrope — Figma র font (HomeTwo এর মতোই, একই package) */
import "@fontsource-variable/manrope";
import "./HomeTwo.css";
import "./HomeTwoProducts.css";

import NhHeader from "./NhHeader";
import NhLayoutCta from "./NhLayoutCta";
import NhFooter from "./NhFooter";
import { IMAGES, cloud, srcSet } from "./data";
import { ArrowUpRight, ChevronDown, ChevronRight } from "./icons";
import { useReveal } from "./motion";

/* ===============================================================
   Products — দ্বিতীয় নকশা  /home/products  (/ja/home/products …)

   Figma র "Product" frame (1440 px):
     Hero (কালো, ছবি, breadcrumb, শিরোনাম)
       → Category (ছয়টা, "View All" এ সব)
       → All Products (Sort by + Filters, ৩ কলামের card, pagination)
       → Lighting Layout CTA → Footer

   মূল Products পাতা (/products) অক্ষত — এটা তার পাশাপাশি দ্বিতীয়
   সংস্করণ. product, category, filter, sort — সব একই তথ্য (একই
   API, একই admin থেকে), শুধু নকশা আলাদা. card চাপলে product এর
   পাতা (/products/:slug) খোলে.

   header, CTA আর footer Home এর (/home) থেকেই — এখানে নতুন করে বানানো
   হয়নি. শুধু Contact আর #about এর মতো link গুলো Home এ ফেরত নেয়
   (এই পাতায় ওই section নেই).

   ঠিকানায় অবস্থা থাকে (?category=…&cct=…&sort=…&page=2&q=…) —
   মূল Products পাতার মতোই, তাই link share, reload, Back ঠিক কাজ করে
   =============================================================== */

const PAGE_SIZE = 9;
const COLLAPSED_CATEGORIES = 6; // Figma: All Products + ৫টা
const SEARCH_DELAY_MS = 250;

const GROUP_KEYS = FILTER_GROUPS.map((group) => group.key);
const SORT_KEYS = SORTS.map((sort) => sort.key);
const CATEGORY_KEYS = CATEGORIES.map((category) => category.key);

/* ---------------------------------------------------------------
   ঠিকানা ⇄ অবস্থা (মূল Products পাতার সাথে একই নিয়ম).
   অচেনা মান চুপচাপ বাদ — হাতে ভুল লিখলেও পাতা ভাঙে না
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

/* খোঁজা — প্রতিটা শব্দ নাম, series বা বিবরণের কোথাও থাকতে হবে */
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

/* pagination এর সংখ্যা: প্রথম, শেষ আর বর্তমানের দুইপাশ (1 2 … 6) */
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

/* card এর ছোট লেখা (Figma: "100-200W Version") — product এর Power filter
   থেকে হিসাব: 101–200W আর 201–300W থাকলে 101–300W. Power না থাকলে
   series (যেমন "High Bay Lights"), তাও না থাকলে কিছু না */
function powerRange(product) {
  const values = product.filters?.power;
  if (!Array.isArray(values) || values.length === 0) return "";

  let low = Infinity;
  let high = 0;
  let open = false;
  for (const value of values) {
    let match = /^(\d+)-(\d+)w$/.exec(value);
    if (match) {
      low = Math.min(low, Number(match[1]));
      high = Math.max(high, Number(match[2]));
      continue;
    }
    match = /^up-to-(\d+)w$/.exec(value);
    if (match) {
      low = 0;
      high = Math.max(high, Number(match[1]));
      continue;
    }
    match = /^over-(\d+)w$/.exec(value);
    if (match) {
      low = Math.min(low, Number(match[1]));
      open = true;
    }
  }

  if (low === Infinity) return "";
  if (open) return `>${low}W`;
  if (low === 0) return `≤${high}W`;
  return `${low}–${high}W`;
}

/* ---------------------------------------------------------------
   Hero (Figma "Desktop 1", 1440 x 516)
   --------------------------------------------------------------- */
function ProductsHero() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="np-hero" aria-labelledby="np-hero-title">
      <div className="np-hero-media" data-loaded={loaded ? "" : undefined}>
        <img
          src={cloud(IMAGES.productsHero, 1920)}
          srcSet={srcSet(IMAGES.productsHero, [960, 1440, 1920, 2560])}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </div>
      <div className="np-hero-shade np-hero-shade--top" aria-hidden="true" />
      <div className="np-hero-shade np-hero-shade--bottom" aria-hidden="true" />

      <div className="nh-wrap np-hero-inner">
        <nav
          className="np-crumb nh-hero-in"
          aria-label={t("home2.products.breadcrumb")}
          style={{ "--d": 0 }}
        >
          <Link to={localeLink("/home")}>{t("home2.footer.nav.home")}</Link>
          <ChevronRight size={12} />
          <span aria-current="page">{t("nav.products")}</span>
        </nav>

        <h1 id="np-hero-title" className="np-hero-title nh-hero-in" style={{ "--d": 1 }}>
          {t("home2.products.heroTitle")}
        </h1>
        <p className="np-hero-text nh-hero-in" style={{ "--d": 2 }}>
          {t("home2.products.heroText")}
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Category (Figma "Frame 2147237460") — শুরুতে ছয়টা, "View All" এ সব
   --------------------------------------------------------------- */
function CategoryBlock({ active, hrefFor }) {
  const { t } = useTranslation();
  const items = [ALL_CATEGORY, ...CATEGORIES];
  const activeIndex = items.findIndex((item) => item.key === active);

  const [expanded, setExpanded] = useState(activeIndex >= COLLAPSED_CATEGORIES);

  /* ঠিকানা বদলে (যেমন Back চেপে) লুকানো category বাছা হলে সব খুলে দেওয়া —
     নাহলে কোনটা বাছা তা দেখাই যেত না. render এর সময় তুলনা (effect ছাড়া) */
  const [seen, setSeen] = useState(active);
  if (seen !== active) {
    setSeen(active);
    if (activeIndex >= COLLAPSED_CATEGORIES) setExpanded(true);
  }

  const visible = expanded ? items : items.slice(0, COLLAPSED_CATEGORIES);
  const canToggle = items.length > COLLAPSED_CATEGORIES;
  const listId = useId();

  return (
    <div className="np-block">
      <div className="np-block-head">
        <h2 className="np-block-title">{t("home2.products.category")}</h2>
        {canToggle && (
          <button
            type="button"
            className="np-chip"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((value) => !value)}
          >
            <span>{t(expanded ? "home2.products.showLess" : "home2.products.viewAll")}</span>
            <span className={`np-chip-arrow${expanded ? " is-open" : ""}`}>
              <ChevronRight size={16} />
            </span>
          </button>
        )}
      </div>

      <ul className="np-cats" id={listId} aria-label={t("productsPage.categoriesLabel")}>
        {visible.map((category) => {
          const isActive = category.key === active;
          return (
            <li key={category.key || "all"}>
              <Link
                to={hrefFor(category.key)}
                preventScrollReset
                className={`np-cat${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="np-cat-image">
                  <CategoryPicture category={category} size={72} loading="eager" />
                </span>
                <span className="np-cat-label">{t(category.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------
   Sort by — নিজের বানানো dropdown. keyboard: ↑ ↓ Home End Enter Esc
   --------------------------------------------------------------- */
function SortMenu({ value, onChange }) {
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

  return (
    <div className="np-sort" ref={rootRef}>
      <span className="np-sort-caption" aria-hidden="true">
        {t("productsPage.sort.labelColon")}
      </span>
      <button
        ref={buttonRef}
        type="button"
        className="np-fill np-sort-button"
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
        <span className="np-sort-value">{t(current.labelKey)}</span>
        <span className={`np-sort-chevron${open ? " is-open" : ""}`}>
          <ChevronDown size={16} />
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className="np-sort-menu"
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
              className={`np-sort-option${index === highlight ? " is-highlighted" : ""}${
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
   Filters এর একটা group — মাথায় ক্লিক করলে খোলে/বন্ধ হয়
   --------------------------------------------------------------- */
function FilterGroup({ group, options, picked, counts, open, onToggleOpen, onToggleValue }) {
  const { t } = useTranslation();
  const panelId = useId();

  return (
    <section className={`np-fgroup${open ? " is-open" : ""}`}>
      <h3 className="np-fgroup-title">
        <button type="button" aria-expanded={open} aria-controls={panelId} onClick={onToggleOpen}>
          <span>{t(group.labelKey)}</span>
          {picked.length > 0 && <span className="np-fpicked">{picked.length}</span>}
          <span className="np-fgroup-chevron">
            <ChevronDown size={16} />
          </span>
        </button>
      </h3>

      <div id={panelId} className="np-foptions" hidden={!open}>
        {options.map((option) => {
          const checked = picked.includes(option.value);
          const count = counts[option.value] ?? 0;
          return (
            <label
              key={option.value}
              className={`np-foption${count === 0 && !checked ? " is-empty" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleValue(option.value)}
              />
              <span className="np-fcheck" aria-hidden="true">
                <CheckIcon size={12} />
              </span>
              <span className="np-foption-label">{optionLabel(t, option)}</span>
              <span
                className="np-fcount"
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
   Product card (Figma "Frame 2147237466", 413 x 370)
   --------------------------------------------------------------- */
function ProductTile({ product, to, eager }) {
  const { t } = useTranslation();
  const { title } = splitName(product.name);
  const power = powerRange(product);
  const subtitle = power ? t("home2.products.version", { power }) : product.series;

  return (
    <Link to={to} className="np-card">
      <div className="np-card-media">
        <ProductImage
          product={product}
          eager={eager}
          widths={[400, 704, 1056]}
          sizes="(max-width: 600px) 90vw, (max-width: 1023px) 45vw, 350px"
        />
      </div>
      <div className="np-card-row">
        <div className="np-card-text">
          <h2 className="np-card-name">{title}</h2>
          {subtitle && <span className="np-card-sub">{subtitle}</span>}
        </div>
        <span className="np-card-go" aria-hidden="true">
          <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}

/* ---------------------------------------------------------------
   তালিকা (Category + All Products)
   --------------------------------------------------------------- */
function ProductsList() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => readParams(searchParams), [searchParams]);
  const { category, filters, sort, page, q } = state;
  const { status, products, retry } = useCatalog();

  const activeCategory = CATEGORIES.find((item) => item.key === category) ?? ALL_CATEGORY;
  const heading = t(activeCategory.labelKey);
  usePageTitle(category ? `${heading} — ${t("nav.products")}` : t("nav.products"));

  const pickedCount = Object.values(filters).reduce((sum, list) => sum + list.length, 0);
  const hasAnyFilter = pickedCount > 0 || Boolean(q);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => {
    const picked = FILTER_GROUPS.filter((group) => filters[group.key]?.length).map(
      (group) => group.key,
    );
    return new Set(picked.length ? picked : ["power", "cct"]);
  });

  /* খোঁজার ঘর — লেখার সাথে সাথে ঠিকানা না বদলে একটু থেমে বদলায়.
     বাইরে থেকে (Back, Reset) q বদলালে ঘরটাও মিলিয়ে নেওয়া — render এর
     সময় আগের মানের সাথে তুলনা করে (effect ছাড়া) */
  const [searchText, setSearchText] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (q !== syncedQ) {
    setSyncedQ(q);
    setSearchText(q);
  }

  /* ঠিকানা বদলানো — সবসময় সর্বশেষ ঠিকানা থেকে হিসাব. page না বললে
     প্রথম পাতায় ফেরে. preventScrollReset — নাহলে ScrollRestoration
     প্রতিটা filter click এ পাতা উপরে তুলে দিত */
  const update = (changes, { push = false } = {}) => {
    setSearchParams(
      (previous) => {
        const next = { ...readParams(previous), ...changes };
        if (!("page" in changes)) next.page = 1;
        return writeParams(next);
      },
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

  // category বদলালে আগের filter মুছে যায়, কিন্তু খোঁজা আর সাজানো থাকে
  const categoryHref = (key) => {
    const params = writeParams({ category: key, filters: {}, sort, page: 1, q });
    const query = params.toString();
    return localeLink(`/home/products${query ? `?${query}` : ""}`);
  };

  /* ---------- হিসাব ---------- */
  const categoryLabels = useMemo(
    () => Object.fromEntries(CATEGORIES.map((item) => [item.key, t(item.labelKey)])),
    [t],
  );

  const terms = useMemo(() => normalize(q).split(/\s+/).filter(Boolean), [q]);

  const inCategory = useMemo(
    () => products.filter((product) => !category || product.category === category),
    [products, category],
  );

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

  /* প্রতিটা মানের পাশের সংখ্যা — ওই group এর নিজের বাছাই বাদে বাকি সব বাছাই
     ধরে. যে মান এই category র কোনো product এই নেই সেটা দেখায় না */
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
  const rangeFrom = results.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const rangeTo = Math.min(safePage * PAGE_SIZE, results.length);

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

  /* ---------- Filters drawer: খোলা থাকলে পেছনের পাতা scroll হয় না,
     Esc এ বন্ধ, Tab ভেতরেই ঘোরে, বন্ধ হলে focus আবার Filters বোতামে ---------- */
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const trigger = triggerRef.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector("input, button")?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [drawerOpen]);

  return (
    <section className="np-main" aria-label={t("nav.products")}>
      <div className="nh-wrap np-inner">
        <CategoryBlock active={category} hrefFor={categoryHref} />

        <div className="np-block" ref={resultsRef}>
          <div className="np-block-head np-toolbar">
            <div className="np-heading">
              <h2 className="np-block-title">{heading}</h2>
              <span className="sr-only" aria-live="polite">
                {status === "ready"
                  ? t("productsPage.resultCount", { count: results.length })
                  : ""}
              </span>
            </div>

            <div className="np-tools">
              <SortMenu value={sort} onChange={(key) => update({ sort: key })} />
              <button
                ref={triggerRef}
                type="button"
                className="np-fill np-filters-button"
                aria-haspopup="dialog"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen(true)}
              >
                <SlidersIcon size={16} />
                <span>{t("productsPage.filters.title")}</span>
                {pickedCount > 0 && <span className="np-fpicked">{pickedCount}</span>}
              </button>
            </div>
          </div>

          {status === "loading" && (
            <ul className="np-grid" aria-busy="true" aria-label={t("productsPage.loading")}>
              {Array.from({ length: PAGE_SIZE }, (_, index) => (
                <li key={index} className="np-skeleton" />
              ))}
            </ul>
          )}

          {status === "error" && (
            <div className="np-message" role="alert">
              <p className="np-message-title">{t("productsPage.error")}</p>
              <button type="button" className="np-message-button" onClick={retry}>
                {t("productsPage.retry")}
              </button>
            </div>
          )}

          {status === "ready" && results.length === 0 && (
            <div className="np-message">
              <p className="np-message-title">{t("productsPage.empty")}</p>
              <p className="np-message-hint">{t("productsPage.emptyHint")}</p>
              {hasAnyFilter ? (
                <button type="button" className="np-message-button" onClick={resetFilters}>
                  {t("productsPage.clearFilters")}
                </button>
              ) : (
                category && (
                  <Link to={categoryHref("")} className="np-message-button">
                    {t("productsPage.seeAll")}
                  </Link>
                )
              )}
            </div>
          )}

          {status === "ready" && results.length > 0 && (
            <ul className="np-grid">
              {visible.map((product, index) => (
                <li key={product.id}>
                  <ProductTile
                    product={product}
                    to={localeLink(`/products/${product.slug || product.id}`)}
                    eager={index < 3}
                  />
                </li>
              ))}
            </ul>
          )}

          {status === "ready" && results.length > 0 && (
            <div className="np-foot">
              <p className="np-showing">
                <span className="np-showing-dot" aria-hidden="true" />
                <span>
                  <Trans
                    i18nKey="home2.products.showing"
                    values={{ from: rangeFrom, to: rangeTo, total: results.length }}
                    components={{ b: <strong /> }}
                  />
                </span>
              </p>

              {pageCount > 1 && (
                <nav className="np-pager" aria-label={t("productsPage.pagination.label")}>
                  <button
                    type="button"
                    className="np-page"
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    aria-label={t("productsPage.pagination.previous")}
                  >
                    <PageArrow direction="left" />
                  </button>
                  <ol className="np-pages">
                    {pageItems.map((item) =>
                      typeof item === "number" ? (
                        <li key={item}>
                          <button
                            type="button"
                            className={`np-page${item === safePage ? " is-active" : ""}`}
                            onClick={() => goToPage(item)}
                            aria-current={item === safePage ? "page" : undefined}
                            aria-label={t("productsPage.pagination.page", { page: item })}
                          >
                            {item}
                          </button>
                        </li>
                      ) : (
                        <li key={item} className="np-page np-page--gap" aria-hidden="true">
                          …
                        </li>
                      ),
                    )}
                  </ol>
                  <button
                    type="button"
                    className="np-page"
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === pageCount}
                    aria-label={t("productsPage.pagination.next")}
                  >
                    <PageArrow direction="right" />
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>
      </div>

      {drawerOpen && (
        <>
          <div className="np-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside
            ref={drawerRef}
            className="np-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("productsPage.filters.title")}
          >
            <div className="np-drawer-head">
              <h2 className="np-drawer-title">{t("productsPage.filters.title")}</h2>
              <button
                type="button"
                className="np-drawer-reset"
                onClick={resetFilters}
                disabled={!hasAnyFilter}
              >
                {t("productsPage.filters.reset")}
                <ResetIcon />
              </button>
              <button
                type="button"
                className="np-drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label={t("productsPage.filters.hide")}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="np-drawer-body">
              <label className="np-search">
                <SearchIcon size={20} />
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

              {facets.length === 0 && (
                <p className="np-drawer-none">{t("productsPage.filters.none")}</p>
              )}
            </div>

            <div className="np-drawer-foot">
              <button type="button" onClick={() => setDrawerOpen(false)}>
                {t("productsPage.filters.show", { count: results.length })}
              </button>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------
   পাতা
   --------------------------------------------------------------- */
function HomeTwoProducts() {
  const rootRef = useRef(null);
  // header কালো হবে কখন — পাতার একদম উপরের অদৃশ্য দাগটা সরলে
  const sentinelRef = useRef(null);

  // CTA আর footer এর পর্দায়-আসার animation (Home এর মতোই)
  useReveal(rootRef);

  return (
    <div className="nh-page np-root" ref={rootRef}>
      <div className="nh-sentinel" ref={sentinelRef} aria-hidden="true" />
      <NhHeader
        sentinelRef={sentinelRef}
        productsTo="/home/products"
        contactTo="/home#contact"
        current="nav.products"
      />

      <main>
        <ProductsHero />
        <ProductsList />
        <NhLayoutCta contactTo="/home#contact" />
      </main>

      <NhFooter homePath="/home" />
    </div>
  );
}

export default HomeTwoProducts;