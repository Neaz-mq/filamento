import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import { FILAMENTO, mapHref } from "../pages/representatives";
import { IMAGES, cloud, srcSet } from "./data";
import "./NhContactCard.css";

/* ===============================================================
   Contact card — Figma "Frame 2147228032" (1280 x 345, radius 30)
   "Still deciding who to contact?"

   রাতের বাতির ছবির উপর: বাঁয়ে tag, শিরোনাম, বিবরণ, "Email sales" আর
   "Build My Custom Layout"; ডানে সাদা card এ যোগাযোগের তিনটা তথ্য.

   তথ্য /home/shop এর মতোই representatives.js এর FILAMENTO থেকে, লেখা
   findRep.contact.* থেকে — তাই বদলালে দুই পাতাতেই বদলায়.
   "Build My Custom Layout" যায় Home এর Contact form এ (/home#contact)
   =============================================================== */

function Icon({ size = 16, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const SmsIcon = (props) => (
  <Icon {...props}>
    <path d="M17 20.5H7c-3 0-5-1.5-5-5v-7c0-3.5 2-5 5-5h10c3 0 5 1.5 5 5v7c0 3.5-2 5-5 5Z" />
    <path d="m17 9-3.13 2.5c-1.03.82-2.72.82-3.75 0L7 9" />
  </Icon>
);

const CallIcon = (props) => (
  <Icon {...props}>
    <path d="M21.97 18.33c0 .36-.08.73-.25 1.09-.17.36-.39.7-.68 1.02-.49.54-1.03.93-1.64 1.18-.6.25-1.25.38-1.95.38-1.02 0-2.11-.24-3.26-.73s-2.3-1.15-3.44-1.98a28.75 28.75 0 0 1-3.28-2.8 28.42 28.42 0 0 1-2.79-3.27c-.82-1.14-1.48-2.28-1.96-3.41C2.24 8.67 2 7.58 2 6.54c0-.68.12-1.33.36-1.93.24-.61.62-1.17 1.15-1.67C4.15 2.31 4.85 2 5.59 2c.28 0 .56.06.81.18.26.12.49.3.67.56l2.32 3.27c.18.25.31.48.4.7.09.21.14.42.14.61 0 .24-.07.48-.21.71-.13.23-.32.47-.56.71l-.76.79c-.11.11-.16.24-.16.4 0 .08.01.15.03.23.03.08.06.14.08.2.18.33.49.76.93 1.28.45.52.93 1.05 1.45 1.58.54.53 1.06 1.02 1.59 1.47.52.44.95.74 1.29.92.05.02.11.05.18.08.08.03.16.04.25.04.17 0 .3-.06.41-.17l.76-.75c.25-.25.49-.44.72-.56.23-.14.46-.21.71-.21.19 0 .39.04.61.13.22.09.45.22.7.39l3.31 2.35c.26.18.44.39.55.64.1.25.16.5.16.78Z" />
  </Icon>
);

const LocationIcon = (props) => (
  <Icon {...props}>
    <path d="M12 13.43a3.12 3.12 0 1 0 0-6.24 3.12 3.12 0 0 0 0 6.24Z" />
    <path d="M3.62 8.49c1.97-8.66 14.8-8.65 16.76.01 1.15 5.08-2.01 9.38-4.78 12.04a5.19 5.19 0 0 1-7.21 0c-2.76-2.66-5.92-6.97-4.77-12.05Z" />
  </Icon>
);

const CartIcon = (props) => (
  <Icon {...props}>
    <path d="M2 2h1.74c1.08 0 1.93.93 1.84 2l-.83 9.96a2.8 2.8 0 0 0 2.79 3.03h10.65c1.44 0 2.7-1.18 2.81-2.61l.54-7.5c.12-1.66-1.14-3.01-2.81-3.01H5.82" />
    <path d="M16.25 22a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM8.25 22a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
    <path d="M9 8h12" />
  </Icon>
);

function NhContactCard() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

  const details = [
    {
      key: "phone",
      icon: <CallIcon />,
      label: t("findRep.contact.northAmerica"),
      value: FILAMENTO.phoneDisplay,
      href: `tel:${FILAMENTO.phoneLink}`,
    },
    {
      key: "email",
      icon: <SmsIcon />,
      label: t("findRep.contact.sales"),
      value: FILAMENTO.email,
      href: `mailto:${FILAMENTO.email}`,
    },
    {
      key: "address",
      icon: <LocationIcon />,
      label: t("findRep.contact.headquarters"),
      value: FILAMENTO.address,
      href: mapHref(FILAMENTO.address),
      external: true,
    },
  ];

  return (
    <section className="ncc" aria-labelledby="ncc-title">
      <div className="nh-wrap">
        <div className="ncc-card" data-reveal="">
          <img
            className="ncc-media"
            src={cloud(IMAGES.shopContact, 1440)}
            srcSet={srcSet(IMAGES.shopContact, [720, 1080, 1440, 1920])}
            sizes="(min-width: 1360px) 1280px, 100vw"
            alt=""
            loading="lazy"
            decoding="async"
          />
          <div className="ncc-shade" aria-hidden="true" />

          <div className="ncc-inner">
            <div className="ncc-copy">
              <div className="ncc-text">
                <span className="ncc-tag">{t("actions.contact")}</span>
                <h2 id="ncc-title" className="ncc-title">
                  {t("findRep.contact.title")}
                </h2>
                <p className="ncc-desc">{t("findRep.contact.description")}</p>
              </div>

              <div className="ncc-actions">
                <a className="ncc-action" href={`mailto:${FILAMENTO.email}`}>
                  <span>{t("findRep.contact.emailSales")}</span>
                  <SmsIcon size={18} />
                </a>
                <Link className="ncc-action is-primary" to={localeLink("/home#contact")}>
                  <span>{t("home2.cta.button")}</span>
                  <CartIcon size={18} />
                </Link>
              </div>
            </div>

            <ul className="ncc-details">
              {details.map((item) => (
                <li key={item.key}>
                  <span className="ncc-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="ncc-detail">
                    <span className="ncc-label">{item.label}</span>
                    <a
                      className="ncc-value"
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {item.value}
                      {item.external && (
                        <span className="ncc-sr"> {t("findRep.results.opensMap")}</span>
                      )}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NhContactCard;