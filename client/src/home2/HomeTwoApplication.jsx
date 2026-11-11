import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import { usePageTitle } from "../pages/projectCatalog";

/* Manrope — Figma র font (HomeTwo এর মতোই, একই package) */
import "@fontsource-variable/manrope";
import "./HomeTwo.css";
import "./HomeTwoApplication.css";

import NhHeader from "./NhHeader";
import ApplicationList from "./HomeTwoApplicationList";
import NhLayoutCta from "./NhLayoutCta";
import NhFooter from "./NhFooter";
import { IMAGES, cloud, srcSet } from "./data";
import { ChevronRight } from "./icons";
import { useReveal } from "./motion";

/* ===============================================================
   Application — দ্বিতীয় নকশা  /home/application  (/ja/home/application …)

   Figma র "Application" frame (1440 px):
     Hero (কালো, McKenna BMW শোরুমের ছবি, breadcrumb "Home > Application",
     শিরোনাম, বিবরণ) → Application এর তালিকা (খোঁজা, chip, card; static) → "Get A Lighting Layout…" CTA (Home এর NhLayoutCta, একই component) → Footer

   ⚠️ এখন Hero + তালিকা + CTA. আরও section এলে এই <main> এ CTA এর আগে বসবে.

   মূল সাইটের /application (Coming soon) অক্ষত — এটা তার পাশাপাশি.
   header আর footer Home এর (/home) থেকেই
   =============================================================== */

function ApplicationHero() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="nap-hero" aria-labelledby="nap-hero-title">
      <div className="nap-hero-media" data-loaded={loaded ? "" : undefined}>
        <img
          src={cloud(IMAGES.applicationHero, 1920)}
          srcSet={srcSet(IMAGES.applicationHero, [960, 1440, 1920, 2560])}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </div>
      <div className="nap-hero-shade nap-hero-shade--top" aria-hidden="true" />
      <div className="nap-hero-shade nap-hero-shade--bottom" aria-hidden="true" />

      <div className="nh-wrap nap-hero-inner">
        <nav
          className="nap-crumb nh-hero-in"
          aria-label={t("home2.applicationPage.breadcrumb")}
          style={{ "--d": 0 }}
        >
          <Link to={localeLink("/home")}>{t("home2.footer.nav.home")}</Link>
          <ChevronRight size={12} />
          <span aria-current="page">{t("nav.application")}</span>
        </nav>

        <h1 id="nap-hero-title" className="nap-hero-title nh-hero-in" style={{ "--d": 1 }}>
          {t("home2.applicationPage.heroTitle")}
        </h1>
        <p className="nap-hero-text nh-hero-in" style={{ "--d": 2 }}>
          {t("home2.applicationPage.heroText")}
        </p>
      </div>
    </section>
  );
}

function HomeTwoApplication() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  // header কালো হবে কখন — পাতার একদম উপরের অদৃশ্য দাগটা সরলে
  const sentinelRef = useRef(null);

  usePageTitle(t("nav.application"));

  // footer এর পর্দায়-আসার animation (Home এর মতোই)
  useReveal(rootRef);

  return (
    <div className="nh-page nap-root" ref={rootRef}>
      <div className="nh-sentinel" ref={sentinelRef} aria-hidden="true" />
      <NhHeader
        sentinelRef={sentinelRef}
        productsTo="/home/products"
        projectsTo="/home/projects"
        shopTo="/home/shop"
        applicationTo="/home/application"
        aboutTo="/home/about-us"
        contactTo="/home#contact"
        current="nav.application"
      />

      <main>
        <ApplicationHero />
        <ApplicationList />
        <NhLayoutCta contactTo="/home#contact" />
      </main>

      <NhFooter homePath="/home" />
    </div>
  );
}

export default HomeTwoApplication;