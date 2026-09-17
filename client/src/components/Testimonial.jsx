import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import "./Testimonial.css";

/* Figma "Frame 282" — বাঁয়ে বড় featured card (active testimonial),
   ডানে দুইটা ছোট card (পরের দুইটা)। arrow চাপলে সবকিছু এক ঘর করে
   ঘুরে যায় — ছোট card এ ক্লিক করলেও সেটা featured হয়ে যায়।

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

const TESTIMONIALS = [
  { id: "marcus", rating: 4.5, projectTo: "/projects/marcus-cold-storage", avatar: PLACEHOLDER_AVATAR },
  { id: "frank", rating: 4.0, projectTo: "/projects/frank-distribution-center", avatar: PLACEHOLDER_AVATAR },
  { id: "david", rating: 4.8, projectTo: "/projects/david-manufacturing-plant", avatar: PLACEHOLDER_AVATAR },
  { id: "elena", rating: 4.6, projectTo: "/projects/elena-warehouse-retrofit", avatar: PLACEHOLDER_AVATAR },
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

function ProjectLink({ to, label }) {
  const localeLink = useLocaleLink();

  return (
    <Link to={localeLink(to)} className="testimonial-project">
      <span>{label}</span>
      <span className="testimonial-project-icon">
        <ProjectIcon />
      </span>
    </Link>
  );
}

function Testimonial() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  const count = TESTIMONIALS.length;
  const at = (offset) => TESTIMONIALS[(activeIndex + offset + count) % count];

  const featured = at(0);
  const upcoming = [at(1), at(2)];

  /* তীর দুই প্রান্তে থামে — Figma তে শুরুর অবস্থায় বাঁয়ের তীর
     আবছা (চাপার কিছু নেই). ডানের ছোট card দুটো অবশ্য তালিকার
     শুরু থেকে ঘুরে আসে, তাই সবসময় দুইটা card দেখায় */
  const atStart = activeIndex === 0;
  const atEnd = activeIndex === count - 1;
  const goPrev = () => setActiveIndex((current) => Math.max(current - 1, 0));
  const goNext = () => setActiveIndex((current) => Math.min(current + 1, count - 1));

  const infoFor = (item) => ({
    name: t(`testimonials.items.${item.id}.name`),
    role: t(`testimonials.items.${item.id}.role`),
  });

  const featuredInfo = infoFor(featured);

  return (
    <section id="testimonials" className="testimonials" aria-labelledby="testimonials-title">
      <div className="testimonials-inner">
        <div className="testimonials-head">
          <h2 id="testimonials-title" className="testimonials-title">
            {t("testimonials.title")}
          </h2>
          <p className="testimonials-text">{t("testimonials.text")}</p>
        </div>

        <div className="testimonials-row">
          {/* বড় card — Figma র "Group 65": পেছনে আবছা quote চিহ্ন
              (উপর-ডানে), উপরে আসল লেখা. দুটো layer একই card এ */}
          <article className="testimonials-featured">
            <QuoteMark />

            <Rating value={featured.rating} t={t} />

            <div className="testimonials-body">
              {/* সব quote একই জায়গায়, একটার উপর আরেকটা — শুধু চালু টা
                  দেখা যায়. ফলে জায়গাটা সবসময় সবচেয়ে লম্বা quote এর
                  সমান থাকে: ছোট quote এলেও নিচের রেখা, ছবি আর Project
                  একই জায়গায় থাকে, আর ফোনে তীর চাপলে card লাফায় না */}
              <div className="testimonial-quotes">
                {TESTIMONIALS.map((item) => {
                  const active = item.id === featured.id;
                  return (
                    <p
                      key={item.id}
                      className="testimonial-quote"
                      data-active={active ? "true" : undefined}
                      aria-hidden={active ? undefined : "true"}
                    >
                      {t(`testimonials.items.${item.id}.quote`)}
                    </p>
                  );
                })}
              </div>
              <hr className="testimonial-divider" />
              <div className="testimonial-person">
                <Avatar name={featuredInfo.name} src={featured.avatar} className="testimonial-avatar-lg" />
                <div className="testimonial-person-info">
                  <span className="testimonial-name">{featuredInfo.name}</span>
                  <span className="testimonial-role">{featuredInfo.role}</span>
                </div>
                <ProjectLink to={featured.projectTo} label={t("testimonials.project")} />
              </div>
            </div>
          </article>

          {/* ছোট দুইটা card — ক্লিক করলে সেটাই featured হয়ে যায়.

              আগে পুরো card টাই একটা বোতাম ছিল, আর তার ভেতরে
              "Project" link — HTML এ বোতামের ভেতরে link রাখা নিষেধ,
              "Project" চাপলে দুইটা কাজ একসাথে ঘটত. এখন বোতাম আর link
              পাশাপাশি; বোতামের অদৃশ্য ::after পুরো card ঢেকে রাখে,
              তাই card এর যেকোনো জায়গায় ক্লিক করলেই বাছাই হয়, আর link
              টা তার উপরে বসে আলাদাভাবে কাজ করে */}
          <div className="testimonials-side">
            {upcoming.map((item) => {
              const info = infoFor(item);
              return (
                <article key={item.id} className="testimonials-mini">
                  <button
                    type="button"
                    className="testimonials-mini-select"
                    onClick={() => setActiveIndex(TESTIMONIALS.indexOf(item))}
                  >
                    <Avatar name={info.name} src={item.avatar} className="testimonial-avatar-sm" />
                    <span className="testimonial-mini-info">
                      <span className="testimonial-name">{info.name}</span>
                      <span className="testimonial-role">{info.role}</span>
                    </span>
                    <MiniRating value={item.rating} t={t} />
                  </button>
                  <ProjectLink to={item.projectTo} label={t("testimonials.project")} />
                </article>
              );
            })}
          </div>

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