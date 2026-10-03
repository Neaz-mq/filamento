import { useState } from "react";
import { Link } from "react-router-dom";
import { thumb } from "../products/upload";
import { interestOf, locationOf, LEAD_STATUS, statusOf, timeAgo } from "../leadFormat";
import {
  IconArrowRight,
  IconBox,
  IconChartSuccess,
  IconChevron,
  IconEdit,
  IconFolder,
  IconHeartEdit,
  IconPerson,
  IconSettings,
  IconTickSquare,
  IconTrash,
  IconTrend,
  IconUploadCloud,
  IconUsers,
} from "../icons";
import AdminSelect from "../AdminSelect";

/* ===============================================================
   Dashboard এর টুকরোগুলো — Figma র প্রতিটা box একটা component

   সংখ্যা আসে AdminHome.jsx থেকে (server এর /api/admin/overview).
   এখানে শুধু দেখানো — কোনো request এখান থেকে যায় না
   =============================================================== */

const plain = new Intl.NumberFormat("en-US");
// 2400 → "2.4K"
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/* ---------------------------------------------------------------
   ছোট pill এর dropdown — "This Week ⌄", "All Time ⌄"

   চোখে Figma র pill, ভেতরে AdminSelect এর অদৃশ্য ঘর (পুরো pill এর
   উপরে বসানো). চাপলে admin এর সাধারণ dropdown তালিকা খোলে —
   keyboard আর screen reader এও চলে
   --------------------------------------------------------------- */
export function PillSelect({ label, value, options, onChange, variant = "round" }) {
  const current = options.find((option) => option.value === value) ?? options[0];
  return (
    <label className={`dsh-pill dsh-pill--${variant}`}>
      <span>{current.label}</span>
      <IconChevron size={14} />
      <AdminSelect
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </AdminSelect>
    </label>
  );
}

/* ---------------------------------------------------------------
   সংখ্যার card — Figma "Card" (245 × 164)

   change — শতাংশ (server থেকে). null মানে তুলনা করার মতো আগের
            কিছু নেই — তখন লেখাটা দেখায় না, বানানো সংখ্যা বসে না
   locked — editor এর জন্য গ্রাহকের সংখ্যা লুকানো
   --------------------------------------------------------------- */
function Change({ change, period }) {
  if (change === null || change === undefined) return null;
  const rounded = Math.abs(change) % 1 === 0 ? Math.abs(change) : Math.abs(change).toFixed(1);
  const tone = change > 0 ? "up" : change < 0 ? "down" : "flat";
  return (
    <p className={`dsh-change is-${tone}`}>
      {tone !== "flat" && <IconTrend down={tone === "down"} size={13} />}
      <span>
        {rounded}% {period}
      </span>
    </p>
  );
}

export function StatCard({ title, Icon, to, value, change, period, split, locked, loading }) {
  return (
    <Link to={to} className="dsh-stat" aria-busy={loading || undefined}>
      <div className="dsh-stat-top">
        <h2 className="dsh-stat-title">{title}</h2>
        <span className="dsh-stat-icon" aria-hidden="true">
          <Icon size={20} />
        </span>
      </div>

      <div className="dsh-stat-row">
        <p className="dsh-stat-value">{locked || loading ? "–" : plain.format(value ?? 0)}</p>
        {!locked && !loading && <Change change={change} period={period} />}
      </div>

      <p className="dsh-stat-split">
        {locked ? (
          <span className="dsh-stat-lock">Owners &amp; admins only</span>
        ) : (
          split.map(([count, label]) => (
            <span key={label}>
              {loading ? "–" : plain.format(count ?? 0)} {label}
            </span>
          ))
        )}
      </p>
    </Link>
  );
}

/* ---------------------------------------------------------------
   Product Activity — সপ্তাহের ৭ দিন, প্রতিদিন product এর পাতা কতবার
   দেখা হয়েছে (Figma: S M T W T F S, ৩৬ চওড়া গোল দণ্ড, 110 উঁচু)

   রঙের নিয়ম (Figma র রঙগুলো দিয়ে):
     বাছা দিন   — গাঢ় সোনালি #6F5500, উপরে সংখ্যার ছোট box
     সবচেয়ে বেশি — #DEAB00
     সবচেয়ে কম  — ধূসর-কালো #373A3C
     বাকি দিন   — হলুদ #F7BE00
     আগামী দিন  — হালকা ধূসর (এখনো আসেনি, তাই ছোট খাটো দণ্ড)

   শুরুতে বাছা থাকে আজ (এই সপ্তাহ) বা সবচেয়ে ব্যস্ত দিন (গত সপ্তাহ).
   দণ্ডে mouse রাখলে বা চাপলে সেই দিনের সংখ্যা দেখায়
   --------------------------------------------------------------- */
const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const BAR_MAX = 110;
const WEEK_OPTIONS = [
  { value: "this", label: "This Week" },
  { value: "last", label: "Last Week" },
];

export function ProductActivity({ views, today, loading }) {
  const [range, setRange] = useState("this");
  const [picked, setPicked] = useState(null);

  const days = (range === "this" ? views?.thisWeek : views?.lastWeek) ?? [];
  const past = days.filter((item) => item.views !== null);
  const values = past.map((item) => item.views);
  const max = values.length ? Math.max(...values) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const total = values.reduce((sum, value) => sum + value, 0);

  const todayIndex = days.findIndex((item) => item.day === today);
  const peakIndex = days.findIndex((item) => item.views === max && max > 0);
  const fallback = range === "this" && todayIndex >= 0 ? todayIndex : peakIndex;
  const chosen = picked ?? fallback;

  const toneOf = (item, index) => {
    if (item.views === null) return "future";
    if (index === chosen) return "pick";
    if (max > 0 && item.views === max) return "peak";
    if (past.length > 1 && max > min && item.views === min) return "low";
    return "base";
  };

  const heightOf = (item) => {
    if (item.views === null) return 24;
    if (!max || !item.views) return 6;
    return Math.max(8, Math.round((item.views / max) * BAR_MAX));
  };

  return (
    <section className="dsh-panel dsh-activity" aria-labelledby="dsh-activity-title">
      <div className="dsh-panel-head">
        <h2 className="dsh-panel-title" id="dsh-activity-title">
          Product Activity
        </h2>
        <PillSelect
          label="Which week"
          value={range}
          options={WEEK_OPTIONS}
          onChange={(value) => {
            setRange(value);
            setPicked(null);
          }}
        />
      </div>

      <div className="dsh-bars" aria-busy={loading || undefined}>
        {days.map((item, index) => {
          const weekday = new Date(`${item.day}T00:00:00Z`).getUTCDay();
          const tone = toneOf(item, index);
          const height = heightOf(item);
          const when = `${WEEKDAY_FULL[weekday]}, ${dayLabel.format(new Date(`${item.day}T00:00:00Z`))}`;
          const said =
            item.views === null
              ? `${when}: still to come`
              : `${when}: ${plain.format(item.views)} product view${item.views === 1 ? "" : "s"}`;

          return (
            <button
              type="button"
              key={item.day}
              className="dsh-bar"
              onMouseEnter={() => item.views !== null && setPicked(index)}
              onFocus={() => item.views !== null && setPicked(index)}
              onClick={() => item.views !== null && setPicked(index)}
              aria-label={said}
              aria-pressed={index === chosen}
              title={said}
            >
              <span className="dsh-bar-track">
                <span className={`dsh-bar-fill is-${tone}`} style={{ height }} />
                {index === chosen && item.views !== null && (
                  <>
                    <span className="dsh-bar-tip" style={{ bottom: height + 3 }}>
                      {compact.format(item.views)}
                    </span>
                    <span className="dsh-bar-dot" style={{ bottom: Math.max(0, height - 3) }} />
                  </>
                )}
              </span>
              <span className="dsh-bar-day">{WEEKDAY[weekday]}</span>
            </button>
          );
        })}

        {!loading && days.length > 0 && total === 0 && (
          <p className="dsh-bars-empty">No product page views {range === "this" ? "this week yet" : "last week"}.</p>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Quick Actions — Figma: ২ কলাম, ৪৮ উঁচু ঘর, প্রথমটা হলুদ

   Add Product আর Add Project শুধু owner/admin পারেন (server এর
   নিয়ম). editor এর কাছে ঘর দুটো ধূসর, চাপলে কিছু হয় না, কারণটা
   mouse রাখলে লেখা আসে
   --------------------------------------------------------------- */
export function QuickActions({ canEdit, onAddProduct }) {
  const actions = [
    { label: "Add Product", Icon: IconBox, onClick: onAddProduct, needsEdit: true, primary: true },
    { label: "Add Project", Icon: IconChartSuccess, to: "/admin/projects/new", needsEdit: true },
    { label: "Add Application", Icon: IconTickSquare, to: "/admin/application" },
    { label: "Add Testimonial", Icon: IconHeartEdit, to: "/admin/testimonials" },
    { label: "Edit Homepage", Icon: IconEdit, to: "/admin/home" },
    { label: "Upload Resource", Icon: IconUploadCloud, to: "/admin/media" },
  ];

  return (
    <section className="dsh-panel dsh-quick" aria-labelledby="dsh-quick-title" id="quick-actions">
      <div className="dsh-panel-head">
        <h2 className="dsh-panel-title" id="dsh-quick-title">
          Quick Actions
        </h2>
      </div>

      <div className="dsh-actions">
        {actions.map(({ label, Icon, to, onClick, needsEdit, primary }) => {
          const className = `dsh-action${primary ? " is-primary" : ""}`;
          const inside = (
            <>
              <span className="dsh-action-label">
                <Icon size={16} />
                {label}
              </span>
              <IconArrowRight size={16} />
            </>
          );

          if (needsEdit && !canEdit) {
            return (
              <span
                key={label}
                className={`${className} is-disabled`}
                aria-disabled="true"
                title="Only owners and admins can add this"
              >
                {inside}
              </span>
            );
          }

          return onClick ? (
            <button key={label} type="button" className={className} onClick={onClick}>
              {inside}
            </button>
          ) : (
            <Link key={label} to={to} className={className}>
              {inside}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Recent Leads — Figma: ৬ কলামের সারি (Lead 220 · Company 130 ·
   Interest 160 · Location 115 · Time 60 · Status 100)
   --------------------------------------------------------------- */
export function RecentLeads({ leads, canSeeLeads, now, loading }) {
  return (
    <section className="dsh-panel dsh-leads" aria-labelledby="dsh-leads-title">
      <div className="dsh-panel-head">
        <h2 className="dsh-panel-title" id="dsh-leads-title">
          Recent Leads
        </h2>
        {canSeeLeads && (
          <Link to="/admin/leads" className="dsh-more">
            View All
            <IconArrowRight size={16} />
          </Link>
        )}
      </div>

      {!canSeeLeads && !loading ? (
        <p className="dsh-empty">Customer details are visible to owners and admins only.</p>
      ) : (
        <div className="dsh-table" role="table" aria-label="Recent leads" aria-busy={loading || undefined}>
          <div className="dsh-tr dsh-thead" role="row">
            <span role="columnheader">Lead</span>
            <span role="columnheader">Company</span>
            <span role="columnheader">Interest</span>
            <span role="columnheader">Location</span>
            <span role="columnheader">Time</span>
            <span role="columnheader" className="dsh-td-center">
              Status
            </span>
          </div>

          {(leads ?? []).map((lead) => {
            const status = statusOf(lead.status);
            return (
              <div className="dsh-tr dsh-row" role="row" key={lead.id}>
                <span role="cell" className="dsh-lead">
                  <span className="dsh-lead-avatar" aria-hidden="true">
                    <IconPerson size={18} />
                  </span>
                  <span className="dsh-lead-text">
                    <span className="dsh-lead-name">{lead.name || "—"}</span>
                    <a className="dsh-lead-mail" href={`mailto:${lead.email}`}>
                      {lead.email}
                    </a>
                  </span>
                </span>
                <span role="cell" data-label="Company" className="dsh-cell">
                  {lead.company || "—"}
                </span>
                <span role="cell" data-label="Interest" className="dsh-cell">
                  {interestOf(lead.facilityType)}
                </span>
                <span role="cell" data-label="Location" className="dsh-cell">
                  {locationOf(lead.location)}
                </span>
                <span role="cell" data-label="Time" className="dsh-cell">
                  {timeAgo(lead.createdAt, now)}
                </span>
                <span role="cell" data-label="Status" className="dsh-td-center">
                  <span className={`dsh-status is-${status}`}>{LEAD_STATUS[status]}</span>
                </span>
              </div>
            );
          })}

          {!loading && leads && leads.length === 0 && (
            <p className="dsh-empty">
              No quote requests yet. New leads from the website’s contact form will show up here.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------
   Top Performing Products — সবচেয়ে বেশি দেখা ৫টা product
   --------------------------------------------------------------- */
const TOP_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "month", label: "Last 30 Days" },
  { value: "week", label: "Last 7 Days" },
];

export function TopProducts({ top, loading }) {
  const [range, setRange] = useState("all");
  const list = top?.[range] ?? [];
  const max = list.length ? Math.max(...list.map((item) => item.views)) : 0;

  return (
    <section className="dsh-panel dsh-top" aria-labelledby="dsh-top-title">
      <div className="dsh-panel-head">
        <h2 className="dsh-panel-title" id="dsh-top-title">
          Top Performing Products
        </h2>
        <PillSelect
          label="Time range"
          value={range}
          options={TOP_OPTIONS}
          onChange={setRange}
          variant="square"
        />
      </div>

      <ul className="dsh-top-list" aria-busy={loading || undefined}>
        {list.map((item) => (
          <li key={item.id}>
            <Link to={`/admin/products/${item.id}`} className="dsh-top-row">
              <span className="dsh-top-thumb" aria-hidden="true">
                {item.image ? (
                  <img src={thumb(item.image, 96)} alt="" loading="lazy" />
                ) : (
                  <IconBox size={20} />
                )}
              </span>
              <span className="dsh-top-middle">
                <span className="dsh-top-name">{item.name || "Untitled product"}</span>
                <span className="dsh-top-track" aria-hidden="true">
                  <span style={{ width: `${max ? Math.max(4, (item.views / max) * 100) : 0}%` }} />
                </span>
              </span>
              <span className="dsh-top-views">
                {compact.format(item.views)} {item.views === 1 ? "View" : "Views"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {!loading && list.length === 0 && (
        <p className="dsh-empty">
          {range === "all"
            ? "No product page views yet."
            : "No product page views in this period yet."}
        </p>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------
   Recent Activity — কে, কী করল (activity log থেকে)
   --------------------------------------------------------------- */
const ACTIONS = {
  "product.create": ["Added Product", "green", IconBox],
  "product.update": ["Updated Product", "green", IconBox],
  "product.publish": ["Published Product", "green", IconBox],
  "product.duplicate": ["Duplicated Product", "green", IconBox],
  "product.delete": ["Deleted Product", "red", IconTrash],
  "project.create": ["Added Project", "blue", IconFolder],
  "project.update": ["Updated Project", "blue", IconFolder],
  "project.publish": ["Published Project", "blue", IconFolder],
  "project.duplicate": ["Duplicated Project", "blue", IconFolder],
  "project.delete": ["Deleted Project", "red", IconTrash],
  "admin.create": ["Added Team Member", "yellow", IconUsers],
  "admin.update": ["Updated Team Member", "yellow", IconUsers],
  "admin.delete": ["Removed Team Member", "red", IconUsers],
  // Home Page Content এর একটা ট্যাব save — নিচে ট্যাবের নাম (Hero …)
  "home.update": ["Updated Home Page", "yellow", IconEdit],
};

const actionOf = (action) => ACTIONS[action] ?? ["Made a Change", "yellow", IconSettings];

export function RecentActivity({ items, now, loading }) {
  return (
    <section className="dsh-panel dsh-recent" aria-labelledby="dsh-recent-title">
      <div className="dsh-panel-head">
        <h2 className="dsh-panel-title" id="dsh-recent-title">
          Recent Activity
        </h2>
        <Link to="/admin/activity" className="dsh-more">
          View All Activity
          <IconArrowRight size={16} />
        </Link>
      </div>

      <ul className="dsh-feed" aria-busy={loading || undefined}>
        {(items ?? []).map((item) => {
          const [verb, tone, Icon] = actionOf(item.action);
          return (
            <li className="dsh-feed-row" key={item.id}>
              <span className={`dsh-feed-icon is-${tone}`} aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className="dsh-feed-text">
                <span className="dsh-feed-title">
                  <span className="dsh-feed-actor">{item.actor}</span> {verb}
                </span>
                <span className="dsh-feed-note">{item.subject || "—"}</span>
              </span>
              <span className="dsh-feed-time">{timeAgo(item.createdAt, now)}</span>
            </li>
          );
        })}
      </ul>

      {!loading && items && items.length === 0 && (
        <p className="dsh-empty">Nothing yet — changes to products, projects and the team show up here.</p>
      )}
    </section>
  );
}
