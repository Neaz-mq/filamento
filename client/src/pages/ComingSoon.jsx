import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import "./ComingSoon.css";

/* ===============================================================
   যে পাতা এখনো বানানো হয়নি (Products, Projects …), ভুল ঠিকানা (404),
   আর অপ্রত্যাশিত সমস্যা — তিনটার জন্যই একটা পাতা, তিন রূপে:

     variant="soon"     লাইট জ্বলছে, ধীরে দুলছে — "আসছে"
     variant="notFound" লাইট নিভে আছে — "অন্ধকারে হারিয়ে গেছেন"
     variant="error"    লাইট নিভে আছে — "কিছু একটা ভুল হয়েছে"

   নকশা Hero এর ধারায়: ধূসর card, ছোট pill, বড় শিরোনামে একটা হলুদ
   শব্দ, হলুদ বোতাম, আর ডানে Filamento র লাইট আলোর শঙ্কু সহ.
   App.jsx থেকে কোন পাতায় কোন রূপ, সেটা ঠিক হয়
   =============================================================== */

// Filamento র RH1 লাইট (e_trim — চারপাশের ফাঁকা অংশ কাটা)
const LAMP_SRC =
  "https://res.cloudinary.com/dzi3u164c/image/upload/e_trim/c_limit,w_900,f_auto,q_auto:best/v1789471643/fix3_yeppeq.webp";

const EMAIL = "Sales@Filamento.com";
const PHONE_DISPLAY = "+1 (408) 475 - 0038";
const PHONE_LINK = "+14084750038";

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2.5 8h11M9.5 4l4 4-4 4" />
    </svg>
  );
}

/* ---------------------------------------------------------------
   ট্যাবের শিরোনাম আর "noindex"

   অসম্পূর্ণ পাতা Google এ index হলে খোঁজে ফাঁকা পাতা আসত — তাই
   এই পাতায় থাকা পর্যন্ত robots noindex, বেরোলে আগের অবস্থায় ফেরত
   --------------------------------------------------------------- */
function usePageMeta(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | Filamento`;

    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;
      robots.remove();
    };
  }, [title]);
}

function ComingSoon({ variant = "soon", titleKey }) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

  const isSoon = variant === "soon";
  const pageName = titleKey ? t(titleKey) : "";

  /* প্রতিটা রূপের লেখা — শিরোনামের হলুদ শব্দটা "soon" এ পাতার নাম
     (যেমন "Products"), বাকি দুইটায় নিজস্ব শব্দ */
  const copy = isSoon
    ? {
        eyebrow: t("comingSoon.eyebrow"),
        accent: pageName,
        rest: t("comingSoon.titleRest"),
        text: t("comingSoon.text"),
        status: t("comingSoon.status"),
        docTitle: t("comingSoon.docTitle", { page: pageName }),
      }
    : {
        eyebrow: t(`comingSoon.${variant}.eyebrow`),
        accent: t(`comingSoon.${variant}.titleAccent`),
        rest: t(`comingSoon.${variant}.titleRest`),
        text: t(`comingSoon.${variant}.text`),
        status: t(`comingSoon.${variant}.status`),
        docTitle: t(`comingSoon.${variant}.docTitle`),
      };

  usePageMeta(copy.docTitle);

  return (
    <section
      className="coming-soon"
      data-variant={variant}
      aria-labelledby="coming-soon-title"
    >
      {/* পেছনের বড় ফিকে লেখা — Fixtures এর "FIXTURES" এর মতো */}
      <span className="coming-soon-watermark" aria-hidden="true">
        {isSoon ? "SOON" : variant === "notFound" ? "404" : "OOPS"}
      </span>

      <div className="coming-soon-inner">
        <div className="coming-soon-copy">
          <p className="coming-soon-eyebrow">
            <span className="coming-soon-eyebrow-dot" aria-hidden="true" />
            {copy.eyebrow}
          </p>

          <h1 id="coming-soon-title" className="coming-soon-title">
            {/* ফাঁকা জায়গা লেখার ভেতরেই (ইংরেজিতে " in the dark.") —
                জাপানি/চীনায় শব্দের মাঝে ফাঁক থাকে না, তাই এখানে বসানো
                যায় না. "soon" এ পাতার নাম আলাদা লাইনে (CSS) */}
            <span className="coming-soon-title-accent">{copy.accent}</span>
            {copy.rest}
          </h1>

          <p className="coming-soon-text">{copy.text}</p>

          <div className="coming-soon-actions">
            <Link to={localeLink("/")} className="coming-soon-btn is-primary">
              {t("comingSoon.home")}
              <ArrowIcon />
            </Link>

            {variant === "error" ? (
              /* সমস্যা হলে পাতা নতুন করে লোড করাই সবচেয়ে কাজের */
              <button
                type="button"
                className="coming-soon-btn is-secondary"
                onClick={() => window.location.reload()}
              >
                {t("comingSoon.error.refresh")}
              </button>
            ) : (
              /* /contact → Home এর Contact section এ নিয়ে যায় (App.jsx) */
              <Link
                to={localeLink("/contact")}
                className="coming-soon-btn is-secondary"
              >
                {t("comingSoon.talk")}
              </Link>
            )}
          </div>

          <p className="coming-soon-reach">
            <span>{t("comingSoon.reach")}</span>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <span className="coming-soon-reach-sep" aria-hidden="true">
              ·
            </span>
            <a href={`tel:${PHONE_LINK}`}>{PHONE_DISPLAY}</a>
          </p>
        </div>

        {/* ডানের ছবি — পুরোটাই সাজসজ্জা, screen reader এড়িয়ে যায়,
            শুধু অবস্থার লেখাটা (status) পড়ে */}
        <div className="coming-soon-visual">
          <div className="coming-soon-pendant" aria-hidden="true">
            <span className="coming-soon-cable" />
            <img
              className="coming-soon-lamp"
              src={LAMP_SRC}
              alt=""
              width="900"
              height="620"
              decoding="async"
            />
            <span className="coming-soon-cone" />
          </div>
          <span className="coming-soon-floor" aria-hidden="true" />

          <div className="coming-soon-status" role="status">
            <span className="coming-soon-status-dot" aria-hidden="true" />
            <span className="coming-soon-status-text">{copy.status}</span>
            {isSoon && (
              <span className="coming-soon-status-bar" aria-hidden="true">
                <span />
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ComingSoon;