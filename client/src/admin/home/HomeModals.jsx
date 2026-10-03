import { useEffect, useId, useRef, useState } from "react";
import { api } from "../../lib/api";
import Modal from "../products/Modal";
import { ProductThumb } from "../products/ProductLibrary";
import { CATEGORIES as PRODUCT_CATEGORIES, categoryOf } from "../products/catalog";
import { PRODUCT_GROUP_ICONS } from "../projects/projectCatalog";
import { HOME_LISTS, ITEM_FORMS, emptyItem, itemProblems } from "./homeShape";
import { MediaInput, Stars, TextField } from "./HomeParts";
import { IconCheck, IconClose, IconSearch } from "../icons";

/* ===============================================================
   Home Page Content এর modal গুলো

   ItemModal      — "Add Hero Section", "Add Key Features", "Add Client
                    Logos", "Add Comparison Point", "Add Video Details",
                    "Add Testimonials" … সবগুলো একই modal, ঘরগুলো আসে
                    homeShape.js এর ITEM_FORMS থেকে
   FixturePicker  — "Add 3 Fixtures Featured Products": library থেকে
                    সর্বোচ্চ ৩টা product বাছা
   PlayerModal    — video চালিয়ে দেখা

   modal এ Save মানে শুধু পাতার খসড়ায় বসানো — database এ যায় পাতার
   নিচের "Save Change" চাপলে
   =============================================================== */

/* modal এর মাথা — ধূসর ঘর, শিরোনাম, নিচে ছোট লেখা, ডানে ✕ */
function ModalHead({ titleId, title, subtitle, onClose }) {
  return (
    <div className="pd-modal-grey-head hc-modal-head">
      <div>
        <h2 id={titleId} className="hc-modal-title">
          {title}
        </h2>
        {subtitle && <p className="pd-modal-sub">{subtitle}</p>}
      </div>
      <button type="button" className="pd-modal-x pd-modal-x--round" onClick={onClose} aria-label="Close">
        <IconClose size={20} />
      </button>
    </div>
  );
}

function ModalButtons({ formId, onClose, saveLabel = "Save", disabled }) {
  return (
    <>
      <button type="button" className="hc-modal-btn" onClick={onClose}>
        Cancel
      </button>
      <button type="submit" form={formId} className="hc-modal-btn hc-modal-btn--yellow" disabled={disabled}>
        {saveLabel}
      </button>
    </>
  );
}

/* লেখা ঘষামাজা — আগে-পিছের ফাঁকা বাদ, rating এক দশমিক */
function cleanItem(form, item) {
  const next = { ...item };
  for (const field of ITEM_FORMS[form].fields) {
    const value = next[field.key];
    if (field.type === "rating") next[field.key] = Math.round(Number(value) * 10) / 10;
    else if (typeof value === "string") next[field.key] = value.trim();
  }
  return next;
}

/* ---------------------------------------------------------------
   ItemModal
   --------------------------------------------------------------- */
export function ItemModal({ form, initial, note, onSave, onClose }) {
  const spec = ITEM_FORMS[form];
  const titleId = useId();
  const formId = useId();
  const [item, setItem] = useState(() => initial ?? emptyItem(form));
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(0);

  const problems = itemProblems(form, item);
  const shown = tried ? problems : {};
  const set = (key, value) => setItem((old) => ({ ...old, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (busy) return;
    if (Object.keys(problems).length) {
      setTried(true);
      const first = spec.fields.find((field) => problems[field.key]);
      window.requestAnimationFrame(() =>
        document.getElementById(`${formId}-${first.key}`)?.focus(),
      );
      return;
    }
    onSave(cleanItem(form, item));
  };

  const heading = `${initial || spec.editOnly ? "Edit" : "Add"} ${spec.title}`;

  return (
    <Modal
      size="md"
      onClose={onClose}
      labelledBy={titleId}
      className="hc-modal"
      busy={busy > 0}
      // খোলার সাথে সাথে প্রথম ঘরে focus (✕ বোতামে নয়)
      initialFocus=".hc-fields input:not([type=file]), .hc-fields textarea, .hc-fields button"
      footer={
        <ModalButtons
          formId={formId}
          onClose={onClose}
          disabled={busy > 0}
          saveLabel={busy ? "Uploading…" : "Save"}
        />
      }
    >
      <form id={formId} className="hc-form" onSubmit={submit} noValidate>
        <ModalHead titleId={titleId} title={heading} subtitle={note || spec.subtitle} onClose={onClose} />

        <div className="hc-fields">
          {spec.fields.map((field) => {
            const id = `${formId}-${field.key}`;
            const width = field.width ? ` hc-span-${field.width}` : "";

            if (field.type === "image" || field.type === "video") {
              return (
                <div key={field.key} className={`hc-span-full${width}`}>
                  <MediaInput
                    id={id}
                    field={field}
                    value={item[field.key]}
                    poster={field.type === "video" ? item.cover?.url : undefined}
                    error={shown[field.key]}
                    onBusy={(on) => setBusy((count) => Math.max(0, count + (on ? 1 : -1)))}
                    onChange={(value) =>
                      setItem((old) => ({
                        ...old,
                        [field.key]: value,
                        // video বদলালে পুরনো cover আর মেলে না
                        ...(field.type === "video" ? { cover: null } : {}),
                      }))
                    }
                  />
                </div>
              );
            }

            if (field.type === "rating") {
              return (
                <div key={field.key} className={`pd-field-wrap hc-field hc-span-full${width}`}>
                  <label className="pd-label" htmlFor={id}>
                    {field.label}
                    <span className="pd-required"> *</span>
                  </label>
                  <span className={`pd-input-box hc-rating-box${shown[field.key] ? " is-bad" : ""}`}>
                    <input
                      id={id}
                      type="number"
                      inputMode="decimal"
                      min="1"
                      max="5"
                      step="0.1"
                      value={item[field.key]}
                      onChange={(event) => set(field.key, event.target.value)}
                    />
                    <Stars value={item[field.key]} size={14} />
                  </span>
                  {shown[field.key] && (
                    <span className="pd-error" role="alert">
                      {shown[field.key]}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <div key={field.key} className={`hc-span-full${width}`}>
                <TextField
                  id={id}
                  label={field.label}
                  value={item[field.key]}
                  max={field.max}
                  required={field.required}
                  multiline={field.type === "textarea"}
                  rows={3}
                  placeholder={field.placeholder}
                  hint={field.hint}
                  error={shown[field.key]}
                  onChange={(value) => set(field.key, value)}
                />
              </div>
            );
          })}
        </div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   FixturePicker — Add 3 Fixtures Featured Products

   বাঁয়ে category (সংখ্যা সহ), ডানে tick দেওয়ার তালিকা. শুধু
   published product বাছা যায় — draft সাইটে দেখায় না.
   onSave(যা বাছা হলো তাদের product তথ্য, ক্রম অনুযায়ী)
   --------------------------------------------------------------- */
const subtitleOf = (item) =>
  [categoryOf(item.category).label, item.series || item.color].filter(Boolean).join(" / ");

export function FixturePicker({ chosen, products, onSave, onClose }) {
  const titleId = useId();
  const max = HOME_LISTS.fixtures.max;

  const [picked, setPicked] = useState(chosen);
  const [known, setKnown] = useState(products);
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState({ q: "", category: "", page: 1 });
  const listRef = useRef(null);

  // টাইপ থামার ২৫০ms পরে খোঁজা
  useEffect(() => {
    const clean = term.trim();
    if (clean === query.q) return undefined;
    const timer = window.setTimeout(() => setQuery((old) => ({ ...old, q: clean, page: 1 })), 250);
    return () => window.clearTimeout(timer);
  }, [term, query.q]);

  const key = JSON.stringify(query);
  const [result, setResult] = useState({ key: null, items: [], hasMore: false, counts: null, error: "" });

  useEffect(() => {
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
      .catch((failure) => {
        if (alive) setResult((old) => ({ ...old, key, error: failure.message }));
      });
    return () => {
      alive = false;
    };
    // key এর ভেতরেই query র সব মান
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = result.key !== key;
  const counts = result.counts;
  const full = picked.length >= max;

  const toggle = (item) => {
    if (item.status !== "published") return;
    setKnown((old) => ({ ...old, [item.id]: item }));
    setPicked((old) =>
      old.includes(item.id) ? old.filter((id) => id !== item.id) : old.length >= max ? old : [...old, item.id],
    );
  };

  const groups = [{ key: "", label: "All Products" }, ...PRODUCT_CATEGORIES];

  return (
    <Modal
      size="md"
      onClose={onClose}
      labelledBy={titleId}
      className="hc-modal hc-picker-modal"
      footer={
        <>
          <span className="pj-picked hc-picked">
            <span className="pj-picked-badge">{picked.length}</span>
            item{picked.length === 1 ? "" : "s"} selected
            {full && <span className="pj-picked-full"> · limit reached</span>}
          </span>
          <button type="button" className="hc-modal-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="hc-modal-btn hc-modal-btn--yellow"
            disabled={!picked.length}
            onClick={() => onSave(picked.map((id) => known[id] ?? { id }))}
          >
            Save
          </button>
        </>
      }
    >
      <div className="hc-form">
        <ModalHead
          titleId={titleId}
          title="Add 3 Fixtures Featured Products"
          subtitle="Explore our top-performing fixtures, engineered for efficiency and durability."
          onClose={onClose}
        />

        <div className="hc-picker">
          <label className="pd-search pj-picker-search hc-picker-search">
            <IconSearch size={18} />
            <span className="sr-only">Search products</span>
            <input
              type="search"
              value={term}
              placeholder="Search products..."
              data-autofocus
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
                    className={`pj-group hc-group${on ? " is-on" : ""}`}
                    onClick={() => {
                      setQuery((old) => ({ ...old, category: group.key, page: 1 }));
                      listRef.current?.scrollTo?.({ top: 0 });
                    }}
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

              <ul
                ref={listRef}
                className={`pj-option-list hc-option-list${loading && result.items.length ? " is-refreshing" : ""}`}
              >
                {result.items.map((item) => {
                  const on = picked.includes(item.id);
                  const draft = item.status !== "published";
                  const blocked = draft || (!on && full);
                  return (
                    <li key={item.id}>
                      <label className={`pj-option hc-option${on ? " is-on" : ""}${blocked ? " is-full" : ""}`}>
                        <ProductThumb image={item.image} category={item.category} size={46} />
                        <span className="pj-option-text">
                          <span className="pj-option-name hc-option-name">{item.name || "Untitled product"}</span>
                          <span className="pj-option-sub">
                            {subtitleOf(item)}
                            {draft && (
                              <span className="pd-status is-draft" title="Publish the product first">
                                Draft
                              </span>
                            )}
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={on}
                          disabled={blocked}
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
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   PlayerModal — video চালিয়ে দেখা
   --------------------------------------------------------------- */
export function PlayerModal({ item, onClose }) {
  const titleId = useId();
  return (
    <Modal size="lg" onClose={onClose} labelledBy={titleId} className="hc-modal pd-player">
      <div className="hc-form">
        <ModalHead titleId={titleId} title={item.title} subtitle={item.description} onClose={onClose} />
        <video src={item.video?.url} controls autoPlay playsInline poster={item.cover?.url || undefined} />
      </div>
    </Modal>
  );
}
