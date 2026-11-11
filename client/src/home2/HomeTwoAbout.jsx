import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import { usePageTitle } from "../pages/projectCatalog";

/* Manrope — Figma র font (HomeTwo এর মতোই, একই package) */
import "@fontsource-variable/manrope";
import "./HomeTwo.css";
import "./HomeTwoAbout.css";

import NhHeader from "./NhHeader";
import NhChoose from "./NhChoose";
import NhContactCard from "./NhContactCard";
import NhFooter from "./NhFooter";
import { IMAGES, cloud, srcSet } from "./data";
import { ChevronRight } from "./icons";
import { useReveal } from "./motion";

/* ===============================================================
   About Us — দ্বিতীয় নকশা  /home/about-us  (/ja/home/about-us …)

   Figma র "About Us" frame (1440 px):
     Hero (কালো, রাতের রাস্তার বাতির ছবি, breadcrumb "Home > About Us",
     শিরোনাম, বিবরণ) → Intro (লেখা, সংখ্যা, তিন ছবি) → Why Choose Us → Contact card → (পরের অংশগুলো পরে) → Footer

   ⚠️ এখন Hero + Intro + Why Choose Us + Contact card. বাকি section পরে এই <main> এ NhContactCard এর নিচে বসবে.

   মূল সাইটের /about-us (Coming soon) অক্ষত — এটা তার পাশাপাশি.
   header আর footer Home এর (/home) থেকেই
   =============================================================== */

function AboutHero() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="nab-hero" aria-labelledby="nab-hero-title">
      <div className="nab-hero-media" data-loaded={loaded ? "" : undefined}>
        <img
          src={cloud(IMAGES.aboutHero, 1920)}
          srcSet={srcSet(IMAGES.aboutHero, [960, 1440, 1920, 2560])}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </div>
      <div className="nab-hero-shade nab-hero-shade--top" aria-hidden="true" />
      <div className="nab-hero-shade nab-hero-shade--bottom" aria-hidden="true" />

      <div className="nh-wrap nab-hero-inner">
        <nav
          className="nab-crumb nh-hero-in"
          aria-label={t("home2.aboutPage.breadcrumb")}
          style={{ "--d": 0 }}
        >
          <Link to={localeLink("/home")}>{t("home2.footer.nav.home")}</Link>
          <ChevronRight size={12} />
          <span aria-current="page">{t("nav.aboutUs")}</span>
        </nav>

        <h1 id="nab-hero-title" className="nab-hero-title nh-hero-in" style={{ "--d": 1 }}>
          {t("home2.aboutPage.heroTitle")}
        </h1>
        <p className="nab-hero-text nh-hero-in" style={{ "--d": 2 }}>
          {t("home2.aboutPage.heroText")}
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Intro + তিন ছবি — Figma "Frame 2147237492" (1280 x 1430)
     উপরে: "1 · About Us" ট্যাগ, ডানে বড় লেখা আর তিনটা সংখ্যা
     মাঝে: founder র ছবি (উদ্ধৃতি সহ) + product এর নকশা
     নিচে: দলের ছবি, উপরে দুটো সাদা card
   --------------------------------------------------------------- */
const STATS = ["savings", "warranty", "madeInUsa"];
const CARDS = ["efficiency", "durability"];

function AboutIntro() {
  const { t } = useTranslation();

  return (
    <section className="nab-intro" aria-label={t("nav.aboutUs")}>
      <div className="nh-wrap nab-intro-inner">
        <div className="nab-top">
          <p className="nab-tag" data-reveal="">
            <span className="nab-tag-index" aria-hidden="true">1</span>
            <span className="nab-tag-label">{t("home2.aboutPage.tag")}</span>
          </p>

          <div className="nab-top-body">
            <p className="nab-lead" data-reveal="" style={{ "--d": 1 }}>
              {t("home2.aboutPage.intro")}
            </p>

            <ul className="nab-stats" data-reveal="" style={{ "--d": 2 }}>
              {STATS.map((key) => (
                <li className="nab-stat" key={key}>
                  <span className="nab-stat-value">{t(`home2.aboutPage.stats.${key}.value`)}</span>
                  <span className="nab-stat-label">{t(`home2.aboutPage.stats.${key}.label`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="nab-gallery">
          <div className="nab-pair">
            <figure className="nab-founder" data-reveal="">
              <img
                src={cloud(IMAGES.aboutPortrait, 1200)}
                srcSet={srcSet(IMAGES.aboutPortrait, [600, 900, 1200])}
                sizes="(max-width: 1099px) 100vw, 604px"
                alt={t("home2.aboutPage.alt.founder")}
                loading="lazy"
                decoding="async"
              />
              <div className="nab-founder-shade" aria-hidden="true" />
              <figcaption className="nab-quote">
                <blockquote>{t("home2.aboutPage.quote")}</blockquote>
                <div className="nab-person">
                  <img
                    src={cloud(IMAGES.aboutPortrait, 120)}
                    alt=""
                    width="34"
                    height="34"
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <p className="nab-person-name">{t("home2.aboutPage.founderName")}</p>
                    <p className="nab-person-role">{t("home2.aboutPage.founderRole")}</p>
                  </div>
                </div>
              </figcaption>
            </figure>

            <div className="nab-diagram" data-reveal="" style={{ "--d": 1 }}>
              <img
                src={cloud(IMAGES.aboutDiagram, 936)}
                srcSet={srcSet(IMAGES.aboutDiagram, [468, 936])}
                sizes="(max-width: 1099px) 90vw, 468px"
                alt={t("home2.aboutPage.alt.diagram")}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div className="nab-team" data-reveal="">
            <img
              src={cloud(IMAGES.aboutTeam, 2000)}
              srcSet={srcSet(IMAGES.aboutTeam, [960, 1440, 2000])}
              sizes="(max-width: 1280px) 100vw, 1280px"
              alt={t("home2.aboutPage.alt.team")}
              loading="lazy"
              decoding="async"
            />
            <div className="nab-team-cards">
              {CARDS.map((key) => (
                <div className="nab-card" key={key}>
                  <p className="nab-card-title">{t(`home2.aboutPage.cards.${key}.title`)}</p>
                  <p className="nab-card-value">{t(`home2.aboutPage.cards.${key}.value`)}</p>
                  <p className="nab-card-text">{t(`home2.aboutPage.cards.${key}.text`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeTwoAbout() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  // header কালো হবে কখন — পাতার একদম উপরের অদৃশ্য দাগটা সরলে
  const sentinelRef = useRef(null);

  usePageTitle(t("nav.aboutUs"));

  // footer এর পর্দায়-আসার animation (Home এর মতোই)
  useReveal(rootRef);

  return (
    <div className="nh-page nab-root" ref={rootRef}>
      <div className="nh-sentinel" ref={sentinelRef} aria-hidden="true" />
      <NhHeader
        sentinelRef={sentinelRef}
        productsTo="/home/products"
        projectsTo="/home/projects"
        shopTo="/home/shop"
        applicationTo="/home/application"
        aboutTo="/home/about-us"
        contactTo="/home#contact"
        current="nav.aboutUs"
      />

      <main>
        <AboutHero />
        <AboutIntro />
        {/* Why Choose Us — /home এর একই section, শুধু নম্বর "2" */}
        <NhChoose number="2" />
        {/* Contact card — /home/shop এর card এর মতো নকশা (NhContactCard.jsx) */}
        <NhContactCard />
      </main>

      <NhFooter homePath="/home" />
    </div>
  );
}

export default HomeTwoAbout;