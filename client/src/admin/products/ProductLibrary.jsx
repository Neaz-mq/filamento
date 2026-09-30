import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAdminAuth, useDocumentTitle } from "../AdminAuth";
import AdminClock from "../AdminClock";
import CategoryModal from "./CategoryModal";
import { CategoryPicture } from "./CategoryArt";
import { ConfirmModal } from "./Modal";
import { CATEGORIES, categoryOf } from "./catalog";
import { thumb } from "./upload";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBox,
  IconCalendar,
  IconChevron,
  IconCopy,
  IconEye,
  IconFilter,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTickSquare,
  IconTrash,
  IconTrend,
} from "../icons";
import "./products.css";

/* ===============================================================
   Product Library — /admin/products (Figma: 1030 × 978)

   খোঁজা, ছাঁকা, সাজানো আর পাতা নম্বর সব ঠিকানায় (?q=…&status=…)
   থাকে. তাই পাতা reload করলে, পেছনে গেলে বা link কাউকে পাঠালে
   একই তালিকা খোলে.

   editor ভূমিকার admin শুধু দেখতে পারে — Add, Edit, Duplicate,
   Delete বোতাম তার কাছে আসে না (আসল পাহারা server এ)
   =============================================================== */

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "updated", label: "Last updated" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
];

const PAGE_SIZES = [5, 10, 20, 50];

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plain = new Intl.NumberFormat("en-US");

const today = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

/* পাতা নম্বরের সারি — 1 2 … 5 এর মতো. বর্তমানের দুই পাশে একটা করে,
   আর প্রথম-শেষ সবসময় */
function pageList(page, pages) {
  const wanted = new Set([1, pages, page - 1, page, page + 1]);
  const numbers = [...wanted]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);

  const out = [];
  numbers.forEach((n, i) => {
    if (i > 0 && n - numbers[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

/* ছবি নেই এমন product — category র নমুনা ছবি, যাতে তালিকায় ফাঁকা
   ধূসর ঘর না দেখায়. নমুনা বোঝাতে একটু ফিকে */
function ProductThumb({ image, category, size = 48 }) {
  const [broken, setBroken] = useState(false);
  const info = categoryOf(category);

  if (image && !broken) {
    return (
      <span className="pd-thumb" style={{ width: size, height: size }}>
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
    <span
      className="pd-thumb pd-thumb--demo"
      style={{ width: size, height: size }}
      title="No image yet — sample picture"
    >
      <CategoryPicture category={info} size={size - 8} />
    </span>
  );
}

export { ProductThumb };

function StatCard({ label, value, note, tone = "plain", Icon, up = false }) {
  return (
    <article className="pd-stat">
      <div className="pd-stat-top">
        <h3 className="pd-stat-label">{label}</h3>
        <span className="pd-stat-icon">
          <Icon size={20} />
        </span>
      </div>
      <p className="pd-stat-value">{value}</p>
      <p className={`pd-stat-note pd-stat-note--${tone}`}>
        {up && <IconTrend size={13} />}
        {note}
      </p>
    </article>
  );
}

function StatusPill({ status }) {
  const published = status === "published";
  return (
    <span className={`pd-status ${published ? "is-live" : "is-draft"}`}>
      <span className="pd-status-dot" aria-hidden="true" />
      {published ? "Published" : "Draft"}
    </span>
  );
}

export { StatusPill };

/* ---------------------------------------------------------------
   Filters এর ছোট panel — এখন শুধু category (All Series আর All
   Status বাইরেই আছে)
   --------------------------------------------------------------- */
function FilterMenu({ category, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="pd-filter" ref={wrapRef}>
      <button
        type="button"
        className={`pd-tool${category ? " is-set" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <IconFilter size={16} />
        Filters
        {category && <span className="pd-tool-count">1</span>}
      </button>

      {open && (
        <div className="pd-filter-panel" role="dialog" aria-label="Filters">
          <label className="pd-label" htmlFor="pd-filter-category">
            Category
          </label>
          <select
            id="pd-filter-category"
            className="pd-input pd-select"
            value={category}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="pd-text-btn"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            disabled={!category}
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}

function ProductLibrary() {
  useDocumentTitle("Products");

  const { admin } = useAdminAuth();
  const canEdit = ["owner", "admin"].includes(admin?.role);
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const status = params.get("status") ?? "";
  const series = params.get("series") ?? "";
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
  const key = JSON.stringify({ q, status, series, category, sort, page, limit, reload });
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    let alive = true;
    api
      .adminListProducts({ q, status, series, category, sort, page, limit })
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
    // শুধু প্রথমবার — বার্তাটা ইতিহাস থেকে মুছে দেওয়া, যাতে reload এ আবার না আসে
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /* ---------- Add Product → category → নতুন পাতা ---------- */
  const [choosing, setChoosing] = useState(false);

  /* ---------- Duplicate / Delete ---------- */
  const [busyId, setBusyId] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const duplicate = async (item) => {
    setBusyId(item.id);
    try {
      const { product } = await api.duplicateProduct(item.id);
      setToast(`Created “${product.name}” as a draft.`);
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
      await api.deleteProduct(deleting.id);
      setToast(`Deleted “${deleting.name}”.`);
      setDeleting(null);
      // শেষ পাতার শেষ product মুছলে পাতাটা ফাঁকা হয় — server নিজেই শেষ পাতা দেয়
      setReload((n) => n + 1);
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setBusyId("");
    }
  };

  const filtered = Boolean(q || status || series || category);

  const clearAll = () => {
    typing.current = false;
    setTerm("");
    setParams(new URLSearchParams(sort !== "newest" ? { sort } : {}), {
      replace: true,
    });
  };

  const first = data ? (data.page - 1) * data.limit + 1 : 0;
  const last = data ? Math.min(data.matched, data.page * data.limit) : 0;
  const pages = useMemo(
    () => (data ? pageList(data.page, data.pages) : []),
    [data],
  );

  const percent = (part) =>
    stats?.total ? `${Math.round((part / stats.total) * 100)}% of total products` : "No products yet";

  return (
    <div className="pd-page">
      {/* ---- মাথার সারি ---- */}
      <div className="pd-head">
        <h1 className="pd-title">Product Library</h1>
        <div className="pd-head-tools">
          <span className="adm-chip">
            <IconCalendar size={20} />
            {today.format(new Date())}
          </span>
          <AdminClock />
          {canEdit && (
            <button
              type="button"
              className="adm-chip adm-chip--go pd-add"
              onClick={() => setChoosing(true)}
            >
              <IconPlus size={20} />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* ---- চারটা সংখ্যা ---- */}
      <section className="pd-stats" aria-label="Product numbers" aria-busy={!stats}>
        <StatCard
          label="Total Products"
          Icon={IconBox}
          value={stats ? plain.format(stats.total) : "–"}
          tone={stats?.newThisMonth ? "green" : "plain"}
          up={Boolean(stats?.newThisMonth)}
          note={
            stats
              ? stats.newThisMonth
                ? `${stats.newThisMonth} new this month`
                : "No new products this month"
              : " "
          }
        />
        <StatCard
          label="Published"
          Icon={IconTickSquare}
          value={stats ? plain.format(stats.published) : "–"}
          note={stats ? percent(stats.published) : " "}
        />
        <StatCard
          label="Drafts"
          Icon={IconPencil}
          value={stats ? plain.format(stats.drafts) : "–"}
          note={stats ? percent(stats.drafts) : " "}
        />
        <StatCard
          label="Total Views"
          Icon={IconEye}
          value={stats ? compact.format(stats.views) : "–"}
          note={stats ? "Across all products" : " "}
        />
      </section>

      {/* ---- তালিকা ---- */}
      <section className="pd-card pd-library" aria-labelledby="pd-library-title">
        <div className="pd-library-head">
          <div>
            <h2 id="pd-library-title" className="pd-card-title">
              Product Library
            </h2>
            <p className="pd-card-sub">
              {data
                ? `${plain.format(data.matched)} of ${plain.format(stats.total)} product${stats.total === 1 ? "" : "s"}`
                : "Loading…"}
            </p>
          </div>

          <div className="pd-tools">
            <label className="pd-search">
              <IconSearch size={18} />
              <span className="sr-only">Search products</span>
              <input
                type="search"
                value={term}
                placeholder="Search everything..."
                onChange={(event) => {
                  typing.current = true;
                  setTerm(event.target.value);
                }}
              />
            </label>

            <label className="pd-tool pd-tool--select">
              <span className="sr-only">Series</span>
              <select
                value={series}
                onChange={(event) => setParam("series", event.target.value)}
              >
                <option value="">All Series</option>
                {(data?.series ?? []).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                {/* ঠিকানায় আছে কিন্তু তালিকায় নেই — তবু দেখানো */}
                {series && !(data?.series ?? []).includes(series) && (
                  <option value={series}>{series}</option>
                )}
              </select>
              <IconChevron size={16} />
            </label>

            <label className="pd-tool pd-tool--select">
              <span className="sr-only">Status</span>
              <select
                value={status}
                onChange={(event) => setParam("status", event.target.value)}
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <IconChevron size={16} />
            </label>

            <FilterMenu
              category={category}
              onChange={(value) => setParam("category", value)}
            />

            <label className="pd-tool pd-tool--select">
              <span className="sr-only">Sort by</span>
              <select
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
              </select>
              <IconChevron size={16} />
            </label>
          </div>
        </div>

        {result.error && (
          <p className="adm-banner adm-banner--bad" role="alert">
            Could not load products: {result.error}{" "}
            <button
              type="button"
              className="adm-link-btn"
              onClick={() => setReload((n) => n + 1)}
            >
              Try again
            </button>
          </p>
        )}

        <div className="pd-table-wrap" aria-busy={loading}>
          <table className="pd-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col" className="pd-center">
                  Certifications
                </th>
                <th scope="col" className="pd-center">
                  Status
                </th>
                <th scope="col">Stock</th>
                <th scope="col" className="pd-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={loading && data ? "is-refreshing" : ""}>
              {!data &&
                !result.error &&
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={`skeleton-${index}`} className="pd-skeleton">
                    <td colSpan={6}>
                      <span />
                    </td>
                  </tr>
                ))}

              {items.map((item) => {
                const info = categoryOf(item.category);
                const editPath = `/admin/products/${item.id}`;
                return (
                  <tr key={item.id}>
                    <td data-label="Product">
                      <Link className="pd-product-cell" to={editPath}>
                        <ProductThumb image={item.image} category={item.category} />
                        <span className="pd-product-name">
                          {item.name || "Untitled product"}
                        </span>
                      </Link>
                    </td>
                    <td data-label="Category">
                      <span className="pd-muted-strong">{item.series || info.label}</span>
                    </td>
                    <td data-label="Certifications" className="pd-center">
                      {item.certifications.length ? (
                        <span className="pd-certs">
                          {item.certifications.map((cert) => (
                            <span key={cert} className="pd-cert">
                              {cert}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="pd-dash">—</span>
                      )}
                    </td>
                    <td data-label="Status" className="pd-center">
                      <StatusPill status={item.status} />
                    </td>
                    <td data-label="Stock">
                      {item.stock === null ? (
                        <span className="pd-dash">—</span>
                      ) : (
                        <span className="pd-muted-strong">{plain.format(item.stock)}</span>
                      )}
                    </td>
                    <td data-label="Actions" className="pd-end">
                      <span className="pd-row-actions">
                        {canEdit ? (
                          <>
                            <Link
                              className="pd-icon-btn"
                              to={editPath}
                              title="Edit"
                              aria-label={`Edit ${item.name}`}
                            >
                              <IconPencil size={16} />
                            </Link>
                            <button
                              type="button"
                              className="pd-icon-btn"
                              onClick={() => duplicate(item)}
                              disabled={busyId === item.id}
                              title="Duplicate"
                              aria-label={`Duplicate ${item.name}`}
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
                              aria-label={`Delete ${item.name}`}
                            >
                              <IconTrash size={16} />
                            </button>
                          </>
                        ) : (
                          <Link
                            className="pd-icon-btn"
                            to={editPath}
                            title="View"
                            aria-label={`View ${item.name}`}
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
                <IconBox size={22} />
              </span>
              {filtered ? (
                <>
                  <p className="pd-empty-title">No products match these filters</p>
                  <button type="button" className="pd-btn pd-btn--line" onClick={clearAll}>
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <p className="pd-empty-title">No products yet</p>
                  <p className="pd-empty-text">
                    Add your first product — it stays a draft until you publish it.
                  </p>
                  {canEdit && (
                    <button
                      type="button"
                      className="pd-btn pd-btn--yellow"
                      onClick={() => setChoosing(true)}
                    >
                      <IconPlus size={18} />
                      Add Product
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ---- নিচের সারি: কতগুলো দেখাচ্ছে, পাতা নম্বর, প্রতি পাতায় কত ---- */}
        {data && data.matched > 0 && (
          <div className="pd-pager">
            <p className="pd-pager-info">
              <span className="pd-pager-dot" aria-hidden="true" />
              Showing {first} to {last} of {plain.format(data.matched)} products
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
                <select
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
                </select>
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

      {choosing && (
        <CategoryModal
          onClose={() => setChoosing(false)}
          onContinue={(key) =>
            navigate(`/admin/products/new?category=${encodeURIComponent(key)}`)
          }
        />
      )}

      {deleting && (
        <ConfirmModal
          title={`Delete “${deleting.name || "this product"}”?`}
          busy={busyId === deleting.id}
          error={deleteError}
          onClose={() => setDeleting(null)}
          onConfirm={confirmDelete}
        >
          <p>
            This can’t be undone. Images, videos and documents that only this
            product uses are deleted too.
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}

export default ProductLibrary;
