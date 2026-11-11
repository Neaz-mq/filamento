import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLocaleLink } from "../i18n/useLocaleLink";
import logoLight from "../assets/logo/filamento-light.png";
import { CloseIcon, MenuIcon } from "./icons";
import NhProductsMenu from "./NhProductsMenu";

/* ===============================================================
   নতুন Home এর header — Figma "Frame 2147237014"

   পাতার শুরুতে hero র ছবির উপর স্বচ্ছ ভাসে (উপর থেকে 30px).
   নিচে scroll করলে কালো পটভূমি ফুটে ওঠে আর একটু উপরে ওঠে — যাতে
   সাদা section এর উপরেও লেখা পড়া যায়.

   scroll এ কোনো listener নেই: পাতার একদম উপরে একটা অদৃশ্য দাগ
   (sentinel) রাখা, সেটা পর্দা থেকে সরলেই IntersectionObserver
   জানায়. প্রতি scroll এ JavaScript চলে না — তাই lag এর প্রশ্ন নেই
   =============================================================== */

const NAV_LINKS = [
  { key: "nav.home", to: "/home" },
  { key: "nav.products", to: "/products" },
  { key: "nav.projects", to: "/projects" },
  { key: "nav.application", to: "/application" },
  { key: "nav.shop", to: "/shop" },
  { key: "nav.aboutUs", to: "/about-us" },
];

// HomeTwo.css এর breakpoint এর সাথে মিলতে হবে
const DESKTOP = "(min-width: 1100px)";

/* props (সবই ঐচ্ছিক — না দিলে /home আগের মতোই):
     productsTo — "Products" link কোথায় যাবে (/home এ → /home/products)
     projectsTo — "Projects" link কোথায় যাবে. না দিলে productsTo "/home" দিয়ে
                  শুরু হলে /home/projects, নাহলে /projects
     shopTo     — "Shop" link কোথায় যাবে. না দিলে productsTo "/home" দিয়ে
                  শুরু হলে /home/shop, নাহলে /shop
     applicationTo — "Application" link কোথায় যাবে. না দিলে productsTo "/home" দিয়ে
                  শুরু হলে /home/application, নাহলে /application
     aboutTo    — "About Us" link কোথায় যাবে. না দিলে productsTo "/home" দিয়ে
                  শুরু হলে /home/about-us, নাহলে /about-us
     contactTo  — Contact বোতাম অন্য পাতার section এ নিলে (যেমন "/home#contact");
                  না দিলে এই পাতার নিজের #contact
     current    — যে menu টা এই পাতা (nav.products …) — হলুদ হয়ে থাকে */
function NhHeader({
  sentinelRef,
  productsTo = "/products",
  projectsTo = productsTo.startsWith("/home") ? "/home/projects" : "/projects",
  shopTo = productsTo.startsWith("/home") ? "/home/shop" : "/shop",
  applicationTo = productsTo.startsWith("/home") ? "/home/application" : "/application",
  aboutTo = productsTo.startsWith("/home") ? "/home/about-us" : "/about-us",
  contactTo,
  current,
}) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

  const links = NAV_LINKS.map((link) => {
    // /home এর বাইরের পাতায় (productsTo "/home" দিয়ে শুরু না হলে) মূল Home এ
    if (link.key === "nav.home") return { ...link, to: productsTo.startsWith("/home") ? "/home" : "/" };
    if (link.key === "nav.products") return { ...link, to: productsTo };
    if (link.key === "nav.projects") return { ...link, to: projectsTo };
    if (link.key === "nav.shop") return { ...link, to: shopTo };
    if (link.key === "nav.application") return { ...link, to: applicationTo };
    if (link.key === "nav.aboutUs") return { ...link, to: aboutTo };
    return link;
  });

  const renderContact = (onClick) =>
    contactTo ? (
      <Link to={localeLink(contactTo)} className="nh-btn-contact" onClick={onClick}>
        {t("actions.contact")}
      </Link>
    ) : (
      <a href="#contact" className="nh-btn-contact" onClick={onClick}>
        {t("actions.contact")}
      </a>
    );

  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  // Products dropdown খোলা আছে কিনা — খোলা থাকলে Home এর highlight সরে (CSS)
  const [pmOpen, setPmOpen] = useState(false);
  const handlePmOpen = useCallback((value) => setPmOpen(value), []);
  const burgerRef = useRef(null);
  const panelRef = useRef(null);

  // sentinel পর্দার বাইরে → কালো পটভূমি
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(([entry]) =>
      setSolid(!entry.isIntersecting),
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef]);

  // বড় পর্দায় চলে গেলে (ফোন ঘোরালে) মেনু বন্ধ
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const handle = (event) => event.matches && setOpen(false);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  // খোলা থাকলে: পেছনের পাতা scroll হয় না, Esc এ বন্ধ, focus প্রথম link এ
  useEffect(() => {
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("a[href]")?.focus();

    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      burgerRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* মেনুর প্রতিটা link চাপলে নিজেই বন্ধ করে — অন্য পাতায় গেলে তো এই
     পুরো পাতাটাই সরে যায়, তাই আলাদা করে পাতা বদল দেখার দরকার নেই */
  const close = () => setOpen(false);

  const className = [
    "nh-header",
    solid && "is-solid",
    open && "is-open",
    pmOpen && "is-pm-open",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={className}>
      <div className="nh-header-inner">
        <Link
          to={localeLink("/home")}
          className="nh-logo"
          aria-label={t("a11y.home")}
          onClick={close}
        >
          <img src={logoLight} alt="Filamento" width="170" height="31" />
        </Link>

        <nav className="nh-nav" aria-label={t("a11y.mainNav")}>
          {links.map((link) =>
            link.key === "nav.products" ? (
              // Products — hover করলে dropdown (NhProductsMenu.jsx)
              <NhProductsMenu
                key={link.key}
                productsTo={productsTo}
                current={current}
                onOpenChange={handlePmOpen}
              />
            ) : (
              <Link
                key={link.key}
                to={localeLink(link.to)}
                className={`nh-nav-link${link.key === "nav.home" ? " nh-nav-link--home" : ""}`}
                aria-current={current === link.key ? "page" : undefined}
              >
                {t(link.key)}
              </Link>
            ),
          )}
        </nav>

        <div className="nh-header-actions">
          {/* contactTo না থাকলে এই পাতার নিজের Contact অংশে */}
          {renderContact()}

          <div className="nh-lang">
            <LanguageSwitcher />
          </div>

          <button
            type="button"
            ref={burgerRef}
            className="nh-burger"
            aria-expanded={open}
            aria-controls="nh-menu"
            aria-label={t(open ? "a11y.closeMenu" : "a11y.openMenu")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* ছোট পর্দার মেনু — সবসময় DOM এ, বন্ধ অবস্থায় inert (Tab এ
          থামে না, screen reader পড়ে না), তাই বন্ধ হওয়ার animation টাও চলে */}
      <div
        id="nh-menu"
        ref={panelRef}
        className="nh-menu"
        inert={!open}
      >
        <nav className="nh-menu-links" aria-label={t("a11y.mainNav")}>
          {links.map((link, index) => (
            <Link
              key={link.key}
              to={localeLink(link.to)}
              onClick={close}
              style={{ "--i": index }}
              aria-current={current === link.key ? "page" : undefined}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="nh-menu-foot">
          {renderContact(close)}
          <LanguageSwitcher variant="inline" onSelect={close} />
        </div>
      </div>
    </header>
  );
}

export default NhHeader;