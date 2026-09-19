import { useId } from "react";
import { Link } from "react-router-dom";
import AdminClock from "./AdminClock";
import { useDocumentTitle } from "./AdminAuth";
import {
  demandBySeries,
  homeSections,
  recentActivity,
  recentLeads,
  stats,
} from "./dashboardData";
import {
  IconArrowRight,
  IconBolt,
  IconBox,
  IconCalendar,
  IconChart,
  IconChat,
  IconChevron,
  IconClock,
  IconFolder,
  IconImage,
  IconLayers,
  IconPencil,
  IconPlus,
  IconSettings,
  IconTickSquare,
  IconTrend,
  IconUsers,
} from "./icons";

/* ===============================================================
   Dashboard — Figma র নকশা অনুযায়ী

   ⚠️ পর্দার সব সংখ্যা এখন dashboardData.js এর স্থির নমুনা.
   database এ এখনো product বা lead নেই, তাই গোনার কিছু নেই.
   ধাপ ৪ এ ওই ফাইলটা server এর উত্তর দিয়ে বদলে যাবে.

   এখনো কাজ করে না (শুধু নকশা): উপরের 🔔, তারিখের বোতাম, আর
   "View All Activity".
   কাজ করে: search, ঘড়ি, Edit বোতাম, Quick Action এর card,
   sidebar এর সব link

   টেবিলের সারিতে আগে একটা টানার হাতল (≡) আর "⋮" মেনু ছিল —
   দুইটাই কিছু করত না, তাই সরানো হয়েছে. সাজানো আর
   দেখানো/লুকানো সত্যিই তৈরি হলে ওগুলো ফিরে আসবে.

   "Last update" কলামটাও সরানো — অংশগুলোর লেখা এখনো কোডে আর
   locale ফাইলে, database এ নয়. তাই "কখন শেষ বদলেছে" বলে কিছু
   কোথাও লেখা থাকে না; সাতটা সারিতে একই বানানো তারিখ বসে ছিল.
   লেখা database এ এলে প্রতিটা save এ updatedAt বসবে, তখন
   কলামটা ফিরবে
   =============================================================== */

const CARD_ICONS = {
  layers: IconLayers,
  tick: IconTickSquare,
  box: IconBox,
  users: IconUsers,
  chat: IconChat,
  settings: IconSettings,
  bolt: IconBolt,
  chart: IconChart,
};

const QUICK_ACTIONS = [
  { label: "Edit Hero", to: "/admin/home/hero", Icon: IconPencil },
  { label: "Add Product", to: "/admin/products", Icon: IconPlus },
  { label: "Add Project", to: "/admin/projects", Icon: IconFolder },
  { label: "Add Testimonial", to: "/admin/testimonials", Icon: IconChat },
  { label: "Manage Logos", to: "/admin/media", Icon: IconImage },
  { label: "View Leads", to: "/admin/leads", Icon: IconUsers },
];

/* ---------------------------------------------------------------
   card এর নিচের ছোট লেখচিত্র

   preserveAspectRatio="none" — ছবিটা card এর পুরো চওড়ায় টেনে বসে.
   টানার সময় রেখাটাও মোটা হয়ে যেত, তাই non-scaling-stroke
   --------------------------------------------------------------- */
function Spark({ points }) {
  const gradientId = useId();
  const width = 200;
  const height = 60;

  const step = width / (points.length - 1);
  const dots = points.map((value, index) => [
    index * step,
    height - (value / 100) * (height - 6) - 3,
  ]);

  let line = `M ${dots[0][0]} ${dots[0][1]}`;
  for (let i = 1; i < dots.length; i += 1) {
    const [x0, y0] = dots[i - 1];
    const [x1, y1] = dots[i];
    const middle = (x0 + x1) / 2;
    line += ` C ${middle} ${y0}, ${middle} ${y1}, ${x1} ${y1}`;
  }

  return (
    <svg
      className="adm-spark"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function StatCard({ stat }) {
  const Icon = CARD_ICONS[stat.icon] || IconLayers;
  const down = stat.direction === "down";
  const bare = stat.tone === "plain";

  return (
    <article className={`adm-card adm-tone-${stat.tone}`}>
      <div className="adm-card-top">
        <h3 className="adm-card-label">{stat.label}</h3>
        <span className="adm-card-icon">
          <Icon size={20} />
        </span>
      </div>

      <div className="adm-card-body">
        <div className="adm-card-row">
          <p className="adm-card-value">{stat.value}</p>
          {/* delta না থাকলে কিছু দেখানো হয় না — বানানো শতাংশ
              বসানোর চেয়ে ফাঁকা থাকা ভালো */}
          {stat.delta && (
            <p className={bare ? "adm-delta adm-delta--bare" : "adm-delta"}>
              <IconTrend down={down} size={13} />
              {stat.delta}
            </p>
          )}
        </div>
        <Spark points={stat.spark} />
      </div>
    </article>
  );
}

function PanelHead({ Icon, title, children }) {
  return (
    <div className="adm-panel-head">
      <div className="adm-panel-head-left">
        <span className="adm-panel-icon">
          <Icon />
        </span>
        <h2 className="adm-panel-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function AdminHome() {
  useDocumentTitle("Dashboard");

  return (
    <>
      {/* ---- Overview এর সারি ---- */}
      <div className="adm-overview">
        <h2 className="adm-overview-title">Overview</h2>

        <div className="adm-overview-tools">
          <span className="adm-chip" aria-hidden="true">
            <IconCalendar size={20} />
            Jan 1 – Jun 30, 2026
          </span>
          {/* চলন্ত ঘড়ি — কাঁটা সত্যি সময় ধরে ঘোরে */}
          <AdminClock />
          <a className="adm-chip adm-chip--go" href="#quick-actions">
            <IconBolt size={18} />
            Quick Actions
            <IconChevron size={18} />
          </a>
        </div>
      </div>

      {/* ---- আটটা সংখ্যার card ---- */}
      <section className="adm-stats" aria-label="Overview numbers">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      {/* ---- Home পাতার অংশগুলো ---- */}
      <section className="adm-panel">
        <PanelHead Icon={IconLayers} title="Home Page Sections" />

        <table className="adm-table adm-table--stack adm-table--sections">
          <thead>
            <tr>
              <th scope="col">Section</th>
              <th scope="col">Status</th>
              <th scope="col" className="adm-th-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {homeSections.map((section) => (
              <tr key={section.slug}>
                <td data-label="Section">
                  <div className="adm-lead-cell">
                    <span className="adm-cell-icon">
                      <IconLayers size={20} />
                    </span>
                    <span className="adm-cell-text">
                      <span className="adm-cell-title">{section.name}</span>
                      <span className="adm-cell-note">{section.note}</span>
                    </span>
                  </div>
                </td>
                <td data-label="Status">
                  <span className="adm-pill adm-pill--green">
                    {section.status}
                  </span>
                </td>
                <td data-label="Actions" className="adm-td-end">
                  <Link
                    className="adm-btn-ghost"
                    to={`/admin/home/${section.slug}`}
                  >
                    Edit
                    <span className="sr-only"> {section.name}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Figma তে এখানে "+ Add New Section" ছিল — ইচ্ছে করে বাদ.

           Home পাতার প্রতিটা অংশ হাতে লেখা React component, নিজের
           নকশা আর animation সহ. তাই database এ নতুন একটা সারি
           বসালে সাইটে কিছুই দেখা যেত না — বোতামটা মিথ্যা প্রতিশ্রুতি
           হতো. নতুন অংশ মানে designer এর নকশা + নতুন component,
           সেটা admin panel এর কাজ নয়.

           এই তালিকায় যা দরকার সেটা হলো অংশগুলো সাজানো আর
           দেখানো/লুকানো — ≡ আর ⋮ ওই কাজ দুইটা পাবে */}
      </section>

      {/* ---- Demand by Series + Quick Actions, পাশাপাশি ---- */}
      <div className="adm-two">
        <section className="adm-panel">
          <PanelHead Icon={IconChart} title="Demand by Series" />
          <div className="adm-bars">
            {demandBySeries.map((series) => (
              <div className="adm-bar" key={series.name}>
                <div className="adm-bar-top">
                  <span className="adm-bar-name">{series.name}</span>
                  <span className="adm-bar-value">{series.percent}%</span>
                </div>
                <div
                  className="adm-track"
                  role="img"
                  aria-label={`${series.name}: ${series.percent} percent`}
                >
                  <span style={{ width: `${series.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="adm-panel" id="quick-actions">
          <PanelHead Icon={IconBolt} title="Quick Actions" />
          <div className="adm-actions">
            {QUICK_ACTIONS.map(({ label, to, Icon }) => (
              <Link className="adm-action" to={to} key={label}>
                <span className="adm-cell-icon">
                  <Icon size={20} />
                </span>
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ---- নতুন আসা lead ---- */}
      <section className="adm-panel">
        <PanelHead Icon={IconUsers} title="Recent Leads" />

        <table className="adm-table adm-table--stack">
          <thead>
            <tr>
              <th scope="col">Lead</th>
              <th scope="col">Company</th>
              <th scope="col">Interest</th>
              <th scope="col">Location</th>
              <th scope="col">Time</th>
              <th scope="col" className="adm-th-end">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {recentLeads.map((lead) => (
              <tr key={lead.id}>
                <td data-label="Lead">
                  <div className="adm-lead-cell">
                    <span className="adm-cell-icon adm-cell-icon--solid">
                      {lead.name.charAt(0)}
                    </span>
                    <span className="adm-cell-text">
                      <span className="adm-cell-title">{lead.name}</span>
                      <span className="adm-cell-note">{lead.email}</span>
                    </span>
                  </div>
                </td>
                <td data-label="Company">
                  <span className="adm-cell-title">{lead.company}</span>
                </td>
                <td data-label="Interest">
                  <span className="adm-cell-title">{lead.interest}</span>
                </td>
                <td data-label="Location">
                  <span className="adm-cell-title">{lead.location}</span>
                </td>
                <td data-label="Time">
                  <span className="adm-cell-muted">{lead.time}</span>
                </td>
                <td data-label="Status" className="adm-td-end">
                  <span
                    className={`adm-pill adm-pill--${lead.status.toLowerCase()}`}
                  >
                    {lead.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ---- সাম্প্রতিক কাজ ---- */}
      <section className="adm-panel">
        <PanelHead Icon={IconClock} title="Recent Activity">
          <span className="adm-panel-more" aria-hidden="true">
            View All Activity
            <IconArrowRight size={18} />
          </span>
        </PanelHead>

        <ul className="adm-activity">
          {recentActivity.map((item) => {
            const Icon = CARD_ICONS[item.icon] || IconPencil;
            return (
              <li className="adm-activity-row" key={item.id}>
                <span className="adm-cell-icon">
                  <Icon size={20} />
                </span>
                <span className="adm-cell-text">
                  <span className="adm-cell-title">{item.title}</span>
                  <span className="adm-cell-note">{item.note}</span>
                </span>
                <span className="adm-cell-muted">{item.time}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

export default AdminHome;