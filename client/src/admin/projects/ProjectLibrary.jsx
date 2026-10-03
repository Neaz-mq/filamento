import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAdminAuth, useDocumentTitle } from "../AdminAuth";
import AdminClock from "../AdminClock";
import { ConfirmModal } from "../products/Modal";
import { thumb } from "../products/upload";
import { CATEGORIES, STATUSES, labelOf } from "./projectCatalog";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconChevron,
  IconClipboardTick,
  IconCopy,
  IconEye,
  IconFolder,
  IconImage,
  IconLocation,
  IconMap,
  IconMoreCircle,
  IconPencil,
  IconPie,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTrash,
  IconTrend,
} from "../icons";
import "../products/products.css";
import "./projects.css";
import AdminSelect from "../AdminSelect";

/* ===============================================================
   Project Library — /admin/projects (Figma: 1030 × 1240)

   উপরে চারটা সংখ্যা (Total, Completed, In Progress, Draft), তার
   নিচে Project Overview (গোল চার্ট) আর Projects by Location, তারপর
   তালিকা.

   খোঁজা, ছাঁকা, সাজানো আর পাতা নম্বর ঠিকানায় (?q=…&status=…) থাকে —
   reload করলে বা link পাঠালে একই তালিকা খোলে. চার্টের রং বা দেশের
   নামে চাপলেও তালিকা সেভাবে ছেঁকে যায়.

   editor ভূমিকার admin শুধু দেখতে পারে (আসল পাহারা server এ)
   =============================================================== */

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "updated", label: "Last updated" },
  { value: "date", label: "Project date" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
];

const PAGE_SIZES = [5, 10, 20, 50];
const STATUS_ORDER = ["completed", "in-progress", "draft"];

const plain = new Intl.NumberFormat("en-US");

const today = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const dayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

// পাতা নম্বরের সারি — 1 2 … 5. বর্তমানের দুই পাশে একটা করে
function pageList(page, pages) {
  const wanted = new Set([1, pages, page - 1, page, page + 1]);
  const numbers = [...wanted].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  numbers.forEach((n, i) => {
    if (i > 0 && n - numbers[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

const percentOf = (part, total) => (total ? Math.round((part / total) * 100) : 0);

/* project এর ছবি — ঘর ভরে (cover). ছবি না থাকলে ধূসর ঘরে icon */
export function ProjectThumb({ image, size = 46 }) {
  const [broken, setBroken] = useState(false);
  if (image && !broken) {
    return (
      <span className="pj-thumb" style={{ width: size, height: size }}>
        <img
          src={thumb(image, size * 3)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
        />
      </span>
    );
  }
  return (
    <span className="pj-thumb pj-thumb--empty" style={{ width: size, height: size }} title="No image yet">
      <IconImage size={Math.round(size / 2.4)} />
    </span>
  );
}

export function ProjectStatus({ status }) {
  const info = STATUSES[status] ?? STATUSES.draft;
  return <span className={`pj-status pj-status--${info.tone}`}>{info.label}</span>;
}

function StatCard({ label, value, note, Icon, up = false }) {
  return (
    <article className="pd-stat">
      <div className="pd-stat-top">
        <h3 className="pd-stat-label">{label}</h3>
        <span className="pd-stat-icon">
          <Icon size={20} />
        </span>
      </div>
      <p className="pd-stat-value">{value}</p>
      <p className={`pd-stat-note${up ? " pd-stat-note--green" : ""}`}>
        {up && <IconTrend size={13} />}
        {note}
      </p>
    </article>
  );
}

/* ---------------------------------------------------------------
   Project Overview — গোল চার্ট. প্রতিটা অংশ একটা বৃত্তের রেখা,
   stroke-dasharray দিয়ে কতটুকু আঁকা হবে ঠিক হয়
   --------------------------------------------------------------- */
const RADIUS = 52;
const RING = 2 * Math.PI * RADIUS;

function Donut({ parts, total }) {
  let offset = 0;
  return (
    <div className="pj-donut">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={RADIUS} className="pj-donut-base" />
        {total > 0 &&
          parts.map((part) => {
            const length = (part.count / total) * RING;
            const circle = (
              <circle
                key={part.key}
                cx="60"
                cy="60"
                r={RADIUS}
                stroke={part.color}
                strokeDasharray={`${length} ${RING - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return part.count ? circle : null;
          })}
      </svg>
      <span className="pj-donut-center">
        <strong>{plain.format(total)}</strong>
        <span>Projects</span>
      </span>
    </div>
  );
}

function ProjectLibrary() {
  useDocumentTitle("Projects");

  const { admin } = useAdminAuth();
  const canEdit = ["owner", "admin"].includes(admin?.role);
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const status = params.get("status") ?? "";
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "newest";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = PAGE_SIZES.includes(Number(params.get("limit")))
    ? Number(params.get("limit"))
    : 10;

  /* একটা মান বদলালে পাতা ১ এ ফেরে — নাহলে ৫ নম্বর পাতায় থেকে
     খুঁজলে "কিছু নেই" দেখাত */
  const setParam = (key, value, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params);
    if (value === "" || value === null || value === undefined) next.delete(key);
    else next.set(key, String(value));
    if (!keepPage) next.delete("page");
    setParams(next, { replace: key !== "page" });
  };

  /* ---------- খোঁজার ঘর — টাইপ থামার ৩০০ms পরে ঠিকানায় ---------- */
  const [term, setTerm] = useState(q);
  const typing = useRef(false);

  useEffect(() => {
    if (!typing.current) return undefined;
    const timer = window.setTimeout(() => {
      typing.current = false;
      setParam("q", term.trim());
    }, 300);
    return () => window.clearTimeout(timer);
    // setParam প্রতি render এ নতুন — শুধু লেখা বদলালেই চলবে
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  /* ---------- তালিকা আনা ----------
     key দিয়ে বোঝা হয় কোন উত্তর কোন খোঁজার — পুরনো ধীর উত্তর পরে
     এসে নতুনটাকে ঢেকে দিতে পারে না */
  const [reload, setReload] = useState(0);
  const key = JSON.stringify({ q, status, category, sort, page, limit, reload });
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    let alive = true;
    api
      .adminListProjects({ q, status, category, sort, page, limit })
      .then((data) => {
        if (alive) setResult({ key, data, error: "" });
      })
      .catch((error) => {
        if (alive) setResult((old) => ({ key, data: old.data, error: error.message }));
      });
    return () => {
      alive = false;
    };
    // key এর ভেতরেই সব মান আছে
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = result.key !== key;
  const data = result.data;
  const items = data?.items ?? [];
  const stats = data?.stats;

  /* ---------- পাতার নিচের বার্তা (save/publish এর পর) ---------- */
  const [toast, setToast] = useState(() => location.state?.flash ?? "");

  useEffect(() => {
    if (location.state?.flash) navigate(".", { replace: true, state: null });
    // শুধু প্রথমবার — বার্তাটা ইতিহাস থেকে মুছে দেওয়া
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /* ---------- Duplicate / Delete ---------- */
  const [busyId, setBusyId] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const duplicate = async (item) => {
    setBusyId(item.id);
    try {
      const { project } = await api.duplicateProject(item.id);
      setToast(`Created “${project.title}” as a draft.`);
      setReload((n) => n + 1);
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusyId("");
    }
  };

  const confirmDelete = async () => {
    setBusyId(deleting.id);
    setDeleteError("");
    try {
      await api.deleteProject(deleting.id);
      setToast(`Deleted “${deleting.title}”.`);
      setDeleting(null);
      setReload((n) => n + 1);
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setBusyId("");
    }
  };

  const filtered = Boolean(q || status || category);

  const clearAll = () => {
    typing.current = false;
    setTerm("");
    setParams(new URLSearchParams(sort !== "newest" ? { sort } : {}), { replace: true });
  };

  const first = data ? (data.page - 1) * data.limit + 1 : 0;
  const last = data ? Math.min(data.matched, data.page * data.limit) : 0;
  const pages = useMemo(() => (data ? pageList(data.page, data.pages) : []), [data]);

  const total = stats?.total ?? 0;
  const counts = {
    completed: stats?.completed ?? 0,
    "in-progress": stats?.inProgress ?? 0,
    draft: stats?.drafts ?? 0,
  };
  const share = (part) =>
    stats ? (total ? `${percentOf(part, total)}% of all projects` : "No projects yet") : " ";

  const parts = STATUS_ORDER.map((key) => ({
    key,
    count: counts[key],
    color: STATUSES[key].color,
  }));

  const locations = stats?.locations ?? [];
  const goNew = () => navigate("/admin/projects/new");

  return (
    <div className="pd-page">
      {/* ---- মাথার সারি ---- */}
      <div className="pd-head">
        <h1 className="pd-title">Project Library</h1>
        <div className="pd-head-tools">
          <span className="adm-chip">
            <IconCalendar size={20} />
            {today.format(new Date())}
          </span>
          <AdminClock />
          {canEdit && (
            <button type="button" className="adm-chip adm-chip--go pd-add" onClick={goNew}>
              <IconPlus size={20} />
              Add Project
            </button>
          )}
        </div>
      </div>

      {/* ---- চারটা সংখ্যা ---- */}
      <section className="pd-stats" aria-label="Project numbers" aria-busy={!stats}>
        <StatCard
          label="Total Projects"
          Icon={IconFolder}
          value={stats ? plain.format(total) : "–"}
          up={Boolean(stats?.newThisMonth)}
          note={
            stats
              ? stats.newThisMonth
                ? `${stats.newThisMonth} new this month`
                : "No new projects this month"
              : " "
          }
        />
        <StatCard
          label="Completed"
          Icon={IconClipboardTick}
          value={stats ? plain.format(counts.completed) : "–"}
          note={share(counts.completed)}
        />
        <StatCard
          label="In Progress"
          Icon={IconMoreCircle}
          value={stats ? plain.format(counts["in-progress"]) : "–"}
          note={share(counts["in-progress"])}
        />
        <StatCard
          label="Draft"
          Icon={IconSettings}
          value={stats ? plain.format(counts.draft) : "–"}
          note={share(counts.draft)}
        />
      </section>

      {/* ---- Overview আর Location ---- */}
      <div className="pj-overview">
        <section className="pj-panel" aria-labelledby="pj-overview-title">
          <h2 id="pj-overview-title" className="pj-panel-title">
            Project Overview
            <IconPie size={16} />
          </h2>
          <div className="pj-overview-body">
            <Donut parts={parts} total={total} />
            <ul className="pj-legend">
              {parts.map((part) => (
                <li key={part.key}>
                  <button
                    type="button"
                    className={`pj-legend-row${status === part.key ? " is-on" : ""}`}
                    onClick={() => setParam("status", status === part.key ? "" : part.key)}
                    aria-pressed={status === part.key}
                    title={`Show ${STATUSES[part.key].label.toLowerCase()} projects`}
                  >
                    <span className="pj-legend-name">
                      <span className="pj-dot" style={{ background: part.color }} />
                      {STATUSES[part.key].label}
                    </span>
                    <span className="pj-legend-value">
                      {part.count} ({percentOf(part.count, total)}%)
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="pj-panel" aria-labelledby="pj-location-title">
          <h2 id="pj-location-title" className="pj-panel-title">
            Projects by Location
            <IconLocation size={16} />
          </h2>
          <div className="pj-location-body">
            <div className="pj-map" aria-hidden="true">
              <IconMap size={32} />
            </div>
            {locations.length ? (
              <ul className="pj-places">
                {locations.map((place) => (
                  <li key={place.name}>
                    {place.other ? (
                      <span className="pj-place">
                        <span>{place.name}</span>
                        <strong>{place.count}</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={`pj-place${q === place.name ? " is-on" : ""}`}
                        onClick={() => {
                          // খোঁজার ঘরেও দেশের নাম বসে, যাতে বোঝা যায় কেন তালিকা ছোট
                          const next = q === place.name ? "" : place.name;
                          typing.current = false;
                          setTerm(next);
                          setParam("q", next);
                        }}
                        title={`Show projects in ${place.name}`}
                      >
                        <span>{place.name}</span>
                        <strong>{place.count}</strong>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pj-places-empty">
                {stats ? "Add a location to a project to see it here." : "Loading…"}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* ---- তালিকা ---- */}
      <section className="pd-card pd-library pj-library" aria-label="Projects">
        <div className="pd-tools pj-tools">
          <label className="pd-search">
            <IconSearch size={18} />
            <span className="sr-only">Search projects</span>
            <input
              type="search"
              value={term}
              placeholder="Search projects, companies…"
              onChange={(event) => {
                typing.current = true;
                setTerm(event.target.value);
              }}
            />
          </label>

          <label className="pd-tool pd-tool--select">
            <span className="sr-only">Status</span>
            <AdminSelect value={status} onChange={(event) => setParam("status", event.target.value)}>
              <option value="">All Status</option>
              {STATUS_ORDER.map((key) => (
                <option key={key} value={key}>
                  {STATUSES[key].label}
                </option>
              ))}
            </AdminSelect>
            <IconChevron size={16} />
          </label>

          <label className="pd-tool pd-tool--select">
            <span className="sr-only">Category</span>
            <AdminSelect
              value={category}
              onChange={(event) => setParam("category", event.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </AdminSelect>
            <IconChevron size={16} />
          </label>

          <label className="pd-tool pd-tool--select">
            <span className="sr-only">Sort by</span>
            <AdminSelect
              value={sort}
              onChange={(event) =>
                setParam("sort", event.target.value === "newest" ? "" : event.target.value)
              }
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AdminSelect>
            <IconChevron size={16} />
          </label>
        </div>

        {result.error && (
          <p className="adm-banner adm-banner--bad" role="alert">
            Could not load projects: {result.error}{" "}
            <button type="button" className="adm-link-btn" onClick={() => setReload((n) => n + 1)}>
              Try again
            </button>
          </p>
        )}

        <div className="pd-table-wrap" aria-busy={loading}>
          <table className="pd-table pj-table">
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col">Location</th>
                <th scope="col">Uploaded On</th>
                <th scope="col">Status</th>
                <th scope="col" className="pd-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={loading && data ? "is-refreshing" : ""}>
              {!data &&
                !result.error &&
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={`skeleton-${index}`} className="pd-skeleton">
                    <td colSpan={7}>
                      <span />
                    </td>
                  </tr>
                ))}

              {items.map((item) => {
                const editPath = `/admin/projects/${item.id}`;
                const created = item.createdAt ? new Date(item.createdAt) : null;
                return (
                  <tr key={item.id}>
                    <td data-label="Project">
                      <Link className="pj-project-cell" to={editPath}>
                        <ProjectThumb image={item.image} />
                        <span className="pj-project-text">
                          <span className="pj-project-name">
                            {item.title || "Untitled project"}
                          </span>
                          {item.ref && <span className="pj-ref">#{item.ref}</span>}
                        </span>
                      </Link>
                    </td>
                    <td data-label="Product">
                      {item.product ? (
                        <span className="pj-cell-strong">
                          {item.product}
                          {item.productCount > 1 && (
                            <span className="pj-more"> +{item.productCount - 1}</span>
                          )}
                        </span>
                      ) : (
                        <span className="pd-dash">—</span>
                      )}
                    </td>
                    <td data-label="Category">
                      {item.category ? (
                        <span className="pj-cat">{labelOf(CATEGORIES, item.category)}</span>
                      ) : (
                        <span className="pd-dash">—</span>
                      )}
                    </td>
                    <td data-label="Location">
                      {item.location ? (
                        <span className="pj-cell-strong">{item.location}</span>
                      ) : (
                        <span className="pd-dash">—</span>
                      )}
                    </td>
                    <td data-label="Uploaded On">
                      {created ? (
                        <span className="pj-when">
                          <span>{dayFormat.format(created)}</span>
                          <span>{timeFormat.format(created)}</span>
                        </span>
                      ) : (
                        <span className="pd-dash">—</span>
                      )}
                    </td>
                    <td data-label="Status">
                      <ProjectStatus status={item.status} />
                    </td>
                    <td data-label="Actions" className="pd-center">
                      <span className="pd-row-actions">
                        {canEdit ? (
                          <>
                            <button
                              type="button"
                              className="pd-icon-btn"
                              onClick={() => duplicate(item)}
                              disabled={busyId === item.id}
                              title="Duplicate"
                              aria-label={`Duplicate ${item.title}`}
                            >
                              <IconCopy size={16} />
                            </button>
                            <button
                              type="button"
                              className="pd-icon-btn pd-icon-btn--bad"
                              onClick={() => {
                                setDeleteError("");
                                setDeleting(item);
                              }}
                              disabled={busyId === item.id}
                              title="Delete"
                              aria-label={`Delete ${item.title}`}
                            >
                              <IconTrash size={16} />
                            </button>
                            <Link
                              className="pd-icon-btn"
                              to={editPath}
                              title="Edit"
                              aria-label={`Edit ${item.title}`}
                            >
                              <IconPencil size={16} />
                            </Link>
                          </>
                        ) : (
                          <Link
                            className="pd-icon-btn"
                            to={editPath}
                            title="View"
                            aria-label={`View ${item.title}`}
                          >
                            <IconEye size={16} />
                          </Link>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {data && !items.length && (
            <div className="pd-empty">
              <span className="pd-empty-icon">
                <IconFolder size={22} />
              </span>
              {filtered ? (
                <>
                  <p className="pd-empty-title">No projects match these filters</p>
                  <button type="button" className="pd-btn pd-btn--line" onClick={clearAll}>
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <p className="pd-empty-title">No projects yet</p>
                  <p className="pd-empty-text">
                    Add your first project — it stays a draft until you publish it.
                  </p>
                  {canEdit && (
                    <button type="button" className="pd-btn pd-btn--yellow" onClick={goNew}>
                      <IconPlus size={18} />
                      Add Project
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ---- নিচের সারি ---- */}
        {data && data.matched > 0 && (
          <div className="pd-pager">
            <p className="pd-pager-info">
              <span className="pd-pager-dot" aria-hidden="true" />
              Showing {first} to {last} of {plain.format(data.matched)} project
              {data.matched === 1 ? "" : "s"}
            </p>

            <nav className="pd-pages" aria-label="Pages">
              <button
                type="button"
                className="pd-page-btn pd-page-btn--wide"
                onClick={() => setParam("page", data.page - 1, { keepPage: true })}
                disabled={data.page <= 1}
              >
                <IconArrowLeft size={14} />
                Previous
              </button>
              {pages.map((entry) =>
                typeof entry === "string" ? (
                  <span key={entry} className="pd-page-gap" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={entry}
                    type="button"
                    className={`pd-page-btn${entry === data.page ? " is-on" : ""}`}
                    onClick={() => setParam("page", entry === 1 ? "" : entry, { keepPage: true })}
                    aria-current={entry === data.page ? "page" : undefined}
                    aria-label={`Page ${entry}`}
                  >
                    {entry}
                  </button>
                ),
              )}
              <button
                type="button"
                className="pd-page-btn pd-page-btn--wide"
                onClick={() => setParam("page", data.page + 1, { keepPage: true })}
                disabled={data.page >= data.pages}
              >
                Next
                <IconArrowRight size={14} />
              </button>
            </nav>

            <label className="pd-show">
              Show
              <span className="pd-tool pd-tool--select pd-tool--sm">
                <AdminSelect
                  value={limit}
                  onChange={(event) =>
                    setParam("limit", Number(event.target.value) === 10 ? "" : event.target.value)
                  }
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </AdminSelect>
                <IconChevron size={16} />
              </span>
            </label>
          </div>
        )}
      </section>

      {toast && (
        <div className="pd-toast" role="status">
          {toast}
        </div>
      )}

      {deleting && (
        <ConfirmModal
          title={`Delete “${deleting.title || "this project"}”?`}
          busy={busyId === deleting.id}
          error={deleteError}
          onClose={() => setDeleting(null)}
          onConfirm={confirmDelete}
        >
          <p>
            This can’t be undone. Photos that only this project uses are deleted
            too. The products it used stay in the Product Library.
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}

export default ProjectLibrary;
