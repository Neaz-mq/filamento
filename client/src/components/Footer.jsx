import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import "./Footer.css";

/* Figma "Frame 506" — গাঢ় footer card: বাঁয়ে লোগো আর এক লাইনের
   পরিচয়, ডানে পাঁচ কলামের link, নিচে রেখা, copyright আর
   Privacy Policy.

   সব পাতায় থাকে — MainLayout এ বসানো */

/* মূল filamento.com এর light লোগো.
   ⚠️ অন্য সাইট থেকে সরাসরি আনা — পরে Cloudinary তে তুলে link টা
   এখানে বদলে দিলে ভালো (দ্রুত, আর ওই সাইট বদলালেও ভাঙবে না) */
const LOGO_SRC =
  "https://www.filamento.com/wp-content/plugins/Tot/images/filamento-logo-light.png";

/* ---------------------------------------------------------------
   link এর কলাম — Figma র ক্রমে.
   label → locale এর footer.links.<key>
   to    → নতুন সাইটের পাতা (এখনো বানানো হয়নি; Navbar এর মতোই
           পথ ধরে রাখা, পাতা তৈরি হলে নিজে থেকেই কাজ করবে)
   --------------------------------------------------------------- */
const COLUMNS = [
  {
    key: "products",
    links: [
      { key: "allProducts", to: "/products" },
      { key: "lampFixture", to: "/products?category=lamp-fixture" },
      { key: "luminaireConfigurator", to: "/products?category=luminaire-configurator" },
      { key: "reflector", to: "/products?category=reflector" },
      { key: "controlCap", to: "/products?category=control-cap" },
      { key: "lampAccessory", to: "/products?category=lamp-accessory" },
      { key: "reflectorAccessory", to: "/products?category=reflector-accessory" },
      { key: "other", to: "/products?category=other" },
    ],
  },
  {
    key: "projects",
    links: [
      { key: "gymnasium", to: "/projects?category=gymnasium" },
      { key: "manufacturing", to: "/projects?category=manufacturing" },
      // ⚠️ Figma তে Projects এর নিচেও আছে (Company তেও) — designer কে জিজ্ঞেস করতে হবে
      { key: "findRep", to: "/find-a-representative" },
      { key: "warehouse", to: "/projects?category=warehouse" },
      { key: "conferenceCenter", to: "/projects?category=conference-center" },
      { key: "automotiveDealership", to: "/projects?category=automotive-dealership" },
      { key: "retail", to: "/projects?category=retail" },
      { key: "streetLights", to: "/projects?category=street-lights" },
    ],
  },
  {
    key: "company",
    links: [
      { key: "aboutUs", to: "/about-us" },
      { key: "applications", to: "/application" },
      { key: "findRep", to: "/find-a-representative" },
      // Navbar এর "Contact" বোতামও এই পথেই যায়
      { key: "contactUs", to: "/contact" },
    ],
  },
  {
    key: "resources",
    links: [
      { key: "videos", to: "/videos" },
      { key: "specSheets", to: "/spec-sheets" },
      { key: "iesFiles", to: "/ies-files" },
      { key: "installationGuides", to: "/installation-guides" },
    ],
  },
];

/* social — নাম brand এর, অনুবাদ হয় না.
   LinkedIn আর Facebook মূল filamento.com থেকে নেওয়া.
   ⚠️ Instagram আর X এর link মূল সাইটে নেই — ক্লায়েন্টের কাছ থেকে
   পেলে href বসিয়ে দিন. ততক্ষণ নাম বাকিগুলোর মতোই দেখায় (Figma),
   কিন্তু চাপা যায় না — ভুল ঠিকানায় পাঠানোর চেয়ে ভালো */
const SOCIAL = [
  { name: "Facebook", href: "https://www.facebook.com/FilamentoLED/" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/filamento.lighting/" },
  { name: "Instagram", href: null },
  { name: "X", href: null },
];

function FooterColumn({ id, title, children }) {
  return (
    <div className="footer-col">
      <h2 id={id} className="footer-col-title">
        {title}
      </h2>
      <ul className="footer-list" aria-labelledby={id}>
        {children}
      </ul>
    </div>
  );
}

function Footer() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

  // বছর নিজে থেকে বদলায় — প্রতি জানুয়ারিতে হাতে বদলাতে হবে না
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Figma: Frame 184 — লোগো + link */}
        <div className="footer-top">
          <div className="footer-brand">
            <Link
              to={localeLink("/")}
              className="footer-logo"
              aria-label={t("a11y.home")}
            >
              <img
                src={LOGO_SRC}
                alt=""
                width="252"
                height="46"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className="footer-tagline">{t("footer.tagline")}</p>
          </div>

          <nav className="footer-nav" aria-label={t("footer.navLabel")}>
            {COLUMNS.map((column) => (
              <FooterColumn
                key={column.key}
                id={`footer-col-${column.key}`}
                title={t(`footer.columns.${column.key}`)}
              >
                {column.links.map((link) => (
                  <li key={`${column.key}-${link.key}`}>
                    <Link to={localeLink(link.to)} className="footer-link">
                      {t(`footer.links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </FooterColumn>
            ))}

            <FooterColumn
              id="footer-col-social"
              title={t("footer.columns.social")}
            >
              {SOCIAL.map((item) => (
                <li key={item.name}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="footer-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.name}
                      <span className="sr-only"> {t("footer.newTab")}</span>
                    </a>
                  ) : (
                    <span className="footer-link is-pending">{item.name}</span>
                  )}
                </li>
              ))}
            </FooterColumn>
          </nav>
        </div>

        {/* Figma: Frame 357 — রেখা, তার নিচে copyright আর Privacy */}
        <div className="footer-bottom">
          <p className="footer-copy">{t("footer.copyright", { year })}</p>
          <Link
            to={localeLink("/privacy-policy")}
            className="footer-copy footer-privacy"
          >
            {t("footer.privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;