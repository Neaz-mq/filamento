import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import NhTag from "./NhTag";
import { TECH, TECH_START, cloud, srcSet } from "./data";
import { ClockIcon, EyeIcon, PlayIcon } from "./icons";
import { isSwipe, useInView, useSwipe } from "./motion";

/* ===============================================================
   Technology — Figma "Frame 2147228152"

   তিনটা video card এর coverflow: মাঝেরটা বড় আর সামনে, দুই পাশে
   আগের আর পরেরটা ছোট হয়ে পেছনে, একটু আবছা. পাশের card বা নিচের
   dot এ চাপলে সেটা ঘুরে মাঝে আসে. তালিকা গোল — শেষের পরে প্রথমটা.

   ঘোরার animation শুধু transform আর opacity তে — তিনটা card শুধু
   জায়গা বদলায় (data-pos), CSS বাকি সব মসৃণ করে. কোনো card নতুন
   করে তৈরি হয় না, তাই ছবি ঝলকায় না.

   Figma তে ৫টা dot, কিন্তু video আছে ৩টা — তাই ৩টা dot.

   view সংখ্যা আর video র সময় মূল পাতার মতোই: সময় video ফাইল থেকে
   পড়া, view সংখ্যা server থেকে (+ baseViews). একই browser এ মূল
   পাতায় দেখা video এখানে আবার গোনা হয় না (একই sessionStorage key)
   =============================================================== */

const count = TECH.length;
const wrap = (index) => (index + count) % count;

// মাঝে থেকে কত ঘর দূরে: 0 মাঝে, 1 ডানে, -1 বাঁয়ে, বাকিরা লুকানো
const positionOf = (index, active) => {
  const offset = wrap(index - active);
  if (offset === 0) return "center";
  if (offset === 1) return "next";
  if (offset === count - 1) return "prev";
  return "hidden";
};

const coverPath = (item, width) => cloud(item.cover, width, item);

/* video চালু হলে keyboard এর focus সেখানে — play বোতামটা সরে যায়,
   focus হারিয়ে যেত. বাইরে রাখা, যাতে প্রতি render এ নতুন function
   না হয় (হলে React প্রতিবার আবার focus করত) */
const focusOnMount = (node) => node?.focus({ preventScroll: true });

/* 1200 → "1.2k" (ইংরেজি); জাপানি/চীনাতে ব্রাউজারের নিজের নিয়মে */
const formatViews = (value, language) =>
  new Intl.NumberFormat(language, { notation: "compact", maximumFractionDigits: 1 })
    .format(value)
    .toLowerCase();

// 134.6 → "2:14"
const formatDuration = (seconds) => {
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/* ---------- video র সময় — শুধু ফাইলের শুরুর অংশ (metadata) নামে ---------- */
function useDurations(enabled) {
  const [durations, setDurations] = useState({});

  useEffect(() => {
    if (!enabled) return undefined;

    const release = (probe) => {
      probe.removeAttribute("src");
      probe.load();
    };

    const probes = TECH.map(({ id, video }) => {
      const probe = document.createElement("video");
      probe.preload = "metadata";
      probe.muted = true;
      probe.addEventListener(
        "loadedmetadata",
        () => {
          const seconds = probe.duration; // release এর আগেই তুলে রাখা
          release(probe);
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
  }, [enabled]);

  return durations;
}

/* ---------- view সংখ্যা ---------- */
const viewedKey = (id) => `filamento_video_viewed:${id}`;

const readViewed = (id) => {
  try {
    return sessionStorage.getItem(viewedKey(id)) === "1";
  } catch {
    return false;
  }
};

const writeViewed = (id, value) => {
  try {
    if (value) sessionStorage.setItem(viewedKey(id), "1");
    else sessionStorage.removeItem(viewedKey(id));
  } catch {
    // রাখা গেল না — সবচেয়ে খারাপ হলে একই session এ দুইবার গোনা
  }
};

function useViews(enabled) {
  const [views, setViews] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    api
      .getVideoViews()
      .then((data) => !cancelled && data?.views && setViews(data.views))
      .catch(() => {}); // না এলে সংখ্যাটা শুধু দেখায় না

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const countView = (id) => {
    if (readViewed(id)) return;
    writeViewed(id, true);

    api
      .addVideoView(id)
      .then((data) => {
        if (typeof data?.count === "number") {
          setViews((prev) => (prev ? { ...prev, [id]: data.count } : prev));
        }
      })
      .catch(() => writeViewed(id, false)); // পরে আবার চেষ্টা হবে
  };

  return [views, countView];
}

function NhTechnology() {
  const { t, i18n } = useTranslation();

  const [active, setActive] = useState(TECH_START);
  const [playing, setPlaying] = useState(false);

  // section কাছে এলে (600px আগে) তবেই সময় আর view সংখ্যা আনা
  const sectionRef = useRef(null);
  const near = useInView(sectionRef, { once: true, rootMargin: "600px 0px" });
  const durations = useDurations(near);
  const [views, countView] = useViews(near);

  const go = (index) => {
    if (index === active) return;
    setPlaying(false); // অন্য card এ গেলে চলমান video বন্ধ
    setActive(index);
  };

  const play = () => {
    setPlaying(true);
    countView(TECH[active].id);
  };

  /* মাঝের card টানা — বাঁয়ে টানলে পরেরটা আসে (ডান থেকে), ডানে টানলে
     আগেরটা. টানার সময় card হাতের সাথে সরে (track এর --drag, CSS এ).
     ছাড়ার সময় --drag মুছে জায়গা বদলানো হয় — card টা যেখানে ছিল
     সেখান থেকেই নতুন জায়গায় মসৃণভাবে যায়, লাফ দেয় না.

     video চলার সময় টানা বন্ধ — নাহলে video র সময়-দাগ টানতে গেলে
     card সরে যেত */
  const trackRef = useRef(null);

  useSwipe(trackRef, {
    enabled: !playing,
    onMove: (dx) => trackRef.current?.style.setProperty("--drag", dx),
    onEnd: (dx, velocity) => {
      trackRef.current?.style.removeProperty("--drag");
      if (!isSwipe(dx, velocity)) return;
      go(wrap(active + (dx < 0 || (!dx && velocity < 0) ? 1 : -1)));
    },
  });

  return (
    <section
      ref={sectionRef}
      className="nh-section nh-tech"
      aria-labelledby="nh-tech-title"
    >
      <div className="nh-wrap">
        <header className="nh-head">
          <NhTag number="3" label={t("home2.technology.tag")} data-reveal="" />
          <h2 id="nh-tech-title" className="nh-h2 nh-h2--tech" data-reveal="" style={{ "--d": 1 }}>
            {t("home2.technology.title")}
          </h2>
          <p className="nh-sub" data-reveal="" style={{ "--d": 2 }}>
            {t("home2.technology.text")}
          </p>
        </header>

        <div className="nh-tech-stage" data-reveal="" style={{ "--d": 2 }}>
          <div
            ref={trackRef}
            className="nh-tech-track"
            role="group"
            aria-label={t("technologies.listLabel")}
          >
            {TECH.map((item, index) => {
              const pos = positionOf(index, active);
              const isCenter = pos === "center";
              const title = t(`technologies.items.${item.id}.title`);
              const duration = durations[item.id];
              const viewCount = views ? item.baseViews + (views[item.id] ?? 0) : null;

              return (
                <article
                  key={item.id}
                  className="nh-tech-card"
                  data-pos={pos}
                  data-fit={item.fit}
                  aria-hidden={isCenter ? undefined : true}
                >
                  <div className="nh-tech-face">
                    <div className="nh-tech-cover">
                      <img
                        src={coverPath(item, 900)}
                        srcSet={srcSet(item.cover, [480, 900, 1300], item)}
                        sizes="(max-width: 1100px) 90vw, 830px"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </div>

                    {isCenter && playing ? (
                      <video
                        className="nh-tech-video"
                        src={item.video}
                        controls
                        controlsList="nodownload"
                        onContextMenu={(event) => event.preventDefault()}
                        autoPlay
                        playsInline
                        aria-label={title}
                        onEnded={() => setPlaying(false)}
                        ref={focusOnMount}
                      />
                    ) : (
                      <>
                        <div className="nh-tech-shade" aria-hidden="true" />

                        <div className="nh-tech-info">
                          <h3 className="nh-tech-title">{title}</h3>
                          <p className="nh-tech-text">
                            {t(`technologies.items.${item.id}.text`)}
                          </p>

                          <div className="nh-tech-meta">
                            <span className="nh-tech-meta-item">
                              {duration ? (
                                <>
                                  <ClockIcon />
                                  <span className="sr-only">{t("technologies.duration")} </span>
                                  {formatDuration(duration)}
                                </>
                              ) : null}
                            </span>
                            {viewCount ? (
                              <span className="nh-tech-meta-item">
                                <EyeIcon />
                                {t("technologies.views", {
                                  value: formatViews(viewCount, i18n.language),
                                })}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {isCenter ? (
                          <button
                            type="button"
                            className="nh-tech-play"
                            onClick={play}
                            aria-label={t("technologies.play", { title })}
                          >
                            <PlayIcon />
                          </button>
                        ) : (
                          <span className="nh-tech-play" aria-hidden="true">
                            <PlayIcon />
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* পাশের card এর উপর স্বচ্ছ বোতাম — চাপলে সেটা মাঝে আসে */}
                  {!isCenter && pos !== "hidden" && (
                    <button
                      type="button"
                      className="nh-tech-pick"
                      tabIndex={-1}
                      onClick={() => go(index)}
                      aria-label={t("technologies.goTo", { title })}
                    />
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div className="nh-dots">
          {TECH.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="nh-dot"
              aria-current={index === active ? "true" : undefined}
              aria-label={t("technologies.goTo", {
                title: t(`technologies.items.${item.id}.title`),
              })}
              onClick={() => go(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default NhTechnology;
