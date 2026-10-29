import { Children, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import {
  FILAMENTO,
  REGION_META,
  mapHref,
  regionOf,
  representativesFor,
  searchRepresentatives,
  telHref,
} from "./representatives";
import { useRegions } from "./useRegions";
import "./FindRepresentative.css";

/* ===============================================================
   SHOP / FIND A REPRESENTATIVE — "How to Buy" পাতা (Figma র ৩ অংশ)

     ১. Hero (Frame 285)        ধূসর card — শিরোনাম + ডানে আলোর নকশা
     ২. Directory (Frame 507)   খোঁজা + অঞ্চল ট্যাব + territory তালিকা
                                → নিচে representative card
     ৩. Direct contact          কালো card — সরাসরি Filamento

   একই পাতা দুই ঠিকানায়: /shop (navbar) আর /find-a-representative
   (footer).

   🔌 representative দের তথ্য আসে server থেকে (useRegions.js →
   GET /api/representatives) — admin এ যা বদলানো হয় সাইটে সেটাই
   দেখায়. server না চললে representatives.js এর বাঁধা তালিকা দেখায়.

   কোন অঞ্চল / territory বাছা আর কী খোঁজা হচ্ছে — সব URL এ থাকে
   (?region=usa&territory=alabama&q=…), তাই link share করলে বা back
   চাপলে একই অবস্থা ফেরে
   =============================================================== */

const DEFAULT_REGION = "usa";
/* ---------------------------------------------------------------
   সাজানোর ধরন — URL এর ?sort=… এ থাকে (link share করলে একই ক্রম)

   তালিকার প্রথমটাই default — সেটা URL এ লাগে না.
   • territory বাছা থাকলে: proximity (বাছা territory র লোকেরা আগে, তারপর
     ভৌগোলিক দূরত্ব অনুযায়ী কাছেরগুলো), company, person
   • খোঁজার সময় দূরত্বের মানে নেই (কোনো territory বাছা নয়), তাই শুধু
     company আর person

   company / person বাছলে সব card একসাথে A–Z হয় — বাছা territory র
   লোকেরা আর আগে থাকে না, তবে "Selected" চিহ্ন আর হলুদ ধার থেকেই যায়
   --------------------------------------------------------------- */
const SORTS_BROWSE = ["proximity", "company", "person"];
const SORTS_SEARCH = ["company", "person"];
// header এ দেখানো লেখার key (findRep.results.<key>)
const SORT_LABEL_KEY = {
  proximity: "sortedProximity",
  company: "sortedCompany",
  person: "sortedPerson",
};
// ভাষা ধরে A–Z, বড়-ছোট হাতের ভেদ নেই
const byText = (a, b) =>
  String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" });

// এর চেয়ে সরু পর্দায় territory বাছার পর তালিকা গুটিয়ে result এ নামে
const COMPACT_QUERY = "(max-width: 640px)";

/* ---------------------------------------------------------------
   Icon — Figma র vuesax "linear" সেট (24 এর grid, stroke 1.5)
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

const SmsIcon = (props) => (
  <Icon {...props}>
    <path d="M17 20.5H7c-3 0-5-1.5-5-5v-7c0-3.5 2-5 5-5h10c3 0 5 1.5 5 5v7c0 3.5-2 5-5 5Z" />
    <path d="m17 9-3.13 2.5c-1.03.82-2.72.82-3.75 0L7 9" />
  </Icon>
);

const CallIcon = (props) => (
  <Icon {...props}>
    <path d="M21.97 18.33c0 .36-.08.73-.25 1.09-.17.36-.39.7-.68 1.02-.49.54-1.03.93-1.64 1.18-.6.25-1.25.38-1.95.38-1.02 0-2.11-.24-3.26-.73s-2.3-1.15-3.44-1.98a28.75 28.75 0 0 1-3.28-2.8 28.42 28.42 0 0 1-2.79-3.27c-.82-1.14-1.48-2.28-1.96-3.41C2.24 8.67 2 7.58 2 6.54c0-.68.12-1.33.36-1.93.24-.61.62-1.17 1.15-1.67C4.15 2.31 4.85 2 5.59 2c.28 0 .56.06.81.18.26.12.49.3.67.56l2.32 3.27c.18.25.31.48.4.7.09.21.14.42.14.61 0 .24-.07.48-.21.71-.13.23-.32.47-.56.71l-.76.79c-.11.11-.16.24-.16.4 0 .08.01.15.03.23.03.08.06.14.08.2.18.33.49.76.93 1.28.45.52.93 1.05 1.45 1.58.54.53 1.06 1.02 1.59 1.47.52.44.95.74 1.29.92.05.02.11.05.18.08.08.03.16.04.25.04.17 0 .3-.06.41-.17l.76-.75c.25-.25.49-.44.72-.56.23-.14.46-.21.71-.21.19 0 .39.04.61.13.22.09.45.22.7.39l3.31 2.35c.26.18.44.39.55.64.1.25.16.5.16.78Z" />
  </Icon>
);

const LocationIcon = (props) => (
  <Icon {...props}>
    <path d="M12 13.43a3.12 3.12 0 1 0 0-6.24 3.12 3.12 0 0 0 0 6.24Z" />
    <path d="M3.62 8.49c1.97-8.66 14.8-8.65 16.76.01 1.15 5.08-2.01 9.38-4.78 12.04a5.19 5.19 0 0 1-7.21 0c-2.76-2.66-5.92-6.97-4.77-12.05Z" />
  </Icon>
);

const SearchIcon = (props) => (
  <Icon {...props}>
    <path d="M11.5 21a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19Z" />
    <path d="m22 22-2-2" />
  </Icon>
);

const CloseCircleIcon = (props) => (
  <Icon {...props}>
    <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10Z" />
    <path d="m9.17 14.83 5.66-5.66M14.83 14.83 9.17 9.17" />
  </Icon>
);

const ChevronIcon = (props) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

const SlidersIcon = (props) => (
  <Icon {...props}>
    <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
  </Icon>
);

const CheckIcon = (props) => (
  <Icon {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

/* ট্যাবের শিরোনাম — অন্য পাতাগুলোর মতোই */
function usePageMeta(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | Filamento`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/* হলুদ গোল বিন্দু + বড় হাতের লেবেল — তিন অংশেই একই */
function SectionLabel({ children, tone }) {
  return (
    <p className={`fr-label${tone ? ` is-${tone}` : ""}`}>
      <span className="fr-label-mark" aria-hidden="true" />
      {children}
    </p>
  );
}

/* Hero র ফোন নম্বর — "475-0038" অংশটা hyphen এ ভেঙে যেত ("475-" আর
   "0038" আলাদা লাইনে). শেষ অংশটা nowrap এ রাখা, তাই লাইন ভাঙলে "+1 (408)"
   এর পরে ভাঙে আর "475-0038" একসাথে থাকে — Figma র মতো */
function PhoneLink({ children, ...props }) {
  const parts = Children.toArray(children);
  const text = parts.length === 1 && typeof parts[0] === "string" ? parts[0] : "";
  const match = text.match(/^(.*\s)(\S*-\S*)$/);

  if (!match) return <a {...props}>{children}</a>;

  return (
    <a {...props}>
      {match[1]}
      <span className="fr-nowrap">{match[2]}</span>
    </a>
  );
}

/* ---------------------------------------------------------------
   Hero র ডানের "Light study" — ফিলামেন্ট বাতির গল্প নিয়ে animation:

   • মাঝের কোর বাতির মতো ধীরে "শ্বাস" নেয়, আভাও সাথে ওঠানামা করে
   • কোর থেকে ঢেউ বেরিয়ে ছড়িয়ে মিলিয়ে যায় (আলো ছড়ানো)
   • বাইরের বৃত্তে অঞ্চলের সংখ্যার সমান বিন্দু ধীরে ঘোরে, একটার পর
     একটা জ্বলে ওঠে — "5 regions" কথাটাই ছবি হয়ে আসে
   • "05" সংখ্যাটা 0 থেকে গড়িয়ে ওঠে (একবার)
   • মাউস নাড়ালে বৃত্ত/আভা স্তরগুলো সামান্য আলাদা গতিতে সরে (parallax)

   ⚡ মসৃণ রাখার নিয়ম: শুধু opacity / transform / translate / scale
   বদলায় — পাতা নতুন করে আঁকতে হয় না. পর্দার বাইরে গেলে সব
   animation থেমে থাকে.

   is-in   — একবার পর্দায় এলে চালু, আর বন্ধ হয় না (প্রবেশ একবারই)
   is-live — এখন পর্দায় আছে কিনা; না থাকলে অসীম animation থামে
   --------------------------------------------------------------- */
function HeroLight({ count }) {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const spotRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;

    // খুব পুরনো ব্রাউজার — animation বাদ, সরাসরি দেখাও
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      setLive(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setLive(entry.isIntersecting);
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          setInView(true);
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* মাউসের সাথে "দামি" অনুভূতি — দুটো জিনিস:

     ১. গভীরতা (depth): আভা সবচেয়ে বেশি সরে, তারপর কোর, তারপর ring,
        সবচেয়ে কম বাইরের বৃত্ত; আলোর ফালি উল্টো দিকে. কোন স্তর কত
        সরবে সেটা JSX এর data-depth এ (px). লেখা (caption, সংখ্যা) নড়ে না,
        তাই সবসময় ঝকঝকে থাকে.
     ২. কার্সরের আলো: কার্সর ছবির কাছে এলে ধূসর card এ একটা নরম সাদা
        আভা কার্সরের পিছু নেয় (spot), দূরে গেলে মিলিয়ে যায়.

     ⚡ কেন আগে কাঁপা কাঁপা লাগত, আর এখন কেন মসৃণ:
     • আগে প্রতি frame এ root এ CSS variable (--px/--py) বসত, তাই browser
       কে ভেতরের সব child এর style নতুন করে হিসাব করতে হত. এখন প্রতিটা
       নড়া অংশে সরাসরি `translate` লেখা হয় — আর কিছুর হিসাব লাগে না.
     • আগে প্রতি pointermove এ getBoundingClientRect() (layout force)
       চলত. এখন মাপ cache করা, শুধু scroll/resize এ নতুন করে মাপা হয়.
     • সব পড়া (read) frame এর শুরুতে, সব লেখা (write) তার পরে — layout
       বারবার ভাঙে না.
     • নড়া অংশগুলো CSS এ will-change দিয়ে নিজের GPU layer এ থাকে, তাই
       sub-pixel সরলে ring/বৃত্ত আবার আঁকতে হয় না (ডবল বৃত্ত দেখা যেত
       এই কারণেই).

     নড়াচড়াটা প্রতি frame এ নিজে হিসাব করা নরম অনুসরণ (spring এর মতো):
     মাউস থামলেও স্তরগুলো একটু গড়িয়ে থিতু হয়.

     • শুধু মাউসওয়ালা যন্ত্রে, "animation কমান" বন্ধ থাকলে
     • সব কিছু settle হলে frame loop নিজেই থামে — মাউস না নড়লে খরচ শূন্য
     • frame-সময় ধরে হিসাব, তাই 60Hz আর 144Hz এ একই অনুভূতি */
  useEffect(() => {
    const root = rootRef.current;
    const spot = spotRef.current;
    if (!root || !spot) return undefined;

    const canHover = window.matchMedia?.(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!canHover?.matches) return undefined;

    // পুরো hero র উপর মাউস নড়লেই কাজ করে
    const area = root.closest("section") || root;
    const clamp = (n) => Math.max(-1, Math.min(1, n));
    const SPOT = 240; // spot এর মাপ (CSS এর সাথে মেলাতে হবে)
    const REACH = 80; // ছবির কিনারা থেকে কত px দূর পর্যন্ত spot জাগে
    const KEYS = ["x", "y", "sx", "sy", "hv"];

    // CSS variable নয় — প্রতিটা নড়া স্তরে সরাসরি style লেখা হবে
    const layers = Array.from(root.querySelectorAll("[data-depth]")).map((node) => ({
      node,
      k: Number(node.dataset.depth) || 0,
    }));

    const target = { x: 0, y: 0, sx: 0, sy: 0, hv: 0 };
    const cur = { x: 0, y: 0, sx: 0, sy: 0, hv: 0 };
    // কতটা ধীরে অনুসরণ (ms) — বড় মান = আরও নরম/ভারী
    const TAU = { x: 170, y: 170, sx: 95, sy: 95, hv: 260 };

    let frame = 0;
    let last = 0;
    let pointer = null;
    let needAim = false; // নতুন pointer অবস্থান এসেছে, target হিসাব করতে হবে
    let dirty = true; // scroll / resize হলে মাপ আবার নিতে হবে
    let areaRect = null;
    let rootRect = null;

    const measure = () => {
      areaRect = area.getBoundingClientRect();
      rootRect = root.getBoundingClientRect();
      dirty = false;
    };

    const aim = () => {
      if (!pointer) return;
      if (dirty) measure();

      target.x = clamp(((pointer.x - areaRect.left) / areaRect.width - 0.5) * 2);
      target.y = clamp(((pointer.y - areaRect.top) / areaRect.height - 0.5) * 2);

      const near =
        pointer.x > rootRect.left - REACH &&
        pointer.x < rootRect.right + REACH &&
        pointer.y > rootRect.top - REACH &&
        pointer.y < rootRect.bottom + REACH;

      if (near) {
        const sx = pointer.x - rootRect.left - SPOT / 2;
        const sy = pointer.y - rootRect.top - SPOT / 2;
        // প্রথমবার জাগলে কোণা থেকে উড়ে না এসে সরাসরি কার্সরের নিচে বসে
        if (cur.hv < 0.02) {
          cur.sx = sx;
          cur.sy = sy;
        }
        target.sx = sx;
        target.sy = sy;
        target.hv = 1;
      } else {
        target.hv = 0;
      }
    };

    const tick = (now) => {
      // পড়া (layout) frame এর শুরুতে, লেখার আগে
      if (needAim) {
        needAim = false;
        aim();
      }

      const dt = last ? Math.min(64, now - last) : 16;
      last = now;

      KEYS.forEach((key) => {
        cur[key] += (target[key] - cur[key]) * (1 - Math.exp(-dt / TAU[key]));
      });

      for (const { node, k } of layers) {
        node.style.translate = `${(cur.x * k).toFixed(2)}px ${(cur.y * k).toFixed(2)}px`;
      }
      spot.style.translate = `${cur.sx.toFixed(1)}px ${cur.sy.toFixed(1)}px`;
      spot.style.opacity = cur.hv.toFixed(3);

      const settled = KEYS.every(
        (key) => Math.abs(target[key] - cur[key]) < (key === "sx" || key === "sy" ? 0.3 : 0.001),
      );
      if (settled && !needAim) {
        frame = 0;
        last = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      needAim = true;
      wake();
    };

    const onLeave = () => {
      pointer = null;
      target.x = 0;
      target.y = 0;
      target.hv = 0;
      wake();
    };

    // scroll / resize এ ছবি সরে যায় কিন্তু কার্সর থাকে এক জায়গায় — মাপ নতুন করে নিয়ে spot আবার বসাতে হয়
    const markDirty = () => {
      dirty = true;
      if (pointer) {
        needAim = true;
        wake();
      }
    };

    area.addEventListener("pointermove", onMove, { passive: true });
    area.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", markDirty, { passive: true });
    window.addEventListener("resize", markDirty);

    return () => {
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", markDirty);
      window.removeEventListener("resize", markDirty);
      cancelAnimationFrame(frame);
    };
  }, []);

  /* "05": দশকের অঙ্ক স্থির, এককের অঙ্ক 0 থেকে গড়িয়ে ওঠে */
  const padded = String(count).padStart(2, "0");
  const tens = padded.slice(0, -1);
  const ones = count % 10;

  return (
    <div
      ref={rootRef}
      className={`fr-light${inView ? " is-in" : ""}${live ? " is-live" : ""}`}
      aria-hidden="true"
    >
      {/* কার্সরের পিছু নেওয়া নরম আলো — ধূসর card এ সাদা আভা */}
      <span ref={spotRef} className="fr-light-spot" />

      <span className="fr-light-layer fr-light-layer-beam" data-depth="-10">
        <span className="fr-light-beam" />
      </span>

      {/* data-depth = মাউস কোণায় গেলে সর্বোচ্চ কত px সরবে
          (বড় = কাছের স্তর, ছোট = দূরের) */}
      <span className="fr-light-layer fr-light-layer-orb">
        <span className="fr-light-glow" data-depth="18" />
        <span className="fr-light-halo" data-depth="4" />
        <span className="fr-light-orbit" data-depth="4">
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className="fr-light-dot"
              style={{ "--a": `${(360 / count) * i}deg`, "--i": i }}
            >
              <i />
            </span>
          ))}
        </span>
        <span className="fr-light-ripple" data-depth="7" style={{ "--rd": "0s" }} />
        <span className="fr-light-ripple" data-depth="7" style={{ "--rd": "2.5s" }} />
        <span className="fr-light-ring" data-depth="7" />
        <span className="fr-light-aperture" data-depth="10" />
      </span>

      {/* লেখার স্তর নড়ে না — caption আর সংখ্যা সবসময় ঝকঝকে */}
      <span className="fr-light-layer fr-light-layer-text">
        <span className="fr-light-caption">
          <span className="fr-light-caption-title">{t("findRep.hero.lightCaption")}</span>
          <span className="fr-light-caption-detail">{t("findRep.hero.lightDetail")}</span>
        </span>
        <span className="fr-light-count">
          <span className="fr-light-count-value">
            <span>{tens}</span>
            <span className="fr-light-count-roll">
              <span className="fr-light-count-track" style={{ "--to": ones }}>
                {Array.from({ length: ones + 1 }, (_, d) => (
                  <span key={d} className="fr-light-count-cell">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          </span>
          <span className="fr-light-count-label">{t("findRep.hero.regions")}</span>
        </span>
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------
   ১. Hero — Figma "Frame 285"
   --------------------------------------------------------------- */
function Hero() {
  const { t } = useTranslation();

  return (
    <section className="section fr-hero" aria-labelledby="fr-hero-title">
      <div className="container fr-hero-inner">
        <div className="fr-hero-copy">
          <SectionLabel tone="yellow">{t("findRep.hero.label")}</SectionLabel>
          <h1 id="fr-hero-title" className="fr-hero-title">
            {t("findRep.hero.title")}
          </h1>
          <p className="fr-hero-intro">
            <Trans
              i18nKey="findRep.hero.intro"
              components={{
                sales: <a href={`mailto:${FILAMENTO.email}`} />,
                phone: <PhoneLink href={telHref(FILAMENTO.phoneLink)} />,
                intl: <a href={`mailto:${FILAMENTO.internationalEmail}`} />,
              }}
            />
          </p>
        </div>

        {/* Figma "Light study" — শুধু নকশা, screen reader এ পড়ার দরকার নেই.
            অঞ্চল (ট্যাব) সবসময় REGION_META র কয়টা — server এর উপর নির্ভর করে না */}
        <HeroLight count={REGION_META.length} />
      </div>
    </section>
  );
}

/* লম্বা email সরু card এ ভাঙলে "@" এর পরেই ভাঙে —
   "…@lightingsolutionsal.co / m" এর মতো বিশ্রী ভাঙন হয় না */
function EmailText({ email }) {
  const at = email.indexOf("@");
  if (at < 0) return email;
  return (
    <>
      {email.slice(0, at + 1)}
      <wbr />
      {email.slice(at + 1)}
    </>
  );
}

/* ---------------------------------------------------------------
   Representative card — Figma "Representative card"

   selected — বাছা territory র নিজের লোক: হলুদ border, "Selected"
   badge আর গাঢ় Email বোতাম

   admin এ ফোন বা ঠিকানা ফাঁকা রাখা যায় — তখন ওই সারি আর Call বোতাম
   বাদ যায় (ফাঁকা সারি বা কাজ না করা "tel:" link দেখায় না)
   --------------------------------------------------------------- */
function RepCard({ rep, location, badge, selected }) {
  const { t } = useTranslation();
  const name = rep.person ? `${rep.person}, ${rep.company}` : rep.company;

  return (
    <article className={`fr-card${selected ? " is-selected" : ""}`}>
      <div className="fr-card-head">
        <div className="fr-card-meta">
          <span className="fr-card-location">{location}</span>
          {badge && <span className="fr-card-badge">{badge}</span>}
        </div>
        <h3 className="fr-card-company">{rep.company}</h3>
        {rep.person && <p className="fr-card-person">{rep.person}</p>}
      </div>

      <span className="fr-card-divider" aria-hidden="true" />

      <ul className="fr-card-details">
        <li>
          <a href={`mailto:${rep.email}`}>
            <EmailText email={rep.email} />
          </a>
          <SmsIcon />
        </li>
        {rep.phone && (
          <li>
            <a href={telHref(rep.phone)}>{rep.phone}</a>
            <CallIcon />
          </li>
        )}
        {rep.address && (
          <li>
            <a href={mapHref(rep.address)} target="_blank" rel="noreferrer">
              {rep.address}
              <span className="sr-only"> {t("findRep.results.opensMap")}</span>
            </a>
            <LocationIcon />
          </li>
        )}
      </ul>

      <div className="fr-card-actions">
        <a
          className={`fr-card-action${selected ? " is-primary" : ""}`}
          href={`mailto:${rep.email}`}
          aria-label={t("findRep.results.emailAria", { name })}
        >
          {t("findRep.results.email")}
          <SmsIcon />
        </a>
        {rep.phone && (
          <a
            className="fr-card-action"
            href={telHref(rep.phone)}
            aria-label={t("findRep.results.callAria", { name })}
          >
            {t("findRep.results.call")}
            <CallIcon />
          </a>
        )}
      </div>
    </article>
  );
}

/* যে territory বা অঞ্চলে এখনো কেউ নেই — Filamento নিজে, একই card এর
   নকশায়. অঞ্চল অনুযায়ী ঠিক email (ইউরোপ/এশিয়া → Ella) */
function FallbackCard({ region, location }) {
  const { t } = useTranslation();
  return (
    <RepCard
      selected
      location={location}
      badge={t("findRep.results.directBadge")}
      rep={{
        company: "Filamento",
        person: t("findRep.results.fallbackPerson"),
        email: region.contactEmail,
        phone: FILAMENTO.phoneDisplay,
        address: FILAMENTO.address,
      }}
    />
  );
}

/* ---------------------------------------------------------------
   ২. Directory — Figma "Frame 507"
   --------------------------------------------------------------- */
function Directory() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef(null);
  const tabRefs = useRef([]);

  /* অঞ্চল → territory → representative — server থেকে (না পারলে বাঁধা
     তালিকা). loading এ থাকলে নিচে শুধু "Loading" দেখানো হয় */
  const { regions, loading } = useRegions();

  /* URL থেকে অবস্থা — ভুল বা পুরনো মান এলে চুপচাপ default এ ফেরে */
  const region = regionOf(regions, searchParams.get("region") ?? DEFAULT_REGION);
  const territory =
    region.territories.find((item) => item.id === searchParams.get("territory")) ??
    region.territories[0] ??
    null;
  const query = searchParams.get("q") ?? "";
  const trimmedQuery = query.trim();
  // territory তালিকা খোলা কিনা — Figma র মতো শুরুতে খোলা
  const [panelOpen, setPanelOpen] = useState(true);

  // "Sorted by …" মেনু খোলা কিনা
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  const sortTriggerRef = useRef(null);
  const sortItemRefs = useRef([]);

  /* মেনু খোলা থাকলে: বাইরে ক্লিক বা Esc চাপলে বন্ধ (Esc এ focus বোতামে
     ফেরে), আর খোলার সাথে সাথে বাছা অপশনে focus যায় — keyboard এ তীর
     দিয়ে চলা যায় */
  useEffect(() => {
    if (!sortOpen) return undefined;

    const onPointerDown = (event) => {
      if (!sortRef.current?.contains(event.target)) setSortOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSortOpen(false);
        sortTriggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    sortItemRefs.current
      .find((node) => node?.getAttribute("aria-checked") === "true")
      ?.focus();

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sortOpen]);

  const updateParams = (changes) => {
    // territory, খোঁজা বা সাজানো — যা-ই বদলাক, মেনু বন্ধ
    setSortOpen(false);
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    /* replace — প্রতিটা অক্ষর বা click এ history ভরে না.
       preventScrollReset — পাতা উপরে লাফিয়ে যায় না */
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };

  const searchResults = useMemo(
    () => searchRepresentatives(regions, trimmedQuery),
    [regions, trimmedQuery],
  );
  const isSearching = trimmedQuery.length > 0;

  // খোঁজার সময় যে territory তে মিল আছে — বাকিগুলো হালকা দেখায়
  const matchedTerritories = useMemo(() => {
    const ids = new Set();
    for (const result of searchResults) {
      for (const item of result.territories) ids.add(`${item.regionId}/${item.id}`);
    }
    return ids;
  }, [searchResults]);

  // হিসাব খুব হালকা (৪৭টা territory) — memo র দরকার নেই
  const nearbyResult = representativesFor(regions, territory);

  const selectRegion = (nextRegion) => {
    updateParams({ region: nextRegion.id, territory: nextRegion.territories[0]?.id ?? "" });
  };

  const selectTerritory = (item) => {
    const compact = window.matchMedia(COMPACT_QUERY).matches;
    // অন্য territory বাছলে খোঁজা মুছে যায় — নইলে result বদলায় না
    updateParams({ territory: item.id, q: "" });
    if (compact) {
      setPanelOpen(false);
      // মোবাইলে লম্বা তালিকা পেরিয়ে result এ নামতে হত — নিজেই নামিয়ে দিই
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  /* ট্যাবে ← → Home End — ARIA tabs এর নিয়ম */
  const onTabKeyDown = (event, index) => {
    const last = regions.length - 1;
    const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: last };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const target = (moves[event.key] + regions.length) % regions.length;
    selectRegion(regions[target]);
    tabRefs.current[target]?.focus();
  };

  const regionName = t(region.labelKey);
  const territoryCount = region.territories.length;

  /* ------------ সাজানো ------------ */
  const sortOptions = isSearching ? SORTS_SEARCH : SORTS_BROWSE;
  const requestedSort = searchParams.get("sort");
  // ভুল বা এই অবস্থায় অচল মান (যেমন খোঁজার সময় proximity) → default
  const activeSort = sortOptions.includes(requestedSort) ? requestedSort : sortOptions[0];

  const chooseSort = (option) => {
    updateParams({ sort: option === sortOptions[0] ? "" : option });
    sortTriggerRef.current?.focus();
  };

  const onSortTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" && !sortOpen) {
      event.preventDefault();
      setSortOpen(true);
    }
  };

  const onSortItemKeyDown = (event, index) => {
    const last = sortOptions.length - 1;
    const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: last };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const target = (moves[event.key] + sortOptions.length) % sortOptions.length;
    sortItemRefs.current[target]?.focus();
  };

  /* ------------ result এর শিরোনাম আর card ------------ */
  let resultsTitle;
  let resultsSummary;
  let cards;
  // সাজানোর মতো কয়টা card আছে — ১টা বা শুধু Filamento র card হলে বোতাম লুকানো
  let sortableCount;

  if (isSearching) {
    resultsTitle = t("findRep.results.searchTitle", { query: trimmedQuery });
    resultsSummary = t("findRep.results.searchCount", { count: searchResults.length });

    // searchRepresentatives আগে থেকেই company অনুযায়ী সাজানো
    const ordered =
      activeSort === "person"
        ? [...searchResults].sort((a, b) => byText(a.rep.person, b.rep.person))
        : searchResults;
    sortableCount = ordered.length;

    cards = ordered.map(({ rep, territories }) => {
      const [first, ...rest] = territories;
      const location = rest.length
        ? `${first.name} ${t("findRep.results.moreTerritories", { count: rest.length })}`
        : first.name;
      return <RepCard key={rep.email} rep={rep} location={location} />;
    });
  } else {
    const place = territory?.name ?? regionName;
    const { exact, nearby } = nearbyResult;
    resultsTitle = t("findRep.results.title", { place });

    const parts = [
      exact.length
        ? t("findRep.results.exactCount", { count: exact.length })
        : t("findRep.results.noExact"),
    ];
    if (nearby.length) parts.push(t("findRep.results.nearbyCount", { count: nearby.length }));
    resultsSummary = parts.join(" · ");

    // proximity: exact আগে, তারপর দূরত্বের ক্রমে nearby — representativesFor
    // ঠিক এই ক্রমেই দেয়, তাই এখানে কিছু করতে হয় না
    const entries = [
      ...exact.map(({ rep }) => ({ rep, location: territory.name, selected: true })),
      ...nearby.map(({ rep, territory: other }) => ({
        rep,
        location: other.name,
        selected: false,
      })),
    ];
    sortableCount = entries.length;

    if (activeSort !== "proximity") {
      const field = activeSort === "company" ? "company" : "person";
      entries.sort((a, b) => byText(a.rep[field], b.rep[field]));
    }

    cards = [
      // বাছা territory তে কেউ না থাকলে Filamento র card সবসময় প্রথমে
      ...(exact.length
        ? []
        : [<FallbackCard key="filamento" region={region} location={place} />]),
      ...entries.map(({ rep, location, selected }) => (
        <RepCard
          key={rep.email}
          rep={rep}
          location={location}
          {...(selected ? { badge: t("findRep.results.selectedBadge"), selected: true } : {})}
        />
      )),
    ];
  }

  const sortLabel =
    sortableCount > 1 ? t(`findRep.results.${SORT_LABEL_KEY[activeSort]}`) : "";

  return (
    <section className="section fr-directory" aria-labelledby="fr-directory-title">
      <div className="container fr-directory-inner">
        {/* Figma "Directory heading" */}
        <header className="fr-directory-head">
          <div className="fr-directory-copy">
            <SectionLabel>{t("findRep.directory.label")}</SectionLabel>
            <h2 id="fr-directory-title" className="fr-directory-title">
              {t("findRep.directory.title")}
            </h2>
            <p className="fr-directory-desc">{t("findRep.directory.description")}</p>
          </div>
          {/* সংখ্যাটা server এর তথ্য থেকে — আসার আগে দেখালে ভুল সংখ্যা ঝলকাত */}
          {!loading && (
            <p className="fr-status">
              {t("findRep.directory.status", { count: territoryCount, region: regionName })}
              <span className="fr-status-dot" aria-hidden="true" />
            </p>
          )}
        </header>

        {loading ? (
          <div className="fr-loading" role="status">
            <span className="fr-loading-dot" aria-hidden="true" />
            {t("findRep.directory.loading")}
          </div>
        ) : (
          <>
            {/* Figma "Finder controls" */}
            <div className="fr-finder">
              <div className="fr-search-row" role="search">
                <label className={`fr-search${query ? " has-query" : ""}`}>
                  <SearchIcon size={18} />
                  <span className="sr-only">{t("findRep.directory.searchLabel")}</span>
                  <input
                    type="search"
                    value={query}
                    placeholder={t("findRep.directory.searchPlaceholder")}
                    onChange={(event) => updateParams({ q: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === "Escape" && query) {
                        event.preventDefault();
                        updateParams({ q: "" });
                      }
                    }}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </label>
                {query && (
                  <button
                    type="button"
                    className="fr-search-clear"
                    onClick={() => updateParams({ q: "" })}
                    aria-label={t("findRep.directory.clearSearch")}
                  >
                    <CloseCircleIcon size={24} />
                  </button>
                )}

                {/* Figma "Location selector" — territory তালিকা খোলে/গুটায় */}
                <button
                  type="button"
                  className={`fr-selector${panelOpen ? " is-open" : ""}`}
                  aria-expanded={panelOpen}
                  aria-controls="fr-territory-panel"
                  onClick={() => setPanelOpen((open) => !open)}
                >
                  <span className="fr-selector-copy">
                    <span className="fr-selector-label">
                      {t("findRep.directory.selectorLabel")}
                    </span>
                    <span className="fr-selector-value">
                      {territory?.name ?? t("findRep.directory.selectorNone")}
                    </span>
                  </span>
                  <ChevronIcon size={20} />
                </button>
              </div>

              <div id="fr-territory-panel" className="fr-panel" hidden={!panelOpen}>
                {/* Figma "Region tabs" */}
                <div
                  className="fr-tabs"
                  role="tablist"
                  aria-label={t("findRep.directory.regionsLabel")}
                >
                  {regions.map((item, index) => {
                    const active = item.id === region.id;
                    return (
                      <button
                        key={item.id}
                        ref={(node) => {
                          tabRefs.current[index] = node;
                        }}
                        type="button"
                        role="tab"
                        id={`fr-tab-${item.id}`}
                        className={`fr-tab${active ? " is-active" : ""}`}
                        aria-selected={active}
                        aria-controls="fr-territory-options"
                        tabIndex={active ? 0 : -1}
                        onClick={() => selectRegion(item)}
                        onKeyDown={(event) => onTabKeyDown(event, index)}
                      >
                        {t(item.labelKey)}
                      </button>
                    );
                  })}
                </div>

                {/* Figma "Location options" */}
                <div
                  id="fr-territory-options"
                  className="fr-options"
                  role="tabpanel"
                  aria-labelledby={`fr-tab-${region.id}`}
                >
                  <div className="fr-options-head">
                    <span>{t("findRep.directory.chooseTerritory", { region: regionName })}</span>
                    <span>{t("findRep.directory.locations", { count: territoryCount })}</span>
                  </div>

                  {territoryCount ? (
                    <ul className="fr-territories">
                      {region.territories.map((item) => {
                        const selected = item.id === territory?.id;
                        const dimmed =
                          isSearching && !matchedTerritories.has(`${item.regionId}/${item.id}`);
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              className={`fr-territory${selected ? " is-selected" : ""}${
                                dimmed ? " is-dimmed" : ""
                              }`}
                              aria-pressed={selected}
                              onClick={() => selectTerritory(item)}
                            >
                              <span className="fr-territory-dot" aria-hidden="true" />
                              {item.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="fr-options-empty">
                      {t("findRep.directory.noTerritories", { region: regionName })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Figma "Results heading" + "Representative results" */}
            <div className="fr-results" ref={resultsRef}>
              <div className="fr-results-head">
                <div className="fr-results-copy">
                  <p className="fr-results-summary" aria-live="polite">
                    {resultsSummary}
                  </p>
                  <h3 className="fr-results-title">{resultsTitle}</h3>
                </div>
                {/* ১টার বেশি card না থাকলে সাজানোর কিছু নেই. Tab দিয়ে বেরিয়ে
                    গেলেও মেনু বন্ধ (onBlur) */}
                {sortLabel && (
                  <div
                    className="fr-sort"
                    ref={sortRef}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) setSortOpen(false);
                    }}
                  >
                    <button
                      type="button"
                      ref={sortTriggerRef}
                      className={`fr-results-sort${sortOpen ? " is-open" : ""}`}
                      aria-haspopup="menu"
                      aria-expanded={sortOpen}
                      aria-controls="fr-sort-menu"
                      onClick={() => setSortOpen((open) => !open)}
                      onKeyDown={onSortTriggerKeyDown}
                    >
                      {sortLabel}
                      <SlidersIcon />
                    </button>

                    {sortOpen && (
                      <ul
                        id="fr-sort-menu"
                        className="fr-sort-menu"
                        role="menu"
                        aria-label={t("findRep.results.sortMenuLabel")}
                      >
                        {sortOptions.map((option, index) => {
                          const active = option === activeSort;
                          return (
                            <li key={option} role="none">
                              <button
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                ref={(node) => {
                                  sortItemRefs.current[index] = node;
                                }}
                                className={`fr-sort-item${active ? " is-active" : ""}`}
                                onClick={() => chooseSort(option)}
                                onKeyDown={(event) => onSortItemKeyDown(event, index)}
                              >
                                {t(`findRep.results.sortOptions.${option}`)}
                                {active && <CheckIcon size={16} />}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {cards.length > 0 ? (
                <div className="fr-cards">{cards}</div>
              ) : (
                <div className="fr-empty">
                  <p>{t("findRep.results.searchEmpty", { query: trimmedQuery })}</p>
                  <button
                    type="button"
                    className="fr-empty-action"
                    onClick={() => updateParams({ q: "" })}
                  >
                    {t("findRep.directory.clearSearch")}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   ৩. Direct contact — Figma "Direct company contact"
   --------------------------------------------------------------- */
function DirectContact() {
  const { t } = useTranslation();
  const cardRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [live, setLive] = useState(false);

  /* is-in   — একবার পর্দায় এলে চালু (প্রবেশের দৃশ্য একবারই)
     is-live — এখন পর্দায় আছে কিনা; না থাকলে অসীম animation থামে */
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return undefined;

    // খুব পুরনো ব্রাউজার — animation বাদ, সরাসরি দেখাও
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      setLive(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setLive(entry.isIntersecting);
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          setInView(true);
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* মাউসের সাথে আভা সামান্য সরে — শুধু মাউসওয়ালা যন্ত্রে, "animation
     কমান" বন্ধ থাকলে. এখানে শুধু --gx / --gy (-1 থেকে 1) বসে, নড়াচড়া
     CSS এর `translate` এ. React state নয়, প্রতি frame এ একবার */
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    const canHover = window.matchMedia?.(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!canHover?.matches) return undefined;

    const clamp = (n) => Math.max(-1, Math.min(1, n));
    let frame = 0;
    let gx = 0;
    let gy = 0;

    const paint = () => {
      frame = 0;
      card.style.setProperty("--gx", gx.toFixed(3));
      card.style.setProperty("--gy", gy.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onMove = (event) => {
      const rect = card.getBoundingClientRect();
      gx = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2);
      gy = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2);
      schedule();
    };
    const onLeave = () => {
      gx = 0;
      gy = 0;
      schedule();
    };

    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", onLeave);
    return () => {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  const details = [
    {
      key: "phone",
      icon: <CallIcon />,
      label: t("findRep.contact.northAmerica"),
      value: FILAMENTO.phoneDisplay,
      href: telHref(FILAMENTO.phoneLink),
    },
    {
      key: "email",
      icon: <SmsIcon />,
      label: t("findRep.contact.sales"),
      value: FILAMENTO.email,
      href: `mailto:${FILAMENTO.email}`,
    },
    {
      key: "address",
      icon: <LocationIcon />,
      label: t("findRep.contact.headquarters"),
      value: FILAMENTO.address,
      href: mapHref(FILAMENTO.address),
      external: true,
    },
  ];

  return (
    <section className="section fr-contact" aria-labelledby="fr-contact-title">
      <div className="container">
        <div
          ref={cardRef}
          className={`fr-contact-card${inView ? " is-in" : ""}${live ? " is-live" : ""}`}
        >
          <span className="fr-contact-glow" aria-hidden="true" />

          <div className="fr-contact-intro">
            <SectionLabel tone="yellow">{t("findRep.contact.label")}</SectionLabel>
            <h2 id="fr-contact-title" className="fr-contact-title">
              {t("findRep.contact.title")}
            </h2>
            <p className="fr-contact-desc">{t("findRep.contact.description")}</p>
            <div className="fr-contact-actions">
              <a className="fr-contact-action is-primary" href={`mailto:${FILAMENTO.email}`}>
                {t("findRep.contact.emailSales")}
                <SmsIcon />
              </a>
              <a className="fr-contact-action" href={telHref(FILAMENTO.phoneLink)}>
                {t("findRep.contact.callCompany")}
                <CallIcon />
              </a>
            </div>
          </div>

          <span className="fr-contact-divider" aria-hidden="true" />

          <ul className="fr-contact-details">
            {details.map((item) => (
              <li key={item.key} className="fr-contact-detail">
                <span className="fr-contact-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="fr-contact-detail-copy">
                  <span className="fr-contact-detail-label">{item.label}</span>
                  <a
                    className="fr-contact-detail-value"
                    href={item.href}
                    {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    {item.value}
                  </a>
                </span>
              </li>
            ))}
          </ul>

          {/* Figma "Tagline lockup" — নকশা */}
          <div className="fr-tagline" aria-hidden="true">
            <span className="fr-tagline-text">{t("findRep.contact.tagline")}</span>
            <span className="fr-tagline-ring">
              <span className="fr-tagline-orbit" />
              <span className="fr-tagline-core" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function FindRepresentative() {
  const { t } = useTranslation();
  usePageMeta(t("findRep.metaTitle"));

  return (
    <div className="find-rep">
      <Hero />
      <Directory />
      <DirectContact />
    </div>
  );
}

export default FindRepresentative;