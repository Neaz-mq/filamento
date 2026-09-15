import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import filamentoLogo from "../assets/logo/filamento.png";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLocaleLink } from "../i18n/useLocaleLink";
import "./Navbar.css";

/* label নয়, translation key — ভাষা বদলালে এই array অপরিবর্তিত
   থাকে, শুধু t() আলাদা লেখা ফেরত দেয় */
const NAV_LINKS = [
  { key: "nav.products", to: "/products" },
  { key: "nav.projects", to: "/projects" },
  { key: "nav.application", to: "/application" },
  { key: "nav.company", to: "/company" },
  { key: "nav.shop", to: "/shop" },
];

// CSS এর breakpoint এর সাথে হুবহু মিলতে হবে
const DESKTOP_QUERY = "(min-width: 1100px)";

function MenuIcon({ open }) {
  return (
    <span className={`navbar-burger-icon${open ? " is-open" : ""}`}>
      <span />
      <span />
    </span>
  );
}

function Navbar() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const burgerRef = useRef(null);

  const close = () => setOpen(false);

  // পাতা বদলালে menu বন্ধ — নাহলে নতুন পাতার উপর খোলা থেকে যেত
  useEffect(close, [pathname]);

  /* মোবাইলে খোলা অবস্থায় ফোন ঘুরিয়ে landscape এ গেলে desktop layout
     চলে আসে, কিন্তু panel টা খোলা থেকে যেত — তাই বন্ধ করে দিচ্ছি */
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handle = (event) => {
      if (event.matches) close();
    };
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  // খোলা অবস্থায় পেছনের পাতা scroll করা বন্ধ
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* Escape এ বন্ধ, আর Tab টা panel এর ভেতরেই ঘোরে।

     trap টা জরুরি — না থাকলে Tab চাপতে চাপতে focus panel এর পেছনের
     লুকানো content এ চলে যেত, keyboard বা screen reader ব্যবহারকারী
     বুঝতেই পারতেন না focus কোথায় গেল */
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        close();
        burgerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled])',
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // খোলার পর focus প্রথম লিংকে
  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector("a[href]")?.focus();
    }
  }, [open]);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link
          to={localeLink("/")}
          className="navbar-logo"
          aria-label={t("a11y.home")}
        >
          <img src={filamentoLogo} alt="Filamento" />
        </Link>

        <nav className="navbar-links" aria-label={t("a11y.mainNav")}>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={localeLink(link.to)}>
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="navbar-actions">
          <Link to={localeLink("/contact")} className="navbar-cta">
            {t("actions.contact")}
          </Link>

          <LanguageSwitcher />

          <button
            type="button"
            ref={burgerRef}
            className="navbar-burger"
            aria-expanded={open}
            aria-controls="navbar-panel"
            aria-label={t(open ? "a11y.closeMenu" : "a11y.openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {/* panel টা সবসময় DOM এ থাকে, hidden দিয়ে লুকানো — এতে
          বন্ধ হওয়ার animation টাও চলতে পারে, আর aria-controls
          একটা বাস্তব element কে নির্দেশ করে */}
      <div
        id="navbar-panel"
        ref={panelRef}
        className={`navbar-panel${open ? " is-open" : ""}`}
        hidden={!open}
      >
        <nav className="navbar-panel-links" aria-label={t("a11y.mainNav")}>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={localeLink(link.to)} onClick={close}>
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="navbar-panel-footer">
          <Link
            to={localeLink("/contact")}
            className="navbar-panel-cta"
            onClick={close}
          >
            {t("actions.contact")}
          </Link>

          {/* panel এর ভেতরে dropdown নয়, পাশাপাশি বসানো তিনটা option —
              ছোট পর্দায় menu এর ভেতরে আরেকটা menu খোলা অস্বস্তিকর */}
          <LanguageSwitcher variant="inline" onSelect={close} />
        </div>
      </div>

      {open && (
        <button
          type="button"
          className="navbar-scrim"
          tabIndex={-1}
          aria-hidden="true"
          onClick={close}
        />
      )}
    </header>
  );
}

export default Navbar;
