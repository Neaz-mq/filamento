import { useTranslation } from "react-i18next";
import NhTag from "./NhTag";
import { BENEFITS, IMAGES, cloud, srcSet } from "./data";
import { DollarIcon, RocketIcon, SunIcon, WrenchIcon } from "./icons";

/* ===============================================================
   Why Choose Us — Figma "Frame 2147228151"

   উপর থেকে হলুদ → নিচে সাদা পটভূমি. বাঁয়ে বড় ছবি, ডানে ২x২ সাদা
   card, প্রতিটায় হলুদ বৃত্তে icon.

   লেখা মূল পাতার fixtures.benefits.* থেকে (Figma র লেখা হুবহু এক).
   শিরোনাম আর নিচের লেখা Figma তে Fixtures section এর হুবহু কপি —
   designer এর সাথে মিলিয়ে নেওয়া দরকার, আপাতত Figma যেমন

   hover এ icon এর বৃত্ত একটু ঘুরে বড় হয়, card একটু উঠে আসে
   =============================================================== */

const ICONS = {
  maintenance: WrenchIcon,
  visibility: SunIcon,
  installation: RocketIcon,
  roi: DollarIcon,
};

function NhChoose() {
  const { t } = useTranslation();

  return (
    <section className="nh-section nh-choose" aria-labelledby="nh-choose-title">
      <div className="nh-wrap">
        <header className="nh-head">
          <NhTag number="4" label={t("home2.choose.tag")} tone="black" data-reveal="" />
          <h2 id="nh-choose-title" className="nh-h2" data-reveal="" style={{ "--d": 1 }}>
            {t("home2.choose.title")}
          </h2>
          <p className="nh-sub" data-reveal="" style={{ "--d": 2 }}>
            {t("fixtures.subhead")}
          </p>
        </header>

        <div className="nh-choose-row">
          <figure className="nh-choose-media" data-reveal="zoom">
            <img
              src={cloud(IMAGES.choose, 1100)}
              srcSet={srcSet(IMAGES.choose, [600, 900, 1100, 1650])}
              sizes="(max-width: 900px) 92vw, 524px"
              alt={t("home2.choose.imageAlt")}
              loading="lazy"
              decoding="async"
            />
          </figure>

          <ul className="nh-choose-grid">
            {BENEFITS.map((id, index) => {
              const Icon = ICONS[id];
              return (
                <li
                  key={id}
                  className="nh-benefit"
                  data-reveal=""
                  style={{ "--d": index + 1 }}
                >
                  <span className="nh-benefit-icon">
                    <Icon />
                  </span>
                  <div className="nh-benefit-text">
                    <h3 className="nh-benefit-title">
                      {t(`fixtures.benefits.${id}.title`)}
                    </h3>
                    <p className="nh-benefit-desc">
                      {t(`fixtures.benefits.${id}.text`)}
                    </p>
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

export default NhChoose;
