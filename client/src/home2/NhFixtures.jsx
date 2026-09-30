import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import NhTag from "./NhTag";
import { FIXTURES, cloud, srcSet } from "./data";
import { ArrowRight } from "./icons";

/* ===============================================================
   Fixtures Product — Figma "Frame 2147228146" (#F6F6F6 পটভূমি)

   তিনটা সাদা card পাশাপাশি: নাম, লাইটের ছবি, বর্ণনা, "More Info".
   নাম আর বর্ণনা মূল পাতার fixtures.items.* থেকে — Figma তে LS1 এর
   বর্ণনা ভুল করে LA1 এর টাই বসানো ছিল, এখানে আসল লেখাটা.

   hover এ card একটু উঠে আসে, ছবি একটু বড় হয়, আর "More Info" এর
   নিচের হলুদ দাগ তীরের সাথে সামনে এগোয়
   =============================================================== */

function NhFixtures() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

  return (
    <section className="nh-section nh-fixtures" aria-labelledby="nh-fixtures-title">
      <div className="nh-wrap">
        <header className="nh-head">
          <NhTag number="2" label={t("home2.fixtures.tag")} data-reveal="" />
          <h2 id="nh-fixtures-title" className="nh-h2" data-reveal="" style={{ "--d": 1 }}>
            {t("home2.fixtures.title")}
          </h2>
          <p className="nh-sub" data-reveal="" style={{ "--d": 2 }}>
            {t("fixtures.subhead")}
          </p>
        </header>

        <ul className="nh-fixture-grid">
          {FIXTURES.map((fixture, index) => (
            <li
              key={fixture.id}
              className="nh-fixture"
              data-reveal=""
              style={{ "--d": index + 1 }}
            >
              <div className="nh-fixture-body">
                <h3 className="nh-fixture-title">
                  {t(`fixtures.items.${fixture.id}.title`)}
                </h3>
                <div className="nh-fixture-media">
                  <img
                    src={cloud(fixture.path, 600, fixture)}
                    srcSet={srcSet(fixture.path, [300, 600, 900], fixture)}
                    sizes="300px"
                    alt=""
                    width="300"
                    height="230"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p className="nh-fixture-text">
                  {t(`fixtures.items.${fixture.id}.description`)}
                </p>
              </div>

              {/* গোটা card নয়, শুধু এই link টা চাপা যায় — কিন্তু CSS এ
                  এর ::after পুরো card ঢেকে দেয়, তাই card এর যেকোনো
                  জায়গায় চাপলেই যায় (screen reader এ একটাই link) */}
              <Link to={localeLink("/products")} className="nh-more">
                <span className="nh-more-row">
                  {t("home2.fixtures.moreInfo")}
                  <ArrowRight size={18} strokeWidth={1.2} />
                </span>
                <span className="nh-more-bar" aria-hidden="true" />
                <span className="sr-only">
                  {" "}
                  — {t(`fixtures.items.${fixture.id}.title`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default NhFixtures;
