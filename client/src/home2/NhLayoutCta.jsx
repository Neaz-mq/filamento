import { useTranslation } from "react-i18next";
import { DoubleChevron } from "./icons";

/* ===============================================================
   "Get A Lighting Layout…" — Figma "Frame 2147228150"

   সাদা → হলুদ ঢালের বড় গোল কোণার বাক্স. বাঁ-নিচে হলুদ আর সাদা
   ফাইলের মতো আকৃতি, ডান-উপরে ঘোরানো হলুদ চৌকো রেখা, ডান-নিচে
   হালকা কমলা আভা.

   Figma র আভাটা filter: blur(100px) — বড় blur প্রতি frame এ আবার
   আঁকতে হয়, scroll ভারী করে. তার বদলে radial-gradient (দেখতে একই,
   খরচ প্রায় শূন্য). Figma র নীল "Star 2" ডিজাইনের ছবিতে দেখা যায়
   না, তাই বাদ.

   আকৃতিগুলো ধীরে একটু ভাসে — CSS animation, শুধু transform, তাই
   GPU তেই চলে, main thread এ কোনো কাজ নেই. বাক্সটা পর্দায় আসার
   (data-shown) আগে শুরু হয় না
   =============================================================== */

function NhLayoutCta() {
  const { t } = useTranslation();

  return (
    <section className="nh-section nh-cta" aria-labelledby="nh-cta-title">
      <div className="nh-wrap">
        <div className="nh-cta-box" data-reveal="">
          <div className="nh-cta-deco" aria-hidden="true">
            <span className="nh-cta-folder nh-cta-folder--yellow">
              <span className="nh-cta-tab" />
              <span className="nh-cta-body" />
            </span>
            <span className="nh-cta-folder nh-cta-folder--white">
              <span className="nh-cta-tab" />
              <span className="nh-cta-body" />
            </span>
            <span className="nh-cta-star" />
            <span className="nh-cta-glow" />
          </div>

          <div className="nh-cta-copy">
            <h2 id="nh-cta-title" className="nh-h2" data-reveal="" style={{ "--d": 1 }}>
              {t("home2.cta.title")}
            </h2>
            <p className="nh-cta-text" data-reveal="" style={{ "--d": 2 }}>
              {t("home2.cta.text")}
            </p>
            <a href="#contact" className="nh-btn-layout" data-reveal="" style={{ "--d": 3 }}>
              <span className="nh-btn-quote-box">
                <DoubleChevron />
              </span>
              <span>{t("home2.cta.button")}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NhLayoutCta;
