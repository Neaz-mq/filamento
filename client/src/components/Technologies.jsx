import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import "./Technologies.css";

/* Figma "Frame 514" — বাঁয়ে শিরোনাম, ডানে technology গুলোর খাড়া
   carousel: মাঝে video card, উপরে আগেরটা আর নিচে পরেরটা pill হয়ে,
   পাশে কোনটা দেখছি তার dot।

   pill বা dot এ ক্লিক করলে সেই technology মাঝে আসে. তালিকা গোল করে
   ঘোরে — প্রথমটার আগে শেষটা, শেষটার পরে প্রথমটা — তাই উপরে-নিচে
   সবসময় একটা করে pill থাকে, ঠিক Figma র মতো */

/* ---------------------------------------------------------------
   ছবি

   fit দুই রকম:
     "photo"   — পুরো thumbnail ছবি, card টা পুরো ঢেকে ফেলে
     "product" — শুধু লাইটের স্বচ্ছ ছবি; হালকা ধূসর পটভূমি আর হলুদ
                 বৃত্তের উপর মাঝে বসে (Figma র cover এর মতো সাজানো)

   কোনো ছবি card এ ঠিকমতো না বসলে শুধু fit টা বদলে দেখুন
   --------------------------------------------------------------- */
const cloudinary = ({ path, trim = false }, width) =>
  "https://res.cloudinary.com/dzi3u164c/image/upload/" +
  (trim ? "e_trim/" : "") +
  `c_limit,w_${width},f_auto,q_auto:best/` +
  path;

const coverSrcSet = (cover) =>
  [480, 800, 1300]
    .map((w) => `${cloudinary(cover, w)} ${w}w`)
    .join(", ");

/* ---------------------------------------------------------------
   technology গুলো — উপর থেকে নিচের ক্রমে

   video     — mp4 link (এখন filamento.com এর নিজের server থেকে).
               null থাকলে play বোতাম শুধু দেখায়, চাপা যায় না
   baseViews — শুরুর সংখ্যা, হাতে বসানো. পাতায় দেখায়
               baseViews + আসল play এর সংখ্যা (backend থেকে).
               শুধু আসল সংখ্যা দেখাতে চাইলে 0 করে দিন —
               database এ হাত দিতে হবে না
               (id টা server/routes/videoViewRoutes.js এর তালিকাতেও
               থাকতে হবে, নাহলে server গুনবে না)

   video র সময় (duration) এখানে লেখা নেই — video ফাইল থেকেই পড়া
   হয় (নিচে useVideoDurations). video বদলালে সময় নিজে থেকে মেলে

   নতুন technology যোগ করতে: এখানে একটা সারি, আর তিনটা locale এ
   technologies.items.<id>.title / .text
   --------------------------------------------------------------- */
const ITEMS = [
  {
    id: "thermal",
    cover: {
      path: "v1789621338/Additional_0001_1779697023_1_taubuk.png",
      fit: "product",
    },
    video:
      "https://www.filamento.com/wp-content/uploads/2026/07/RH1_Animation_Final_02_compressed.mp4",
    baseViews: 544,
  },
  {
    id: "optical",
    // Figma র video cover — পুরো ছবি
    cover: {
      path: "v1789628672/8f7e17c86d7e55308fb2c4aa5e59b763e23cc115_zcjucz.png",
      fit: "photo",
    },
    video:
      "https://www.filamento.com/wp-content/uploads/2026/06/10467854031752108853_compressed.mp4",
    // পাতা খুললে এটাই প্রথমে দেখায় — তাই সবচেয়ে বেশি view
    baseViews: 1200,
  },
  {
    id: "driver",
    cover: { path: "v1789471643/fix3_yeppeq.webp", trim: true, fit: "product" },
    video:
      "https://www.filamento.com/wp-content/plugins/Tot/upload/resources/VIDEOS/INSV_ACC-005-PT1-000-FL_230907.mp4",
    baseViews: 768,
  },
];

// Figma তে মাঝেরটা (Superior Optical Distribution) খোলা
const DEFAULT_ACTIVE = 1;

/* ---------- icon ---------- */
const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

// Figma: 26px, stroke 2, #111827
function PlayIcon() {
  return (
    <svg {...ICON_PROPS} width="26" height="26">
      <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
    </svg>
  );
}

// Figma: 16px, stroke 2
function ClockIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* 1200 → "1.2k" (ইংরেজি). চীনা/জাপানিতে এই মাপের সংখ্যা ছোট করা হয়
   না, তাই "1200" থাকে — ব্রাউজারের Intl নিজেই ঠিক করে */
const formatViews = (count, language) =>
  new Intl.NumberFormat(language, {
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(count)
    .toLowerCase();

/* 140.6 সেকেন্ড → "2:20". ঘণ্টা পেরোলে "1:02:05".
   নিচে নামানো (floor) — ব্রাউজারের নিজের video player ও তাই দেখায়,
   ফলে card আর player এ সময় এক থাকে */
const formatDuration = (seconds) => {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}`
    : `${minutes}:${secs}`;
};

/* ---------------------------------------------------------------
   section টা পর্দার কাছাকাছি (400px) এসেছে কিনা

   video র সময় পড়া আর view সংখ্যা আনা — দুটোই তখনই শুরু হয়.
   যারা এত নিচে scroll করে না, তাদের জন্য কিছুই নামে না.
   একবার true হলে আর false হয় না
   --------------------------------------------------------------- */
function useNearViewport(targetRef) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return undefined;

    // IntersectionObserver নেই এমন খুব পুরনো ব্রাউজারে সরাসরি শুরু
    if (typeof IntersectionObserver === "undefined") {
      const id = setTimeout(() => setNear(true), 0);
      return () => clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          setNear(true);
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef]);

  return near;
}

/* ---------------------------------------------------------------
   video র সময় — ফাইল থেকে পড়া

   প্রতিটা video র জন্য একটা অদৃশ্য <video> তৈরি হয়, যেটা শুধু
   "metadata" নামায় — ফাইলের শুরুর ছোট অংশ, যেখানে সময় লেখা থাকে.
   পুরো video নামে না; সময় পাওয়ার সাথে সাথে সেটাও বন্ধ করা হয়.

   অন্য domain এর video হলেও সময় পড়তে কোনো অনুমতি (CORS) লাগে না.
   কোনো কারণে পড়া না গেলে সময়টা শুধু দেখায় না, বাকি সব ঠিক থাকে
   --------------------------------------------------------------- */
function useVideoDurations(enabled, items) {
  const [durations, setDurations] = useState({});

  useEffect(() => {
    if (!enabled) return undefined;

    const release = (probe) => {
      probe.removeAttribute("src");
      probe.load(); // নামানো বন্ধ
    };

    const probes = items
      .filter(({ video }) => video)
      .map(({ id, video }) => {
        const probe = document.createElement("video");
        probe.preload = "metadata";
        probe.muted = true;

        probe.addEventListener(
          "loadedmetadata",
          () => {
            /* মানটা এখনই তুলে রাখা জরুরি: setDurations এর ভেতরের
               function React পরে চালায়, ততক্ষণে release() এ video
               খালি হয়ে duration NaN হয়ে যায় */
            const seconds = probe.duration;
            release(probe);

            // কিছু live stream এ সময় Infinity আসে — তখন দেখানো হয় না
            if (Number.isFinite(seconds) && seconds > 0) {
              setDurations((prev) => ({ ...prev, [id]: seconds }));
            }
          },
          { once: true },
        );
        probe.addEventListener("error", () => release(probe), { once: true });

        probe.src = video;
        return probe;
      });

    return () => probes.forEach(release);
  }, [enabled, items]);

  /* চলমান video থেকেও সময় জানা গেলে সেটা বসানো — আগে পড়া না
     গিয়ে থাকলে এখানে পূরণ হয় */
  const rememberDuration = (id, seconds) => {
    // seconds এখানে আগেই সংখ্যা হিসেবে এসেছে, তাই পরে পড়ার ঝুঁকি নেই
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    setDurations((prev) => (prev[id] ? prev : { ...prev, [id]: seconds }));
  };

  return [durations, rememberDuration];
}

/* ---------------------------------------------------------------
   view সংখ্যা — backend (MongoDB) থেকে

   views   — { thermal: 12, optical: 40, ... } — আসল play এর সংখ্যা.
             null মানে এখনো আসেনি, বা backend এ পৌঁছানো যায়নি —
             তখন view সংখ্যা দেখানো হয় না, বাকি section ঠিক থাকে

   countView(id) — play চাপলে ডাকা হয়:
     ১. একই browser এর একই session এ একটা video একবারই গোনা হয়
        (sessionStorage) — বারবার play চাপলে সংখ্যা ফোলে না
     ২. card এ সংখ্যা সাথে সাথে ১ বাড়ে (অপেক্ষা নয়)
     ৩. server এর উত্তর এলে তার সংখ্যাই বসে — এর মধ্যে অন্য কেউ
        দেখে থাকলে সেটাও ধরা পড়ে
     ৪. পাঠানো ব্যর্থ হলে বাড়ানো ১ ফেরত যায়, আর session এর দাগও
        মুছে যায় — পরে আবার play চাপলে আবার চেষ্টা হবে
   --------------------------------------------------------------- */
const VIEWED_KEY = (id) => `filamento_video_viewed:${id}`;

// Safari private mode এ sessionStorage throw করতে পারে
const readViewed = (id) => {
  try {
    return sessionStorage.getItem(VIEWED_KEY(id)) === "1";
  } catch {
    return false;
  }
};

const writeViewed = (id, value) => {
  try {
    if (value) sessionStorage.setItem(VIEWED_KEY(id), "1");
    else sessionStorage.removeItem(VIEWED_KEY(id));
  } catch {
    // সংরক্ষণ করা গেল না — সবচেয়ে খারাপ হলে একই session এ দুইবার গোনা হবে
  }
};

function useVideoViews(enabled) {
  const [views, setViews] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    api
      .getVideoViews()
      .then((data) => {
        if (!cancelled && data?.views) setViews(data.views);
      })
      .catch((error) => {
        // দর্শককে কিছু দেখানোর দরকার নেই — শুধু সংখ্যাটা লুকানো থাকে
        console.warn("Video views unavailable:", error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const bump = (id, by) =>
    setViews((prev) =>
      prev ? { ...prev, [id]: Math.max(0, (prev[id] ?? 0) + by) } : prev,
    );

  const countView = (id) => {
    if (readViewed(id)) return;
    writeViewed(id, true);
    bump(id, 1);

    api
      .addVideoView(id)
      .then((data) => {
        if (typeof data?.count === "number") {
          setViews((prev) => (prev ? { ...prev, [id]: data.count } : prev));
        }
      })
      .catch((error) => {
        bump(id, -1);
        writeViewed(id, false);
        console.warn("Could not record video view:", error.message);
      });
  };

  return [views, countView];
}

function Technologies() {
  const { t, i18n } = useTranslation();

  const [active, setActive] = useState(DEFAULT_ACTIVE);
  /* নতুন card কোন দিক থেকে আসবে — উপরের pill চাপলে উপর থেকে,
     নিচেরটা চাপলে নিচ থেকে */
  const [enterFrom, setEnterFrom] = useState("none");
  const [playing, setPlaying] = useState(false);

  /* বদলানোর animation এর সময় পুরনো card টা কিছুক্ষণ পেছনে থাকে —
     নতুনটা তার উপর দিয়ে আসে. { index, key } — key দিয়ে প্রতিবার
     নতুন করে animation শুরু হয় (দ্রুত পরপর চাপলেও) */
  const [leaving, setLeaving] = useState(null);

  /* নতুন card এর key — শুধু বদলানোর সময় বাড়ে. animation শেষে
     পুরনো card সরলেও এটা বদলায় না, তাই নতুন card নতুন করে তৈরি
     হয় না (ছবি ঝলকায় না, চলমান video থামে না) */
  const [enterKey, setEnterKey] = useState(0);

  /* animation শেষ হলে পুরনো card সরানো হয় (নিচে onAnimationEnd).
     motion বন্ধ থাকলে animation হয় না, event ও আসে না — তাই সময়
     পেরোলে এমনিতেই সরে যায় */
  useEffect(() => {
    if (!leaving) return undefined;
    const timer = setTimeout(() => setLeaving(null), 1100);
    return () => clearTimeout(timer);
  }, [leaving]);

  const sectionRef = useRef(null);
  const near = useNearViewport(sectionRef);
  const [durations, rememberDuration] = useVideoDurations(near, ITEMS);
  const [views, countView] = useVideoViews(near);

  /* section কাছে এলে তিনটা cover ছবি আগেই নামিয়ে রাখা — নাহলে
     animation এর সময় নতুন card এর ছবি তখনো আসেনি, ফাঁকা দেখাত */
  useEffect(() => {
    if (!near) return;
    ITEMS.forEach(({ cover }) => {
      if (!cover) return;
      const image = new Image();
      image.srcset = coverSrcSet(cover);
      image.sizes = "(max-width: 1099px) 90vw, 45vw";
      image.src = cloudinary(cover, 800);
    });
  }, [near]);

  /* play চাপলে বোতামটা সরে গিয়ে video আসে — keyboard এর focus যেন
     হারিয়ে না যায়, তাই video তে পাঠানো হয়. video শেষ হলে আবার
     play বোতামে ফেরে */
  const playButtonRef = useRef(null);
  const focusOnMount = (node) => node?.focus({ preventScroll: true });

  const handleEnded = () => {
    setPlaying(false);
    requestAnimationFrame(() =>
      playButtonRef.current?.focus({ preventScroll: true }),
    );
  };

  const count = ITEMS.length;
  const wrap = (index) => (index + count) % count;

  const prevIndex = wrap(active - 1);
  const nextIndex = wrap(active + 1);
  const item = ITEMS[active];
  const itemTitle = t(`technologies.items.${item.id}.title`);

  const handlePlay = () => {
    setPlaying(true);
    countView(item.id);
  };

  /* তালিকায় ২টার কম হলে উপরে-নিচে একই জিনিস দুইবার দেখাত —
     তখন ফাঁকা জায়গা রাখা হয়, যাতে card টা মাঝেই থাকে */
  const showPrev = count > 2;
  const showNext = count > 1;

  const show = (index, from) => {
    if (index === active) return;
    setLeaving({ index: active, key: Date.now() });
    setEnterKey((current) => current + 1);
    setEnterFrom(from);
    setActive(index);
    setPlaying(false); // অন্য technology তে গেলে চলমান video বন্ধ
  };

  /* নতুন card এর বড় হওয়া শেষ → পুরনোটা সরানো.
     ভেতরের element এর animation (লেখা, play) ও এখানে bubble করে আসে,
     তাই শুধু card এর নিজের animation ধরা হয় */
  const handleCardAnimationEnd = (event) => {
    if (event.target === event.currentTarget) setLeaving(null);
  };

  /* card এর ভেতরের অংশ — cover, play বোতাম / video, নিচের লেখা.
     interactive false → animation এর সময় পেছনে থাকা পুরনো card:
     একই রকম দেখায়, কিন্তু চাপা যায় না আর video চলে না */
  const renderFace = (entry, interactive) => {
    const title = t(`technologies.items.${entry.id}.title`);
    const duration = durations[entry.id];
    // backend থেকে সংখ্যা না এলে null — তখন view দেখায় না
    const viewCount = views
      ? (entry.baseViews ?? 0) + (views[entry.id] ?? 0)
      : null;

    return (
      <>
        <div className="tech-cover">
          {entry.cover && (
            <img
              src={cloudinary(entry.cover, 800)}
              srcSet={coverSrcSet(entry.cover)}
              sizes="(max-width: 1099px) 90vw, 45vw"
              alt=""
              loading="lazy"
              decoding="async"
            />
          )}
        </div>

        {interactive && playing && entry.video ? (
          /* play চাপার পরেই video নামা শুরু হয় — আগে থেকে
             তিনটা video নামিয়ে পাতা ভারী করা হয় না.
             শেষ হলে আবার cover আর লেখা ফিরে আসে.

             controlsList="nodownload" — তিন-বিন্দু menu থেকে
             "Download" সরায়, মূল filamento.com এর মতো. playback
             speed আর picture-in-picture থাকে.
             onContextMenu — ডান-ক্লিকের "Save video as" ও বন্ধ.
             (link টা public, তাই এটা পুরো সুরক্ষা নয় — শুধু
             সাধারণ দর্শকের জন্য সহজ download এর পথ বন্ধ) */
          <video
            ref={focusOnMount}
            className="tech-video"
            src={entry.video}
            controls
            controlsList="nodownload"
            onContextMenu={(event) => event.preventDefault()}
            autoPlay
            playsInline
            aria-label={title}
            onLoadedMetadata={(event) =>
              rememberDuration(entry.id, event.currentTarget.duration)
            }
            onEnded={handleEnded}
          />
        ) : (
          <>
            {interactive && entry.video ? (
              <button
                ref={playButtonRef}
                type="button"
                className="tech-play"
                onClick={handlePlay}
                aria-label={t("technologies.play", { title })}
              >
                <PlayIcon />
              </button>
            ) : (
              <span className="tech-play is-idle" aria-hidden="true">
                <PlayIcon />
              </span>
            )}

            {/* Figma: video-overlay — নিচে কালো আভা, তার উপর লেখা */}
            <div className="tech-overlay">
              <div className="tech-overlay-text">
                <h3 className="tech-card-title">{title}</h3>
                <p className="tech-card-text">
                  {t(`technologies.items.${entry.id}.text`)}
                </p>
              </div>

              {/* Boolean — নাহলে দুটোই 0 হলে React পাতায় "0" লিখে দিত */}
              {Boolean(duration || viewCount) && (
                <div className="tech-meta">
                  {/* সময় পড়া শেষ না হওয়া পর্যন্ত ফাঁকা span —
                      view সংখ্যা যেন ডান পাশেই থাকে */}
                  {duration ? (
                    <span className="tech-meta-item">
                      <ClockIcon />
                      <span className="sr-only">
                        {`${t("technologies.duration")} `}
                      </span>
                      {formatDuration(duration)}
                    </span>
                  ) : (
                    <span />
                  )}

                  {viewCount ? (
                    <span className="tech-meta-item">
                      <EyeIcon />
                      {/* "count" নাম নয় — i18next ওই নামে বহুবচনের
                          নিয়ম খোঁজে, আর এখানে এটা লেখা ("1.2k") */}
                      {t("technologies.views", {
                        value: formatViews(viewCount, i18n.language),
                      })}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </>
        )}
      </>
    );
  };

  const renderPill = (index, from, visible) => {
    if (!visible) {
      return <span className="tech-pill tech-pill--empty" aria-hidden="true" />;
    }

    const title = t(`technologies.items.${ITEMS[index].id}.title`);

    return (
      <button
        type="button"
        className="tech-pill"
        onClick={() => show(index, from)}
        aria-label={t("technologies.goTo", { title })}
      >
        {/* key দিয়ে শুধু লেখাটা নতুন করে আসে — বোতামটা একই থাকে,
            তাই keyboard এর focus হারায় না */}
        <span key={ITEMS[index].id} className="tech-pill-label">
          <span aria-hidden="true">+ </span>
          {title}
        </span>
      </button>
    );
  };

  return (
    <section
      ref={sectionRef}
      className="technologies"
      aria-labelledby="technologies-title"
    >
      <div className="technologies-inner">
        {/* Figma: Frame 596 — 320px */}
        <div className="tech-intro">
          <h2 id="technologies-title" className="tech-title">
            {t("technologies.title")}
          </h2>
          <p className="tech-text">{t("technologies.text")}</p>
        </div>

        {/* Figma: Frame 594 — stack + dots, gap 48 */}
        <div className="tech-stage">
          <div
            className="tech-stack"
            role="group"
            aria-label={t("technologies.listLabel")}
          >
            {renderPill(prevIndex, "top", showPrev)}

            {/* নতুন technology এলে screen reader শিরোনামটা পড়ে শোনায় */}
            {/* নতুন technology এলে screen reader শিরোনামটা পড়ে শোনায়.
                slot এর ভেতরে দুইটা card একই জায়গায় স্তূপ করা — পুরনোটা
                পেছনে, নতুনটা উপরে (Technologies.css দেখুন) */}
            <div className="tech-card-slot" aria-live="polite">
              {leaving && (
                <article
                  key={`leaving-${leaving.key}`}
                  className="tech-card is-leaving"
                  data-fit={ITEMS[leaving.index].cover?.fit ?? "photo"}
                  data-enter={enterFrom}
                  aria-hidden="true"
                  inert
                >
                  {renderFace(ITEMS[leaving.index], false)}
                </article>
              )}

              <article
                key={`${item.id}-${enterKey}`}
                className="tech-card"
                data-fit={item.cover?.fit ?? "photo"}
                data-enter={leaving ? enterFrom : "none"}
                onAnimationEnd={handleCardAnimationEnd}
              >
                {/* বড় হওয়ার শুরুতে card টা pill এর মতো দেখায় — ধূসর,
                    ভেতরে pill এর লেখা. তারপর মিলিয়ে যায় */}
                {leaving && (
                  <span className="tech-card-veil" aria-hidden="true">
                    <span className="tech-card-veil-label">
                      + {itemTitle}
                    </span>
                  </span>
                )}
                {renderFace(item, true)}
              </article>
            </div>

            {renderPill(nextIndex, "bottom", showNext)}
          </div>

          {/* Figma: Frame 228 — খাড়া dot, চালু টা লম্বা */}
          <div className="tech-dots">
            {ITEMS.map((dot, index) => (
              <button
                key={dot.id}
                type="button"
                className="tech-dot"
                aria-label={t("technologies.goTo", {
                  title: t(`technologies.items.${dot.id}.title`),
                })}
                aria-current={index === active ? "true" : undefined}
                onClick={() => show(index, index < active ? "top" : "bottom")}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Technologies;