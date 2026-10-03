import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import AdminClock from "./AdminClock";
import { useAdminAuth, useDocumentTitle } from "./AdminAuth";
import CategoryModal from "./products/CategoryModal";
import {
  ProductActivity,
  QuickActions,
  RecentActivity,
  RecentLeads,
  StatCard,
  TopProducts,
} from "./dashboard/DashboardParts";
import { IconBox, IconCalendar, IconChartSuccess, IconFilterTick, IconReceipt } from "./icons";
import "./products/products.css";
import "./dashboard/dashboard.css";
import AdminSelect from "./AdminSelect";

/* ===============================================================
   Dashboard — Figma র নতুন নকশা (1030 চওড়া)

     Welcome Back, <নাম>              [📅 সময়কাল] [🕘 ঘড়ি]
     [Total Products] [Total Projects] [Quote Requests] [Total Leads]
     [Product Activity          ] [Quick Actions              ]
     [Recent Leads — পুরো চওড়া                                ]
     [Top Performing Products   ] [Recent Activity            ]

   সব সংখ্যা আসল — server এর GET /api/admin/overview থেকে
   (server/routes/overviewRoutes.js). কোথাও বানানো সংখ্যা নেই:
   কিছু না থাকলে "এখনো কিছু নেই" লেখা দেখায়.

   📅 এ চাপলে সময়কাল বদলায় (৭ / ৩০ / ৯০ দিন / ১২ মাস) — card এর
   "↑ 15% last month" এর মতো লেখা ওই সময়ের তুলনা. বাছাটা এই browser
   এ মনে থাকে.

   পাতা খোলা থাকলে প্রতি ২ মিনিটে নিজে থেকেই নতুন সংখ্যা আনে
   =============================================================== */

const PERIODS = [
  { days: 7, label: "Last 7 days", short: "last week" },
  { days: 30, label: "Last 30 days", short: "last month" },
  { days: 90, label: "Last 90 days", short: "last quarter" },
  { days: 365, label: "Last 12 months", short: "last year" },
];

const PERIOD_KEY = "fil_admin_period";
const REFRESH_MS = 2 * 60 * 1000;

const readPeriod = () => {
  try {
    const saved = Number(window.localStorage.getItem(PERIOD_KEY));
    return PERIODS.some((period) => period.days === saved) ? saved : 30;
  } catch {
    return 30;
  }
};

/* "2026-10-03" এর মতো দিনের key দিয়ে তারিখ লেখা — সময়-অঞ্চলের
   গোলমাল এড়াতে UTC ধরে (key টা নিজেই server এর দিন) */
const shortDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const fullDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function rangeText(today, days) {
  if (!today) return null;
  const end = new Date(`${today}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  return `${(sameYear ? shortDay : fullDay).format(start)} – ${fullDay.format(end)}`;
}

function AdminHome() {
  useDocumentTitle("Dashboard");
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const canEdit = ["owner", "admin"].includes(admin?.role);

  const [days, setDays] = useState(readPeriod);
  const [reload, setReload] = useState(0);
  const [choosing, setChoosing] = useState(false);

  /* key দিয়ে বোঝা হয় কোন উত্তর কোন request এর — সময়কাল বদলানোর
     পরে পুরনো ধীর উত্তর এসে নতুনটাকে ঢেকে দিতে পারে না */
  const key = `${days}:${reload}`;
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    let alive = true;
    api
      .adminOverview(days)
      .then((data) => {
        if (alive) setResult({ key, data, error: "" });
      })
      .catch((error) => {
        if (alive) setResult((old) => ({ key, data: old.data, error: error.message }));
      });
    return () => {
      alive = false;
    };
    // key এর ভেতরেই days আর reload আছে
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // খোলা থাকলে প্রতি ২ মিনিটে নতুন সংখ্যা — পেছনের tab এ নয়
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setReload((value) => value + 1);
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const data = result.data;
  // প্রথমবার আনার সময় — আগের কোনো সংখ্যা নেই
  const loading = !data;
  const period = PERIODS.find((item) => item.days === days) ?? PERIODS[1];

  const changePeriod = (value) => {
    const next = Number(value);
    setDays(next);
    try {
      window.localStorage.setItem(PERIOD_KEY, String(next));
    } catch {
      // মনে রাখা গেল না — শুধু পরের বার আবার ৩০ দিন
    }
  };

  const locked = data ? !data.canSeeLeads : false;
  const range = rangeText(data?.today, days);

  return (
    <div className="dsh">
      {/* ---- Welcome + সময়কাল + ঘড়ি ---- */}
      <div className="dsh-head">
        <h1 className="dsh-welcome">
          Welcome Back, <strong>{admin?.name || "Admin"}</strong>
        </h1>

        <div className="dsh-head-tools">
          {/* দেখতে Figma র তারিখের chip, ভেতরে AdminSelect এর অদৃশ্য ঘর */}
          <label className="adm-chip dsh-period" title="Change the comparison period">
            <IconCalendar size={20} />
            <span>{range ?? period.label}</span>
            <AdminSelect
              value={days}
              onChange={(event) => changePeriod(event.target.value)}
              aria-label="Comparison period"
            >
              {PERIODS.map((item) => (
                <option key={item.days} value={item.days}>
                  {item.label}
                </option>
              ))}
            </AdminSelect>
          </label>
          <AdminClock />
        </div>
      </div>

      {result.error && (
        <div className="dsh-alert" role="alert">
          <span>
            {data
              ? "Couldn’t refresh the numbers — showing the last ones we got."
              : `Couldn’t load the dashboard. ${result.error}`}
          </span>
          <button type="button" onClick={() => setReload((value) => value + 1)}>
            Try again
          </button>
        </div>
      )}

      {/* ---- চারটা সংখ্যার card ---- */}
      <section className="dsh-stats" aria-label={`Numbers — ${period.label}`}>
        <StatCard
          title="Total Products"
          Icon={IconBox}
          to="/admin/products"
          loading={loading}
          value={data?.products.total}
          change={data?.products.change}
          period={period.short}
          split={[
            [data?.products.published, "Published"],
            [data?.products.draft, "Draft"],
          ]}
        />
        <StatCard
          title="Total Projects"
          Icon={IconChartSuccess}
          to="/admin/projects"
          loading={loading}
          value={data?.projects.total}
          change={data?.projects.change}
          period={period.short}
          split={[
            [data?.projects.published, "Published"],
            [data?.projects.draft, "Draft"],
          ]}
        />
        <StatCard
          title="Quote Requests"
          Icon={IconReceipt}
          to="/admin/leads"
          loading={loading}
          locked={locked}
          value={data?.quotes?.total}
          change={data?.quotes?.change}
          period={period.short}
          split={[
            [data?.quotes?.new, "New"],
            [data?.quotes?.closed, "Closed"],
          ]}
        />
        <StatCard
          title="Total Leads"
          Icon={IconFilterTick}
          to="/admin/leads"
          loading={loading}
          locked={locked}
          value={data?.leads?.total}
          change={data?.leads?.change}
          period={period.short}
          split={[
            [data?.leads?.new, "New"],
            [data?.leads?.contacted, "Contacted"],
          ]}
        />
      </section>

      {/* ---- Product Activity + Quick Actions ---- */}
      <div className="dsh-pair">
        <ProductActivity views={data?.views} today={data?.today} loading={loading} />
        <QuickActions canEdit={canEdit} onAddProduct={() => setChoosing(true)} />
      </div>

      {/* ---- Recent Leads ---- */}
      <RecentLeads
        leads={data?.recentLeads}
        canSeeLeads={data ? data.canSeeLeads : true}
        now={data?.generatedAt}
        loading={loading}
      />

      {/* ---- Top Performing Products + Recent Activity ---- */}
      <div className="dsh-pair">
        <TopProducts top={data?.topProducts} loading={loading} />
        <RecentActivity items={data?.recentActivity} now={data?.generatedAt} loading={loading} />
      </div>

      {/* Add Product — Products পাতার মতোই আগে category, তারপর নতুন product */}
      {choosing && (
        <CategoryModal
          onClose={() => setChoosing(false)}
          onContinue={(category) =>
            navigate(`/admin/products/new?category=${encodeURIComponent(category)}`)
          }
        />
      )}
    </div>
  );
}

export default AdminHome;
