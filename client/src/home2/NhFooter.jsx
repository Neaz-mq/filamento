import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useLocaleLink } from "../i18n/useLocaleLink";
import SoftLink from "../components/SoftLink";
import { SOCIAL } from "./data";
import { ArrowRight, SOCIAL_ICONS } from "./icons";

/* ===============================================================
   Footer — Figma "Frame 2147228433" (কালো, 150px হলুদ "Filamento")

   উপরে বিশাল নাম আর social, মাঝে চারটা কলাম (About, Navigation,
   Services, Newsletter), নিচে রেখা আর copyright.

   পর্দায় এলে "Filamento" র অক্ষরগুলো একটা একটা করে নিচ থেকে ওঠে
   (HomeTwo.css এ nh-foot-word). ডান-উপরের হলুদ আভা আলাদা element
   নয় — .nh-footer-inner::before (HomeTwo.css), Figma র মতো social
   এর উপরে আঁকা.

   Navigation আর Services এর link গুলো নিচের NAV_LINKS / SERVICE_LINKS
   থেকে আসে — নতুন link যোগ/বাদ দিতে শুধু ওখানে বদলাবেন.
     to   — পাতার route (ভাষার prefix নিজে বসে)
     hash — এই পাতার ভেতরের section (#about, #contact)
     label — locale এর key

   Newsletter জমা হয় server এর /api/newsletter এ
   =============================================================== */

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WORD = "Filamento";

/* Navigation — সাইটের মূল পাতাগুলো */
const NAV_LINKS = [
  { label: "home2.footer.nav.home", to: "/home" },
  { label: "home2.footer.nav.about", hash: "#about" },
  // soft — এখন "#" (কোথাও যায় না). আসল পাতায় নিতে soft: true মুছে দিন
  { label: "nav.products", to: "/products", soft: true },
  { label: "nav.projects", to: "/projects", soft: true },
  { label: "home2.footer.nav.contact", hash: "#contact" },
];

/* Services — Filamento যা দেয়: বিনা খরচে lighting layout, কোথা থেকে
   কিনবেন, আর কেনার আগে-পরের নথি (spec sheet, IES, installation) */
const SERVICE_LINKS = [
  { label: "home2.footer.services.layout", hash: "#contact" },
  { label: "footer.links.findRep", to: "/find-a-representative" },
  { label: "footer.links.specSheets", to: "/spec-sheets" },
  { label: "footer.links.iesFiles", to: "/ies-files" },
  { label: "footer.links.installationGuides", to: "/installation-guides" },
];

/* একটা footer link — soft হলে "#" (SoftLink), to থাকলে route, নাহলে
   এই পাতার section (hash) */
function FooterLink({ link }) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

  if (link.soft) {
    return <SoftLink to={localeLink(link.to)}>{t(link.label)}</SoftLink>;
  }
  if (link.to) {
    return <Link to={localeLink(link.to)}>{t(link.label)}</Link>;
  }
  return <a href={link.hash}>{t(link.label)}</a>;
}

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

          <div className="nh-footer-col nh-footer-col--nav" data-reveal="" style={{ "--d": 2 }}>
            <h2 className="nh-footer-title">{t("home2.footer.navTitle")}</h2>
            <ul className="nh-footer-list">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div className="nh-footer-col nh-footer-col--services" data-reveal="" style={{ "--d": 3 }}>
            <h2 className="nh-footer-title">{t("home2.footer.servicesTitle")}</h2>
            <ul className="nh-footer-list">
              {SERVICE_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} />
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