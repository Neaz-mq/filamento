import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import "./Testimonial.css";

/* Figma "Frame 282" — তিনটা card পাশাপাশি: একটা বড় (খোলা), দুইটা
   সরু. শুরুতে প্রথমটা খোলা.

   hover করলে সেই card টা মসৃণভাবে চওড়া হয়ে বড় card এর রূপ নেয়,
   আর যেটা খোলা ছিল সেটা সরু হয়ে যায় — এক card থেকে আরেক card এ
   চোখ গেলেই সেটা পড়ার মতো বড় হয়ে ওঠে. মাউস সরিয়ে নিলে আবার
   বেছে রাখা card টা খোলে (শুরুতে প্রথমটা; তীর বা ক্লিকে বদলায়).

   keyboard এ Tab দিয়ে card এ এলে, আর ফোনে card ছুঁলেও একই কাজ হয়.

   তীর চাপলেও ঠিক একই animation: খোলা card টা পাশের card এ সরে
   যায়. চারটা testimonial কিন্তু জায়গা তিনটার — তাই শেষ প্রান্তে
   পৌঁছালে একপাশের card গুটিয়ে শূন্য হয়ে যায় আর অন্য পাশ থেকে
   নতুনটা খুলে আসে, পুরো সারিটা যেন মসৃণভাবে সরে.

   ⚠️ নিচের quote/নাম/ছবি সবই placeholder — আসল client testimonial
   আর ছবি পেলে TESTIMONIALS array আর en/ja/zh-Hant.json এর
   "testimonials.items" অংশ বদলে দেবেন। ছবি না থাকলে initials
   দিয়ে avatar বানানো হচ্ছে (নিচে Avatar দেখুন), তাই ভাঙা <img>
   দেখানোর ঝুঁকি নেই। */
/* আসল client photo না আসা পর্যন্ত সবার জন্য একই ছবি — পরে যার যার
   real photo পেলে নিচের প্রতিটা entry তে আলাদা avatar বসিয়ে দেবেন,
   এই constant টা তখন আর লাগবে না */
const PLACEHOLDER_AVATAR =
  "https://res.cloudinary.com/dzi3u164c/image/upload/v1789637818/a73e9b59e7a15dc477a605d52bd4add7b91a67a9_pewd5s.jpg";

/* projectTo — এখন Projects পাতার ওই ধরনের project এর তালিকায় যায়
   (আগের /projects/marcus-cold-storage এর মতো ঠিকানায় কোনো আসল project
   নেই, "not found" দেখাত). admin এ এই গ্রাহকদের project যোগ হলে এখানে
   তার ঠিকানা বসাবেন: "/projects/<slug>" */
const TESTIMONIALS = [
  { id: "marcus", rating: 4.5, projectTo: "/projects?category=coldStorage", avatar: PLACEHOLDER_AVATAR },
  { id: "frank", rating: 4.0, projectTo: "/projects?category=distributionCenter", avatar: PLACEHOLDER_AVATAR },
  { id: "david", rating: 4.8, projectTo: "/projects?category=manufacturing", avatar: PLACEHOLDER_AVATAR },
  { id: "elena", rating: 4.6, projectTo: "/projects?category=warehouse", avatar: PLACEHOLDER_AVATAR },
];

/* Figma: 32px বৃত্তের ভেতরে তীর — 10.5px লম্বা, 45° ঘোরানো,
   stroke 1.5, #0B121A */
function ProjectIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3.3 10.7 10.7 3.3" />
      <path d="M5.4 3.3h5.3v5.3" />
    </svg>
  );
}

/* Figma: stroke 2, #EBEBEC */
function ChevronIcon({ direction }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={direction === "next" ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} />
    </svg>
  );
}

/* Figma: বড় card এর পেছনে “ — 300 x 237.19, rgba(55,58,60,.25),
   mix-blend-mode: overlay (তাই খুব আবছা, প্রায় জলছাপ).

   আকৃতিটা Space Grotesk Bold এর “ glyph থেকে সরাসরি নেওয়া —
   glyph এর অনুপাত 406 : 321 = 1.2648, Figma র বাক্স 300 : 237.19
   = 1.2648, হুবহু এক. font দিয়ে লিখলে line-height এর কারণে ঠিক
   জায়গায় বসানো কঠিন, svg তে বাক্স আর আকৃতি একই */
const QUOTE_PATH =
  "M381.0 0.0V68.0H342.0Q296.0 68.0 296.0 114.0V146.0H313.0Q353.0 146.0 379.5 170.0Q406.0 194.0 406.0 231.0Q406.0 271.0 379.5 296.0Q353.0 321.0 313.0 321.0Q272.0 321.0 246.0 295.5Q220.0 270.0 220.0 227.0V112.0Q220.0 0.0 332.0 0.0ZM161.0 0.0V68.0H122.0Q76.0 68.0 76.0 114.0V146.0H93.0Q133.0 146.0 159.5 170.0Q186.0 194.0 186.0 231.0Q186.0 271.0 159.5 296.0Q133.0 321.0 93.0 321.0Q52.0 321.0 26.0 295.5Q0.0 270.0 0.0 227.0V112.0Q0.0 0.0 112.0 0.0Z";

function QuoteMark() {
  return (
    <svg
      className="testimonials-quote-mark"
      viewBox="0 0 406 321"
      aria-hidden="true"
      focusable="false"
    >
      <path d={QUOTE_PATH} fill="currentColor" />
    </svg>
  );
}

/* ছবি না থাকলে নামের আদ্যক্ষর দিয়ে বৃত্ত বানায় — Figma তে সবার
   ছবি আছে, কিন্তু বাস্তব client photo হাতে না পাওয়া পর্যন্ত এটাই
   নিরাপদ fallback (ভাঙা img icon দেখাবে না) */
function Avatar({ name, src, className }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return <img className={`testimonial-avatar ${className}`} src={src} alt="" />;
  }

  return (
    <span className={`testimonial-avatar testimonial-avatar-fallback ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}

/* Figma র তারা — 34 x 33, #F7BE00 (Figma থেকে "Copy as SVG").

   fill: 0 থেকে 1 — অর্ধেক তারার জন্য একই তারা দুইবার আঁকা হয়:
   নিচে ফিকে হলুদ (খালি অংশ), উপরে পুরো হলুদ, যেটা বাঁ দিক থেকে
   fill অনুপাতে কাটা (overflow: hidden).

   ভেতরের svg সবসময় পুরো তারার মাপে fix — wrapper সরু হলে svg
   ছোট হয় না, শুধু বাড়তি অংশ কেটে যায় (Testimonial.css দেখুন) */
const STAR_PATH =
  "M15.9943 0.692676C16.2936 -0.228635 17.597 -0.228635 17.8964 0.692676L21.2111 10.8943C21.345 11.3063 21.7289 11.5853 22.1621 11.5853H32.8888C33.8575 11.5853 34.2603 12.8249 33.4765 13.3943L24.7985 19.6993C24.448 19.9539 24.3014 20.4053 24.4353 20.8173L27.75 31.0189C28.0493 31.9402 26.9948 32.7063 26.2111 32.1369L17.5331 25.832C17.1826 25.5774 16.708 25.5774 16.3575 25.832L7.67951 32.1369C6.89579 32.7063 5.84131 31.9402 6.14066 31.0189L9.45537 20.8173C9.58925 20.4053 9.44259 19.9539 9.0921 19.6993L0.414081 13.3943C-0.369633 12.8249 0.0331428 11.5853 1.00187 11.5853H11.7285C12.1617 11.5853 12.5457 11.3063 12.6795 10.8943L15.9943 0.692676Z";

function StarShape({ className }) {
  return (
    <svg className={className} viewBox="0 0 34 33" aria-hidden="true" focusable="false">
      <path d={STAR_PATH} fill="currentColor" />
    </svg>
  );
}

function Star({ fill }) {
  return (
    <span className="testimonial-star">
      <StarShape className="testimonial-star-bg" />
      <span className="testimonial-star-fill" style={{ width: `${fill * 100}%` }}>
        <StarShape className="testimonial-star-fg" />
      </span>
    </span>
  );
}

/* তারার মাপ CSS থেকে আসে — বড় card এ 40, ছোট card এ 30, ফোনে
   ছোট. inline style এ দিলে ফোনের জন্য বদলানো যেত না */
function Stars({ value }) {
  // 4.5 কে সরাসরি ব্যবহার করা হয় — 4.3 এর মতো মান এলে নিকটতম 0.5 এ নামিয়ে আনা হয়
  const rounded = Math.round(value * 2) / 2;

  return (
    <span className="testimonial-stars">
      {[0, 1, 2, 3, 4].map((index) => (
        <Star key={index} fill={Math.min(Math.max(rounded - index, 0), 1)} />
      ))}
    </span>
  );
}

/* rating এর wrapper span — ছোট card এ এটা বোতামের ভেতরে বসে,
   আর HTML এ বোতামের ভেতরে div রাখা যায় না */
function Rating({ value, t }) {
  return (
    <span className="testimonial-rating" role="img" aria-label={t("testimonials.ratingLabel", { value })}>
      <span className="testimonial-rating-value">{value.toFixed(1)}</span>
      <Stars value={value} />
    </span>
  );
}

/* ছোট দুইটা card এ Figma পাঁচটা তারা দেখায় না — সংখ্যার পাশে
   একটা মাত্র (সবসময় পুরো ভরা, সিদ্ধান্তমূলক নয়) star icon, শুধু
   accent হিসেবে। বড় featured card এর proportional 5-star Rating
   থেকে এটা তাই আলাদা component */
function MiniRating({ value, t }) {
  return (
    <span className="testimonial-rating" role="img" aria-label={t("testimonials.ratingLabel", { value })}>
      <span className="testimonial-rating-value">{value.toFixed(1)}</span>
      <span className="testimonial-mini-star">
        <Star fill={1} />
      </span>
    </span>
  );
}

/* tabIndex — সরু card এর link টা keyboard এ থামে না (নিচে কারণ
   লেখা আছে), কিন্তু মাউস বা আঙুলে চাপা যায় */
function ProjectLink({ to, label, tabIndex }) {
  const localeLink = useLocaleLink();

  return (
    <Link to={localeLink(to)} className="testimonial-project" tabIndex={tabIndex}>
      <span>{label}</span>
      <span className="testimonial-project-icon">
        <ProjectIcon />
      </span>
    </Link>
  );
}

/* hover এ card খোলা শুধু চওড়া পর্দায় — যেখানে card গুলো পাশাপাশি.
   ছোট পর্দায় card গুলো খাড়া সাজানো, আর খোলা card টা উপরে চলে
   আসে (CSS এর order). তখন মাউস ছুঁলেই খুলে দিলে card লাফিয়ে উপরে
   উঠত, মাউসের নিচে অন্য card চলে আসত, সেটাও খুলত — অনন্ত লাফালাফি.
   তাই ওখানে শুধু চাপলে খোলে */
const WIDE = "(min-width: 1100px)";
const isWide = () =>
  typeof window !== "undefined" && window.matchMedia(WIDE).matches;

/* ---------------------------------------------------------------
   একটা card — ভেতরে দুইটা রূপ, একটার উপর আরেকটা:

     tcard-full     বড় রূপ: rating, পুরো quote, ব্যক্তি, Project
     tcard-compact  সরু রূপ: ছবি, নাম, পদবি, একটা তারা, Project

   খোলা card এ বড় রূপ দেখা যায়, বাকিগুলোতে সরু রূপ. দুইটা রূপই
   সবসময় DOM এ থাকে — card চওড়া হওয়ার সময় একটা মিলিয়ে যায়,
   আরেকটা ফুটে ওঠে (Testimonial.css এ কেন লেখা নড়ে না, দেখুন)
   --------------------------------------------------------------- */
/* out   — এই মুহূর্তে জানালার বাইরে: চওড়া শূন্য, আর inert (Tab এ
           থামে না, screen reader ও পড়ে না)
   first / last — জানালার প্রথম আর শেষ card: তীরগুলো এদের কিনারায়
           ভাসে, তাই ভেতরের লেখা সেদিকে একটু সরে থাকে (CSS দেখুন) */
function TestimonialCard({ item, active, out, first, last, onHover, onSelect, t }) {
  const nameId = useId();
  const roleId = useId();
  const cardRef = useRef(null);

  /* ছোট পর্দায় চাপলে: card খোলার পরে সেটা পর্দার ভেতরে আছে কি না
     দেখা — না থাকলে আলতো করে scroll করে আনা. ট্যাবলেটে খোলা card
     উপরে চলে যায়, তখন এটা না থাকলে সেটা পর্দার বাইরে থাকত.
     requestAnimationFrame — React নতুন অবস্থা আঁকার পরে মাপা হয় */
  const handleSelect = () => {
    onSelect();
    if (isWide()) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({
        block: "nearest",
        behavior: calm ? "auto" : "smooth",
      });
    });
  };

  const name = t(`testimonials.items.${item.id}.name`);
  const role = t(`testimonials.items.${item.id}.role`);

  return (
    <article
      ref={cardRef}
      className={[
        "tcard",
        active && "is-active",
        out && "is-out",
        first && "is-first",
        last && "is-last",
      ]
        .filter(Boolean)
        .join(" ")}
      inert={out}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" && isWide()) onHover();
      }}
      /* card এর যেকোনো জায়গায় ক্লিক = বেছে নেওয়া. hover এ খোলা card
         এ ক্লিক করলেও সেটা থেকে যায়, মাউস সরালে আর ফিরে যায় না —
         খোলা card এ অদৃশ্য বোতামটা চাপ ছেড়ে দেয়, তাই এটা এখানে */
      onClick={onSelect}
      /* keyboard এ Tab দিয়ে card এর ভেতরে এলে খোলে (React এর onFocus
         ভেতর থেকে উপরে ওঠে).

         শুধু keyboard এর focus (:focus-visible) — আঙুল বা মাউসের
         focus এ নয়. কারণ ছোঁয়ার মুহূর্তেই focus আসে, click আসে তার
         পরে. focus এ খুলে দিলে click পৌঁছানোর আগেই সরু রূপটা লুকিয়ে
         যেত: Project link এ আঙুল দিলে link এ যেত না, শুধু card খুলত.
         আঙুল আর মাউসের জন্য খোলার কাজ নিচের বোতামের onClick করে */
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) onSelect();
      }}
    >
      {/* পুরো card ঢাকা অদৃশ্য বোতাম — সরু card এর যেকোনো জায়গায়
          চাপলে খোলে. নাম আর পদবি থেকেই এর পড়ার লেখা আসে
          (aria-labelledby), তাই নতুন অনুবাদ লাগে না.

          খোলার পরেও বোতামটা DOM এ থাকে, শুধু Tab এ আর থামে না —
          বোতামটা সরিয়ে দিলে যে বোতামে focus ছিল সেটাই হারিয়ে যেত,
          keyboard এর মানুষ পাতার শুরুতে ছিটকে যেতেন */}
      <button
        type="button"
        className="tcard-select"
        onClick={handleSelect}
        tabIndex={active ? -1 : 0}
        aria-expanded={active}
        aria-labelledby={`${nameId} ${roleId}`}
      />

      {/* ---- বড় রূপ ---- */}
      <div className="tcard-full" aria-hidden={active ? undefined : "true"}>
        <QuoteMark />

        <Rating value={item.rating} t={t} />

        <div className="testimonials-body">
          {/* চারটা quote একই জায়গায়, একটার উপর আরেকটা — শুধু এই
              card এর টা দেখা যায়. ফলে প্রতিটা card এর উচ্চতা সবচেয়ে
              লম্বা quote এর সমান: তিনটা card সবসময় সমান উঁচু, আর
              hover বা তীর চাপলে সারির উচ্চতা একটুও বদলায় না */}
          <div className="testimonial-quotes">
            {TESTIMONIALS.map((other) => {
              const own = other.id === item.id;
              return (
                <p
                  key={other.id}
                  className="testimonial-quote"
                  data-active={own ? "true" : undefined}
                  aria-hidden={own ? undefined : "true"}
                >
                  {t(`testimonials.items.${other.id}.quote`)}
                </p>
              );
            })}
          </div>
          <hr className="testimonial-divider" />
          <div className="testimonial-person">
            <Avatar name={name} src={item.avatar} className="testimonial-avatar-lg" />
            <div className="testimonial-person-info">
              <span className="testimonial-name">{name}</span>
              <span className="testimonial-role">{role}</span>
            </div>
            <ProjectLink to={item.projectTo} label={t("testimonials.project")} />
          </div>
        </div>
      </div>

      {/* ---- সরু রূপ ---- */}
      <div className="tcard-compact" aria-hidden={active ? "true" : undefined}>
        <Avatar name={name} src={item.avatar} className="testimonial-avatar-sm" />
        <span className="testimonial-mini-info">
          <span className="testimonial-name" id={nameId}>
            {name}
          </span>
          <span className="testimonial-role" id={roleId}>
            {role}
          </span>
        </span>
        <MiniRating value={item.rating} t={t} />
        {/* keyboard এ এই link এ থামে না: এখানে focus এলে card টা
            খুলে যেত, আর খোলার সাথে সাথে এই সরু রূপটাই লুকিয়ে যেত —
            focus করা link টা চোখের সামনে থেকে উধাও. keyboard এর
            মানুষ card খোলার পর বড় রূপের Project link টা পান */}
        <ProjectLink to={item.projectTo} label={t("testimonials.project")} tabIndex={-1} />
      </div>
    </article>
  );
}

// একসাথে কয়টা card দেখা যায়
const VISIBLE = 3;

function Testimonial() {
  const { t } = useTranslation();

  /* তিনটা আলাদা জিনিস:

       selected    — বেছে নেওয়া testimonial (তীর, ক্লিক, ছোঁয়া, Tab).
                     এটা থেকে যায়
       hovered     — মাউস যেটার উপরে, শুধু দেখার জন্য. মাউস সরালে
                     মুছে যায়, তখন আবার selected টা খোলে
       windowStart — চারটার মধ্যে কোন তিনটা এখন দেখা যাচ্ছে */
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [windowStart, setWindowStart] = useState(0);

  const count = TESTIMONIALS.length;
  const activeIndex = hovered ?? selected;

  /* বেছে নেওয়া — যেটা বাছা হলো সেটা জানালার বাইরে থাকলে জানালাও
     সেদিকে সরে, ঠিক যতটুকু দরকার (একবারে এক ঘর) */
  const select = (index) => {
    setSelected(index);
    setHovered(null);
    setWindowStart((start) => {
      if (index < start) return index;
      if (index > start + VISIBLE - 1) return index - VISIBLE + 1;
      return start;
    });
  };

  /* তীর গোনে যেটা এখন খোলা দেখা যাচ্ছে সেটা থেকে — hover করে
     তৃতীয় card খোলা রেখে "পরে" চাপলে চতুর্থটা খোলে, যেমনটা চোখ
     আশা করে. দুই প্রান্তে থামে, Figma র মতো আবছা হয়ে */
  const atStart = activeIndex === 0;
  const atEnd = activeIndex === count - 1;
  const goPrev = () => select(Math.max(activeIndex - 1, 0));
  const goNext = () => select(Math.min(activeIndex + 1, count - 1));

  // মাউস সারি ছেড়ে গেলে শুধু দেখাটা মোছে — বেছে নেওয়াটা থাকে
  const handleRowLeave = (event) => {
    if (event.pointerType === "mouse") setHovered(null);
  };

  return (
    <section id="testimonials" className="testimonials" aria-labelledby="testimonials-title">
      <div className="testimonials-inner">
        <div className="testimonials-head">
          <h2 id="testimonials-title" className="testimonials-title">
            {t("testimonials.title")}
          </h2>
          <p className="testimonials-text">{t("testimonials.text")}</p>
        </div>

        <div className="testimonials-row" onPointerLeave={handleRowLeave}>
          {/* চারটা card ই সবসময় DOM এ, key testimonial ধরে — তাই প্রতিটা
              card নিজের জায়গায় থেকে শুধু চওড়া বদলায়: বড় হয়, ছোট হয়,
              বা জানালার বাইরে গেলে শূন্য হয়ে যায়. কোনো card লাফিয়ে
              অন্য জায়গায় যায় না, তাই সব বদলই একই মসৃণ animation */}
          {TESTIMONIALS.map((item, index) => {
            const inView = index >= windowStart && index < windowStart + VISIBLE;
            return (
              <TestimonialCard
                key={item.id}
                item={item}
                active={index === activeIndex}
                out={!inView}
                first={index === windowStart}
                last={index === windowStart + VISIBLE - 1}
                onHover={() => setHovered(index)}
                onSelect={() => select(index)}
                t={t}
              />
            );
          })}

          {/* Figma তে arrow দুটো card গুলোর একদম কিনারায় ভেসে থাকে;
              মোবাইলে row একটা কলামে নেমে গেলে সেটা আর মানানসই না,
              তাই ছোট স্ক্রিনে এগুলো নিচে সাধারণ বোতাম হয়ে যায়
              (Testimonial.css এর responsive অংশ দেখুন) */}
          <div className="testimonials-nav">
            <button
              type="button"
              className="testimonials-arrow testimonials-arrow-prev"
              onClick={goPrev}
              disabled={atStart}
              aria-label={t("testimonials.prev")}
            >
              <ChevronIcon direction="prev" />
            </button>
            <button
              type="button"
              className="testimonials-arrow testimonials-arrow-next"
              onClick={goNext}
              disabled={atEnd}
              aria-label={t("testimonials.next")}
            >
              <ChevronIcon direction="next" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Testimonial;