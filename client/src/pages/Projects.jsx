import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import {
  PROJECT_TYPES,
  fallbackPhoto,
  photoSrcSet,
  photoUrl,
  projectPhotos,
  rememberListSearch,
  useProjectList,
} from "./projectCatalog";
import ProjectSelect from "../components/projects/ProjectSelect";
import "./Projects.css";

/* ===============================================================
   PROJECTS — লিস্ট পাতা

   Figma "Frame 285" (1408 x 742, কোনো background রঙ নেই):

     সার্চ বার (1240 x 70) ── gap 32 ── category pill এর সারি (দুইপাশে তীর)
        │ gap 48
     card rail (450 উঁচু) ── gap 32 ── pagination (মাঝখানে)

   card এর আচরণ: সাধারণ অবস্থায় 298 x 450 শুধু ছবি। মাউস দিলে (hover)
   card টা 612 চওড়া হয়ে যায় — ছবি 358 উঁচুতে নামে, নিচে ধূসর অংশে নাম,
   শহর আর তীর বোতাম ফুটে ওঠে, উপরে বাঁয়ে category label। বাকি card
   গুলো 298 এ ফিরে যায়। rail এর দুইপাশে 48px এর তীর দিয়ে card এ
   card এ যাওয়া যায়; পরের card অর্ধেক উঁকি দেয় (peek)।

   ✅ project details এ যাওয়ার লিংক এখন শুধু খোলা card এর ↗ বোতামে।
   card এর বাকি অংশে ক্লিক করলে শুধু card খোলে, কোথাও যায় না।

   ডেটা: admin panel এর Projects থেকে (GET /api/projects) — শুধু
   Completed আর In Progress, draft কখনো আসে না. ক্রম: তারিখ (নতুন আগে).
   pill আর dropdown এ শুধু সেই Project Type গুলো আসে যেগুলোতে অন্তত
   একটা project আছে.

   ছবি: project এর প্রথম ছবি. না থাকলে বা নামতে না পারলে Project Type
   এর একটা নমুনা ছবি (pages/projectCatalog.js). একই ছবি collapsed
   অবস্থায় 298 x 450 (portrait) আর expanded অবস্থায় 612 x 358
   (landscape) এ object-fit: cover দিয়ে কাটা হয়।
   =============================================================== */

const PAGE_SIZE = 10;

/* শুরুতে কোন card টা খোলা থাকবে (0 থেকে গোনা) — Figma তে তৃতীয়টা।
   4 card এর পাতায় তৃতীয়টা খুললে 628 + 612 = 1240, অর্থাৎ ঠিক
   container এর ডান কিনারায় শেষ হয় — তাই rail কে সরাতে হয় না।
   পাতায় এর চেয়ে কম card থাকলে নিচের `active` হিসাবটা শেষেরটা ধরে */
const DEFAULT_ACTIVE_INDEX = 2;

/* srcset — খোলা card 612px, retina তে ~1224px লাগে। ফোনে card পুরো
   প্রস্থ, তাই 100vw */
const PHOTO_WIDTHS = [800, 1200, 1600];
const PHOTO_SIZES = "(max-width: 640px) 100vw, 612px";

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

/* now() — React এর নিয়মে render এর ভেতরে "সময়" পড়া যায়
   না; এগুলো শুধু event আর timer এ চলে, তাই আলাদা করে রাখা */
const now = () => performance.now();

/* ---------------------------------------------------------------
   আইকন — মাপ আর stroke Figma র CSS থেকে
   --------------------------------------------------------------- */

/* Figma: 24px, stroke 2px #40464E */
function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="#40464E" strokeWidth="2" />
      <path d="M16.5 16.5 21 21" stroke="#40464E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Figma: 16px, stroke 1.5px #84888C — তিন সারির slider আইকন।
   শুধু সাজসজ্জা (dropdown এর পাশে), তাই aria-hidden */
function FilterIcon() {
  return (
    <svg
      className="projects-filter-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="#84888C" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 3.33h4.67M9.33 3.33H14M9.33 2v2.67" />
        <path d="M2 8h3.33M8 8h6M5.33 6.67v2.67" />
        <path d="M2 12.67h6M10.67 12.67H14M10.67 11.33V14" />
      </g>
    </svg>
  );
}

/* Figma: 10 x 5, stroke 1.5px #373A3C */
/* Figma: 16px, stroke 1.5px */
function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 14.67S13.33 10.2 13.33 6.67A5.33 5.33 0 0 0 2.67 6.67C2.67 10.2 8 14.67 8 14.67Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.67" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* card এর 48px গোল বোতামের ভেতরের সাদা তীর */
function ArrowUpRight() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 18 18 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 6H18v9.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* pill সারি আর rail এর তীর — দিক CSS ছাড়া এখানেই ঘোরানো */
function Chevron({ direction = "left", width = 8, height = 14 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 8 14"
      fill="none"
      aria-hidden="true"
      style={{ transform: direction === "right" ? "rotate(180deg)" : undefined }}
    >
      <path d="M7 1 1 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* pagination এর "← Previous" / "Next →" এর ছোট তীর */
function PageArrow({ direction = "right" }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      style={{ transform: direction === "left" ? "scaleX(-1)" : undefined }}
    >
      <path d="M1 5h8M5.6 1.6 9 5 5.6 8.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ট্যাবের শিরোনাম — ComingSoon.jsx এর মতোই প্যাটার্ন */
function usePageMeta(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | Filamento`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/* একটা আনুভূমিক scroll এলাকা তার শুরু/শেষ প্রান্তে আছে কিনা — তীর
   বোতাম ধূসর (disabled) করার জন্য।

   ResizeObserver দিয়ে মাপা হয়, তাই প্রথমবার আঁকা, resize, আর
   ভেতরের জিনিসের মাপ বদলানো (card বড় হওয়া) — সবই নিজে ধরে।
   ⚠️ enabled=false হলে element নেই (যেমন ফলাফল খালি) — তখন কিছু করে না */
function useScrollEdges(ref, enabled = true) {
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;

    const measure = () => {
      const atStart = el.scrollLeft <= 4;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      setEdges((prev) =>
        prev.atStart === atStart && prev.atEnd === atEnd ? prev : { atStart, atEnd }
      );
    };

    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));

    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [ref, enabled]);

  return edges;
}

/* pagination এর সংখ্যা: শুরু, শেষ আর বর্তমান পাতার দুইপাশ।
   মাঝে শুধু একটা পাতা বাদ পড়লে "…" না বসিয়ে সংখ্যাটাই দেখানো হয়।
   ৫ পাতার প্রথম পাতায়:  1 2 … 5   (Figma র মতো) */
function buildPageItems(current, total) {
  if (total <= 4) return Array.from({ length: total }, (_, i) => i + 1);

  const keep = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const items = [];
  keep.forEach((page, index) => {
    if (index > 0) {
      const gap = page - keep[index - 1];
      if (gap === 2) items.push(page - 1);
      else if (gap > 2) items.push(`ellipsis-${page}`);
    }
    items.push(page);
  });
  return items;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* card বড় হওয়ার transition এর সময় (ms) — Projects.css এর
   --pj-card-dur এর সাথে মেলাতে হবে */
const CARD_TRANSITION_MS = 820;

/* মাউস card এর উপর এসে এই সময় (ms) থাকলে তবেই card খোলে — মাউস
   দ্রুত অনেক card এর উপর দিয়ে গেলে প্রতিটা খুলতে-বন্ধ হতে থাকত (ঝাঁকুনি) */
const HOVER_INTENT_MS = 90;

/* scroll/টানা থামার পর এই সময় (ms) পর্যন্ত hover এ card খোলা বন্ধ */
const SLIDE_SETTLE_MS = 250;

/* CSS variable এর আসল মাপ (px) — var(--x) এ px, calc, cqw যাই থাকুক,
   একটা অদৃশ্য element এ বসিয়ে ব্রাউজারকে দিয়েই হিসাব করানো */
function cssWidth(host, variable) {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;height:0;width:var(${variable})`;
  host.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

function Projects() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const [searchParams, setSearchParams] = useSearchParams();

  usePageMeta(t("projects.title"));

  // ইউআরএল থেকে শুরুর অবস্থা পড়া — footer/testimonial এর
  // ?category=xxx লিংক থেকে সরাসরি এলে যেন সঠিক ট্যাব সিলেক্ট থাকে
  const initialCategory = searchParams.get("category") || "all";
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(
    PROJECT_TYPES.includes(initialCategory) ? initialCategory : "all"
  );
  const { status, projects: liveProjects, retry } = useProjectList();
  const [page, setPage] = useState(1);
  // এই পাতার কোন card টা এখন বড় (expanded) — hover/focus/tap এ বদলায়।
  // শুরুতে Figma র মতো তৃতীয় card টা খোলা; মাউস সরিয়ে নিলেও শেষ
  // card টাই বড় থাকে, যাতে rail লাফালাফি না করে
  const [activeIndex, setActiveIndex] = useState(DEFAULT_ACTIVE_INDEX);
  // তীর/ক্লিকে card বদলানোর সময়টুকু (width transition) track এর
  // hover/click handler লক থাকে — carousel লাইব্রেরির industry-standard
  // প্যাটার্ন: animation চলাকালীন নতুন interaction ধরা হয় না, তাই
  // মাঝপথে হঠাৎ hover ফায়ার হয়ে তীরের ক্লিককে বাতিল করতে পারে না
  const [isNavigating, setIsNavigating] = useState(false);
  const navigateLockTimer = useRef(null);

  const tabsRef = useRef(null);
  const railRef = useRef(null);
  // openCard() থেকে প্রতিবার সেট হয় (শুধু auto-scroll নয়) — width
  // transition চলাকালীন কোনো card এর উপর দিয়ে মাউস "সরে" গেলে
  // (আসলে card টাই সরে, browser কে hover recompute করতে হয়) hover
  // handler যেন নতুন করে activeIndex পাল্টাতে না পারে
  const autoScrollAt = useRef(0);
  const hasMounted = useRef(false);
  const hoverTimer = useRef(null);
  // rail কে scroll করানো হবে শুধু স্পষ্ট কাজে (তীর, ক্লিক/tap, কিবোর্ড
  // focus)। মাউস hover এ কখনোই নয় — hover এ card গুলো নিজের জায়গায় থাকে
  const revealOnChange = useRef(false);
  // slider টানা/scroll চলছে কিনা — তখন hover এ কোনো card খুলবে না, নাহলে
  // card এর মাপ বদলে বাকি সব জায়গা থেকে সরে যেত
  const isDragging = useRef(false);
  const lastScrollAt = useRef(0);

  // ফিল্টার বদলালে ইউআরএল টাও (?q=, ?category=) সাথে সাথে আপডেট —
  // যাতে লিংক শেয়ার করা যায়। পাতা ১ এ ফেরত নেওয়াটা effect এ না
  // করে নিচের handler এ করা — effect এর ভেতর থেকে সরাসরি setState
  // করলে cascading render হয়
  useEffect(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (category !== "all") next.set("category", category);
    setSearchParams(next, { replace: true, preventScrollReset: true });
    // Project Details এর "All projects" এই filter এই ফেরে
    const search = next.toString();
    rememberListSearch(search ? `?${search}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category]);

  // নতুন তালিকা/পাতা এলে rail শুরুতে ফিরে যায়, তৃতীয় card বড়
  function resetRail() {
    setActiveIndex(DEFAULT_ACTIVE_INDEX);
    railRef.current?.scrollTo({ left: 0 });
  }

  function handleQueryChange(value) {
    setQuery(value);
    setPage(1);
    resetRail();
  }

  function handleCategoryChange(id) {
    setCategory(id);
    setPage(1);
    resetRail();
  }

  function goToPage(nextPage) {
    setPage(nextPage);
    resetRail();
  }

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
    [liveProjects]
  );

  const counts = useMemo(() => {
    const map = { all: projects.length };
    for (const project of projects) {
      map[project.category] = (map[project.category] || 0) + 1;
    }
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
    [counts, category, status]
  );

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return projects.filter((project) => {
      const matchesCategory = category === "all" || project.category === category;
      if (!matchesCategory) return false;
      if (!words.length) return true;
      const categoryLabel = t(`projects.categories.${project.category}`).toLowerCase();
      const text = `${project.search} ${categoryLabel}`;
      return words.every((word) => text.includes(word));
    });
  }, [projects, query, category, t]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  // পাতায় ৩টার কম card থাকলে (যেমন filter এর শেষ পাতা) DEFAULT_ACTIVE_INDEX
  // নাগালের বাইরে — তখন শেষ card টাই খোলা থাকে
  const active = Math.min(activeIndex, Math.max(visible.length - 1, 0));
  const hasResults = visible.length > 0;

  const tabEdges = useScrollEdges(tabsRef);
  // rail এর দুই পাশের বড় তীর — শুরুতে বাঁ তীর, শেষে ডান তীর ধূসর
  const railEdges = useScrollEdges(railRef, hasResults);

  // পাতা/filter বদলে card কমে গেলে (যেমন শেষ পাতায় ২টা) activeIndex
  // নাগালের বাইরে থেকে যেত — উপরের `active` ঠিক দেখালেও state টা আলাদা
  // থাকত, ফলে openCard এর `index === active` তুলনা মিলত না আর তীর
  // চুপচাপ কিছুই করত না। তাই state কেই সীমার ভেতরে টেনে আনা — render
  // এর সময়ই (effect এ করলে একবার বাড়তি render হতো)
  if (activeIndex !== active && visible.length > 0) {
    setActiveIndex(active);
  }

  // তীর/ক্লিক/focus এ card বদলালে, transition শেষে ডানে/বাঁয়ে কেটে থাকলে
  // rail কে সরিয়ে card টাকে content এর ভেতরে আনা। hover এ কখনো নয়,
  // আর প্রথমবার আঁকার সময়ও নয়
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return undefined;
    }
    if (!revealOnChange.current) return undefined;
    revealOnChange.current = false;

    const timer = setTimeout(() => {
      const rail = railRef.current;
      const card = rail?.querySelectorAll(".projects-card")[active];
      if (!rail || !card) return;

      // content এর বাঁ/ডান সীমা = rail এর padding (--rail-gutter)
      const gutter = parseFloat(getComputedStyle(rail.firstElementChild).paddingLeft) || 0;
      const railBox = rail.getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      const overRight = cardBox.right - (railBox.right - gutter);
      const overLeft = cardBox.left - (railBox.left + gutter);

      let delta = 0;
      if (overRight > 1) delta = overRight;
      else if (overLeft < -1) delta = overLeft;

      if (delta !== 0) {
        autoScrollAt.current = now();
        rail.scrollBy({ left: delta, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    }, CARD_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [active]);

  // খুললে card টা (612) কি এখন দেখা যাওয়া এলাকার ভেতরেই ধরবে? উত্তর "না"
  // হলে (যেমন ডানে উঁকি দেওয়া card) hover এ খোলা হয় না — নাহলে বাড়তে
  // গিয়ে কেটে যেত, আর কাটা ঠেকাতে rail সরাতে হতো। ওই card তীর বা
  // ক্লিক দিয়ে খোলা যায়
  function fitsWhenOpen(index) {
    const rail = railRef.current;
    const track = rail?.firstElementChild;
    if (!rail || !track) return false;
    const style = getComputedStyle(track);
    const gutter = parseFloat(style.paddingLeft) || 0;
    const gap = parseFloat(style.columnGap) || 0;
    const closed = cssWidth(rail, "--pj-card-w");
    const open = cssWidth(rail, "--pj-card-w-active");
    // খুললে বাকি সব card বন্ধ — তাই index তম card এর বাঁ কিনারা এটাই
    const left = gutter + index * (closed + gap);
    const right = left + open;
    return left >= rail.scrollLeft - 1 && right <= rail.scrollLeft + rail.clientWidth + 1;
  }

  // টানা চলছে, বা এইমাত্র scroll থেমেছে (momentum/trackpad সহ)
  function isSliding() {
    return isDragging.current || now() - lastScrollAt.current < SLIDE_SETTLE_MS;
  }

  function handlePointerEnter(event, index) {
    // touch এ hover নেই — সেখানে tap (onClick) দিয়ে খোলে
    if (event.pointerType !== "mouse") return;
    if (index === active) return;
    if (now() - autoScrollAt.current < CARD_TRANSITION_MS + 200) return;
    if (isSliding()) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      if (isSliding()) return;
      if (fitsWhenOpen(index)) setActiveIndex(index);
    }, HOVER_INTENT_MS);
  }

  function handlePointerLeave() {
    clearTimeout(hoverTimer.current);
  }

  // ক্লিক/tap/কিবোর্ড focus — স্পষ্ট ইচ্ছা, তাই দরকারে rail সরবে
  function openCard(index) {
    clearTimeout(hoverTimer.current);
    if (index === active) return;
    revealOnChange.current = true;
    autoScrollAt.current = now();
    setIsNavigating(true);
    clearTimeout(navigateLockTimer.current);
    navigateLockTimer.current = setTimeout(() => setIsNavigating(false), CARD_TRANSITION_MS);
    setActiveIndex(index);
  }

  useEffect(
    () => () => {
      clearTimeout(hoverTimer.current);
      clearTimeout(navigateLockTimer.current);
    },
    []
  );

  /* rail এর তীর — একবারে দুইটা বন্ধ card এর সমান সরে (Figma "Button":
     48px গোল তীর, দুই পাশে). টানার মতোই hover এ card খোলা কিছুক্ষণ
     বন্ধ থাকে (scroll event থেকে), তাই সরার মাঝে card লাফায় না */
  function slideRail(direction) {
    const rail = railRef.current;
    const track = rail?.firstElementChild;
    if (!rail || !track) return;
    clearTimeout(hoverTimer.current);
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = (cssWidth(rail, "--pj-card-w") + gap) * 2;
    rail.scrollBy({
      left: direction * Math.min(step, rail.clientWidth * 0.8),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  function scrollTabsBy(amount) {
    tabsRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  // card গুলো slider: touch এ আঙুলে টানা, trackpad এ swipe, মাউসে চেপে
  // ধরে টানা, আর বড় পর্দায় দুই পাশের তীর (slideRail). ছাড়ার পর হালকা
  // momentum থাকে, তাই থামাটা আচমকা নয়
  const dragMoved = useRef(false);
  useEffect(() => {
    const rail = railRef.current;
    if (!hasResults || !rail) return undefined;

    let down = false;
    let startX = 0;
    let startLeft = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0; // px/ms, scrollLeft এর দিকে
    let raf = 0;

    const stopMomentum = () => cancelAnimationFrame(raf);

    const onScroll = () => {
      lastScrollAt.current = now();
      // scroll চলাকালীন অপেক্ষায় থাকা hover-open বাতিল
      clearTimeout(hoverTimer.current);
    };

    const onDown = (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      stopMomentum();
      down = true;
      dragMoved.current = false;
      startX = event.clientX;
      startLeft = rail.scrollLeft;
      lastX = event.clientX;
      lastT = now();
      velocity = 0;
    };

    const onMove = (event) => {
      if (!down) return;
      const dx = event.clientX - startX;
      if (!dragMoved.current && Math.abs(dx) > 5) {
        dragMoved.current = true;
        isDragging.current = true;
        clearTimeout(hoverTimer.current);
        rail.classList.add("is-dragging");
      }
      if (!dragMoved.current) return;

      const time = now();
      const dt = time - lastT;
      if (dt > 0) velocity = 0.7 * velocity + 0.3 * ((lastX - event.clientX) / dt);
      lastX = event.clientX;
      lastT = time;

      rail.scrollLeft = startLeft - dx;
    };

    const onUp = () => {
      if (!down) return;
      down = false;
      rail.classList.remove("is-dragging");
      lastScrollAt.current = now();

      const wasDragging = dragMoved.current;
      // ছাড়ার আগে অনেকক্ষণ থেমে থাকলে momentum নেই
      if (!wasDragging || now() - lastT > 80 || prefersReducedMotion()) {
        isDragging.current = false;
        return;
      }

      let v = velocity * 16; // px/frame
      const step = () => {
        const before = rail.scrollLeft;
        rail.scrollLeft += v;
        v *= 0.94;
        lastScrollAt.current = now();
        if (Math.abs(v) > 0.4 && rail.scrollLeft !== before) {
          raf = requestAnimationFrame(step);
        } else {
          isDragging.current = false;
        }
      };
      raf = requestAnimationFrame(step);
    };

    rail.addEventListener("scroll", onScroll, { passive: true });
    rail.addEventListener("pointerdown", onDown);
    // wheel/touch এ momentum চললে নতুন ইনপুটে আগেরটা থামানো
    rail.addEventListener("wheel", stopMomentum, { passive: true });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      stopMomentum();
      rail.removeEventListener("scroll", onScroll);
      rail.removeEventListener("pointerdown", onDown);
      rail.removeEventListener("wheel", stopMomentum);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      isDragging.current = false;
    };
  }, [hasResults]);

  const pageItems = useMemo(() => buildPageItems(safePage, pageCount), [safePage, pageCount]);

  return (
    <section className="section projects">
      <div className="container projects-inner">
        {/* Figma নকশায় পাতার শিরোনাম দেখানো হয়নি — তবু h1 থাকা দরকার
            (screen reader, SEO), তাই শুধু চোখের আড়ালে */}
        <h1 className="sr-only">{t("projects.title")}</h1>

        <div className="projects-filters">
          {/* সার্চ বার + environment dropdown — Figma "Search Bar" */}
          <div className="projects-searchbar">
            <label className="projects-search-field">
              <SearchIcon />
              <input
                type="search"
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder={t("projects.search.placeholder")}
                aria-label={t("projects.search.ariaLabel")}
              />
            </label>

            <FilterIcon />

            <ProjectSelect
              value={category}
              onChange={handleCategoryChange}
              ariaLabel={t("projects.search.environmentAriaLabel")}
              options={[
                { value: "all", label: t("projects.search.environmentLabel") },
                ...categoryOrder
                  .filter((id) => id !== "all")
                  .map((id) => ({
                    value: id,
                    label: t(`projects.categories.${id}`),
                  })),
              ]}
            />
          </div>

          {/* category pill — Figma "Frame 419": 24px তীর + pill + 24px তীর, gap 16 */}
          <div className="projects-tabs-row">
            <button
              type="button"
              className="projects-tabs-arrow"
              onClick={() => scrollTabsBy(-240)}
              disabled={tabEdges.atStart}
              aria-label={t("projects.categoriesPrev", "Scroll categories left")}
            >
              <Chevron direction="left" />
            </button>

            <div className="projects-tabs" ref={tabsRef} role="tablist">
              {categoryOrder.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={category === id}
                  className={`projects-tab${category === id ? " is-active" : ""}`}
                  onClick={() => handleCategoryChange(id)}
                >
                  <span>{t(`projects.categories.${id}`)}</span>
                  <span className="projects-tab-count">{counts[id] ?? 0}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="projects-tabs-arrow"
              onClick={() => scrollTabsBy(240)}
              disabled={tabEdges.atEnd}
              aria-label={t("projects.categoriesNext", "Scroll categories right")}
            >
              <Chevron direction="right" />
            </button>
          </div>
        </div>

        <div className="projects-gallery">
          {status === "loading" ? (
            <div className="projects-loading" aria-busy="true">
              <span className="sr-only">{t("projects.loading")}</span>
              {Array.from({ length: 4 }, (_, index) => (
                <span
                  key={index}
                  className={`projects-skeleton${index === 2 ? " is-wide" : ""}`}
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : status === "error" ? (
            <div className="projects-empty" role="alert">
              <p>{t("projects.error")}</p>
              <button type="button" className="projects-empty-clear" onClick={retry}>
                {t("projects.retry")}
              </button>
            </div>
          ) : hasResults ? (
            <div className="projects-stage">
              <div
                className="projects-rail"
                ref={railRef}
                onClickCapture={(event) => {
                  // টেনে সরানোর পর ছাড়লে যে "click" ফায়ার হয় সেটা আটকানো,
                  // নাহলে টানার শেষে হঠাৎ একটা card খুলে যেত
                  if (dragMoved.current) {
                    event.preventDefault();
                    event.stopPropagation();
                    dragMoved.current = false;
                  }
                }}
              >
                <ul
                  key={`${safePage}-${category}`}
                  className={`projects-track${isNavigating ? " is-navigating" : ""}`}
                >
                  {visible.map((project, index) => (
                    <li
                      key={project.id}
                      className={`projects-card${index === active ? " is-active" : ""}`}
                      onPointerEnter={(event) => handlePointerEnter(event, index)}
                      onPointerLeave={handlePointerLeave}
                      onFocus={() => openCard(index)}
                      onClick={() => openCard(index)}
                    >
                      <div className="projects-card-media">
                        <img
                          src={photoUrl(project.photo, 1200)}
                          srcSet={photoSrcSet(project.photo, PHOTO_WIDTHS)}
                          sizes={PHOTO_SIZES}
                          onError={fallbackOnError(project.category)}
                          alt=""
                          width="1200"
                          height="900"
                          loading={index < 4 ? "eager" : "lazy"}
                          decoding="async"
                          draggable="false"
                        />
                        <span className="projects-card-badge">
                          {t(`projects.categories.${project.category}`)}
                        </span>
                      </div>

                      <div className="projects-card-footer">
                        <div className="projects-card-text">
                          <h2 className="projects-card-name">{project.name}</h2>
                          <p className="projects-card-city">
                            <PinIcon />
                            <span>{project.city}</span>
                          </p>
                        </div>

                        {/* শুধু এই ↗ বোতামেই project details এ যায়। বন্ধ card এ
                            CSS এ pointer-events বন্ধ, তাই সেখানে ক্লিক শুধু
                            card খোলে। বন্ধ card এর বোতাম tab দিয়েও ধরা যায় না */}
                        <Link
                          to={localeLink(`/projects/${project.slug}`)}
                          className="projects-card-arrow"
                          aria-label={t("projects.viewProject", { name: project.name })}
                          tabIndex={index === active ? 0 : -1}
                          onClick={(event) => {
                            // বন্ধ card এর বোতামে ক্লিক হলে navigate নয়,
                            // শুধু card খোলা (li এর onClick সেটা করবে)
                            if (index !== active) event.preventDefault();
                          }}
                        >
                          <ArrowUpRight />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Figma "Button" — rail এর দুই পাশে 48px গোল তীর. ফোনে
                  লুকানো, সেখানে আঙুলে টেনে সরানো হয়. সব card একসাথে
                  দেখা গেলে (সরানোর কিছু নেই) তীরও নেই */}
              {!(railEdges.atStart && railEdges.atEnd) && (
                <>
                  <button
                    type="button"
                    className="projects-rail-arrow is-prev"
                    onClick={() => slideRail(-1)}
                    disabled={railEdges.atStart}
                    aria-label={t("projects.railPrev")}
                  >
                    <Chevron direction="left" width={9} height={16} />
                  </button>
                  <button
                    type="button"
                    className="projects-rail-arrow is-next"
                    onClick={() => slideRail(1)}
                    disabled={railEdges.atEnd}
                    aria-label={t("projects.railNext")}
                  >
                    <Chevron direction="right" width={9} height={16} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="projects-empty">
              <p>{t("projects.empty")}</p>
              <p className="projects-empty-hint">{t("projects.emptyHint")}</p>
              <button
                type="button"
                className="projects-empty-clear"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  goToPage(1);
                }}
              >
                {t("projects.clearFilters")}
              </button>
            </div>
          )}

          {/* pagination — Figma "Group 5": মাঝখানে, gap 8. Figma র মতো
              সবসময় দেখায় (এক পাতা হলেও) — তখন Previous/Next ধূসর */}
          {status === "ready" && hasResults && (
            <nav className="projects-pagination" aria-label={t("projects.pagination.ariaLabel")}>
              <button
                type="button"
                className="projects-pagination-side"
                disabled={safePage === 1}
                onClick={() => goToPage(Math.max(1, safePage - 1))}
              >
                <PageArrow direction="left" />
                <span>{t("projects.pagination.previous")}</span>
              </button>

              <ul className="projects-pagination-pages">
                {pageItems.map((item) =>
                  typeof item === "number" ? (
                    <li key={item}>
                      <button
                        type="button"
                        className={`projects-pagination-page${item === safePage ? " is-active" : ""}`}
                        aria-current={item === safePage ? "page" : undefined}
                        aria-label={t("projects.pagination.pageAriaLabel", { page: item })}
                        onClick={() => goToPage(item)}
                      >
                        {item}
                      </button>
                    </li>
                  ) : (
                    <li key={item} className="projects-pagination-ellipsis" aria-hidden="true">
                      …
                    </li>
                  )
                )}
              </ul>

              <button
                type="button"
                className="projects-pagination-side"
                disabled={safePage === pageCount}
                onClick={() => goToPage(Math.min(pageCount, safePage + 1))}
              >
                <span>{t("projects.pagination.next")}</span>
                <PageArrow direction="right" />
              </button>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}

export default Projects;