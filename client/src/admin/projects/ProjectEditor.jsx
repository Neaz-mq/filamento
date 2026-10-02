import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAdminAuth, useDocumentTitle } from "../AdminAuth";
import AdminClock from "../AdminClock";
import Modal, { ConfirmModal } from "../products/Modal";
import StepProjectInfo from "./StepProjectInfo";
import StepStory from "./StepStory";
import StepProducts from "./StepProducts";
import { ProjectStatus, ProjectThumb } from "./ProjectLibrary";
import { CATEGORIES, PROJECT_TYPES, STATUSES, isLive, labelOf } from "./projectCatalog";
import {
  ctaProblem,
  emptyProject,
  fromServer,
  missingForPublish,
  snapshot,
  toServer,
} from "./projectShape";
import {
  IconAlert,
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconClose,
} from "../icons";
import "../products/products.css";
import "./projects.css";

/* ===============================================================
   Add / Edit Project — তিন ধাপ

     /admin/projects/new   → নতুন
     /admin/projects/<id>  → পুরনোটা সম্পাদনা

   Product পাতার মতোই: প্রথমবার save করলে ঠিকানা নিজে থেকে
   /admin/projects/<id> হয়, তিনটা ধাপ একসাথে পাতায় থাকে (চলতে
   থাকা ছবি upload থামে না), save না করে বেরোতে গেলে জিজ্ঞেস করে,
   Ctrl/⌘ + S এ save.

   শেষে Review & Publish — এখানে ঠিক করা হয় project টা Completed
   নাকি In Progress হিসেবে সাইটে যাবে
   =============================================================== */

const STEPS = [
  { id: "info", label: "Project Info" },
  { id: "specs", label: "Specifications" },
  { id: "products", label: "Product Used" },
];

const dayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

/* origin "new" — /new ঠিকানা থেকে শুরু হওয়া project (save এর পরেও).
   এতে বোঝা যায় /new এ ফিরলে নতুন ফাঁকা project লাগবে কি না */
const makeNew = () => {
  const project = emptyProject();
  return { key: "new", origin: "new", project, saved: snapshot(project) };
};

/* editor ভূমিকার admin — ভেতরের সব ঘর একসাথে বন্ধ */
function Lock({ locked, children }) {
  if (!locked) return children;
  return (
    <fieldset className="pd-lock" disabled>
      {children}
    </fieldset>
  );
}

/* ---------------------------------------------------------------
   Review & Publish
   --------------------------------------------------------------- */
function ReviewModal({ project, saving, error, onClose, onSave }) {
  const titleId = useId();
  const missing = missingForPublish(project);
  const live = isLive(project.status);
  const [stage, setStage] = useState(live ? project.status : "completed");

  const infoMissing = missing.filter((item) => !item.toLowerCase().includes("image"));
  const removed = project.products.filter((id) => project.items[id]?.missing).length;
  const drafts = project.products.filter((id) => project.items[id]?.status === "draft").length;
  const story = [
    project.challenge.trim() && "challenge",
    project.solution.length && "solution",
    project.results.trim() && "results",
  ].filter(Boolean);

  const rows = [
    {
      label: "Project info",
      value: infoMissing.length
        ? `${infoMissing.join(", ")} missing`
        : `${labelOf(PROJECT_TYPES, project.projectType)} · ${project.location}`,
      ok: !infoMissing.length,
      required: true,
    },
    {
      label: "Project image",
      value: project.images.length
        ? `${project.images.length} image${project.images.length > 1 ? "s" : ""}`
        : "No image yet",
      ok: project.images.length > 0,
      required: true,
    },
    {
      label: "Key features",
      value: `${project.keyFeatures.length} added`,
      ok: project.keyFeatures.length > 0,
    },
    {
      label: "Specifications",
      value: story.length ? `${story.length} of 3 parts written` : "Challenge, solution and results are empty",
      ok: story.length === 3,
    },
    {
      label: "Highlights",
      value: `${project.highlights.filter((item) => item.trim()).length} added`,
      ok: project.highlights.some((item) => item.trim()),
    },
    {
      label: "Products used",
      value: project.products.length
        ? `${project.products.length} product${project.products.length > 1 ? "s" : ""}${
            drafts ? ` · ${drafts} still draft (hidden on the site)` : ""
          }${removed ? ` · ${removed} removed` : ""}`
        : "None picked yet",
      ok: project.products.length > 0 && !removed,
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
            onClick={() => onSave(stage)}
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
          <ProjectThumb image={project.images[0]?.url} size={64} />
          <div>
            <p className="pd-review-name">{project.title || "Untitled project"}</p>
            <p className="pd-review-cat">
              {[project.ref && `#${project.ref}`, project.company, labelOf(CATEGORIES, project.category)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <ProjectStatus status={project.status} />
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

        {/* সাইটে কোন অবস্থায় যাবে */}
        <fieldset className="pj-stage" disabled={saving}>
          <legend className="pd-label">Show on the website as</legend>
          {["completed", "in-progress"].map((key) => (
            <label key={key} className={`pj-stage-choice${stage === key ? " is-on" : ""}`}>
              <input
                type="radio"
                name="project-stage"
                value={key}
                checked={stage === key}
                onChange={() => setStage(key)}
              />
              <span className="pj-dot" style={{ background: STATUSES[key].color }} />
              <span>
                <strong>{STATUSES[key].label}</strong>
                <small>
                  {key === "completed" ? "The work is finished." : "Installation is still going on."}
                </small>
              </span>
            </label>
          ))}
        </fieldset>

        {missing.length > 0 && (
          <p className="pd-review-warn">
            <IconAlert size={16} />
            To publish, add: {missing.join(", ").toLowerCase()}. You can still save it as a
            draft.
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
function ProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const canEdit = ["owner", "admin"].includes(admin?.role);

  const isNewRoute = id === "new";

  /* doc = { key, origin, project, saved }
     key   — কোন ঠিকানার জন্য এই তথ্য ("new" অথবা id)
     saved — শেষবার save হওয়া অবস্থা; এর সাথে না মিললে "unsaved" */
  const [doc, setDoc] = useState(() => (isNewRoute ? makeNew() : null));
  const [loadError, setLoadError] = useState("");

  /* অন্য project থেকে /new এ এলে — render এর সময়েই নতুন ফাঁকা
     project (React এর নিয়মে বৈধ, effect লাগে না) */
  if (isNewRoute && doc?.origin !== "new") setDoc(makeNew());

  useEffect(() => {
    if (isNewRoute || doc?.key === id) return undefined;
    let alive = true;
    api
      .adminGetProject(id)
      .then(({ project }) => {
        if (!alive) return;
        const loaded = fromServer(project);
        setLoadError("");
        setDoc({ key: id, origin: id, project: loaded, saved: snapshot(loaded) });
      })
      .catch((error) => {
        if (alive) setLoadError(error.message);
      });
    return () => {
      alive = false;
    };
  }, [id, isNewRoute, doc?.key]);

  /* প্রথম save এর পরের মুহূর্ত: id এসে গেছে কিন্তু ঠিকানা তখনো
     /new — তখনও পাতা তৈরি ধরা হয় */
  const ready = Boolean(doc && (isNewRoute ? doc.origin === "new" : doc.key === id));
  const project = ready ? doc.project : null;

  const setProject = (change) =>
    setDoc((current) => ({
      ...current,
      project: typeof change === "function" ? change(current.project) : change,
    }));

  const current = useMemo(() => (project ? snapshot(project) : ""), [project]);
  const dirty = Boolean(ready && current !== doc.saved);

  /* ---------- ধাপ ---------- */
  const [step, setStep] = useState(0);
  const topRef = useRef(null);

  const goStep = (next) => {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const focusLater = (selector) =>
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());

  const needTitle = () => {
    if (project.title.trim()) return false;
    setErrors({ title: "Enter the project title — it is needed even for a draft." });
    setStep(0);
    focusLater("#pj-title");
    return true;
  };

  // Call to Action অর্ধেক থাকলে server ফিরিয়ে দিত — আগেই দেখানো
  const needCta = () => {
    const problem = ctaProblem(project.cta);
    if (!problem) return false;
    setErrors({ cta: problem });
    setStep(1);
    focusLater(project.cta.text.trim() ? "#pj-cta-link" : "#pj-cta-text");
    return true;
  };

  const save = async (status = project.status) => {
    if (!canEdit || saving || !project) return false;
    if (needTitle() || needCta()) {
      setReviewOpen(false);
      return false;
    }
    setErrors({});

    if (isLive(status)) {
      const missing = missingForPublish(project);
      if (missing.length) {
        setReviewError(`To publish, add: ${missing.join(", ").toLowerCase()}.`);
        return false;
      }
    }

    setSaving(true);
    setReviewError("");
    const sent = { ...project, status };
    const sentSnapshot = snapshot(sent);

    try {
      const body = toServer(sent);
      const { project: result } = project.id
        ? await api.updateProject(project.id, body)
        : await api.createProject(body);
      const next = fromServer(result);

      /* উত্তর আসার ফাঁকে admin আরও কিছু বদলে থাকলে সেগুলো হারানো
         চলবে না — তখন শুধু id, নম্বর, slug, status নেওয়া হয় */
      setDoc((old) => {
        const untouched = snapshot({ ...old.project, status }) === sentSnapshot;
        const merged = untouched
          ? next
          : {
              ...old.project,
              id: next.id,
              ref: next.ref,
              slug: next.slug,
              status: next.status,
              updatedAt: next.updatedAt,
              items: { ...old.project.items, ...next.items },
            };
        return { key: next.id, origin: old.origin, project: merged, saved: snapshot(next) };
      });

      if (!project.id) {
        allowLeave.current = true;
        Promise.resolve(navigate(`/admin/projects/${next.id}`, { replace: true })).finally(() => {
          allowLeave.current = false;
        });
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
    const result = await save(project.status);
    if (result) {
      setNotice({
        tone: "ok",
        text: isLive(result.status) ? "Changes saved." : "Saved as draft.",
      });
    }
  };

  const finish = async (status) => {
    const result = await save(status);
    if (!result) return;
    setReviewOpen(false);
    if (isLive(status)) {
      allowLeave.current = true;
      navigate("/admin/projects", {
        state: { flash: `“${result.title}” is published as ${STATUSES[status].label}.` },
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
      !allowLeave.current && dirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
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

  const heading = isNewRoute && !project?.id ? "Add New Project" : canEdit ? "Edit Project" : "View Project";
  useDocumentTitle(heading);

  /* ---------- পাতা আসার আগে / ভুল id ---------- */
  if (!ready) {
    return (
      <div className="pd-page">
        <div className="pd-head">
          <h1 className="pd-title">{loadError ? "Project not found" : "Loading…"}</h1>
        </div>
        {loadError ? (
          <section className="pd-card pd-empty">
            <p className="pd-empty-title">{loadError}</p>
            <Link className="pd-btn pd-btn--yellow" to="/admin/projects">
              <IconArrowLeft size={16} />
              Back to Project Library
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
      if (needTitle()) return;
      goStep(1);
      return;
    }
    if (step === 1) {
      goStep(2);
      return;
    }
    setReviewError("");
    setReviewOpen(true);
  };

  const previous = () => {
    if (step === 0) navigate("/admin/projects");
    else goStep(step - 1);
  };

  const nextLabel =
    step === 0 ? "Next: Specifications" : step === 1 ? "Next: Product Used" : "Next: Review & Publish";

  const saveState = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : project.id
        ? "All changes saved"
        : "Not saved yet";

  return (
    <div className="pd-page" ref={topRef}>
      {/* ---- মাথার সারি ---- */}
      <div className="pd-head">
        <div className="pd-head-left">
          <h1 className="pd-title">{heading}</h1>
          <span className="pd-head-meta">
            {project.ref && <span className="pj-head-ref">#{project.ref}</span>}
            <ProjectStatus status={project.status} />
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
          You can view projects. Only owners and admins can change them.
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
                    if (index > 0 && needTitle()) return;
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

      {/* ---- তিনটা ধাপ — একসাথে পাতায়, দেখা যায় একটা ---- */}
      <div className="pd-step-pane" hidden={step !== 0}>
        <Lock locked={!canEdit}>
          <StepProjectInfo project={project} setProject={setProject} errors={errors} canEdit={canEdit} />
        </Lock>
      </div>

      <div className="pd-step-pane" hidden={step !== 1}>
        <Lock locked={!canEdit}>
          <StepStory project={project} setProject={setProject} errors={errors} canEdit={canEdit} />
        </Lock>
      </div>

      <div className="pd-step-pane" hidden={step !== 2}>
        <Lock locked={!canEdit}>
          <StepProducts
            project={project}
            setProject={setProject}
            canEdit={canEdit}
            active={step === 2}
          />
        </Lock>
      </div>

      <div className="pd-foot">
        <button type="button" className="pd-btn pd-btn--line" onClick={previous}>
          <IconArrowLeft size={14} />
          {step === 0 ? "Back to list" : "Previous"}
        </button>
        <div className="pd-foot-right">
          {canEdit && (
            <button type="button" className="pd-btn pd-btn--grey" onClick={saveDraft} disabled={saving}>
              {saving ? "Saving…" : isLive(project.status) ? "Save changes" : "Save as Draft"}
            </button>
          )}
          {(canEdit || step < 2) && (
            <button type="button" className="pd-btn pd-btn--yellow" onClick={next}>
              {nextLabel}
              <IconArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {reviewOpen && (
        <ReviewModal
          project={project}
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

export default ProjectEditor;
