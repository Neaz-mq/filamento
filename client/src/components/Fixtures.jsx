import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import "./Fixtures.css";

/* e_trim     — চারপাশের স্বচ্ছ ফাঁকা অংশ ছেঁটে দেয়। শুধু যেসব ছবিতে
                ফাঁকা margin আছে সেগুলোতেই লাগে — না দিলে লাইটটা
                বাক্সের মাঝে ছোট হয়ে ভাসতে থাকে
   c_limit,w_  — নির্দিষ্ট প্রস্থে নামায়, কখনো বড় করে না
   q_auto:best — q_auto এর সবচেয়ে কম ক্ষতিকর ধাপ
   f_auto      — ব্রাউজার অনুযায়ী সেরা format */
const cloudinary = (fixture, width) =>
  "https://res.cloudinary.com/dzi3u164c/image/upload/" +
  (fixture.trim ? "e_trim/" : "") +
  `c_limit,w_${width},f_auto,q_auto:best/` +
  fixture.path;

/* srcset এর মাপগুলো 3x export ধরে বসানো:
     LA1 300 CSS px → 900,  LS1 392 → 1176,  RH1 339 → 1017

   c_limit থাকায় উৎস ছোট হলে Cloudinary বড় করবে না, যা আছে তাই
   পাঠাবে — তাই বড় সংখ্যা রাখায় কোনো ক্ষতি নেই */
const srcSetFor = (fixture) =>
  [400, 600, 900, 1200]
    .map((w) => `${cloudinary(fixture, w)} ${w}w`)
    .join(", ");

/* তিনটা ছবির মাপ Figma তে আলাদা — বাক্স আর ছবির মাপ CSS এ
   data-fixture দিয়ে বসানো (Fixtures.css দেখুন):

     la1  বাক্স 300 x 236     ছবি 300 x 230
     ls1  বাক্স 392 x 281.44  ছবি 392 x 313.61  (নিচে উপচে পড়ে)
     rh1  বাক্স 300 x 230     ছবি e_trim করে 84% চওড়া */
const FIXTURES = [
  {
    id: "la1",
    number: "01",
    to: "/products/la1-high-bay",
    /* PNG আপলোড, কিন্তু f_auto থাকায় ব্রাউজারে WebP/AVIF হয়েই
       যাবে — তাই বড় PNG রাখায় ফাইলের ওজন বাড়ছে না */
    path: "v1789621178/image_7_wqtldv.png",
  },
  {
    id: "ls1",
    number: "02",
    to: "/products/ls1-high-bay",
    path: "v1789621338/Additional_0001_1779697023_1_taubuk.png",
    /* Figma তে মাঝের card টা বড় — 456x600, আর background গাঢ়
       (রঙ এক, opacity .75 বনাম .25) */
    featured: true,
  },
  {
    id: "rh1",
    number: "03",
    to: "/products/rh1-high-bay",
    /* এই ছবিটা স্বচ্ছ (transparent) — নতুন export টার background
       সাদা ছিল, তাই ওটা পেছনের "03" সংখ্যার উপর একটা সাদা চৌকো
       হয়ে বসে যাচ্ছিল।

       পরে 3x এ আবার export করলে Figma র Export প্যানেলে "Background"
       টা transparent রাখবেন, নাহলে একই সমস্যা ফিরে আসবে */
    path: "v1789471643/fix3_yeppeq.webp",
    /* এই ছবির চারপাশে অনেকটা স্বচ্ছ ফাঁকা জায়গা আছে, তাই লাইটটা
       বাক্সের মাঝে ছোট হয়ে ভাসছিল। e_trim ওই প্রান্তগুলো কেটে দেয়,
       ফলে লাইট বাক্স ভরে ফেলে আর নিজে থেকেই কেন্দ্রে বসে।

       card ১ আর ২ এর ছবি টাইট crop করা, তাই ওগুলোতে লাগছে না */
    trim: true,
  },
];

/* Figma: 24px icon, 64px গাঢ় বৃত্তের ভেতরে, stroke #EBEBEC।

   wrench আর rocket দুইটা Figma র নিজের path দিয়ে বসানো — নিজের
   হাতে আঁকাগুলো মিলছিল না। বাকি চারটার SVG পেলে একইভাবে বদলে
   দেওয়া যাবে */
const ICON_PROPS = {
  width: 24,
  height: 24,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const BENEFIT_ICONS = {
  energy: (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
    </svg>
  ),

  // Figma থেকে হুবহু
  maintenance: (
    <svg {...ICON_PROPS} viewBox="0 0 22 22">
      <path d="M13.7005 5.30369C13.5172 5.49062 13.4146 5.74194 13.4146 6.00369C13.4146 6.26544 13.5172 6.51676 13.7005 6.70369L15.3005 8.30369C15.4874 8.48692 15.7387 8.58955 16.0005 8.58955C16.2622 8.58955 16.5135 8.48692 16.7005 8.30369L19.8065 5.19869C20.1265 4.87669 20.6695 4.97869 20.7895 5.41669C21.0916 6.51557 21.0745 7.67776 20.7402 8.76728C20.406 9.85681 19.7683 10.8286 18.9019 11.5689C18.0354 12.3093 16.9761 12.7875 15.8477 12.9478C14.7194 13.108 13.5688 12.9436 12.5305 12.4737L4.62047 20.3837C4.22264 20.7814 3.68313 21.0048 3.12061 21.0047C2.5581 21.0046 2.01866 20.781 1.62097 20.3832C1.22327 19.9854 0.999906 19.4459 1 18.8833C1.00009 18.3208 1.22364 17.7814 1.62147 17.3837L9.53147 9.47369C9.06161 8.4354 8.89717 7.28477 9.0574 6.15644C9.21763 5.02811 9.69589 3.96874 10.4362 3.10231C11.1766 2.23587 12.1484 1.5982 13.2379 1.26392C14.3274 0.929633 15.4896 0.912558 16.5885 1.21469C17.0265 1.33469 17.1285 1.87669 16.8075 2.19869L13.7005 5.30369Z" />
    </svg>
  ),

  visibility: (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
    </svg>
  ),

  glare: (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <path d="m12 2.5 9 4.8-9 4.8-9-4.8 9-4.8Z" />
      <path d="m3 12.3 9 4.8 9-4.8" />
      <path d="m3 17.2 9 4.8 9-4.8" />
    </svg>
  ),

  // Figma থেকে হুবহু
  installation: (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <path d="M12 15V20C12 20 15.03 19.45 16 18C17.08 16.38 16 13 16 13" />
      <path d="M2.5 21.4993C2.5 21.4993 3 17.7593 4.5 16.4993C4.91088 16.1531 5.43516 15.9708 5.97223 15.9874C6.50929 16.004 7.02131 16.2184 7.41 16.5893C8.2 17.3693 8.21 18.6593 7.5 19.4993C6.24 20.9993 2.5 21.4993 2.5 21.4993Z" />
      <path d="M9 12.0002C9.53214 10.6197 10.2022 9.29631 11 8.05025C12.1652 6.18723 13.7876 4.6533 15.713 3.59434C17.6384 2.53538 19.8027 1.98662 22 2.00025C22 4.72025 21.22 9.50025 16 13.0002C14.7367 13.7987 13.3967 14.4687 12 15.0002L9 12.0002Z" />
      <path d="M9 12.0006H4C4 12.0006 4.55 8.97057 6 8.00057C7.62 6.92057 11 8.05057 11 8.05057" />
    </svg>
  ),

  // Figma থেকে হুবহু
  roi: (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
      <path d="M16 8H10C9.46957 8 8.96086 8.21071 8.58579 8.58579C8.21071 8.96086 8 9.46957 8 10C8 10.5304 8.21071 11.0391 8.58579 11.4142C8.96086 11.7893 9.46957 12 10 12H14C14.5304 12 15.0391 12.2107 15.4142 12.5858C15.7893 12.9609 16 13.4696 16 14C16 14.5304 15.7893 15.0391 15.4142 15.4142C15.0391 15.7893 14.5304 16 14 16H8" />
      <path d="M12 18V6" />
    </svg>
  ),
};

const BENEFITS = ["energy", "maintenance", "visibility", "glare", "installation", "roi"];

function ArrowUpRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M4 11 11 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M5.4 4H11v5.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CtaArrow() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
      <path
        d="M1 5h10M7.2 1.2 11 5 7.2 8.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Fixtures() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

  return (
    <section className="fixtures">
      <div className="fixtures-inner">
        <div className="fixtures-top">
          <header className="fixtures-header">
            {/* Figma র 284px জলছাপ। শুধু সাজসজ্জা, তাই aria-hidden —
                screen reader এ "FIXTURES" দুইবার পড়া হতো না */}
            <span className="fixtures-watermark" aria-hidden="true">
              {t("fixtures.watermark")}
            </span>

            <div className="fixtures-heading">
              <h2 className="fixtures-title">
                {t("fixtures.titleTop")}
                <br />
                {t("fixtures.titleBottom")}
              </h2>
              <p className="fixtures-subhead">{t("fixtures.subhead")}</p>
            </div>
          </header>

          <div className="fixtures-cards">
            {FIXTURES.map((fixture) => (
              <article
                key={fixture.id}
                data-fixture={fixture.id}
                className={`fixtures-card${fixture.featured ? " is-featured" : ""}`}
              >
                <div className="fixtures-card-media">
                  {/* বিশাল ফিকে সংখ্যাটা ছবির পেছনে. Figma তে এটা
                      negative margin দিয়ে করা, কিন্তু absolute বসানোই
                      বেশি নির্ভরযোগ্য — margin এর হিসাব content এর
                      উচ্চতার সাথে বদলে যেত */}
                  <span className="fixtures-card-number" aria-hidden="true">
                    {fixture.number}
                  </span>

                  <img
                    src={cloudinary(fixture, 900)}
                    srcSet={srcSetFor(fixture)}
                    sizes="(max-width: 767px) 86vw, (max-width: 1099px) 44vw, 25vw"
                    alt={t(`fixtures.items.${fixture.id}.title`)}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="fixtures-card-body">
                  <div className="fixtures-card-text">
                    <h3 className="fixtures-card-title">
                      {t(`fixtures.items.${fixture.id}.title`)}
                    </h3>
                    <p className="fixtures-card-scope">
                      {t(`fixtures.items.${fixture.id}.scope`)}
                    </p>
                    <p className="fixtures-card-desc">
                      {t(`fixtures.items.${fixture.id}.description`)}
                    </p>
                  </div>

                  <Link to={localeLink(fixture.to)} className="fixtures-card-link">
                    <span>{t("fixtures.moreInfo")}</span>
                    <span className="fixtures-card-arrow">
                      <ArrowUpRight />
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <ul className="fixtures-benefits">
          {BENEFITS.map((id) => (
            <li key={id} className="fixtures-benefit">
              <span className="fixtures-benefit-icon">{BENEFIT_ICONS[id]}</span>
              <h3 className="fixtures-benefit-title">
                {t(`fixtures.benefits.${id}.title`)}
              </h3>
              <p className="fixtures-benefit-text">
                {t(`fixtures.benefits.${id}.text`)}
              </p>
            </li>
          ))}
        </ul>

        <Link to={localeLink("/products")} className="fixtures-cta">
          {t("fixtures.seeAll")}
          <CtaArrow />
        </Link>
      </div>
    </section>
  );
}

export default Fixtures;