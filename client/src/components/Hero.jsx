import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SoftLink from "./SoftLink";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import { LINKS_LIVE } from "../lib/siteLinks";
import {
  DEFAULT_HERO_URL,
  buildHeroView,
  cloudinaryUrl,
  isCloudinary,
  isExternalLink,
  useHomeContent,
} from "../lib/homeContent";
import "./Hero.css";

/* ---------------------------------------------------------------
   Hero এর ছবি

   লেখা, ছবি, badge আর নিচের card এখন database থেকে আসে (admin এর
   Home Page Content → Hero). server না পেলে বা কিছু save না হলে
   আগের হুবহু লেখা-ছবিই দেখায় — lib/homeContent.js দেখুন.

   ছবিটা আপলোডের আগেই টাইট crop করা, তাই e_trim আর লাগছে না।

   c_limit,w_   — নির্দিষ্ট প্রস্থে নামিয়ে আনে, কিন্তু কখনো বড় করে না।
                  উৎসে যে পিক্সেল নেই সেটা বানিয়ে দেওয়ার চেয়ে যা আছে
                  তাই পাঠানো ভালো
   q_auto:best  — q_auto এর সবচেয়ে কম ক্ষতিকর ধাপ। সাধারণ q_auto
                  (মানে q_auto:good) এখানে চোখে পড়ার মতো নরম করে দিচ্ছিল
   f_auto       — ব্রাউজার অনুযায়ী সেরা format (AVIF/WebP)
   --------------------------------------------------------------- */
const heroSrc = (url, width) =>
  cloudinaryUrl(url, `c_limit,w_${width},f_auto,q_auto:best`);

/* আসল (আগের) ছবির উৎস প্রস্থ। Figma থেকে 2x export করে নতুন ছবি
   আপলোড করলে শুধু এই সংখ্যাটা বদলাবেন — srcset নিজে থেকে মিলে যাবে।

   এর চেয়ে বড় মাপ srcset এ রাখা যাবে না: c_limit ছবি বড় করে না,
   তাই ব্রাউজার "1280w" ভেবে যেটা নামাবে সেটা আসলে 829px ই হতো —
   ভুল হিসাব করে ঝাপসা ছবি বেছে নিত */
const HERO_SOURCE_WIDTH = 829;

const SRCSET_WIDTHS = [480, 640, 960, 1280, 1600];

const DEFAULT_SRCSET_WIDTHS = SRCSET_WIDTHS.filter((w) => w < HERO_SOURCE_WIDTH).concat(
  HERO_SOURCE_WIDTH,
);

/* admin এ আপলোড করা ছবির আসল প্রস্থ আমরা জানি না — তাই সাধারণ তালিকা.
   ছবি ছোট হলে c_limit সেটাকেই পাঠায়, বড় করে না */
const heroSrcSet = (url) => {
  if (!isCloudinary(url)) return undefined;
  const widths = url === DEFAULT_HERO_URL ? DEFAULT_SRCSET_WIDTHS : SRCSET_WIDTHS;
  return widths.map((w) => `${heroSrc(url, w)} ${w}w`).join(", ");
};

const heroFallbackWidth = (url) => (url === DEFAULT_HERO_URL ? HERO_SOURCE_WIDTH : 960);

/* নিচের card এর ছবি ~214x240 ঘরে বসে — 640px যথেষ্ট (2x পর্দাতেও) */
const cardImage = (url) => cloudinaryUrl(url, "c_limit,w_640,f_auto,q_auto");

/* Figma এ badge গুলোর icon vector হিসেবে এসেছে (32x32, 2px stroke).
   stroke currentColor রাখা হয়েছে যাতে CSS থেকে রঙ নিয়ন্ত্রণ করা যায় */
const ICON_PROPS = {
  width: 32,
  height: 32,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const BADGE_ICONS = {
  energy: (
    <svg {...ICON_PROPS}>
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
    </svg>
  ),
  warranty: (
    <svg {...ICON_PROPS}>
      <path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.7 7.5 10 4.4-1.3 7.5-5.4 7.5-10v-6L12 2.5Z" />
      <path d="M9 12.2l2.2 2.2L15.4 10" />
    </svg>
  ),
  madeIn: (
    <svg {...ICON_PROPS}>
      <path d="M5 21V3.5" />
      <path d="M5 4.2h12.5l-2.4 4 2.4 4H5" />
    </svg>
  ),
  certified: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.2 12.2l2.5 2.5 5.1-5.1" />
    </svg>
  ),
  listed: (
    <svg {...ICON_PROPS}>
      <path d="M7.5 3.5h9v5a4.5 4.5 0 0 1-9 0v-5Z" />
      <path d="M7.5 5.5H5a2.5 2.5 0 0 0 2.5 2.5M16.5 5.5H19A2.5 2.5 0 0 1 16.5 8" />
      <path d="M12 13v4M8.5 20.5h7M10 17h4l1.5 3.5h-7L10 17Z" />
    </svg>
  ),
  /* নিচের icon গুলো admin এর অন্য icon নামের জন্য (Key Features এ
     শিরোনাম দেখে বসে). আঁকার ধরন একই: 2px stroke, currentColor */
  maintenance: (
    <svg {...ICON_PROPS}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
    </svg>
  ),
  visibility: (
    <svg {...ICON_PROPS}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  glare: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  installation: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  roi: (
    <svg {...ICON_PROPS}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  ),
  spark: (
    <svg {...ICON_PROPS}>
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
    </svg>
  ),
};

function ArrowUpRight() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <path d="M4.2 12.8 12.8 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M5.9 4.2h6.9v6.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CtaArrow() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
      <path
        d="M1 5h10M7.2 1.2 11 5 7.2 8.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chevron({ direction }) {
  return (
    <svg width="9" height="16" viewBox="0 0 9 16" fill="none" aria-hidden="true">
      <path
        d={direction === "prev" ? "M7.5 1 1.5 8l6 7" : "M1.5 1l6 7-6 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* lightsOn — Home থেকে আসে: intro loader পুরো শেষ হলে true.
   আলাদা কোনো পাতায় Hero ব্যবহার করলে prop না দিলেও চলবে —
   তখন পাতা খুলতেই জ্বলবে */
/* কত সেকেন্ড পরপর নিজে থেকে পরের slide এ যাবে */
const AUTOPLAY_MS = 6000;
// বদলানোর সময় পুরনো লেখা-ছবি ঝাপসা হতে এই সময় নেয় (Hero.css এর --hero-swap এর সাথে মেলে)
const SWAP_MS = 260;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Hero({ lightsOn = true }) {
  const { t, i18n } = useTranslation();
  const localeLink = useLocaleLink();

  /* ---------- database এর content ----------
     ready: উত্তর এসেছে (বা ১.৫ সেকেন্ড পেরিয়েছে). তার আগে অংশটা
     লুকানো থাকে — নাহলে প্রথমে পুরনো লেখা-ছবি, তারপর নতুনটা
     ঝলকাত. লুকানো অবস্থাতেও জায়গা নেয়, তাই পাতা লাফায় না */
  const { content, settled: ready } = useHomeContent();

  // t এর পরিচয় ভাষা বদলালে বদলায় — তাই ভাষা বদলালে view নিজে নতুন হয়
  const view = useMemo(
    () =>
      buildHeroView(content?.hero, {
        t,
        en: i18n.getFixedT("en"),
        has: (key) => i18n.exists(key, { lng: "en" }),
      }),
    [content, t, i18n],
  );

  /* admin এর দেওয়া ছবি না নামলে (ভাঙা link) আগের ছবিতে ফিরে যায় —
     hero ফাঁকা বা ভাঙা ছবিসহ থাকে না */
  const [failedUrls, setFailedUrls] = useState([]);
  const hasCards = view.cards.length > 0;

  /* ---------- Hero slider ----------
     active  — এখন কোন slide দেখাচ্ছে
     fading  — বদলের মাঝখানে: পুরনো লেখা-ছবি মিলিয়ে যাচ্ছে, তারপর
               নতুনটা বসে ফুটে ওঠে
     paused  — mouse উপরে (বা keyboard focus) থাকলে নিজে বদলানো থামে

     slide একটা হলে এসবের কিছুই দেখা যায় না — আগের মতোই */
  const slides = view.slides;
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);
  const swapTimer = useRef(0);

  // admin এ slide কমালে active যেন সীমার বাইরে না থাকে
  const current = slides[active] ?? slides[0];
  useEffect(() => {
    if (active >= count) setActive(0);
  }, [active, count]);

  const goTo = useCallback(
    (next) => {
      if (count < 2) return;
      const target = (next + count) % count;
      if (target === active) return;

      window.clearTimeout(swapTimer.current);
      if (prefersReducedMotion()) {
        setActive(target);
        return;
      }
      setFading(true);
      swapTimer.current = window.setTimeout(() => {
        setActive(target);
        setFading(false);
      }, SWAP_MS);
    },
    [active, count],
  );

  useEffect(() => () => window.clearTimeout(swapTimer.current), []);

  const imageUrl = failedUrls.includes(current.imageUrl) ? DEFAULT_HERO_URL : current.imageUrl;

  /* লাইটের ছবি এখনো নামেনি অথচ আলো জ্বলে উঠল — ধীর internet এ
     এমন হলে ফাঁকা জায়গায় আলো ঝিলিক দিত. তাই ছবি আসা পর্যন্ত অপেক্ষা.

     React নিজে img তৈরি করে src বসায়, তাই cache থেকে এলেও onLoad
     ঘটেই. তবু খুব ধীর connection এ অনন্তকাল অন্ধকার যেন না থাকে —
     2.5 সেকেন্ড পরে ছবি ছাড়াই জ্বলে যায় */
  const [imageReady, setImageReady] = useState(false);
  const markImageReady = () => setImageReady(true);
  const handleImageError = () => {
    setFailedUrls((old) => (old.includes(imageUrl) ? old : [...old, imageUrl]));
    setImageReady(true);
  };

  useEffect(() => {
    if (!lightsOn) return undefined;
    const fallback = setTimeout(() => setImageReady(true), 2500);
    return () => clearTimeout(fallback);
  }, [lightsOn]);

  const lit = lightsOn && imageReady && ready;

  /* নিজে নিজে পরের slide — আলো জ্বলার পরে শুরু, pause থাকলে নয়,
     আর যাঁরা কম নড়াচড়া চান (reduced motion) তাঁদের জন্য একদমই নয়.
     active বদলালেই timer নতুন করে ৬ সেকেন্ড গোনে, তাই হাতে বদলালেও
     সাথে সাথে আবার বদলে যায় না */
  useEffect(() => {
    if (count < 2 || paused || !lit || prefersReducedMotion()) return undefined;
    const id = window.setTimeout(() => goTo(active + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [count, paused, lit, active, goTo]);

  /* অন্য slide এর ছবি আগে থেকে নামিয়ে রাখা, যাতে বদলের সময় ফাঁকা না দেখায় */
  const slideImagesKey = slides.map((item) => item.imageUrl).join("|");
  useEffect(() => {
    if (!ready || count < 2) return;
    slideImagesKey.split("|").forEach((url) => {
      if (url && url !== DEFAULT_HERO_URL) new Image().src = heroSrc(url, heroFallbackWidth(url));
    });
  }, [ready, count, slideImagesKey]);

  const trackRef = useRef(null);

  /* দুই প্রান্তে পৌঁছেছি কিনা — এটা দিয়েই তীর নিষ্ক্রিয় হয় আর
     ধারের fade টা বসে বা সরে যায় */
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /* টানার অবস্থা state এ নয়, ref এ। প্রতিটা mousemove এ re-render
     হলে স্লাইডার আটকে আটকে চলত */
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: 0 });
  const suppressClick = useRef(false);

  const syncEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const max = el.scrollWidth - el.clientWidth;
    // 1px সহনশীলতা — কিছু ব্রাউজারে scrollLeft ভগ্নাংশে গিয়ে থামে
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    syncEdges();
    el.addEventListener("scroll", syncEdges, { passive: true });

    /* card এর প্রস্থ clamp() দিয়ে viewport এর সাথে বদলায়, তাই window
       resize নয় — element এর মাপ সরাসরি নজরে রাখা হচ্ছে */
    const observer = new ResizeObserver(syncEdges);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", syncEdges);
      observer.disconnect();
    };
  }, [syncEdges, hasCards]);

  /* admin এ card বাড়ালে/কমালে তীর আর ধারের fade নতুন করে হিসাব হয় —
     ResizeObserver শুধু ঘরের মাপ দেখে, ভেতরের card এর সংখ্যা নয় */
  const cardsKey = view.cards.map((card) => card.id).join("|");
  useEffect(() => {
    syncEdges();
  }, [cardsKey, ready, syncEdges]);

  /* এক card + এক gap = এক ধাপ। মাপটা DOM থেকে পড়া হচ্ছে, hardcode
     করা হয়নি — card এর প্রস্থ clamp() দিয়ে বদলায় */
  const stepSize = () => {
    const el = trackRef.current;
    const card = el?.querySelector(".hero-card");
    if (!el || !card) return 0;

    const gap = parseFloat(getComputedStyle(el).columnGap) || 16;
    return card.getBoundingClientRect().width + gap;
  };

  const slide = (direction) => {
    const el = trackRef.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: direction * stepSize(),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  /* ---------- mouse দিয়ে টেনে সরানো ----------
     touch আর trackpad এ ব্রাউজারের নিজের scroll ই সবচেয়ে ভালো লাগে
     (গতিজড়তা, rubber-band — সবই বিনামূল্যে), তাই শুধু mouse এর জন্য।
     pointer capture নেওয়ায় কার্সার স্লাইডারের বাইরে গেলেও টানা চলে */
  const handlePointerDown = (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    const el = trackRef.current;
    if (!el) return;

    suppressClick.current = false;
    drag.current = {
      active: true,
      startX: event.clientX,
      startScroll: el.scrollLeft,
      moved: 0,
    };

    el.setPointerCapture(event.pointerId);
    el.classList.add("is-dragging");
  };

  const handlePointerMove = (event) => {
    const el = trackRef.current;
    if (!drag.current.active || !el) return;

    const delta = event.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(delta));
    el.scrollLeft = drag.current.startScroll - delta;
  };

  const endDrag = (event) => {
    const el = trackRef.current;
    if (!drag.current.active || !el) return;

    /* ৫px এর বেশি সরলে সেটা টানা, ক্লিক নয় — নাহলে card টেনে ছাড়ার
       সাথে সাথেই লিংকে চলে যেত */
    suppressClick.current = drag.current.moved > 5;

    drag.current.active = false;
    el.classList.remove("is-dragging");

    if (event?.pointerId !== undefined && el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
  };

  const handleClickCapture = (event) => {
    if (!suppressClick.current) return;

    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  };

  return (
    /* data-light দিয়েই পুরো "জ্বলে ওঠা" animation চলে — বাকি সব CSS এ */
    <section className="hero" data-light={lit ? "on" : "off"}>
      <div className="hero-inner" style={ready ? undefined : { visibility: "hidden" }}>
        {/* ---------- উপরের অংশ: লেখা + ছবি ---------- */}
        <div
          className="hero-top"
          data-fading={fading}
          /* mouse (বা keyboard) এখানে থাকলে slide বদলানো থামে. শুধু
             mouse ধরা হয় — touch এ ঠেকালে "hover" আটকে থেকে চিরকাল
             থেমে থাকত */
          onPointerEnter={(event) => event.pointerType === "mouse" && setPaused(true)}
          onPointerLeave={(event) => event.pointerType === "mouse" && setPaused(false)}
          onFocus={(event) => event.target.matches(":focus-visible") && setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className="hero-copy">
            <p className="hero-eyebrow">{current.eyebrow}</p>

            <h1 className="hero-title">
              <span className="hero-title-accent">{current.accent}</span>{" "}
              {current.rest}
            </h1>

            <p className="hero-subhead">{current.subhead}</p>

            <Link to={localeLink("/contact")} className="hero-cta">
              {t("actions.requestQuote")}
              <CtaArrow />
            </Link>

            {view.badges.length > 0 && (
              <ul className="hero-badges">
                {/* divider গুলো আলাদা element নয়, CSS এর ::before দিয়ে আঁকা —
                    তাহলে প্রথমটার আগে বাড়তি দাগ পড়ে না */}
                {view.badges.map((badge) => (
                  <li key={badge.id} className="hero-badge">
                    <span className="hero-badge-icon">
                      {BADGE_ICONS[badge.icon] ?? BADGE_ICONS.spark}
                    </span>
                    <span className="hero-badge-value">{badge.value}</span>
                    <span className="hero-badge-label">{badge.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="hero-visual">
            {/* Figma তে আলোর শঙ্কুটা দুইটা layer. আপনার webp এ যদি এটা
                আগে থেকেই আঁকা থাকে, section এ data-glow="off" বসান */}
            <span className="hero-glow hero-glow--wide" aria-hidden="true" />
            <span className="hero-glow hero-glow--narrow" aria-hidden="true" />

            {/* ready না হওয়া পর্যন্ত ছবি বসানোই হয় না — ভুল ছবি নামানো আর
                পরে বদলানো দুটোই বাঁচে. .hero-visual এ aspect-ratio আছে, তাই
                ছবি না থাকলেও জায়গা ঠিক থাকে */}
            {ready && (
              <img
                src={heroSrc(imageUrl, heroFallbackWidth(imageUrl))}
                srcSet={heroSrcSet(imageUrl)}
                /* ছবিটা desktop এ content কলামের প্রায় অর্ধেক (~44vw),
                   1100px এর নিচে stack হয়ে প্রায় পুরো চওড়া হয়ে যায় */
                sizes="(max-width: 1099px) 80vw, 44vw"
                alt={current.alt}
                className="hero-image"
                /* hero এর ছবি পাতার প্রথম জিনিস (LCP) — lazy করলে
                   উল্টো ক্ষতি, তাই eager + high priority */
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onLoad={markImageReady}
                onError={handleImageError}
              />
            )}

            {/* ফিক্সচারের নিচের LED প্লেট — জ্বলে ওঠার সময় এখানেই
                সবচেয়ে উজ্জ্বল. ছবির উপরে বসে, তাই img এর পরে */}
            <span className="hero-led" aria-hidden="true" />

            {/* slide এর তীর আর বিন্দু — slide একটার বেশি হলেই */}
            {count > 1 && (
              <div
                className="hero-slides"
                role="group"
                aria-label={t("hero.slidesLabel", { defaultValue: "Hero slides" })}
              >
                <button
                  type="button"
                  className="hero-slides-btn"
                  onClick={() => goTo(active - 1)}
                  aria-label={t("hero.slidePrev", { defaultValue: "Previous slide" })}
                >
                  <Chevron direction="prev" />
                </button>

                <div className="hero-slides-dots">
                  {slides.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className="hero-slides-dot"
                      onClick={() => goTo(index)}
                      aria-label={t("hero.slideGoTo", {
                        defaultValue: "Go to slide {{number}} of {{total}}",
                        number: index + 1,
                        total: count,
                      })}
                      aria-current={index === active ? "true" : undefined}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="hero-slides-btn"
                  onClick={() => goTo(active + 1)}
                  aria-label={t("hero.slideNext", { defaultValue: "Next slide" })}
                >
                  <Chevron direction="next" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ---------- category slider ----------
            Figma তে তিনটা card = 3x516 + 2x16 = 1580px, container 1240px.
            মানে ইচ্ছাকৃতভাবে উপচে পড়ছে — তৃতীয় card আংশিক দেখায়।

            ব্রাউজারের নিজের scroll ই ভিত্তি (touch আর trackpad এ এর
            চেয়ে ভালো কিছু হাতে লেখা যায় না), তার উপরে mouse drag,
            তীর, আর ধারের fade যোগ করা হয়েছে */}
        {hasCards && (
          <div className="hero-slider" data-at-start={atStart} data-at-end={atEnd}>
            <div
              className="hero-cards"
              ref={trackRef}
              role="region"
              aria-label={t("hero.cardsLabel")}
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onClickCapture={handleClickCapture}
            >
              {view.cards.map((card) => {
                const body = (
                  <>
                    <div className="hero-card-media">
                      {card.image && (
                        <img
                          src={cardImage(card.image)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                      )}
                    </div>

                    <div className="hero-card-body">
                      <h2 className="hero-card-title">
                        <span>{card.top}</span>
                        {card.bottom && <span className="hero-card-title-muted">{card.bottom}</span>}
                      </h2>

                      <p className="hero-card-text">{card.text}</p>
                    </div>

                    <span className="hero-card-arrow" aria-hidden="true">
                      <ArrowUpRight />
                    </span>
                  </>
                );

                /* admin এ পুরো https link দিলে সাধারণ <a> (নতুন tab এ);
                   /products... এর মতো সাইটের পথ হলে আগের মতোই SoftLink */
                const external = isExternalLink(card.to);
                if (external && LINKS_LIVE) {
                  return (
                    <a
                      key={card.id}
                      href={card.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-card"
                      draggable={false}
                    >
                      {body}
                    </a>
                  );
                }

                return (
                  <SoftLink
                    key={card.id}
                    to={external ? card.to : localeLink(card.to)}
                    className="hero-card"
                    /* টানার সময় ব্রাউজার ছবি বা লিংকটা "ধরে" নিয়ে
                       যেতে চায় — সেটা বন্ধ */
                    draggable={false}
                  >
                    {body}
                  </SoftLink>
                );
              })}
            </div>

            <button
              type="button"
              className="hero-slider-btn hero-slider-btn--prev"
              onClick={() => slide(-1)}
              disabled={atStart}
              aria-label={t("hero.prev")}
            >
              <Chevron direction="prev" />
            </button>

            <button
              type="button"
              className="hero-slider-btn hero-slider-btn--next"
              onClick={() => slide(1)}
              disabled={atEnd}
              aria-label={t("hero.next")}
            >
              <Chevron direction="next" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default Hero;