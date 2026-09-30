import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import NhTag from "./NhTag";
import { TESTIMONIALS, cloud } from "./data";
import { ChevronLeft, ChevronRight, MinusIcon, PlusIcon } from "./icons";

/* ===============================================================
   Testimonials — Figma "Frame 2147228148"

   বড় পর্দায় একসাথে তিনটা card: একটা খোলা (চওড়া, 640) আর দুইটা সরু
   (304). সরু card এর "+" চাপলে সেটা জায়গায় থেকেই চওড়া হয়, খোলাটা
   সরু হয়. খোলা card এর "−" চাপলে তিনটাই সমান চওড়া.
   তীর চাপলে পরের/আগের card খোলে; জানালার বাইরে গেলে পুরো সারি
   মসৃণভাবে সরে. ছোট পর্দায় একবারে একটা card, তীরে বদলায়.

   মাপ JavaScript এ হিসাব (ResizeObserver), কারণ Figma র অনুপাত
   (304 : 640 : 304) যেকোনো প্রস্থে ধরে রাখতে হয়. animation CSS এর —
   card এর প্রস্থ আর সারির transform, মাত্র ৪টা card, তাই হালকা
   =============================================================== */

const GAP = 16;
const WIDE_FROM = 900; // এর চেয়ে চওড়া হলে তিনটা card
const SIDE_RATIO = 304 / 1248; // Figma: 304 + 640 + 304 = 1248 (gap বাদে)

const count = TESTIMONIALS.length;

function NhTestimonials() {
  const { t } = useTranslation();

  const viewportRef = useRef(null);
  const [width, setWidth] = useState(0);

  // শুরুতে Figma র মতো মাঝেরটা খোলা
  const [active, setActive] = useState(Math.min(1, count - 1));
  const [start, setStart] = useState(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const wide = width >= WIDE_FROM && count >= 3;
  const visible = wide ? 3 : 1;

  // ছোট পর্দায় কোনো card বন্ধ থাকে না — একটাই পুরো চওড়া
  const current = wide ? active : (active ?? start);
  const windowStart = wide ? start : current;

  const side = wide ? (width - 2 * GAP) * SIDE_RATIO : width;
  const equal = wide ? (width - 2 * GAP) / 3 : width;
  const open = wide ? width - 2 * side - 2 * GAP : width;

  // যে card খোলা নয় তার প্রস্থ — কেউ খোলা না থাকলে সবাই সমান
  const closedWidth = current === null ? equal : side;
  const offset = windowStart * (closedWidth + GAP);

  /* তীর — পরের/আগের card খোলে, জানালার বাইরে গেলে জানালা সরে.
     শেষের পরে প্রথমটায় ফেরে (গোল) */
  const step = (direction) => {
    const base = current ?? (direction > 0 ? windowStart - 1 : windowStart + visible);
    const next = (base + direction + count) % count;

    setActive(next);
    if (next < windowStart) setStart(next);
    else if (next > windowStart + visible - 1) setStart(next - visible + 1);
  };

  const toggle = (index) => {
    setActive((value) => (value === index ? null : index));
  };

  return (
    <section className="nh-section nh-testi" aria-labelledby="nh-testi-title">
      <div className="nh-wrap">
        <NhTag number="6" label={t("home2.testimonials.tag")} data-reveal="" />

        <div className="nh-testi-head">
          <div className="nh-testi-copy">
            <h2 id="nh-testi-title" className="nh-h2 nh-h2--left" data-reveal="" style={{ "--d": 1 }}>
              {t("home2.testimonials.title")}
            </h2>
            <p className="nh-sub nh-sub--left" data-reveal="" style={{ "--d": 2 }}>
              {t("home2.testimonials.text")}
            </p>
          </div>

          <div className="nh-testi-arrows" data-reveal="" style={{ "--d": 3 }}>
            <button
              type="button"
              className="nh-arrow"
              onClick={() => step(-1)}
              aria-label={t("testimonials.prev")}
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              className="nh-arrow nh-arrow--next"
              onClick={() => step(1)}
              aria-label={t("testimonials.next")}
            >
              <ChevronRight />
            </button>
          </div>
        </div>

        <div className="nh-testi-viewport" ref={viewportRef} data-reveal="" style={{ "--d": 3 }}>
          <ul
            className="nh-testi-track"
            style={{ transform: `translate3d(${-offset}px, 0, 0)` }}
            /* মাপ জানার আগে (প্রথম frame) animation ছাড়া — নাহলে
               শূন্য থেকে ফুলে ওঠা দেখা যেত */
            data-ready={width ? "" : undefined}
          >
            {TESTIMONIALS.map((item, index) => {
              const isOpen = index === current;
              const shown = index >= windowStart && index < windowStart + visible;
              const name = t(`testimonials.items.${item.id}.name`);

              return (
                <li
                  key={item.id}
                  className="nh-tcard"
                  data-open={isOpen ? "" : undefined}
                  style={{ width: width ? (isOpen ? open : closedWidth) : undefined }}
                  inert={!shown}
                  aria-hidden={shown ? undefined : true}
                >
                  <div className="nh-tcard-top">
                    <span
                      className="nh-rating"
                      role="img"
                      aria-label={t("testimonials.ratingLabel", { value: 5 })}
                    >
                      {[0, 1, 2, 3, 4].map((dot) => (
                        <span key={dot} />
                      ))}
                    </span>

                    {wide && (
                      <button
                        type="button"
                        className="nh-tcard-toggle"
                        onClick={() => toggle(index)}
                        aria-expanded={isOpen}
                        aria-label={
                          isOpen
                            ? t("home2.testimonials.collapse")
                            : t("home2.testimonials.expand", { name })
                        }
                      >
                        {isOpen ? <MinusIcon /> : <PlusIcon />}
                      </button>
                    )}
                  </div>

                  <blockquote className="nh-tcard-quote">
                    <p>“{t(`testimonials.items.${item.id}.quote`)}”</p>
                  </blockquote>

                  <div className="nh-tcard-foot">
                    <div className="nh-person">
                      <img
                        className="nh-avatar"
                        src={cloud(item.avatar, 96)}
                        alt=""
                        width="46"
                        height="46"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="nh-person-text">
                        <span className="nh-person-name">{name}</span>
                        <span className="nh-person-role">
                          {t(`testimonials.items.${item.id}.role`)}
                        </span>
                      </span>
                    </div>

                    {item.logo && (
                      <img className="nh-tcard-logo" src={item.logo} alt="" width="92" height="46" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default NhTestimonials;
