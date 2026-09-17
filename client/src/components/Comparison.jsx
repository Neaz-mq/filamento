import { useTranslation } from "react-i18next";
import "./Comparison.css";

/* Figma "Frame 509" — বাঁয়ে শিরোনাম, ডানে Filamento বনাম সাধারণ
   LED এর তুলনার table।

   আসল <table> ব্যবহার করা হয়েছে, div দিয়ে বানানো grid নয় —
   screen reader তখন প্রতিটা ঘরের সাথে কলামের নাম ("Traditional LED")
   আর সারির নাম ("Warranty") দুইটাই পড়ে শোনায়। div grid এ এটা হয় না */

/* সারির ক্রম Figma অনুযায়ী। নতুন সারি লাগলে এখানে id যোগ করে
   তিনটা locale ফাইলে comparison.rows.<id> বসালেই হবে */
const ROWS = ["energy", "dimming", "glare", "lifetime", "warranty", "design"];

/* Figma: 20px, stroke 2, #373A3C — lucide এর lightbulb.
   viewBox 24 এর, দেখানো হয় 20px এ; তাই stroke 2.4 দিলে পর্দায়
   ঠিক 2px দাঁড়ায় (2.4 × 20/24 = 2) */
function LightbulbIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

/* Figma: 24px, stroke 1.5, #F7BE00 — badge এর ভেতরে টিক চিহ্ন.
   path দুইটা Figma র "Copy as SVG" থেকে হুবহু নেওয়া.

   stroke এ #F7BE00 সরাসরি না লিখে currentColor — রঙটা CSS এর
   .comparison-check থেকে আসে, তাই পরে রঙ বদলাতে হলে শুধু CSS এ */
const BADGE_PATH =
  "M3.84922 8.61912C3.70326 7.96165 3.72567 7.27796 3.91437 6.63146C4.10308 5.98496 4.45196 5.39657 4.92868 4.92084C5.40541 4.44512 5.99453 4.09747 6.64142 3.91012C7.28832 3.72277 7.97205 3.70179 8.62922 3.84912C8.99093 3.28342 9.48922 2.81788 10.0782 2.49541C10.6671 2.17293 11.3278 2.00391 11.9992 2.00391C12.6707 2.00391 13.3313 2.17293 13.9203 2.49541C14.5092 2.81788 15.0075 3.28342 15.3692 3.84912C16.0274 3.70114 16.7123 3.72203 17.3602 3.90984C18.0081 4.09764 18.598 4.44626 19.0751 4.92327C19.5521 5.40029 19.9007 5.99019 20.0885 6.63812C20.2763 7.28605 20.2972 7.97095 20.1492 8.62912C20.7149 8.99083 21.1805 9.48913 21.5029 10.0781C21.8254 10.667 21.9944 11.3277 21.9944 11.9991C21.9944 12.6706 21.8254 13.3312 21.5029 13.9202C21.1805 14.5091 20.7149 15.0074 20.1492 15.3691C20.2966 16.0263 20.2756 16.71 20.0882 17.3569C19.9009 18.0038 19.5532 18.5929 19.0775 19.0697C18.6018 19.5464 18.0134 19.8953 17.3669 20.084C16.7204 20.2727 16.0367 20.2951 15.3792 20.1491C15.018 20.717 14.5193 21.1845 13.9293 21.5084C13.3394 21.8324 12.6772 22.0022 12.0042 22.0022C11.3312 22.0022 10.669 21.8324 10.0791 21.5084C9.48914 21.1845 8.99045 20.717 8.62922 20.1491C7.97205 20.2965 7.28832 20.2755 6.64142 20.0881C5.99453 19.9008 5.40541 19.5531 4.92868 19.0774C4.45196 18.6017 4.10308 18.0133 3.91437 17.3668C3.72567 16.7203 3.70326 16.0366 3.84922 15.3791C3.27917 15.0184 2.80963 14.5193 2.48426 13.9283C2.1589 13.3374 1.98828 12.6737 1.98828 11.9991C1.98828 11.3245 2.1589 10.6609 2.48426 10.0699C2.80963 9.47895 3.27917 8.97988 3.84922 8.61912Z";

function CheckIcon() {
  return (
    <svg
      className="comparison-check"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={BADGE_PATH} />
      <path d="M9 12L11 14L15 10" />
    </svg>
  );
}

function Comparison() {
  const { t } = useTranslation();

  return (
    <section className="comparison" aria-labelledby="comparison-title">
      <div className="comparison-inner">
        {/* Figma: Frame 192 — 320px চওড়া */}
        <div className="comparison-intro">
          <h2 id="comparison-title" className="comparison-title">
            {t("comparison.title")}
          </h2>
          <p className="comparison-text">{t("comparison.text")}</p>
        </div>

        {/* Figma: Frame 257 (সাদা) + Frame 253 (border) */}
        <div className="comparison-table-wrap">
          {/* role গুলো বাড়তি মনে হলেও দরকারি: ফোনে CSS দিয়ে table
              কে block বানানো হয়, তখন Safari table এর অর্থ ভুলে যায়.
              role থাকলে screen reader তখনও এটাকে table হিসেবেই পড়ে */}
          <table className="comparison-table" role="table">
            {/* চোখে দেখা যায় না, কিন্তু screen reader table এর নাম
                হিসেবে পড়ে */}
            <caption className="sr-only">
              {t("comparison.caption")}
            </caption>

            <thead role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader">
                  {t("comparison.columns.metric")}
                </th>
                <th scope="col" role="columnheader">
                  {t("comparison.columns.traditional")}
                </th>
                <th scope="col" role="columnheader">
                  {/* Figma: হলুদ pill, 146 x 36 */}
                  <span className="comparison-badge">
                    <LightbulbIcon />
                    {t("comparison.columns.filamento")}
                  </span>
                </th>
              </tr>
            </thead>

            <tbody role="rowgroup">
              {ROWS.map((row) => (
                <tr key={row} role="row">
                  <th scope="row" role="rowheader">
                    {t(`comparison.rows.${row}.label`)}
                  </th>
                  {/* data-label — ফোনে ঘরের উপরে কলামের নাম দেখানোর জন্য */}
                  <td
                    role="cell"
                    className="comparison-traditional"
                    data-label={t("comparison.columns.traditional")}
                  >
                    {t(`comparison.rows.${row}.traditional`)}
                  </td>
                  <td role="cell" data-label={t("comparison.columns.filamento")}>
                    <span className="comparison-ours">
                      <CheckIcon />
                      <span>{t(`comparison.rows.${row}.filamento`)}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Comparison;