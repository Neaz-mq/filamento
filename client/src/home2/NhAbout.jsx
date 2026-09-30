import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import NhTag from "./NhTag";
import { IMAGES, cloud, srcSet } from "./data";
import { prefersReducedMotion, useInView } from "./motion";

/* ===============================================================
   About Us — Figma "Frame 2147228145"

   উপরে বাঁয়ে চিহ্ন, ডানে বড় লেখা আর তিনটা সংখ্যা. নিচে পুরো চওড়া
   ছবি, তার উপর বাঁয়ে দুইটা সাদা card.

   সংখ্যাগুলো পর্দায় এলে 0 থেকে গুনে ওঠে (60%+, 5 Years, 100%).
   গোনার সময় React কে বারবার আঁকতে বলা হয় না — সরাসরি লেখাটা
   বদলানো হয় (ref দিয়ে), তাই ৬০ frame এও পাতা ভারী হয় না
   =============================================================== */

const STATS = [
  { id: "energy", value: 60 },
  { id: "warranty", value: 5 },
  { id: "usa", value: 100 },
];

const COUNT_MS = 1600;

// শেষের দিকে ধীর — গাড়ি থামার মতো
const easeOut = (x) => 1 - (1 - x) ** 3;

function CountUp({ value, format }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    /* span এর ভেতরের লেখার node টাই বদলানো হয়, নতুন node নয় —
       React এর নিজের রাখা node টা অক্ষত থাকে */
    const node = ref.current?.firstChild;
    if (!node || !inView || prefersReducedMotion()) return undefined;

    let frame = 0;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / COUNT_MS, 1);
      node.nodeValue = format(Math.round(value * easeOut(progress)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, format]);

  /* শুরুতেই শেষ মানটা লেখা থাকে — screen reader, Google আর JavaScript
     বন্ধ থাকলেও ঠিক সংখ্যা পায়. পর্দায় এলে 0 থেকে গোনা শুরু হয় */
  return <span ref={ref}>{format(value)}</span>;
}

function NhAbout() {
  const { t } = useTranslation();

  return (
    <section id="about" className="nh-section nh-about" aria-labelledby="nh-about-tag">
      <div className="nh-wrap">
        <div className="nh-about-top">
          <NhTag
            id="nh-about-tag"
            number="1"
            label={t("home2.about.tag")}
            data-reveal=""
          />

          <div className="nh-about-main">
            <p className="nh-about-lead" data-reveal="" style={{ "--d": 1 }}>
              {t("home2.about.text")}
            </p>

            <dl className="nh-stats">
              {STATS.map((stat, index) => (
                <div
                  key={stat.id}
                  className="nh-stat"
                  data-reveal=""
                  style={{ "--d": 2 + index }}
                >
                  <dt className="nh-stat-label">
                    {t(`home2.about.stats.${stat.id}.label`)}
                  </dt>
                  <dd className="nh-stat-value">
                    <CountUp
                      value={stat.value}
                      format={(n) => t(`home2.about.stats.${stat.id}.value`, { n })}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <figure className="nh-about-media" data-reveal="zoom">
          <img
            src={cloud(IMAGES.about, 1600)}
            srcSet={srcSet(IMAGES.about, [640, 960, 1280, 1600, 2400])}
            sizes="(max-width: 1440px) 92vw, 1280px"
            alt={t("home2.about.imageAlt")}
            loading="lazy"
            decoding="async"
          />

          <div className="nh-about-cards">
            {["efficiency", "built"].map((id, index) => (
              <div
                key={id}
                className="nh-glass-card"
                data-reveal=""
                style={{ "--d": 2 + index }}
              >
                <p className="nh-glass-label">{t(`home2.about.cards.${id}.label`)}</p>
                <p className="nh-glass-value">{t(`home2.about.cards.${id}.value`)}</p>
                <p className="nh-glass-text">{t(`home2.about.cards.${id}.text`)}</p>
              </div>
            ))}
          </div>
        </figure>
      </div>
    </section>
  );
}

export default NhAbout;
