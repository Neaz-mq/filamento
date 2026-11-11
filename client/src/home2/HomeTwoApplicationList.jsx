import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import NhSelect from "./NhSelect";
import { ArrowUpRight, ChevronRight } from "./icons";
import { cloud, srcSet } from "./data";
import { APPLICATIONS, ENVIRONMENTS, PAGE_SIZE } from "./applicationData";
import "./HomeTwoApplicationList.css";

/* ===============================================================
   Application এর তালিকা — Figma "Frame 2147228145" (1440 x 1723)

     "Application" + View All
       → খোঁজার বার (search, All environments, Filters)
       → chip এর সারি (All Application (09), LA1 Aisle Lighter (01) …)
       → ৩ কলামের card (ছবি, নাম, ছোট লেখা, ↗ বোতাম)
       → "Showing 01–09 of 09 Products" + পাতা বদলের সারি

   সব তথ্য static — applicationData.js. কোনো API নেই.

   কাজ করে: খোঁজা (নাম, environment, wattage), chip, environment,
   "Filters" মেনুর সাজানো, পাতা বদল. পাতা বদলের সারি শুধু তখন আসে যখন
   তালিকা PAGE_SIZE (৯) এর বেশি — এখন ৯টা, তাই আসে না
   =============================================================== */

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const pad = (value) => String(value).padStart(2, "0");

const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const SORTS = ["default", "az", "za"];

// 1 … 4 … 9 — মাঝের পাতাগুলো ... হয়ে যায়
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
   Icon — Figma র vuesax "linear" সেট
   --------------------------------------------------------------- */
function Icon({ size = 16, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const SearchIcon = (props) => (
  <Icon {...props}>
    <path d="M11.5 21a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19ZM22 22l-2-2" />
  </Icon>
);

const FilterIcon = (props) => (
  <Icon {...props}>
    <path d="M5.4 2.1h13.2c1.1 0 2 .9 2 2v2.2c0 .8-.5 1.8-1 2.3l-3.8 3.4c-.6.5-1 1.5-1 2.3v3.8c0 .6-.4 1.4-.9 1.7l-1.3.8c-1.2.8-2.9-.1-2.9-1.6v-4.8c0-.7-.4-1.7-.8-2.2l-3.4-3.6c-.5-.5-.9-1.5-.9-2.1V4.2c0-1.2.9-2.1 2-2.1Z" />
  </Icon>
);

const PageArrow = ({ direction }) => (
  <Icon size={16}>
    <path d={direction === "left" ? "m15 19-7-7 7-7" : "m9 5 7 7-7 7"} />
  </Icon>
);

/* ---------------------------------------------------------------
   Filters — সাজানোর ছোট মেনু (বাইরে চাপলে বা Esc এ বন্ধ)
   --------------------------------------------------------------- */
function SortMenu({ value, onChange }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="nal-sort" ref={rootRef}>
      <button
        type="button"
        ref={buttonRef}
        className="nal-white nal-filters"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <FilterIcon />
        <span>{t("home2.applicationPage.list.filters")}</span>
        {value !== "default" && <span className="nal-dot" aria-hidden="true" />}
      </button>

      {open && (
        <div className="nal-menu" id={menuId} role="group" aria-label={t("home2.applicationPage.list.sortTitle")}>
          <p className="nal-menu-title">{t("home2.applicationPage.list.sortTitle")}</p>
          {SORTS.map((key) => (
            <button
              key={key}
              type="button"
              className="nal-menu-option"
              aria-pressed={value === key}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
            >
              {t(`home2.applicationPage.list.sort.${key}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Card
   --------------------------------------------------------------- */
function ApplicationCard({ item, eager }) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

  const to = item.query
    ? `/home/products?q=${encodeURIComponent(item.query)}`
    : "/home/products";

  return (
    <Link to={localeLink(to)} className="nal-card">
      <div className="nal-card-media">
        <img
          src={cloud(item.image, 700)}
          srcSet={srcSet(item.image, [350, 700, 1050])}
          sizes="(max-width: 639px) 90vw, (max-width: 1099px) 45vw, 350px"
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
      <div className="nal-card-row">
        <div className="nal-card-text">
          <h3 className="nal-card-name">{item.title}</h3>
          <span className="nal-card-sub">
            {t("home2.applicationPage.list.version", { power: item.power })}
          </span>
        </div>
        <span className="nal-card-go" aria-hidden="true">
          <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}

/* ---------------------------------------------------------------
   ChipRail — chip এর সারি স্লাইড করে দেখার জন্য (premium feel)
   - mouse drag: আঙুলের সাথে 1:1, ছাড়লে velocity অনুযায়ী inertia (momentum)
   - শুরু/শেষে টানলে rubber-band, তারপর spring দিয়ে ফিরে আসে
   - chip চাপলে সেটা মাঝখানে ease-out করে গ্লাইড করে আসে
   - সব requestAnimationFrame এ, scroll-snap/scroll-behavior এর সাথে ঝগড়া নেই
   - touch/trackpad এ browser এর নিজস্ব momentum scroll ই চলে
   - prefers-reduced-motion হলে inertia/bounce/glide বন্ধ
   --------------------------------------------------------------- */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// iOS এর মতো rubber-band: যত বেশি টানবে তত শক্ত লাগবে
const rubber = (x, dim) => (x * dim * 0.55) / (dim + 0.55 * x);
const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ChipRail({ label, activeKey, children }) {
  const railRef = useRef(null);
  const raf = useRef(0);
  // pos = scrollLeft (float), v = px/ms, over/ov = সীমার বাইরে টান (px) ও তার গতি
  const phys = useRef({ pos: 0, v: 0, over: 0, ov: 0 });
  const drag = useRef({ active: false, moved: false, startX: 0, startPos: 0, samples: [] });
  const [edge, setEdge] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = { start: el.scrollLeft > 4, end: el.scrollLeft < max - 4 };
    setEdge((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  // chip বদলালে/ফন্ট লোড হলে মাপ আবার দেখি (state একই থাকলে re-render হয় না)
  useEffect(measure);

  const maxScroll = () => {
    const el = railRef.current;
    return Math.max(0, el.scrollWidth - el.clientWidth);
  };

  const paintOver = (over) => {
    const el = railRef.current;
    const dim = el.clientWidth || 1;
    const shift = over === 0 ? 0 : -Math.sign(over) * rubber(Math.abs(over), dim);
    el.style.setProperty("--over", shift.toFixed(2) + "px");
  };

  const stop = () => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
  };

  // চলমান animation থামিয়ে সারি স্বাভাবিক অবস্থায় আনি
  const cancel = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    stop();
    const p = phys.current;
    p.v = 0;
    p.over = 0;
    p.ov = 0;
    paintOver(0);
    el.dataset.moving = "false";
  }, []);

  // একটাই rAF loop; step(dt) true ফেরত দিলে চলতে থাকে
  const run = (step) => {
    const el = railRef.current;
    stop();
    el.dataset.moving = "true";
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(32, now - last);
      last = now;
      if (step(dt, el)) {
        raf.current = requestAnimationFrame(frame);
      } else {
        raf.current = 0;
        el.dataset.moving = "false";
      }
    };
    raf.current = requestAnimationFrame(frame);
  };

  // ছেড়ে দেওয়ার পর: inertia, সীমায় লাগলে spring দিয়ে ফেরা
  const fling = (velocity) => {
    const p = phys.current;
    if (prefersReduced()) {
      p.v = 0;
      p.over = 0;
      p.ov = 0;
      paintOver(0);
      return;
    }
    p.v = velocity;
    p.ov = 0;
    if (p.over === 0 && Math.abs(p.v) < 0.02) return;
    run((dt, el) => {
      let alive = false;
      if (p.over === 0 && Math.abs(p.v) > 0.02) {
        p.pos += p.v * dt;
        p.v *= Math.exp(-dt / 320); // friction
        const max = maxScroll();
        if (p.pos < 0 || p.pos > max) {
          const c = clamp(p.pos, 0, max);
          p.over = p.pos - c;
          p.pos = c;
          p.ov = p.v * 0.6; // বাকি গতি bounce এ যায়
          p.v = 0;
        }
        el.scrollLeft = p.pos;
        alive = true;
      }
      if (p.over !== 0 || p.ov !== 0) {
        const k = 0.00045; // spring stiffness
        const c = 0.042; // critical damping, তাই দোলে না
        p.ov += (-k * p.over - c * p.ov) * dt;
        p.over += p.ov * dt;
        if (Math.abs(p.over) < 0.3 && Math.abs(p.ov) < 0.01) {
          p.over = 0;
          p.ov = 0;
        }
        paintOver(p.over);
        alive = alive || p.over !== 0 || p.ov !== 0;
      }
      return alive;
    });
  };

  // নির্দিষ্ট জায়গায় ease-out করে গ্লাইড
  const glideTo = useCallback((target) => {
    const el = railRef.current;
    if (!el) return;
    const p = phys.current;
    const from = el.scrollLeft;
    const to = clamp(target, 0, maxScroll());
    if (Math.abs(to - from) < 1) return;
    cancel();
    if (prefersReduced()) {
      el.scrollLeft = to;
      return;
    }
    const dur = clamp(Math.abs(to - from) * 0.9, 280, 650);
    let t = 0;
    run((dt) => {
      t += dt;
      const k = Math.min(1, t / dur);
      p.pos = from + (to - from) * (1 - Math.pow(1 - k, 4)); // easeOutQuart
      el.scrollLeft = p.pos;
      return k < 1;
    });
  }, [cancel]);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return undefined;
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf.current);
    };
  }, [measure]);

  // সক্রিয় chip কে মাঝখানে গ্লাইড করে আনি (পুরো পেজ নড়ে না, শুধু সারি)
  useEffect(() => {
    const el = railRef.current;
    const li = el?.querySelector('[aria-pressed="true"]')?.parentElement;
    if (!el || !li) return;
    glideTo(li.offsetLeft - (el.clientWidth - li.offsetWidth) / 2);
  }, [activeKey, glideTo]);

  /* mouse drag (touch এ browser নিজেই swipe + momentum করে) */
  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = railRef.current;
    const p = phys.current;
    const inFlight = raf.current !== 0; // চলন্ত অবস্থায় ধরলে সেখান থেকেই শুরু
    stop();
    if (!inFlight) {
      p.over = 0;
      p.ov = 0;
      paintOver(0);
    }
    p.pos = el.scrollLeft;
    p.v = 0;
    drag.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startPos: p.pos + p.over,
      samples: [{ t: e.timeStamp, x: e.clientX }],
    };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    const el = railRef.current;
    const dx = e.clientX - d.startX;
    if (!d.moved) {
      if (Math.abs(dx) < 5) return; // ছোট নড়াচড়া = সাধারণ click
      d.moved = true;
      el.dataset.drag = "true";
      el.dataset.moving = "true";
      el.setPointerCapture(e.pointerId);
    }
    const p = phys.current;
    const raw = d.startPos - dx;
    const c = clamp(raw, 0, maxScroll());
    p.pos = c;
    p.over = prefersReduced() ? 0 : raw - c;
    el.scrollLeft = c;
    paintOver(p.over);

    d.samples.push({ t: e.timeStamp, x: e.clientX });
    while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > 100) d.samples.shift();
  };

  const endDrag = (e) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    const el = railRef.current;
    if (!d.moved) {
      if (phys.current.over !== 0) fling(0); // spring এর মাঝে ধরে ছেড়ে দিলে
      return;
    }
    el.dataset.drag = "false";
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* capture আগেই ছেড়ে গেছে */
    }
    // শেষ ~100ms এর গতি থেকে velocity (px/ms, scroll এর দিকে)
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const span = last.t - first.t;
    const idle = e.timeStamp - last.t;
    let v = 0;
    if (span > 0 && idle < 80) v = clamp(-(last.x - first.x) / span, -3, 3);
    fling(v);
  };

  // drag শেষে chip যেন ভুল করে select না হয়
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <div className="nal-chips-wrap" data-start={edge.start} data-end={edge.end}>
      <ul
        ref={railRef}
        className="nal-chips"
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onTouchStart={cancel}
        onWheel={cancel}
      >
        {children}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------
   Section
   --------------------------------------------------------------- */
function ApplicationList() {
  const { t } = useTranslation();
  const resultsRef = useRef(null);

  const [query, setQuery] = useState("");
  const [chip, setChip] = useState(""); // "" = All Application
  const [env, setEnv] = useState(""); // "" = All environments
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);

  const envOptions = useMemo(
    () => [
      { value: "", label: t("home2.applicationPage.list.envAll") },
      ...ENVIRONMENTS.map((id) => ({
        value: id,
        label: t(`home2.applicationPage.list.env.${id}`),
      })),
    ],
    [t],
  );

  // ভাষা অনুযায়ী নাম — locale থেকে
  const items = useMemo(
    () =>
      APPLICATIONS.map((app) => ({
        ...app,
        name: t(`home2.applicationPage.list.items.${app.id}.name`),
        title: t(`home2.applicationPage.list.items.${app.id}.title`),
        envLabels: app.env.map((id) => t(`home2.applicationPage.list.env.${id}`)),
      })),
    [t],
  );

  const results = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);

    const found = items.filter((item) => {
      if (chip && item.id !== chip) return false;
      if (env && !item.env.includes(env)) return false;
      if (!terms.length) return true;
      const haystack = normalize([item.name, item.title, item.power, ...item.envLabels].join(" "));
      return terms.every((term) => haystack.includes(term));
    });

    if (sort === "az") found.sort((a, b) => nameCollator.compare(a.title, b.title));
    if (sort === "za") found.sort((a, b) => nameCollator.compare(b.title, a.title));
    return found;
  }, [items, query, chip, env, sort]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = results.slice(start, start + PAGE_SIZE);
  const rangeFrom = results.length ? start + 1 : 0;
  const rangeTo = start + visible.length;
  const pageItems = buildPageItems(safePage, pageCount);

  const filtered = Boolean(query.trim() || chip || env || sort !== "default");

  // যেকোনো ফিল্টার বদলালে প্রথম পাতায়
  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const reset = () => {
    setQuery("");
    setChip("");
    setEnv("");
    setSort("default");
    setPage(1);
  };

  const goToPage = (next) => {
    setPage(Math.min(Math.max(1, next), pageCount));
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="nal" aria-labelledby="nal-title">
      <div className="nh-wrap nal-inner">
        <div className="nal-top">
          <div className="nal-head">
            <h2 id="nal-title" className="nal-title">
              {t("home2.applicationPage.list.title")}
            </h2>
            <button type="button" className="nal-viewall" onClick={reset} disabled={!filtered}>
              <span>{t("home2.applicationPage.list.viewAll")}</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="nal-controls">
            <div className="nal-bar">
              <label className="nal-search">
                <SearchIcon size={24} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => change(setQuery)(event.target.value.slice(0, 100))}
                  placeholder={t("home2.applicationPage.list.searchPlaceholder")}
                  aria-label={t("home2.applicationPage.list.searchLabel")}
                  autoComplete="off"
                  spellCheck="false"
                />
              </label>

              {/* ব্রাউজারের <select> এর বদলে নিজের dropdown (Figma "Program Type popup"):
                  সাদা গোল কোণার তালিকা, hover/বাছা সারি ধূসর, keyboard এ <select> এর মতোই */}
              <NhSelect
                className="nal-select"
                value={env}
                options={envOptions}
                onChange={(value) => change(setEnv)(value)}
                ariaLabel={t("home2.applicationPage.list.envLabel")}
              />

              <SortMenu value={sort} onChange={change(setSort)} />
            </div>

            <ChipRail
              label={t("home2.applicationPage.list.chipsLabel")}
              activeKey={chip}
            >
                <li>
                  <button
                    type="button"
                    className="nal-chip"
                    aria-pressed={chip === ""}
                    onClick={() => change(setChip)("")}
                  >
                    {t("home2.applicationPage.list.all")}
                    <span className="nal-chip-count"> ({pad(items.length)})</span>
                  </button>
                </li>
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="nal-chip"
                      aria-pressed={chip === item.id}
                      onClick={() => change(setChip)(chip === item.id ? "" : item.id)}
                    >
                      {item.name}
                      <span className="nal-chip-count"> (01)</span>
                    </button>
                  </li>
                ))}
            </ChipRail>
          </div>
        </div>

        <div className="nal-results" ref={resultsRef}>
          {visible.length > 0 ? (
            <ul className="nal-grid">
              {visible.map((item, index) => (
                <li key={item.id}>
                  <ApplicationCard item={item} eager={index < 3} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="nal-empty">
              <p className="nal-empty-title">{t("home2.applicationPage.list.empty")}</p>
              <p className="nal-empty-hint">{t("home2.applicationPage.list.emptyHint")}</p>
              <button type="button" className="nal-empty-action" onClick={reset}>
                {t("home2.applicationPage.list.clear")}
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div className="nal-foot">
              <p className="nal-showing" aria-live="polite">
                <span className="nal-showing-dot" aria-hidden="true" />
                <span>
                  <Trans
                    i18nKey="home2.applicationPage.list.showing"
                    values={{ from: pad(rangeFrom), to: pad(rangeTo), total: pad(results.length) }}
                    components={{ b: <strong /> }}
                  />
                </span>
              </p>

              {pageCount > 1 && (
                <nav className="nal-pager" aria-label={t("home2.applicationPage.list.pager.label")}>
                  <button
                    type="button"
                    className="nal-page"
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    aria-label={t("home2.applicationPage.list.pager.previous")}
                  >
                    <PageArrow direction="left" />
                  </button>
                  <ol className="nal-pages">
                    {pageItems.map((item) =>
                      typeof item === "number" ? (
                        <li key={item}>
                          <button
                            type="button"
                            className={`nal-page${item === safePage ? " is-active" : ""}`}
                            onClick={() => goToPage(item)}
                            aria-current={item === safePage ? "page" : undefined}
                            aria-label={t("home2.applicationPage.list.pager.page", { page: item })}
                          >
                            {item}
                          </button>
                        </li>
                      ) : (
                        <li key={item} className="nal-page nal-page--gap" aria-hidden="true">
                          …
                        </li>
                      ),
                    )}
                  </ol>
                  <button
                    type="button"
                    className="nal-page"
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === pageCount}
                    aria-label={t("home2.applicationPage.list.pager.next")}
                  >
                    <PageArrow direction="right" />
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ApplicationList;