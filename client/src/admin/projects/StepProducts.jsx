import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { ProductThumb } from "../products/ProductLibrary";
import { CATEGORIES as PRODUCT_CATEGORIES, categoryOf } from "../products/catalog";
import { PRODUCT_GROUP_ICONS, PROJECT_LIMITS } from "./projectCatalog";
import { IconCheck, IconPencil, IconPlus, IconSearch, IconTrash } from "../icons";

/* ===============================================================
   ধাপ ৩ — Product Used (Figma: 1030 × 859)

   বাঁয়ে: library র সব product — উপরে খোঁজা, পাশে category আর
          কয়টা আছে, ডানে tick দেওয়ার তালিকা
   ডানে:  এই project এ যা বাছা হয়েছে (Products Used)

   tick দিলেই সাথে সাথে ডানের তালিকায় যোগ হয়, আবার চাপলে সরে.
   project এ শুধু product এর id রাখা হয় — তাই product এর নাম বা
   ছবি বদলালে project এ নিজে থেকেই নতুনটা দেখায়.

   draft product ও বাছা যায় (হয়তো শিগগিরই publish হবে), কিন্তু
   সেটা publish না হওয়া পর্যন্ত সাইটে দেখায় না — তাই "Draft" চিহ্ন
   =============================================================== */

const subtitleOf = (item) =>
  [categoryOf(item.category).label, item.series || item.color].filter(Boolean).join(" / ");

function ProductBadge({ item }) {
  if (item?.missing) return <span className="pd-status is-removed">Removed</span>;
  if (item?.status === "draft") {
    return (
      <span className="pd-status is-draft" title="Hidden on the site until the product is published">
        Draft
      </span>
    );
  }
  return null;
}

function StepProducts({ project, setProject, canEdit, active }) {
  const searchRef = useRef(null);
  const usedRef = useRef(null);

  /* ---------- কী দেখানো হবে ---------- */
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState({ q: "", category: "", page: 1 });

  // টাইপ থামার ২৫০ms পরে খোঁজা
  useEffect(() => {
    const clean = term.trim();
    if (clean === query.q) return undefined;
    const timer = window.setTimeout(
      () => setQuery((old) => ({ ...old, q: clean, page: 1 })),
      250,
    );
    return () => window.clearTimeout(timer);
  }, [term, query.q]);

  /* ধাপটা প্রথমবার দেখা গেলে তবেই তালিকা আনা — Project Info তে
     থাকতেই অকারণে product গুলো নামানোর দরকার নেই */
  const [started, setStarted] = useState(active);
  if (active && !started) setStarted(true);

  const key = JSON.stringify(query);
  const [result, setResult] = useState({
    key: null,
    items: [],
    hasMore: false,
    counts: null,
    error: "",
  });

  useEffect(() => {
    if (!started) return undefined;
    let alive = true;
    api
      .adminProjectProducts(query)
      .then((data) => {
        if (!alive) return;
        setResult((old) => ({
          key,
          items: query.page > 1 ? [...old.items, ...data.items] : data.items,
          hasMore: data.hasMore,
          counts: data.counts,
          error: "",
        }));
      })
      .catch((error) => {
        if (alive) setResult((old) => ({ ...old, key, error: error.message }));
      });
    return () => {
      alive = false;
    };
    // key এর ভেতরেই query র সব মান
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, started]);

  const loading = result.key !== key;
  const counts = result.counts;

  /* ---------- বাছা ---------- */
  const chosen = project.products;
  const chosenSet = new Set(chosen);
  const full = chosen.length >= PROJECT_LIMITS.products;

  const toggle = (item) => {
    if (!canEdit) return;
    setProject((p) => {
      if (p.products.includes(item.id)) {
        return { ...p, products: p.products.filter((id) => id !== item.id) };
      }
      if (p.products.length >= PROJECT_LIMITS.products) return p;
      return {
        ...p,
        products: [...p.products, item.id],
        items: { ...p.items, [item.id]: item },
      };
    });
  };

  const remove = (id) =>
    setProject((p) => ({ ...p, products: p.products.filter((other) => other !== id) }));

  const pickCategory = (category) => setQuery((old) => ({ ...old, category, page: 1 }));

  const groups = [{ key: "", label: "All Products" }, ...PRODUCT_CATEGORIES];

  return (
    <div className="pd-info pj-products">
      {/* ---- বাঁয়ে: library ---- */}
      <section className="pd-card pj-picker" aria-labelledby="pj-picker-title">
        <div>
          <h3 id="pj-picker-title" className="pd-card-title pd-card-title--sm">
            Product Used
          </h3>
          <p className="pd-card-sub">Select products for this project.</p>
        </div>

        <label className="pd-search pj-picker-search">
          <IconSearch size={18} />
          <span className="sr-only">Search products</span>
          <input
            ref={searchRef}
            type="search"
            value={term}
            placeholder="Search products..."
            onChange={(event) => setTerm(event.target.value)}
          />
        </label>

        <div className="pj-split">
          <nav className="pj-groups" aria-label="Product categories">
            {groups.map((group) => {
              const Icon = PRODUCT_GROUP_ICONS[group.key] ?? PRODUCT_GROUP_ICONS.other;
              const count = counts ? (group.key ? counts[group.key] ?? 0 : counts.all) : null;
              const on = query.category === group.key;
              return (
                <button
                  key={group.key || "all"}
                  type="button"
                  className={`pj-group${on ? " is-on" : ""}`}
                  onClick={() => pickCategory(group.key)}
                  aria-pressed={on}
                >
                  <Icon size={16} />
                  <span className="pj-group-name">{group.label}</span>
                  <span className="pj-group-count">{count ?? ""}</span>
                </button>
              );
            })}
          </nav>

          <div className="pj-options" aria-busy={loading}>
            {result.error && (
              <p className="pd-error" role="alert">
                Could not load products: {result.error}
              </p>
            )}

            {!result.items.length && !result.error && (
              <p className="pd-picker-note">
                {loading
                  ? "Loading products…"
                  : query.q
                    ? `No products match “${query.q}”.`
                    : "No products in this category yet."}
              </p>
            )}

            <ul className={`pj-option-list${loading && result.items.length ? " is-refreshing" : ""}`}>
              {result.items.map((item) => {
                const on = chosenSet.has(item.id);
                return (
                  <li key={item.id}>
                    <label className={`pj-option${on ? " is-on" : ""}${!on && full ? " is-full" : ""}`}>
                      <ProductThumb image={item.image} category={item.category} size={40} />
                      <span className="pj-option-text">
                        <span className="pj-option-name">{item.name || "Untitled product"}</span>
                        <span className="pj-option-sub">
                          {subtitleOf(item)}
                          <ProductBadge item={item} />
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        disabled={!canEdit || (!on && full)}
                        onChange={() => toggle(item)}
                      />
                      <span className="pj-check" aria-hidden="true">
                        {on && <IconCheck size={12} />}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            {result.hasMore && (
              <button
                type="button"
                className="pd-text-btn pj-more-btn"
                disabled={loading}
                onClick={() => setQuery((old) => ({ ...old, page: old.page + 1 }))}
              >
                {loading ? "Loading…" : "Show more"}
              </button>
            )}
          </div>
        </div>

        <div className="pj-picker-foot">
          <span className="pj-picked">
            <span className="pj-picked-badge">{chosen.length}</span>
            item{chosen.length === 1 ? "" : "s"} selected
            {full && <span className="pj-picked-full"> · limit reached</span>}
          </span>
          <button
            type="button"
            className="pd-btn pd-btn--yellow pd-btn--sm"
            onClick={() => {
              setTerm("");
              setQuery({ q: "", category: "", page: 1 });
              usedRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              usedRef.current?.focus({ preventScroll: true });
            }}
          >
            Done
          </button>
        </div>
      </section>

      {/* ---- ডানে: যা বাছা হয়েছে ---- */}
      <aside className="pd-info-side">
        <section
          className="pd-card pj-used"
          aria-labelledby="pj-used-title"
          ref={usedRef}
          tabIndex={-1}
        >
          <div>
            <h3 id="pj-used-title" className="pd-card-title pd-card-title--sm">
              Products Used
            </h3>
            <p className="pd-card-sub">Hand-picked lighting solutions used in this project.</p>
          </div>

          {chosen.length ? (
            <ul className="pj-used-list">
              {chosen.map((id) => {
                const item = project.items[id] ?? { id, missing: true };
                return (
                  <li key={id} className={`pj-used-item${item.missing ? " is-missing" : ""}`}>
                    <ProductThumb image={item.image} category={item.category} size={40} />
                    <span className="pj-option-text">
                      <span className="pj-option-name">
                        {item.missing ? "Deleted product" : item.name || "Untitled product"}
                      </span>
                      <span className="pj-option-sub">
                        {item.missing ? "Removed from the library" : subtitleOf(item)}
                        <ProductBadge item={item} />
                      </span>
                    </span>
                    <span className="pd-row-tools">
                      {canEdit && (
                        <button
                          type="button"
                          className="pd-icon-btn pd-icon-btn--bad pd-icon-btn--sm"
                          onClick={() => remove(id)}
                          aria-label={`Remove ${item.name || "product"}`}
                          title="Remove from project"
                        >
                          <IconTrash size={16} />
                        </button>
                      )}
                      {!item.missing && (
                        <Link
                          className="pd-icon-btn pd-icon-btn--sm"
                          to={`/admin/products/${id}`}
                          target="_blank"
                          rel="noopener"
                          aria-label={`Open ${item.name} in the Product Library (new tab)`}
                          title="Open product (new tab)"
                        >
                          <IconPencil size={16} />
                        </Link>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="pj-used-empty">No products yet — tick them in the list.</p>
          )}

          {canEdit && (
            <button
              type="button"
              className="pj-dashed-btn"
              onClick={() => {
                searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                searchRef.current?.focus({ preventScroll: true });
              }}
            >
              <IconPlus size={14} />
              Add Product
            </button>
          )}
        </section>
      </aside>
    </div>
  );
}

export default StepProducts;
