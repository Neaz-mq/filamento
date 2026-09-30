import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

// ছুড়ে দেওয়া card কত দূরে উড়ে যাবে, আর কতক্ষণ পরে পেছনে বসবে
const THROW_PX = 560;
const THROW_MS = 300;

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
function CardStack() {
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
      frontCard()?.style.setProperty("--dx", dx);
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
      card.style.setProperty("--dx", direction * THROW_PX);

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
          <Link
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
          </Link>
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

  return (
    <section className="nh-hero" aria-labelledby="nh-hero-title">
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

        <CardStack />
      </div>

      <div className="nh-wrap nh-hero-logos">
        <ul className="nh-logos" aria-label={t("brands.label")}>
          {LOGOS.map((logo, index) => (
            <li key={logo.name} className="nh-hero-in" style={{ "--d": 6 + index * 0.5 }}>
              <img
                src={logo.src}
                alt={logo.name}
                width="114"
                height="57"
                decoding="async"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default NhHero;
