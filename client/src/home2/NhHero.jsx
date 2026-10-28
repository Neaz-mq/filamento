import { useEffect, useRef, useState } from "react";
import SoftLink from "../components/SoftLink";
import { Trans, useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import { HERO_CARDS, IMAGES, cloud, srcSet } from "./data";
import { ArrowUpRight, DoubleChevron } from "./icons";
import { isSwipe, useSwipe } from "./motion";

import prologis from "../assets/logo/Prologis_Logo 1.svg";
import caterpillar from "../assets/logo/Caterpillar_Logo-1 1.svg";
import toshiba from "../assets/logo/Toshiba_Logo-1 1.svg";
import anheuserBusch from "../assets/logo/Anheuser_Busch_Logo-1 1.svg";
import airbus from "../assets/logo/Airbus_Logo-1 1.svg";
import bobs from "../assets/logo/Bobs_Logo-1 1.svg";

/* ===============================================================
   Hero — Figma "Desktop 1" (1440 x 986, কালো)

   পেছনে stadium এর ছবি, উপরে আর নিচে কালো আভা. বাঁয়ে শিরোনাম,
   ডান-নিচে তিনটা card এর স্তূপ, সবার নিচে ক্রেতাদের logo.

   animation (সব একবার, পাতা খোলার সময়):
     • ছবিটা একটু বড় থেকে ধীরে আসল মাপে আসে
     • লেখাগুলো একটার পর একটা নিচ থেকে উঠে আসে
     • card এর স্তূপ নিজে থেকে ঘোরে না — শুধু দর্শক টেনে সরালে
       সামনেরটা পেছনে যায় আর পরেরটা সামনে আসে
   =============================================================== */

const LOGOS = [
  { name: "Prologis", src: prologis },
  { name: "Caterpillar", src: caterpillar },
  { name: "Toshiba", src: toshiba },
  { name: "Anheuser-Busch", src: anheuserBusch },
  { name: "Airbus", src: airbus },
  { name: "Bob's Discount Furniture", src: bobs },
];

/* marquee তে সেটটা কতবার বসবে (জোড় সংখ্যা). ছয়টা logo এর এক সেট
   ~1100px — বড় পর্দায় ফাঁক না পড়তে বারবার বসানো. ট্র্যাক ঠিক অর্ধেক
   সরলে লুপ জোড়া লাগে, তাই জোড় হতে হবে */
const LOGO_SETS = 6;

// ছুড়ে দেওয়া card কত দূরে উড়ে যাবে, আর কতক্ষণ পরে পেছনে বসবে
const THROW_PX = 560;
const THROW_MS = 300;

/* ---------------------------------------------------------------
   Hero র লেখা, card আর logo screen এর মাপ অনুযায়ী ছোট-বড় হয়
   (CSS zoom, --hero-zoom) — যাতে পুরো Hero, নিচের logo সারি সহ, প্রথম
   screen এই ধরে

   Hero র নকশা Figma 1440 x 986 — content ~987px. কিন্তু আসল browser এ
   উচ্চতা কম হতে পারে (1440 x 896) বা চওড়া বেশি (2560). তাই মাপ হয়
   তিনটা সীমার সবচেয়ে ছোটটা:
   • চওড়া ÷ 1920 (কিন্তু কমপক্ষে 1) — বড় পর্দায় চওড়ার অনুপাতে বড়
   • (উচ্চতা − 74) ÷ 930             — Hero র সব content (~987px = header 74
                                       + 913) screen এ ঢুকতে হবে, নাহলে
                                       নিচের logo কাটা পড়ে. 930 (913 না) —
                                       একটু বাড়তি জায়গা, যাতে কয়েক px
                                       এদিক-ওদিক হলেও না কাটে
   • 1.37                            — তার বেশি হলে শিরোনাম 1280px content
                                       এর বাইরে চলে যেত
   আর কখনো 0.7 এর নিচে নামে না — তার ছোট হলে লেখা পড়া কঠিন

   উদাহরণ: 1440 x 896 → 0.88 | 1920 x 1080 → 1 | 2048 x 996 → 0.99
            2560 x 1379 → 1.33

   1100 এর নিচে (tablet/mobile) এই মাপ বদল বন্ধ — সেখানে আলাদা নকশা.
   window.innerWidth/innerHeight — CSS এর (min-width: 1100px) আর 100svh
   এর সাথে একই, তাই সব একসাথে চালু/বন্ধ হয়
   --------------------------------------------------------------- */
const HERO_FROM_W = 1100; // এর নিচে মাপ বদল নেই (CSS এর media query র সাথে মিল)
const HERO_BASE_W = 1920;
const HERO_HEADER_H = 74; // --nh-header-h
const HERO_CONTENT_H = 930; // Hero র content (header বাদে) + একটু বাড়তি
const HERO_MAX_ZOOM = 1.37;
const HERO_MIN_ZOOM = 0.7;

const getHeroScale = () => {
  if (typeof window === "undefined") return 1;
  const { innerWidth: width, innerHeight: height } = window;
  if (width < HERO_FROM_W) return 1;

  const byWidth = Math.min(Math.max(1, width / HERO_BASE_W), HERO_MAX_ZOOM);
  const byHeight = (height - HERO_HEADER_H) / HERO_CONTENT_H;
  const scale = Math.min(byWidth, byHeight);

  // নিচের দিকে গোল — উপরে গোল করলে content সামান্য লম্বা হয়ে কাটা পড়ত
  return Math.max(HERO_MIN_ZOOM, Math.floor(scale * 100) / 100);
};

function useHeroScale() {
  const [scale, setScale] = useState(getHeroScale);

  useEffect(() => {
    const update = () => setScale(getHeroScale());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}

/* ---------------------------------------------------------------
   card এর স্তূপ — Figma "Group 174"

   তিনটা card একই মাপের, পেছনের দুইটা ছোট করে (scale) উপরে বসানো —
   slot 0 সামনে, 1 মাঝে, 2 সবার পেছনে (HomeTwo.css এ data-slot)

   সামনের card টা mouse বা আঙুলে ডানে-বাঁয়ে টানা যায় — টানার সময়
   হাতের সাথে সাথে সরে আর একটু হেলে. যথেষ্ট টেনে (বা ঝটকা দিয়ে)
   ছাড়লে সেদিকে উড়ে যায়, তারপর স্তূপের একদম পেছনে গিয়ে বসে, আর
   দ্বিতীয়টা সামনে আসে. অল্প টেনে ছাড়লে জায়গায় ফিরে যায়.

   টানার সময় React আবার আঁকে না — card এর --dx (CSS variable)
   সরাসরি বদলানো হয়, CSS তা দিয়ে transform বানায়
   --------------------------------------------------------------- */
function CardStack({ scale = 1 }) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

  const [front, setFront] = useState(0);
  const stackRef = useRef(null);

  // একটা card উড়ে যাওয়ার মাঝে (0.3s) আরেকবার টানা ধরা হয় না
  const throwingRef = useRef(false);
  const throwTimer = useRef(0);

  useEffect(() => () => clearTimeout(throwTimer.current), []);

  const frontCard = () => stackRef.current?.querySelector('[data-slot="0"]');

  useSwipe(stackRef, {
    onMove: (dx) => {
      if (throwingRef.current) return;
      /* stack zoom হয়ে বড় থাকলে transform এর px ও scale হয় — তাই dx
         ভাগ করে দেওয়া, যাতে card ঠিক আঙুল/mouse এর সাথে সাথে চলে */
      frontCard()?.style.setProperty("--dx", dx / scale);
    },
    onEnd: (dx, velocity) => {
      if (throwingRef.current) return;
      const card = frontCard();
      if (!card) return;

      // অল্প টানা — জায়গায় ফেরা (CSS transition টেনে আনে)
      if (!isSwipe(dx, velocity)) {
        card.style.removeProperty("--dx");
        return;
      }

      // সেদিকে উড়িয়ে দেওয়া, তারপর পেছনে পাঠানো
      const direction = Math.sign(dx || velocity) || 1;
      throwingRef.current = true;
      card.setAttribute("data-thrown", "");
      card.style.setProperty("--dx", (direction * THROW_PX) / scale);

      clearTimeout(throwTimer.current);
      throwTimer.current = setTimeout(() => {
        card.removeAttribute("data-thrown");
        card.style.removeProperty("--dx");
        setFront((value) => (value + 1) % HERO_CARDS.length);
        throwingRef.current = false;
      }, THROW_MS);
    },
  });

  const count = HERO_CARDS.length;

  return (
    <div
      ref={stackRef}
      className="nh-stack nh-hero-in"
      style={{ "--d": 5 }}
      role="group"
      aria-label={t("hero.cardsLabel")}
    >
      {HERO_CARDS.map((card, index) => {
        const slot = (index - front + count) % count;
        const isFront = slot === 0;
        const title = `${t(`hero.cards.${card.id}.titleTop`)} ${t(
          `hero.cards.${card.id}.titleBottom`,
        )}`;

        return (
          <SoftLink
            key={card.id}
            to={localeLink("/products")}
            className="nh-stack-card"
            data-slot={slot}
            /* পেছনের card গুলো চোখে দেখা যায়, কিন্তু চাপা বা Tab করা
               যায় না — একই জিনিস তিনবার শোনানোর মানে নেই */
            tabIndex={isFront ? undefined : -1}
            aria-hidden={isFront ? undefined : true}
            draggable={false}
          >
            <span className="nh-stack-media">
              <img
                src={cloud(card.image, 320)}
                alt=""
                width="102"
                height="102"
                decoding="async"
                draggable={false}
              />
            </span>

            <span className="nh-stack-body">
              <span className="nh-stack-top">
                <span className="nh-stack-tag">{t("home2.hero.launch")}</span>
                <span className="nh-stack-go">
                  <ArrowUpRight />
                </span>
              </span>
              <span className="nh-stack-text">
                <span className="nh-stack-title">{title}</span>
                <span className="nh-stack-desc">
                  {t(`hero.cards.${card.id}.text`)}
                </span>
              </span>
            </span>
          </SoftLink>
        );
      })}
    </div>
  );
}

function NhHero() {
  const { t } = useTranslation();

  /* ছবি নামা শেষ হলে তবেই zoom শুরু — ধীর internet এ ফাঁকা কালোর
     উপর zoom চললে দেখাই যেত না. cache থেকে এলে onLoad সাথে সাথে */
  const [loaded, setLoaded] = useState(false);

  const heroScale = useHeroScale();

  return (
    <section
      className="nh-hero"
      aria-labelledby="nh-hero-title"
      style={{ "--hero-zoom": heroScale }}
    >
      <div className="nh-hero-media" data-loaded={loaded ? "" : undefined}>
        <img
          src={cloud(IMAGES.hero, 1920)}
          srcSet={srcSet(IMAGES.hero, [960, 1440, 1920, 2560])}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </div>
      <div className="nh-hero-shade nh-hero-shade--top" aria-hidden="true" />
      <div className="nh-hero-shade nh-hero-shade--bottom" aria-hidden="true" />

      <div className="nh-wrap nh-hero-inner">
        <div className="nh-hero-copy">
          <p className="nh-hero-eyebrow nh-hero-in" style={{ "--d": 0 }}>
            {t("hero.eyebrow")}
          </p>

          <h1 id="nh-hero-title" className="nh-hero-title nh-hero-in" style={{ "--d": 1 }}>
            {t("home2.hero.title")}
          </h1>

          <p className="nh-hero-text nh-hero-in" style={{ "--d": 2 }}>
            <Trans i18nKey="home2.hero.subhead" components={{ b: <strong /> }} />
          </p>

          <a href="#contact" className="nh-btn-quote nh-hero-in" style={{ "--d": 3 }}>
            <span className="nh-btn-quote-box">
              <DoubleChevron />
            </span>
            <span>{t("actions.requestQuote")}</span>
          </a>
        </div>

        <CardStack scale={heroScale} />
      </div>

      {/* logo গুলো ডান থেকে বামে একটানা চলে (marquee). পুরো প্রস্থ জুড়ে —
          তাই nh-wrap এর ভেতরে নয়. পাতা খোলার সময় সারিটা একসাথে
          একবার নিচ থেকে ওঠে (nh-hero-in), তারপর চলতে থাকে */}
      <div className="nh-hero-logos nh-hero-in" style={{ "--d": 6 }}>
        <div className="nh-logos-marquee">
          <div className="nh-logos-track">
            {Array.from({ length: LOGO_SETS }, (_, setIndex) => (
              /* শুধু প্রথম সেট screen reader এর জন্য — বাকিগুলো কপি */
              <ul
                key={setIndex}
                className="nh-logos"
                aria-label={setIndex === 0 ? t("brands.label") : undefined}
                aria-hidden={setIndex === 0 ? undefined : true}
              >
                {LOGOS.map((logo) => (
                  <li key={logo.name}>
                    <img
                      src={logo.src}
                      alt={setIndex === 0 ? logo.name : ""}
                      width="114"
                      height="57"
                      decoding="async"
                      draggable="false"
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default NhHero;