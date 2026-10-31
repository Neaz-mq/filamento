import { useEffect, useMemo, useRef, useState } from "react";
import SoftLink from "./SoftLink";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import { buildFixturesView, cloudinaryUrl, isCloudinary, useHomeContent } from "../lib/homeContent";
import "./Fixtures.css";

/* e_trim     — চারপাশের স্বচ্ছ ফাঁকা অংশ ছেঁটে দেয়। শুধু যেসব ছবিতে
                ফাঁকা margin আছে সেগুলোতেই লাগে — না দিলে লাইটটা
                বাক্সের মাঝে ছোট হয়ে ভাসতে থাকে
   c_limit,w_  — নির্দিষ্ট প্রস্থে নামায়, কখনো বড় করে না
   q_auto:best — q_auto এর সবচেয়ে কম ক্ষতিকর ধাপ
   f_auto      — ব্রাউজার অনুযায়ী সেরা format */
const imageUrl = (image, width) =>
  isCloudinary(image.url)
    ? cloudinaryUrl(image.url, `${image.trim ? "e_trim/" : ""}c_limit,w_${width},f_auto,q_auto:best`)
    : image.url;

const srcSetFor = (image) =>
  isCloudinary(image.url)
    ? [400, 600, 900, 1200].map((w) => `${imageUrl(image, w)} ${w}w`).join(", ")
    : undefined;

/* তিনটা ছবির মাপ Figma তে আলাদা — বাক্স আর ছবির মাপ CSS এ
   data-fixture দিয়ে বসানো (Fixtures.css দেখুন):

     la1  বাক্স 300 x 236     ছবি 300 x 230
     ls1  বাক্স 392 x 281.44  ছবি 392 x 313.61  (নিচে উপচে পড়ে)
     rh1  বাক্স 300 x 230     ছবি e_trim করে 84% চওড়া */
/* কার্ডের তালিকা এখন lib/homeContent.js এর buildFixturesView এ (admin থেকে,
   না পেলে আগের তিনটা) */

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
  /* admin এর বাকি icon নামগুলো — Hero র badge এর সাথে একই আঁকা */
  warranty: (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.7 7.5 10 4.4-1.3 7.5-5.4 7.5-10v-6L12 2.5Z" />
      <path d="M9 12.2l2.2 2.2L15.4 10" />
    </svg>
  ),
  madeIn: (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <path d="M5 21V3.5" />
      <path d="M5 4.2h12.5l-2.4 4 2.4 4H5" />
    </svg>
  ),
  certified: (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.2 12.2l2.5 2.5 5.1-5.1" />
    </svg>
  ),
  listed: (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <path d="M7.5 3.5h9v5a4.5 4.5 0 0 1-9 0v-5Z" />
      <path d="M7.5 5.5H5a2.5 2.5 0 0 0 2.5 2.5M16.5 5.5H19A2.5 2.5 0 0 1 16.5 8" />
      <path d="M12 13v4M8.5 20.5h7M10 17h4l1.5 3.5h-7L10 17Z" />
    </svg>
  ),
  spark: (
    <svg {...ICON_PROPS} viewBox="0 0 24 24">
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
    </svg>
  ),
};

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

/* মাউসের টর্চ কতদূর পর্যন্ত আলো ফেলে (px). আগের CSS gradient এর
   circle 280px এর সমান */
const TORCH_RADIUS = 280;

function Fixtures() {
  const { t, i18n } = useTranslation();
  const localeLink = useLocaleLink();

  /* ---------- database এর content ----------
     ready: উত্তর এসেছে (বা ১.৫ সেকেন্ড পেরিয়েছে). তার আগে অংশটা
     লুকানো থাকে (জায়গা নেয়, তাই পাতা লাফায় না) — নাহলে প্রথমে
     পুরনো লেখা-ছবি, তারপর নতুনটা ঝলকাত. Hero র মতোই */
  const { content, settled: ready } = useHomeContent();

  const view = useMemo(
    () =>
      buildFixturesView(content?.featured, {
        t,
        en: i18n.getFixedT("en"),
        has: (key) => i18n.exists(key, { lng: "en" }),
      }),
    [content, t, i18n],
  );

  /* জলছাপ ৮ অক্ষরের (\"FIXTURES\") মাপে বসানো. admin এ লম্বা লেখা (সর্বোচ্চ
     ৩০) দিলে section ছাপিয়ে যেত — তাই ৮ এর বেশি হলে অনুপাতে ছোট */
  const watermarkLength = Array.from(view.watermark).length;
  const watermarkStyle =
    watermarkLength > 8
      ? { "--fx-watermark-scale": ((22.9 * 8) / watermarkLength).toFixed(2) }
      : undefined;

  /* জলছাপের অক্ষরগুলো পর্দায় ঢুকলে একটা একটা করে উঠে এসে ফিলামেন্টের
     মতো জ্বলে ওঠে (CSS এ দেখুন). শুরুর সংকেত এখানে — একবার চললে আর
     বারবার নয় */
  const watermarkRef = useRef(null);
  const [watermarkIn, setWatermarkIn] = useState(false);

  useEffect(() => {
    const node = watermarkRef.current;
    if (!node) return undefined;

    // খুব পুরনো ব্রাউজার — animation বাদ, সরাসরি দেখাও
    if (typeof IntersectionObserver === "undefined") {
      setWatermarkIn(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // top < 0 — #contact এ লাফ দিলে এই section উপরে থেকে যায়
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          setWatermarkIn(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -15% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* মাউসের টর্চ — section এর উপর মাউস নাড়ালে জলছাপের অক্ষর মাউসের কাছে
     হলুদ আলোয় ভেজে. এখানে শুধু "কোন অক্ষরে কতটা আলো" হিসাব হয়:
     প্রতি অক্ষরের কেন্দ্র থেকে মাউস কত দূরে, সেই দূরত্ব থেকে 0..1
     একটা সংখ্যা বের করে --fx-lit এ বসানো. CSS ওই সংখ্যা দিয়ে শুধু
     opacity বদলায় (রঙ/gradient নয়) — তাই আঁকার খরচ নেই.

     • শুধু মাউসওয়ালা যন্ত্রে (ফোন/ট্যাবলেটে hover নেই) আর "animation
       কমান" বন্ধ থাকলে
     • React state নয়, সরাসরি style — নইলে মাউস নড়ার প্রতিটা মুহূর্তে
       পুরো section নতুন করে আঁকত
     • প্রতি frame এ একবার (requestAnimationFrame)
     • section পর্দার বাইরে থাকলে scroll এ কোনো কাজই হয় না */
  useEffect(() => {
    const root = watermarkRef.current;
    const section = root?.closest("section");
    if (!root || !section) return undefined;

    const canHover = window.matchMedia?.(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!canHover?.matches) return undefined;

    const letters = [...root.querySelectorAll(".fixtures-watermark-letter")];
    let frame = 0;
    let pointer = null;
    let active = false;

    const paint = () => {
      frame = 0;
      if (!pointer || !active) return;

      // আগে সব মাপ পড়া, তারপর লেখা — বারবার layout হিসাব করতে হয় না
      const centers = letters.map((letter) => {
        const rect = letter.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });

      letters.forEach((letter, index) => {
        const distance = Math.hypot(
          pointer.x - centers[index].x,
          pointer.y - centers[index].y,
        );
        const closeness = Math.max(0, 1 - distance / TORCH_RADIUS);
        // বর্গ করায় কিনারা নরম মিলিয়ে যায়, মাঝখানে জোরালো
        letter.style.setProperty("--fx-lit", (closeness * closeness).toFixed(3));
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onMove = (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      active = true;
      schedule();
    };

    const onLeave = () => {
      active = false;
      letters.forEach((letter) => letter.style.setProperty("--fx-lit", "0"));
    };

    // scroll করলে অক্ষর সরে যায় কিন্তু মাউস থাকে এক জায়গায় — আলো আবার বসাতে হয়
    const onScroll = () => {
      if (active) schedule();
    };

    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [view.watermark]);

  return (
    <section className="fixtures" style={watermarkStyle}>
      <div className="fixtures-inner" style={ready ? undefined : { visibility: "hidden" }}>
        <div className="fixtures-top">
          <header className="fixtures-header">
            {/* Figma র 284px জলছাপ। শুধু সাজসজ্জা, তাই aria-hidden —
                screen reader এ "FIXTURES" দুইবার পড়া হতো না */}
            <span
              ref={watermarkRef}
              className={`fixtures-watermark${watermarkIn ? " is-in" : ""}`}
              aria-hidden="true"
            >
              {/* প্রতিটা অক্ষর আলাদা span — যাতে একটার পর একটা ওঠে.
                  --i হলো অক্ষরের ক্রম, CSS এ দেরির হিসাবে লাগে.
                  data-char — CSS এর হলুদ কপি (::before / ::after) এই
                  অক্ষরটাই আবার আঁকে */}
              <span className="fixtures-watermark-drift">
                {Array.from(view.watermark).map((char, index) => (
                  <span
                    key={index}
                    className="fixtures-watermark-letter"
                    data-char={char === " " ? "\u00A0" : char}
                    style={{ "--i": index }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </span>
            </span>

            <div className="fixtures-heading">
              <h2 className="fixtures-title">
                {view.titleTop}
                {view.titleBottom && (
                  <>
                    <br />
                    {view.titleBottom}
                  </>
                )}
              </h2>
              <p className="fixtures-subhead">{view.subhead}</p>
            </div>
          </header>

          <div className="fixtures-cards">
            {view.cards.map((card) => (
              <article
                key={card.id}
                data-fixture={card.slot}
                className={`fixtures-card${card.featured ? " is-featured" : ""}`}
              >
                <div className="fixtures-card-media">
                  {/* বিশাল ফিকে সংখ্যাটা ছবির পেছনে. Figma তে এটা
                      negative margin দিয়ে করা, কিন্তু absolute বসানোই
                      বেশি নির্ভরযোগ্য — margin এর হিসাব content এর
                      উচ্চতার সাথে বদলে যেত */}
                  <span className="fixtures-card-number" aria-hidden="true">
                    {card.number}
                  </span>

                  {/* ready না হওয়া পর্যন্ত ছবি বসানোই হয় না — ভুল ছবি
                      নামানো আর দুইবার নামানো ঠেকাতে */}
                  {ready && card.image.url && (
                    <img
                      src={imageUrl(card.image, 900)}
                      srcSet={srcSetFor(card.image)}
                      sizes="(max-width: 767px) 86vw, (max-width: 1099px) 44vw, 25vw"
                      alt={card.alt}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>

                <div className="fixtures-card-body">
                  <div className="fixtures-card-text">
                    <h3 className="fixtures-card-title">{card.title}</h3>
                    <p className="fixtures-card-scope">{card.scope}</p>
                    <p className="fixtures-card-desc">{card.description}</p>
                  </div>

                  <SoftLink to={localeLink(card.to)} className="fixtures-card-link">
                    <span>{t("fixtures.moreInfo")}</span>
                    <span className="fixtures-card-arrow">
                      <ArrowUpRight />
                    </span>
                  </SoftLink>
                </div>
              </article>
            ))}
          </div>
        </div>

        {view.points.length > 0 && (
          <ul className="fixtures-benefits">
            {view.points.map((point) => (
              <li key={point.id} className="fixtures-benefit">
                <span className="fixtures-benefit-icon">
                  {BENEFIT_ICONS[point.icon] ?? BENEFIT_ICONS.spark}
                </span>
                <h3 className="fixtures-benefit-title">{point.title}</h3>
                <p className="fixtures-benefit-text">{point.text}</p>
              </li>
            ))}
          </ul>
        )}

        <SoftLink to={localeLink("/products")} className="fixtures-cta">
          {t("fixtures.seeAll")}
          <CtaArrow />
        </SoftLink>
      </div>
    </section>
  );
}

export default Fixtures;