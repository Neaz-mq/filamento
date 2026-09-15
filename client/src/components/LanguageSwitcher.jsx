import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, localePath, persistLanguage, stripLocale } from "../i18n";
import "./LanguageSwitcher.css";

function GlobeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse
        cx="8"
        cy="8"
        rx="2.7"
        ry="6.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="1.5"
        y1="8"
        x2="14.5"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="8"
      height="4"
      viewBox="0 0 8 4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1 1L4 3L7 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// একই পাতা, অন্য ভাষায় — /ja/products থেকে /zh-Hant/products
function hrefFor(code) {
  return localePath(code, stripLocale(window.location.pathname));
}

/* React Router এর navigate() নয়, আসল page load.

   কারণ Chrome এর translate prompt টা document load এর সময় একবারই
   ভাষা detect করে। SPA navigation এ কোনো load হয় না, তাই Chrome
   টেরই পায় না যে পাতাটা এখন জাপানি। ভাষা বদলানো দিনে একবারের কাজ,
   তাই এখানে reload এর খরচটা সমস্যা নয় */
function goToLanguage(event, code) {
  event.preventDefault();
  persistLanguage(code);
  window.location.assign(hrefFor(code));
}

/* ---------------------------------------------------------------
   inline — মোবাইল panel এর জন্য. তিনটা option পাশাপাশি, dropdown নয়:
   একটা খোলা menu এর ভেতরে আরেকটা menu খোলা অস্বস্তিকর
   --------------------------------------------------------------- */
function InlineSwitcher({ current, onSelect }) {
  const { t } = useTranslation();

  return (
    <div className="lang-inline">
      <span className="lang-inline-label">
        <GlobeIcon />
        {t("a11y.changeLanguage")}
      </span>

      <div className="lang-inline-options" role="group">
        {LANGUAGES.map((language) => {
          const isActive = language.code === current.code;

          return (
            <a
              key={language.code}
              href={hrefFor(language.code)}
              hrefLang={language.htmlLang}
              aria-current={isActive ? "true" : undefined}
              className={`lang-inline-option${isActive ? " is-active" : ""}`}
              onClick={(event) => {
                onSelect?.();
                goToLanguage(event, language.code);
              }}
            >
              {language.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   dropdown — desktop navbar এর pill
   --------------------------------------------------------------- */
function DropdownSwitcher({ current, currentIndex }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const itemRefs = useRef([]);

  const closeAndFocusButton = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;

    // pointerdown, তাই touch device এও কাজ করে
    const handlePointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeAndFocusButton();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[currentIndex]?.focus();
  }, [open, currentIndex]);

  const handleListKeyDown = (event, index) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      // % দিয়ে wrap — শেষ থেকে নিচে গেলে শুরুতে ফিরে আসে
      const next = (index + step + LANGUAGES.length) % LANGUAGES.length;
      itemRefs.current[next]?.focus();
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      itemRefs.current[event.key === "Home" ? 0 : LANGUAGES.length - 1]?.focus();
    }

    if (event.key === "Tab") setOpen(false);
  };

  return (
    <div className="lang" ref={wrapRef}>
      <button
        type="button"
        ref={buttonRef}
        className="lang-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("a11y.changeLanguage")}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <GlobeIcon />
        <span className="lang-button-text">{current.short}</span>
        <span className={`lang-chevron${open ? " lang-chevron--open" : ""}`}>
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <ul
          className="lang-menu"
          role="listbox"
          aria-label={t("a11y.changeLanguage")}
        >
          {LANGUAGES.map((language, index) => {
            const isActive = language.code === current.code;

            return (
              <li key={language.code} role="none">
                {/* <a> রাখছি button নয় — middle-click বা Ctrl+click এ
                    নতুন ট্যাবে খোলা যায়, আর ক্রলার লিংকটা দেখতে পায় */}
                <a
                  href={hrefFor(language.code)}
                  hrefLang={language.htmlLang}
                  role="option"
                  aria-selected={isActive}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  className={`lang-option${isActive ? " lang-option--active" : ""}`}
                  onClick={(event) => goToLanguage(event, language.code)}
                  onKeyDown={(event) => handleListKeyDown(event, index)}
                >
                  {/* ভাষার নাম সবসময় তার নিজের ভাষায় — একজন জাপানি
                      ব্যবহারকারী "Japanese" নয়, 日本語 খুঁজবেন */}
                  {language.label}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LanguageSwitcher({ variant = "dropdown", onSelect }) {
  const { i18n } = useTranslation();

  const current =
    LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? LANGUAGES[0];

  if (variant === "inline") {
    return <InlineSwitcher current={current} onSelect={onSelect} />;
  }

  return (
    <DropdownSwitcher current={current} currentIndex={LANGUAGES.indexOf(current)} />
  );
}

export default LanguageSwitcher;
