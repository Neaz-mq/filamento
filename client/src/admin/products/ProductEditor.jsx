import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Link,
  useBlocker,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api } from "../../lib/api";
import { useAdminAuth, useDocumentTitle } from "../AdminAuth";
import AdminClock from "../AdminClock";
import Modal, { ConfirmModal } from "./Modal";
import StepInfo from "./StepInfo";
import StepSpecs, { SpecNav } from "./StepSpecs";
import StepVideos from "./StepVideos";
import StepDocuments from "./StepDocuments";
import { ProductThumb, StatusPill } from "./ProductLibrary";
import { CATEGORIES, categoryOf } from "./catalog";
import {
  emptyProduct,
  fromServer,
  getGroup,
  missingForPublish,
  snapshot,
  specProgress,
  toServer,
} from "./productShape";
import {
  IconAlert,
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconClose,
} from "../icons";
import "./products.css";

/* ===============================================================
   Add / Edit Product — চার ধাপ

     /admin/products/new?category=lamp-fixture  → নতুন
     /admin/products/<id>                       → পুরনোটা সম্পাদনা

   প্রথমবার save করলে ঠিকানা নিজে থেকে /admin/products/<id> হয়ে
   যায় — পাতা আবার নামে না, যেখানে ছিলেন সেখানেই থাকেন.

   চারটা ধাপই একসাথে পাতায় থাকে (যেটা দেখা যাচ্ছে না সেটা শুধু
   লুকানো). তাই ধাপ বদলালেও চলতে থাকা upload থামে না.

   save না করে বেরোতে গেলে (sidebar, back বোতাম, tab বন্ধ) আগে
   জিজ্ঞেস করে. Ctrl/⌘ + S চাপলেও save হয়
   =============================================================== */

const STEPS = [
  { id: "info", label: "Product Info" },
  { id: "specs", label: "Specifications" },
  { id: "videos", label: "Videos" },
  { id: "docs", label: "Documents & Resources" },
];

const dayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const validCategory = (key) =>
  CATEGORIES.some((category) => category.key === key) ? key : "lamp-fixture";

const makeNew = (key, category) => {
  const product = emptyProduct(category);
  return { key, product, saved: snapshot(product) };
};

/* editor ভূমিকার admin — ভেতরের সব ঘর আর বোতাম একসাথে বন্ধ
   (fieldset disabled). ধাপের তালিকা আর নিচের বোতাম বাইরে, তাই
   ঘুরে দেখা যায় */
function Lock({ locked, children }) {
  if (!locked) return children;
  return (
    <fieldset className="pd-lock" disabled>
      {children}
    </fieldset>
  );
}

function Tip() {
  return (
    <p className="pd-tip">
      Tip: Drag and drop specifications within a group to quickly reorder them.
    </p>
  );
}

/* ---------------------------------------------------------------
   Review & Publish
   --------------------------------------------------------------- */
function ReviewModal({ product, saving, error, onClose, onSave }) {
  const titleId = useId();
  const category = categoryOf(product.category);
  const missing = missingForPublish(product);
  const specs = specProgress(product);
  const live = product.status === "published";
  const needColor = Boolean(category.color);
  // Reflector এর General এর মতো যে group এ বিবরণ বাধ্যতামূলক
  const specNeeds = category.specGroups
    .filter(
      (group) =>
        group.descriptionRequired && !getGroup(product.specs, group.id).description.trim(),
    )
    .map((group) => `${group.label} short description`);
  const infoOk = Boolean(
    product.name.trim() &&
      product.shortDescription.trim() &&
      (!needColor || product.color.trim()),
  );

  const rows = [
    {
      label: "Product info",
      value: infoOk
        ? needColor
          ? `Name, short description and color (${product.color})`
          : "Name and short description"
        : needColor
          ? "Name, short description or color missing"
          : "Name or short description missing",
      ok: infoOk,
      required: true,
    },
    {
      label: "Product image",
      value: product.images.length
        ? `${product.images.length} image${product.images.length > 1 ? "s" : ""}`
        : "No image yet",
      ok: product.images.length > 0,
      required: true,
    },
    {
      label: "Key features",
      value: `${product.keyFeatures.length} added`,
      ok: product.keyFeatures.length > 0,
    },
    {
      label: "Specifications",
      value: specNeeds.length
        ? `${specNeeds.join(", ")} missing`
        : `${specs.done} of ${specs.total} groups filled`,
      ok: specs.done > 0 && !specNeeds.length,
      required: specNeeds.length > 0,
    },
    {
      label: "Videos",
      value: `${product.videos.length} added`,
      ok: product.videos.length > 0,
    },
    {
      label: "Documents",
      value: `${product.documents.length} added`,
      ok: product.documents.length > 0,
    },
  ];

  return (
    <Modal
      size="md"
      onClose={onClose}
      busy={saving}
      labelledBy={titleId}
      footer={
        <>
          <button
            type="button"
            className="pd-btn pd-btn--grey pd-btn--grow pd-btn--lg"
            onClick={() => onSave("draft")}
            disabled={saving}
          >
            {live ? "Unpublish (Draft)" : "Save as Draft"}
          </button>
          <button
            type="button"
            className="pd-btn pd-btn--yellow pd-btn--grow pd-btn--lg"
            onClick={() => onSave("published")}
            disabled={saving || missing.length > 0}
          >
            {saving ? "Saving…" : live ? "Update" : "Publish"}
          </button>
        </>
      }
    >
      <div className="pd-modal-form">
      <div className="pd-modal-simple-head">
        <h2 id={titleId} className="pd-modal-title">
          Review &amp; Publish
        </h2>
        <button
          type="button"
          className="pd-modal-x"
          onClick={onClose}
          aria-label="Close"
          disabled={saving}
        >
          <IconClose size={16} />
        </button>
      </div>

      <div className="pd-review-head">
        <ProductThumb image={product.images[0]?.url} category={product.category} size={64} />
        <div>
          <p className="pd-review-name">{product.name || "Untitled product"}</p>
          <p className="pd-review-cat">
            {category.label}
            {product.series ? ` · ${product.series}` : ""}
          </p>
        </div>
        <StatusPill status={product.status} />
      </div>

      <ul className="pd-review-list">
        {rows.map((row) => (
          <li key={row.label} className={row.ok ? "is-ok" : row.required ? "is-bad" : "is-empty"}>
            <span className="pd-review-mark" aria-hidden="true">
              {row.ok ? <IconCheck size={10} /> : row.required ? "!" : ""}
            </span>
            <span className="pd-review-label">{row.label}</span>
            <span className="pd-review-value">{row.value}</span>
          </li>
        ))}
      </ul>

      {missing.length > 0 && (
        <p className="pd-review-warn">
          <IconAlert size={16} />
          To publish, add: {missing.join(", ").toLowerCase()}. You can still save
          it as a draft.
        </p>
      )}

      {error && (
        <p className="adm-banner adm-banner--bad" role="alert">
          {error}
        </p>
      )}
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   মূল পাতা
   --------------------------------------------------------------- */
function ProductEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const canEdit = ["owner", "admin"].includes(admin?.role);

  const isNewRoute = id === "new";
  const newCategory = validCategory(params.get("category"));
  const wanted = isNewRoute ? `new:${newCategory}` : id;

  /* doc = { key, product, saved }
     key   — কোন ঠিকানার জন্য এই তথ্য (নতুন হলে "new:<category>")
     saved — শেষবার save হওয়া অবস্থা; এর সাথে না মিললে "unsaved" */
  const [doc, setDoc] = useState(() =>
    isNewRoute ? makeNew(wanted, newCategory) : null,
  );
  const [loadError, setLoadError] = useState("");

  /* অন্য "new" ঠিকানায় এলে (অন্য category) — render এর সময়েই নতুন
     ফাঁকা product. React এর নিয়মে এটা বৈধ, effect লাগে না */
  const docIsNew = !doc || doc.key.startsWith("new:");
  if (isNewRoute && docIsNew && doc?.key !== wanted) {
    setDoc(makeNew(wanted, newCategory));
  }

  useEffect(() => {
    if (isNewRoute || doc?.key === id) return undefined;
    let alive = true;
    api
      .adminGetProduct(id)
      .then(({ product }) => {
        if (!alive) return;
        const loaded = fromServer(product);
        setLoadError("");
        setDoc({ key: id, product: loaded, saved: snapshot(loaded) });
      })
      .catch((error) => {
        if (alive) setLoadError(error.message);
      });
    return () => {
      alive = false;
    };
  }, [id, isNewRoute, doc?.key]);

  /* প্রথম save এর পরের এক মুহূর্ত: product এর id এসে গেছে কিন্তু
     ঠিকানা তখনো /new — তখনও পাতা তৈরি ধরা হয়, নাহলে এক ঝলক
     "Loading…" দেখাত */
  const ready = Boolean(doc && (doc.key === wanted || (isNewRoute && !docIsNew)));
  const product = ready ? doc.product : null;

  const setProduct = (change) =>
    setDoc((current) => ({
      ...current,
      product: typeof change === "function" ? change(current.product) : change,
    }));

  const current = useMemo(() => (product ? snapshot(product) : ""), [product]);
  const dirty = Boolean(ready && current !== doc.saved);

  /* ---------- ধাপ ---------- */
  const [step, setStep] = useState(0);
  const [pickedGroup, setPickedGroup] = useState("");
  const groups = product ? categoryOf(product.category).specGroups : [];
  const group = groups.some((g) => g.id === pickedGroup) ? pickedGroup : groups[0]?.id;
  const groupIndex = groups.findIndex((g) => g.id === group);

  const topRef = useRef(null);
  const toTop = () =>
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goStep = (next) => {
    setStep(next);
    toTop();
  };

  /* ---------- save ---------- */
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null); // { tone, text }
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const allowLeave = useRef(false);
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const needName = () => {
    if (product.name.trim()) return false;
    setErrors({ name: "Enter the product name — it is needed even for a draft." });
    setStep(0);
    window.requestAnimationFrame(() => document.getElementById("pd-name")?.focus());
    return true;
  };

  const save = async (status = product.status) => {
    if (!canEdit || saving || !product) return false;
    if (needName()) return false;
    setErrors({});

    if (status === "published") {
      const missing = missingForPublish(product);
      if (missing.length) {
        setReviewError(`To publish, add: ${missing.join(", ").toLowerCase()}.`);
        return false;
      }
    }

    setSaving(true);
    setReviewError("");
    const sent = { ...product, status };
    const sentSnapshot = snapshot(sent);

    try {
      const body = toServer(sent);
      const { product: result } = product.id
        ? await api.updateProduct(product.id, body)
        : await api.createProduct(body);
      const next = fromServer(result);

      /* উত্তর আসার ফাঁকে admin আরও কিছু বদলে থাকলে সেগুলো হারানো
         চলবে না — তখন শুধু id, slug, status নেওয়া হয় */
      setDoc((old) => {
        const untouched = snapshot({ ...old.product, status }) === sentSnapshot;
        const merged = untouched
          ? next
          : { ...old.product, id: next.id, slug: next.slug, status: next.status, updatedAt: next.updatedAt };
        return { key: next.id, product: merged, saved: snapshot(next) };
      });

      if (!product.id) {
        allowLeave.current = true;
        Promise.resolve(navigate(`/admin/products/${next.id}`, { replace: true })).finally(
          () => {
            allowLeave.current = false;
          },
        );
      }

      return next;
    } catch (error) {
      setNotice({ tone: "bad", text: error.message });
      setReviewError(error.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    const result = await save(product.status === "published" ? "published" : "draft");
    if (result) {
      setNotice({
        tone: "ok",
        text: result.status === "published" ? "Changes saved." : "Saved as draft.",
      });
    }
  };

  const finish = async (status) => {
    const result = await save(status);
    if (!result) return;
    setReviewOpen(false);
    if (status === "published") {
      allowLeave.current = true;
      navigate("/admin/products", {
        state: { flash: `“${result.name}” is published.` },
      });
    } else {
      setNotice({ tone: "ok", text: "Saved as draft." });
    }
  };

  /* ---------- বার্তা কিছুক্ষণ পরে নিজে থেকে সরে ---------- */
  useEffect(() => {
    if (!notice || notice.tone === "bad") return undefined;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  /* ---------- save না করে বেরোনো ---------- */
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowLeave.current &&
      dirtyRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /* ---------- Ctrl/⌘ + S ---------- */
  const saveRef = useRef(saveDraft);
  useEffect(() => {
    saveRef.current = saveDraft;
  });
  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const category = product ? categoryOf(product.category) : categoryOf(newCategory);
  const heading = `${isNewRoute && !product?.id ? "Add" : canEdit ? "Edit" : "View"} ${category.label}`;
  useDocumentTitle(heading);

  /* ---------- পাতা আসার আগে / ভুল id ---------- */
  if (!ready) {
    return (
      <div className="pd-page">
        <div className="pd-head">
          <h1 className="pd-title">{loadError ? "Product not found" : "Loading…"}</h1>
        </div>
        {loadError ? (
          <section className="pd-card pd-empty">
            <p className="pd-empty-title">{loadError}</p>
            <Link className="pd-btn pd-btn--yellow" to="/admin/products">
              <IconArrowLeft size={16} />
              Back to Product Library
            </Link>
          </section>
        ) : (
          <section className="pd-card pd-loading-card" aria-busy="true">
            <span className="admin-spinner" />
          </section>
        )}
      </div>
    );
  }

  /* ---------- নিচের বোতামের সারি ---------- */
  const next = () => {
    if (step === 0) {
      if (needName()) return;
      goStep(1);
      return;
    }
    if (step === 1) {
      if (groupIndex < groups.length - 1) {
        setPickedGroup(groups[groupIndex + 1].id);
        toTop();
      } else goStep(2);
      return;
    }
    if (step === 2) {
      goStep(3);
      return;
    }
    setReviewError("");
    setReviewOpen(true);
  };

  const previous = () => {
    if (step === 0) {
      navigate("/admin/products");
      return;
    }
    if (step === 1 && groupIndex > 0) {
      setPickedGroup(groups[groupIndex - 1].id);
      toTop();
      return;
    }
    if (step === 2) setPickedGroup(groups.at(-1)?.id ?? "");
    goStep(step - 1);
  };

  const nextLabel =
    step === 0
      ? "Next: Specifications"
      : step === 1
        ? groupIndex < groups.length - 1
          ? `Next: ${groups[groupIndex + 1].label}`
          : "Next: Videos"
        : step === 2
          ? "Next: Documents & Resources"
          : "Next: Review & Publish";

  const footer = (
    <div className="pd-foot">
      <button type="button" className="pd-btn pd-btn--line" onClick={previous}>
        <IconArrowLeft size={14} />
        {step === 0 ? "Back to list" : "Previous"}
      </button>
      <div className="pd-foot-right">
        {canEdit && (
          <button
            type="button"
            className="pd-btn pd-btn--grey"
            onClick={saveDraft}
            disabled={saving}
          >
            {saving ? "Saving…" : product.status === "published" ? "Save changes" : "Save as Draft"}
          </button>
        )}
        {(canEdit || step < 3) && (
          <button type="button" className="pd-btn pd-btn--yellow" onClick={next}>
            {nextLabel}
            <IconArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );

  const saveState = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : product.id
        ? "All changes saved"
        : "Not saved yet";

  return (
    <div className="pd-page" ref={topRef}>
      {/* ---- মাথার সারি ---- */}
      <div className="pd-head">
        <div className="pd-head-left">
          <h1 className="pd-title">{heading}</h1>
          <span className="pd-head-meta">
            <StatusPill status={product.status} />
            <span className={`pd-save-state${dirty ? " is-dirty" : ""}`} aria-live="polite">
              {saveState}
            </span>
          </span>
        </div>
        <div className="pd-head-tools">
          <span className="adm-chip">
            <IconCalendar size={20} />
            {dayFormat.format(new Date())}
          </span>
          <AdminClock />
        </div>
      </div>

      {!canEdit && (
        <p className="adm-banner adm-banner--bad">
          You can view products. Only owners and admins can change them.
        </p>
      )}

      {/* ---- ধাপের সারি ---- */}
      <nav className="pd-card pd-steps" aria-label="Steps">
        <ol>
          {STEPS.map((item, index) => {
            const state = index === step ? "is-on" : index < step ? "is-done" : "";
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`pd-step ${state}`}
                  onClick={() => {
                    if (index > 0 && needName()) return;
                    goStep(index);
                  }}
                  aria-current={index === step ? "step" : undefined}
                >
                  <span className="pd-step-num">
                    {index < step ? <IconCheck size={12} /> : index + 1}
                  </span>
                  <span className="pd-step-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {notice && (
        <p
          className={`adm-banner ${notice.tone === "bad" ? "adm-banner--bad" : "adm-banner--ok"} pd-notice`}
          role={notice.tone === "bad" ? "alert" : "status"}
        >
          {notice.text}
          {notice.tone === "bad" && (
            <button
              type="button"
              className="pd-notice-x"
              onClick={() => setNotice(null)}
              aria-label="Dismiss"
            >
              <IconClose size={14} />
            </button>
          )}
        </p>
      )}

      {/* ---- চারটা ধাপ — একসাথে পাতায়, দেখা যায় একটা ---- */}
      <div className="pd-step-pane" hidden={step !== 0}>
        <Lock locked={!canEdit}>
          <StepInfo product={product} setProduct={setProduct} errors={errors} canEdit={canEdit} />
        </Lock>
      </div>

      <div className="pd-step-pane pd-spec-layout" hidden={step !== 1}>
        <SpecNav product={product} active={group} onPick={(id) => setPickedGroup(id)} />
        <div className="pd-spec-right">
          <Lock locked={!canEdit}>
            <StepSpecs product={product} setProduct={setProduct} active={group} />
          </Lock>
          <Tip />
          {step === 1 && footer}
        </div>
      </div>

      <div className="pd-step-pane" hidden={step !== 2}>
        <Lock locked={!canEdit}>
          <StepVideos product={product} setProduct={setProduct} canEdit={canEdit} />
        </Lock>
      </div>

      <div className="pd-step-pane" hidden={step !== 3}>
        <Lock locked={!canEdit}>
          <StepDocuments product={product} setProduct={setProduct} canEdit={canEdit} />
        </Lock>
        <Tip />
      </div>

      {step !== 1 && footer}

      {reviewOpen && (
        <ReviewModal
          product={product}
          saving={saving}
          error={reviewError}
          onClose={() => setReviewOpen(false)}
          onSave={finish}
        />
      )}

      {blocker.state === "blocked" && (
        <ConfirmModal
          title="Leave without saving?"
          confirmLabel="Leave without saving"
          cancelLabel="Stay"
          onClose={() => blocker.reset()}
          onConfirm={() => blocker.proceed()}
        >
          <p>You have changes that are not saved yet. They will be lost.</p>
        </ConfirmModal>
      )}
    </div>
  );
}

export default ProductEditor;
