import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import { PageArrow, SearchIcon, SlidersIcon } from "../components/products/ProductIcons";
import ProjectSelect from "../components/projects/ProjectSelect";
import {
  PROJECT_TYPES,
  fallbackPhoto,
  photoSrcSet,
  photoUrl,
  projectPhotos,
  useProjectList,
  usePageTitle,
} from "../pages/projectCatalog";

/* Manrope — Figma র font (HomeTwo এর মতোই, একই package) */
import "@fontsource-variable/manrope";
import "./HomeTwo.css";
import "./HomeTwoProjects.css";

import NhHeader from "./NhHeader";
import NhFooter from "./NhFooter";
import NhLayoutCta from "./NhLayoutCta";
import { IMAGES, cloud, srcSet } from "./data";
import { ArrowUpRight, ChevronRight } from "./icons";
import { useReveal } from "./motion";

/* ===============================================================
   Projects — দ্বিতীয় নকশা  /home/projects  (/ja/home/projects …)

   Figma র frame (1440 px):
     Hero (কালো, ছবি, breadcrumb "Home > Projects", শিরোনাম, বিবরণ)
       → Projects (শিরোনাম + View All, search + environment + Filters,
         category pill এর সারি, ৩ কলামের card, Showing + pagination)
       → Footer

   মূল Projects পাতা (/projects) অক্ষত — এটা তার পাশাপাশি দ্বিতীয়
   সংস্করণ. project, category, environment — সব একই তথ্য (একই API,
   একই admin থেকে, GET /api/projects), শুধু নকশা আলাদা. card চাপলে
   project এর পাতা (/projects/:slug) খোলে.

   ঠিকানায় থাকে: ?q=…&category=…  (link share, reload, Back ঠিক কাজ করে)

   header আর footer Home এর (/home) থেকেই
   =============================================================== */

const PAGE_SIZE = 9; // Figma: ৩ x ৩
const SEARCH_DELAY_MS = 250;

const pad2 = (number) => String(number).padStart(2, "0");

const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/* সাজানো — "newest" মানে server এর নিজের ক্রম (তারিখ, নতুন আগে) */
const SORTERS = {
  newest: (list) => list,
  oldest: (list) => [...list].reverse(),
  "name-asc": (list) => [...list].sort((a, b) => nameCollator.compare(a.name, b.name)),
  "name-desc": (list) => [...list].sort((a, b) => nameCollator.compare(b.name, a.name)),
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

/* ছবি নামতে না পারলে (মুছে ফেলা, ভুল link) Project Type এর নমুনা ছবি —
   একবারই, যাতে নমুনাটাও না নামলে বারবার চেষ্টা না করে */
function fallbackOnError(type) {
  return (event) => {
    const img = event.currentTarget;
    if (img.dataset.fallback) return;
    img.dataset.fallback = "1";
    img.removeAttribute("srcset");
    img.src = photoUrl(fallbackPhoto(type), 1200);
  };
}

/* Figma: 16px, stroke 1.2px, #4A4A4A */
function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 14.67S13.33 10.2 13.33 6.67A5.33 5.33 0 0 0 2.67 6.67C2.67 10.2 8 14.67 8 14.67Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.67" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/* একটা scroll এলাকা তার ডান প্রান্তে পৌঁছেছে কিনা — ডানের ঝাপসা পর্দা
   (fade) তখন সরে যায়. ResizeObserver দিয়ে, তাই pill বাড়লে-কমলেও ঠিক */
function useScrollEnd(ref, watch) {
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const measure = () => setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    measure();

    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));

    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [ref, watch]);

  return atEnd;
}

/* ---------------------------------------------------------------
   Filters বোতাম — Figma র "Filters". এখন এটা সাজানোর (Sort by) মেনু:
   Newest / Oldest / Name A–Z / Name Z–A
   --------------------------------------------------------------- */
function SortMenu({ value, onChange }) {
  const { t } = useTranslation();
  const menuId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const options = [
    { key: "newest", label: t("productsPage.sort.newest") },
    { key: "oldest", label: t("home2.projects.oldest") },
    { key: "name-asc", label: t("productsPage.sort.nameAsc") },
    { key: "name-desc", label: t("productsPage.sort.nameDesc") },
  ];

  /* খোলা থাকলে: বাইরে ক্লিক বা Esc এ বন্ধ */
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      rootRef.current?.querySelector("button")?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="npj-sort" ref={rootRef}>
      <button
        type="button"
        className="npj-fill npj-fill--white"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <SlidersIcon size={16} />
        <span>{t("productsPage.filters.title")}</span>
      </button>

      {open && (
        <div
          id={menuId}
          className="npj-sort-menu"
          role="group"
          aria-label={t("productsPage.sort.label")}
        >
          <p className="npj-sort-title">{t("productsPage.sort.label")}</p>
          <ul>
            {options.map((option) => (
              <li key={option.key}>
                <button
                  type="button"
                  className={`npj-sort-option${option.key === value ? " is-active" : ""}`}
                  aria-pressed={option.key === value}
                  onClick={() => {
                    onChange(option.key);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Project card — Figma "Frame 2147237480" (413 x 370)
   ছবি 414 x 277, নিচে ধূসর অংশে নাম + শহর, ডানে ↗ বোতাম
   (মাউস দিলে হলুদ). পুরো card টাই একটা link
   --------------------------------------------------------------- */
function ProjectTile({ project, to, eager }) {
  const { t } = useTranslation();

  return (
    <Link
      to={to}
      className="npj-card"
      aria-label={t("projects.viewProject", { name: project.name })}
    >
      <span className="npj-card-media">
        <img
          src={photoUrl(project.photo, 800)}
          srcSet={photoSrcSet(project.photo, [600, 900, 1200])}
          sizes="(max-width: 639px) 100vw, (max-width: 1099px) 50vw, 414px"
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={fallbackOnError(project.category)}
        />
      </span>
      <span className="npj-card-body">
        <span className="npj-card-text">
          <span className="npj-card-name">{project.name}</span>
          {project.city && (
            <span className="npj-card-city">
              <PinIcon />
              <span>{project.city}</span>
            </span>
          )}
        </span>
        <span className="npj-card-go" aria-hidden="true">
          <ArrowUpRight size={16} />
        </span>
      </span>
    </Link>
  );
}

/* ---------------------------------------------------------------
   Projects তালিকা
   --------------------------------------------------------------- */
function ProjectsList() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const [searchParams, setSearchParams] = useSearchParams();
  const { status, projects: liveProjects, retry } = useProjectList();

  /* ঠিকানা থেকে শুরুর অবস্থা — অচেনা category চুপচাপ বাদ */
  const rawCategory = searchParams.get("category") ?? "";
  const category = PROJECT_TYPES.includes(rawCategory) ? rawCategory : "all";
  const [text, setText] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const resultsRef = useRef(null);
  const chipsRef = useRef(null);
  const drag = useRef({ down: false, startX: 0, scroll: 0, moved: false });

  /* খোঁজার লেখা ঠিকানায় (?q=) — একটু থেমে, আর পুরনো history না বাড়িয়ে */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = text.trim();
      const current = new URLSearchParams(window.location.search).get("q") ?? "";
      if (current === value) return;
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (value) next.set("q", value);
          else next.delete("q");
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [text, setSearchParams]);

  const changeText = (value) => {
    setText(value);
    setPage(1);
  };

  const changeCategory = (id) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (id === "all") next.delete("category");
        else next.set("category", id);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
    setPage(1);
  };

  const hasFilter = text.trim() !== "" || category !== "all";

  const resetAll = () => {
    setText("");
    setPage(1);
    setSearchParams({}, { replace: true, preventScrollReset: true });
  };

  /* server এর project → card এর আকার. search — খোঁজার জন্য সব লেখা
     একসাথে: নাম, শহর, কোম্পানি, বিবরণ, ব্যবহার করা product এর নাম
     (তাই "LS1" বা "high bay" লিখলেও project পাওয়া যায়) */
  const projects = useMemo(
    () =>
      liveProjects.map((project) => {
        const type = PROJECT_TYPES.includes(project.projectType) ? project.projectType : "other";
        return {
          id: project.id,
          slug: project.slug || project.id,
          name: project.title,
          city: project.location,
          category: type,
          photo: projectPhotos(project)[0],
          search: [
            project.title,
            project.location,
            project.company,
            project.shortDescription,
            project.projectTypeLabel,
            ...(project.products ?? []).map((item) => `${item.name} ${item.series}`),
          ]
            .join(" ")
            .toLowerCase(),
        };
      }),
    [liveProjects],
  );

  const counts = useMemo(() => {
    const map = { all: projects.length };
    for (const project of projects) map[project.category] = (map[project.category] || 0) + 1;
    return map;
  }, [projects]);

  /* pill এর ক্রম — "All Projects" আগে, তারপর যে type এ project আছে.
     ঠিকানায় বাছা type এ project না থাকলেও সেটা দেখায়, যাতে দর্শক
     বোঝে কেন তালিকা খালি */
  const categoryOrder = useMemo(
    () => [
      "all",
      ...PROJECT_TYPES.filter((id) => counts[id] > 0 || (id === category && status === "ready")),
    ],
    [counts, category, status],
  );

  const envOptions = useMemo(
    () =>
      categoryOrder.map((id) => ({
        value: id,
        label: id === "all" ? t("projects.search.environmentLabel") : t(`projects.categories.${id}`),
      })),
    [categoryOrder, t],
  );

  const results = useMemo(() => {
    const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matched = projects.filter((project) => {
      if (category !== "all" && project.category !== category) return false;
      if (!words.length) return true;
      const label = t(`projects.categories.${project.category}`).toLowerCase();
      const haystack = `${project.search} ${label}`;
      return words.every((word) => haystack.includes(word));
    });
    return (SORTERS[sort] ?? SORTERS.newest)(matched);
  }, [projects, text, category, sort, t]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(() => buildPageItems(safePage, pageCount), [safePage, pageCount]);
  const visible = results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeFrom = results.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const rangeTo = Math.min(safePage * PAGE_SIZE, results.length);

  /* পাতা বদলালে তালিকার মাথায় ফেরা — শুধু মাথাটা চোখের বাইরে থাকলে */
  const goToPage = (next) => {
    if (next < 1 || next > pageCount || next === safePage) return;
    setPage(next);
    const top = resultsRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) {
      resultsRef.current.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  /* ---------- category pill এর সারি: ডানে ঝাপসা পর্দা, মাউসে টানা ---------- */
  const chipsAtEnd = useScrollEnd(chipsRef, categoryOrder.length + status);

  // বাছা pill টা সারির ভেতরে চোখের সামনে আনা (সারি নিজে সরে, পাতা নয়)
  useEffect(() => {
    const list = chipsRef.current;
    const chip = list?.querySelector('[aria-pressed="true"]');
    if (!list || !chip) return;
    const left = chip.offsetLeft - list.offsetLeft - 16;
    if (left > 0 || list.scrollLeft > 0) list.scrollTo({ left: Math.max(left, 0) });
  }, [category, status]);

  const onChipsPointerDown = useCallback((event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag.current = {
      down: true,
      startX: event.clientX,
      scroll: chipsRef.current?.scrollLeft ?? 0,
      moved: false,
    };
  }, []);

  const onChipsPointerMove = useCallback((event) => {
    const state = drag.current;
    if (!state.down || !chipsRef.current) return;
    const delta = event.clientX - state.startX;
    if (Math.abs(delta) > 4) state.moved = true;
    if (state.moved) chipsRef.current.scrollLeft = state.scroll - delta;
  }, []);

  const onChipsPointerEnd = useCallback(() => {
    drag.current.down = false;
  }, []);

  // টানার শেষে ছাড়লে pill এ "ক্লিক" ধরা হয় না
  const onChipsClickCapture = useCallback((event) => {
    if (!drag.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current.moved = false;
  }, []);

  return (
    <section className="npj-main" aria-labelledby="npj-list-title">
      <div className="nh-wrap npj-inner">
        {/* ---------- শিরোনাম + search + pill ---------- */}
        <div className="npj-top">
          <div className="npj-heading">
            <h2 id="npj-list-title" className="npj-title">
              {t("nav.projects")}
            </h2>
            <button type="button" className="npj-fill npj-viewall" onClick={resetAll}>
              <span>{t("home2.products.viewAll")}</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="npj-filters">
            <div className="npj-bar">
              <label className="npj-search">
                <SearchIcon size={24} />
                <input
                  type="search"
                  value={text}
                  onChange={(event) => changeText(event.target.value)}
                  placeholder={t("projects.search.placeholder")}
                  aria-label={t("projects.search.ariaLabel")}
                  autoComplete="off"
                />
              </label>

              <div className="npj-env">
                <ProjectSelect
                  value={category}
                  options={envOptions}
                  onChange={changeCategory}
                  ariaLabel={t("projects.search.environmentAriaLabel")}
                />
              </div>

              <SortMenu
                value={sort}
                onChange={(key) => {
                  setSort(key);
                  setPage(1);
                }}
              />
            </div>

            <div className="npj-chips-wrap" data-end={chipsAtEnd ? "" : undefined}>
              <ul
                className="npj-chips"
                ref={chipsRef}
                onPointerDown={onChipsPointerDown}
                onPointerMove={onChipsPointerMove}
                onPointerUp={onChipsPointerEnd}
                onPointerLeave={onChipsPointerEnd}
                onPointerCancel={onChipsPointerEnd}
                onClickCapture={onChipsClickCapture}
              >
                {status !== "ready"
                  ? Array.from({ length: 5 }, (_, index) => (
                      <li key={index} className="npj-chip npj-chip--skeleton" aria-hidden="true" />
                    ))
                  : categoryOrder.map((id) => (
                      <li key={id}>
                        <button
                          type="button"
                          className={`npj-chip${id === category ? " is-active" : ""}`}
                          aria-pressed={id === category}
                          onClick={() => changeCategory(id)}
                        >
                          <span>{t(`projects.categories.${id}`)}</span>
                          <span className="npj-chip-count">({pad2(counts[id] ?? 0)})</span>
                        </button>
                      </li>
                    ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ---------- card এর grid ---------- */}
        <div className="npj-results" ref={resultsRef}>
          {status === "loading" && (
            <ul className="npj-grid" aria-busy="true" aria-label={t("projects.loading")}>
              {Array.from({ length: PAGE_SIZE }, (_, index) => (
                <li key={index} className="npj-skeleton" />
              ))}
            </ul>
          )}

          {status === "error" && (
            <div className="npj-message" role="alert">
              <p className="npj-message-title">{t("projects.error")}</p>
              <button type="button" className="npj-message-button" onClick={retry}>
                {t("projects.retry")}
              </button>
            </div>
          )}

          {status === "ready" && results.length === 0 && (
            <div className="npj-message">
              <p className="npj-message-title">{t("projects.empty")}</p>
              <p className="npj-message-hint">{t("projects.emptyHint")}</p>
              {hasFilter && (
                <button type="button" className="npj-message-button" onClick={resetAll}>
                  {t("projects.clearFilters")}
                </button>
              )}
            </div>
          )}

          {status === "ready" && results.length > 0 && (
            <ul className="npj-grid">
              {visible.map((project, index) => (
                <li key={project.id}>
                  <ProjectTile
                    project={project}
                    to={localeLink(`/projects/${project.slug}`)}
                    eager={index < 3}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ---------- নিচের সারি: Showing … + pagination ---------- */}
        {status === "ready" && results.length > 0 && (
          <div className="npj-foot">
            <p className="npj-showing">
              <span className="npj-showing-dot" aria-hidden="true" />
              <span>
                <Trans
                  i18nKey="home2.projects.showing"
                  values={{ from: rangeFrom, to: pad2(rangeTo), total: results.length }}
                  components={{ b: <strong /> }}
                />
              </span>
            </p>

            {pageCount > 1 && (
              <nav className="npj-pager" aria-label={t("projects.pagination.ariaLabel")}>
                <button
                  type="button"
                  className="npj-page"
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 1}
                  aria-label={t("projects.pagination.previous")}
                >
                  <PageArrow direction="left" />
                </button>
                <ol className="npj-pages">
                  {pageItems.map((item) =>
                    typeof item === "number" ? (
                      <li key={item}>
                        <button
                          type="button"
                          className={`npj-page${item === safePage ? " is-active" : ""}`}
                          onClick={() => goToPage(item)}
                          aria-current={item === safePage ? "page" : undefined}
                          aria-label={t("projects.pagination.pageAriaLabel", { page: item })}
                        >
                          {item}
                        </button>
                      </li>
                    ) : (
                      <li key={item} className="npj-page npj-page--gap" aria-hidden="true">
                        …
                      </li>
                    ),
                  )}
                </ol>
                <button
                  type="button"
                  className="npj-page"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage === pageCount}
                  aria-label={t("projects.pagination.next")}
                >
                  <PageArrow direction="right" />
                </button>
              </nav>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Hero
   --------------------------------------------------------------- */
function ProjectsHero() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="npj-hero" aria-labelledby="npj-hero-title">
      <div className="npj-hero-media" data-loaded={loaded ? "" : undefined}>
        <img
          src={cloud(IMAGES.projectsHero, 1920)}
          srcSet={srcSet(IMAGES.projectsHero, [960, 1440, 1920, 2560])}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </div>
      <div className="npj-hero-shade npj-hero-shade--top" aria-hidden="true" />
      <div className="npj-hero-shade npj-hero-shade--bottom" aria-hidden="true" />

      <div className="nh-wrap npj-hero-inner">
        <nav
          className="npj-crumb nh-hero-in"
          aria-label={t("home2.projects.breadcrumb")}
          style={{ "--d": 0 }}
        >
          <Link to={localeLink("/home")}>{t("home2.footer.nav.home")}</Link>
          <ChevronRight size={12} />
          <span aria-current="page">{t("nav.projects")}</span>
        </nav>

        <h1 id="npj-hero-title" className="npj-hero-title nh-hero-in" style={{ "--d": 1 }}>
          {t("home2.projects.heroTitle")}
        </h1>
        <p className="npj-hero-text nh-hero-in" style={{ "--d": 2 }}>
          {t("home2.projects.heroText")}
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   পাতা
   --------------------------------------------------------------- */
function HomeTwoProjects() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  // header কালো হবে কখন — পাতার একদম উপরের অদৃশ্য দাগটা সরলে
  const sentinelRef = useRef(null);

  usePageTitle(t("nav.projects"));

  // footer এর পর্দায়-আসার animation (Home এর মতোই)
  useReveal(rootRef);

  return (
    <div className="nh-page npj-root" ref={rootRef}>
      <div className="nh-sentinel" ref={sentinelRef} aria-hidden="true" />
      <NhHeader
        sentinelRef={sentinelRef}
        productsTo="/home/products"
        projectsTo="/home/projects"
        contactTo="/home#contact"
        current="nav.projects"
      />

      <main>
        <ProjectsHero />
        <ProjectsList />
        <NhLayoutCta contactTo="/home#contact" />
      </main>

      <NhFooter homePath="/home" />
    </div>
  );
}

export default HomeTwoProjects;