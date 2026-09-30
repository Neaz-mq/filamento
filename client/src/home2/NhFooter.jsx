import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useLocaleLink } from "../i18n/useLocaleLink";
import { SOCIAL } from "./data";
import { ArrowRight, SOCIAL_ICONS } from "./icons";

/* ===============================================================
   Footer — Figma "Frame 2147228433" (কালো, 150px হলুদ "Filamento")

   উপরে বিশাল নাম আর social, মাঝে চারটা কলাম (About, Navigation,
   Services, Newsletter), নিচে রেখা আর copyright.

   পর্দায় এলে "Filamento" র অক্ষরগুলো একটা একটা করে নিচ থেকে ওঠে
   (HomeTwo.css এ nh-foot-word). ডান-উপরের হলুদ আভা Figma তে
   blur(207px) — এখানে radial-gradient, একই দেখায় কিন্তু scroll এ
   ভার পড়ে না.

   ⚠️ "Services" কলামের তিনটা লেখা (Adapta Bilpay, API Payouts,
   Documentations) Figma র template এর placeholder — Filamento র
   কোনো সেবা নয়. designer আসল লেখা দিলে en/ja/zh-Hant.json এর
   home2.footer.services বদলাবেন. তাই এগুলো link নয়, শুধু লেখা.

   Newsletter জমা হয় server এর /api/newsletter এ
   =============================================================== */

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WORD = "Filamento";

function Newsletter() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | invalid | error

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === "sending") return;

    const value = email.trim();
    if (!EMAIL_SHAPE.test(value)) {
      setStatus("invalid");
      return;
    }

    setStatus("sending");
    try {
      await api.subscribeNewsletter(value, i18n.resolvedLanguage);
      setEmail("");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const message = {
    done: t("home2.footer.subscribed"),
    invalid: t("contact.errors.email"),
    error: t("home2.footer.subscribeError"),
  }[status];

  return (
    <form className="nh-news" onSubmit={handleSubmit} noValidate>
      <div className="nh-news-row">
        <label className="nh-news-field">
          <span className="sr-only">{t("home2.footer.emailLabel")}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== "sending") setStatus("idle");
            }}
            placeholder={t("home2.footer.emailPlaceholder")}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck="false"
            maxLength={200}
            aria-invalid={status === "invalid" ? "true" : undefined}
          />
        </label>
        <button
          type="submit"
          className="nh-news-go"
          disabled={status === "sending"}
          aria-label={t("home2.footer.subscribe")}
        >
          <ArrowRight size={20} />
        </button>
      </div>
      <p className="nh-news-status" data-status={status} role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}

function NhFooter() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const year = new Date().getFullYear();

  return (
    <footer className="nh-footer">
      <div className="nh-footer-glow" aria-hidden="true" />

      <div className="nh-wrap nh-footer-inner">
        <div className="nh-footer-top">
          {/* অক্ষর আলাদা span এ — animation এর জন্য. screen reader
              যাতে "F i l a…" না পড়ে, পুরো শব্দটা aria-label এ */}
          <p className="nh-foot-word" data-reveal="" aria-label={WORD}>
            {[...WORD].map((letter, index) => (
              <span key={index} aria-hidden="true" style={{ "--i": index }}>
                {letter}
              </span>
            ))}
          </p>

          <ul className="nh-social" aria-label={t("footer.columns.social")}>
            {SOCIAL.map((item) => {
              const Icon = SOCIAL_ICONS[item.id];
              return (
                <li key={item.id}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="nh-social-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${item.name} ${t("footer.newTab")}`}
                    >
                      <Icon />
                    </a>
                  ) : (
                    /* link এখনো নেই — দেখায়, কিন্তু চাপা যায় না */
                    <span className="nh-social-btn is-pending" title={item.name}>
                      <Icon />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="nh-footer-cols">
          <div className="nh-footer-col nh-footer-col--about" data-reveal="" style={{ "--d": 1 }}>
            <h2 className="nh-footer-title">{t("home2.footer.aboutTitle")}</h2>
            <p className="nh-footer-text">{t("home2.footer.aboutText")}</p>
          </div>

          <div className="nh-footer-col" data-reveal="" style={{ "--d": 2 }}>
            <h2 className="nh-footer-title">{t("home2.footer.navTitle")}</h2>
            <ul className="nh-footer-list">
              <li>
                <Link to={localeLink("/home")}>{t("home2.footer.nav.home")}</Link>
              </li>
              <li>
                <a href="#about">{t("home2.footer.nav.about")}</a>
              </li>
              <li>
                <a href="#contact">{t("home2.footer.nav.contact")}</a>
              </li>
            </ul>
          </div>

          <div className="nh-footer-col" data-reveal="" style={{ "--d": 3 }}>
            <h2 className="nh-footer-title">{t("home2.footer.servicesTitle")}</h2>
            <ul className="nh-footer-list">
              {["one", "two", "three"].map((key) => (
                <li key={key}>
                  <span>{t(`home2.footer.services.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="nh-footer-col nh-footer-col--news" data-reveal="" style={{ "--d": 4 }}>
            <h2 className="nh-footer-title">{t("home2.footer.newsletterTitle")}</h2>
            <Newsletter />
          </div>
        </div>

        <div className="nh-footer-bottom">
          <p>{t("footer.copyright", { year })}</p>
          <Link to={localeLink("/privacy-policy")}>{t("footer.privacy")}</Link>
        </div>
      </div>
    </footer>
  );
}

export default NhFooter;
