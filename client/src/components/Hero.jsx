import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import "./Hero.css";

/* ---------------------------------------------------------------
   Hero এর ছবি

   ছবিটা আপলোডের আগেই টাইট crop করা, তাই e_trim আর লাগছে না।

   c_limit,w_   — নির্দিষ্ট প্রস্থে নামিয়ে আনে, কিন্তু কখনো বড় করে না।
                  উৎসে যে পিক্সেল নেই সেটা বানিয়ে দেওয়ার চেয়ে যা আছে
                  তাই পাঠানো ভালো
   q_auto:best  — q_auto এর সবচেয়ে কম ক্ষতিকর ধাপ। সাধারণ q_auto
                  (মানে q_auto:good) এখানে চোখে পড়ার মতো নরম করে দিচ্ছিল
   f_auto       — ব্রাউজার অনুযায়ী সেরা format (AVIF/WebP)
   --------------------------------------------------------------- */
const heroImage = (width) =>
  "https://res.cloudinary.com/dzi3u164c/image/upload/" +
  `c_limit,w_${width},f_auto,q_auto:best/` +
  "v1789466783/hero-optimised_dtyrew.webp";

/* উৎস ছবির আসল প্রস্থ। Figma থেকে 2x export করে নতুন ছবি আপলোড
   করলে শুধু এই সংখ্যাটা বদলাবেন — srcset নিজে থেকে মিলে যাবে।

   এর চেয়ে বড় মাপ srcset এ রাখা যাবে না: c_limit ছবি বড় করে না,
   তাই ব্রাউজার "1280w" ভেবে যেটা নামাবে সেটা আসলে 829px ই হতো —
   ভুল হিসাব করে ঝাপসা ছবি বেছে নিত */
const HERO_SOURCE_WIDTH = 829;

const HERO_SRCSET = [480, 640, 960, 1280, 1600]
  .filter((w) => w < HERO_SOURCE_WIDTH)
  .concat(HERO_SOURCE_WIDTH)
  .map((w) => `${heroImage(w)} ${w}w`)
  .join(", ");

const CARDS = [
  {
    id: "high-bay",
    to: "/products/high-bay",
    image:
      "https://res.cloudinary.com/dzi3u164c/image/upload/v1789461035/card1_xfkfg6.webp",
  },
  {
    id: "build-fixture",
    to: "/build-fixture",
    image:
      "https://res.cloudinary.com/dzi3u164c/image/upload/v1789461131/card2_dxyfhj.webp",
  },
  {
    id: "optional-parts",
    to: "/products/parts",
    image:
      "https://res.cloudinary.com/dzi3u164c/image/upload/v1789461212/card3_rcubwu.webp",
  },
];

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
};

const BADGES = [
  { id: "energy", valueKey: "hero.badges.energy.value", labelKey: "hero.badges.energy.label" },
  { id: "warranty", valueKey: "hero.badges.warranty.value", labelKey: "hero.badges.warranty.label" },
  { id: "madeIn", valueKey: "hero.badges.madeIn.value", labelKey: "hero.badges.madeIn.label" },
  { id: "certified", valueKey: "hero.badges.certified.value", labelKey: "hero.badges.certified.label" },
  { id: "listed", valueKey: "hero.badges.listed.value", labelKey: "hero.badges.listed.label" },
];

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

function Hero() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

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
  }, [syncEdges]);

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
    <section className="hero">
      <div className="hero-inner">
        {/* ---------- উপরের অংশ: লেখা + ছবি ---------- */}
        <div className="hero-top">
          <div className="hero-copy">
            <p className="hero-eyebrow">{t("hero.eyebrow")}</p>

            <h1 className="hero-title">
              <span className="hero-title-accent">{t("hero.titleAccent")}</span>{" "}
              {t("hero.titleRest")}
            </h1>

            <p className="hero-subhead">{t("hero.subhead")}</p>

            <Link to={localeLink("/contact")} className="hero-cta">
              {t("actions.requestQuote")}
              <CtaArrow />
            </Link>

            <ul className="hero-badges">
              {/* divider গুলো আলাদা element নয়, CSS এর ::before দিয়ে আঁকা —
                  তাহলে প্রথমটার আগে বাড়তি দাগ পড়ে না */}
              {BADGES.map((badge) => (
                <li key={badge.id} className="hero-badge">
                  <span className="hero-badge-icon">{BADGE_ICONS[badge.id]}</span>
                  <span className="hero-badge-value">{t(badge.valueKey)}</span>
                  <span className="hero-badge-label">{t(badge.labelKey)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-visual">
            {/* Figma তে আলোর শঙ্কুটা দুইটা layer. আপনার webp এ যদি এটা
                আগে থেকেই আঁকা থাকে, section এ data-glow="off" বসান */}
            <span className="hero-glow hero-glow--wide" aria-hidden="true" />
            <span className="hero-glow hero-glow--narrow" aria-hidden="true" />

            <img
              src={heroImage(HERO_SOURCE_WIDTH)}
              srcSet={HERO_SRCSET}
              /* ছবিটা desktop এ content কলামের প্রায় অর্ধেক (~44vw),
                 1100px এর নিচে stack হয়ে প্রায় পুরো চওড়া হয়ে যায় */
              sizes="(max-width: 1099px) 80vw, 44vw"
              alt={t("hero.imageAlt")}
              className="hero-image"
              /* hero এর ছবি পাতার প্রথম জিনিস (LCP) — lazy করলে
                 উল্টো ক্ষতি, তাই eager + high priority */
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>

        {/* ---------- category slider ----------
            Figma তে তিনটা card = 3x516 + 2x16 = 1580px, container 1240px.
            মানে ইচ্ছাকৃতভাবে উপচে পড়ছে — তৃতীয় card আংশিক দেখায়।

            ব্রাউজারের নিজের scroll ই ভিত্তি (touch আর trackpad এ এর
            চেয়ে ভালো কিছু হাতে লেখা যায় না), তার উপরে mouse drag,
            তীর, আর ধারের fade যোগ করা হয়েছে */}
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
            {CARDS.map((card) => (
              <Link
                key={card.id}
                to={localeLink(card.to)}
                className="hero-card"
                /* টানার সময় ব্রাউজার ছবি বা লিংকটা "ধরে" নিয়ে
                   যেতে চায় — সেটা বন্ধ */
                draggable={false}
              >
                <div className="hero-card-media">
                  <img
                    src={card.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                </div>

                <div className="hero-card-body">
                  <h2 className="hero-card-title">
                    <span>{t(`hero.cards.${card.id}.titleTop`)}</span>
                    <span className="hero-card-title-muted">
                      {t(`hero.cards.${card.id}.titleBottom`)}
                    </span>
                  </h2>

                  <p className="hero-card-text">{t(`hero.cards.${card.id}.text`)}</p>
                </div>

                <span className="hero-card-arrow" aria-hidden="true">
                  <ArrowUpRight />
                </span>
              </Link>
            ))}
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
      </div>
    </section>
  );
}

export default Hero;