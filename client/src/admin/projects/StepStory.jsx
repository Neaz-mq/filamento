import { useId, useLayoutEffect, useRef, useState } from "react";
import Modal from "../products/Modal";
import { AddButton } from "../products/SpecEditors";
import { PROJECT_ICONS, PROJECT_LIMITS, iconOf } from "./projectCatalog";
import { ctaProblem } from "./projectShape";
import {
  IconClose,
  IconLink,
  IconPencil,
  IconPlus,
  IconSend,
  IconTickCircle,
  IconTrash,
} from "../icons";

/* ===============================================================
   ধাপ ২ — Specifications (Figma: 1030 × 1428)

   বাঁয়ে project এর গল্প, তিন ভাগে:
     01 The Challenge — কী সমস্যা ছিল (লম্বা লেখা)
     02 The Solution  — Filamento কী দিল (icon + শিরোনাম + বিবরণ)
     03 The Results   — কী ফল হলো (লম্বা লেখা)
   ডানে: Highlights (ছোট ছোট সুবিধার তালিকা) আর Call to Action
   (project পাতার নিচের বোতাম)

   লম্বা লেখায় Enter চাপলে নতুন অনুচ্ছেদ — সাইটেও আলাদা অনুচ্ছেদ
   হয়ে দেখাবে
   =============================================================== */

function StoryCard({ number, title, hint, children, titleId }) {
  return (
    <section className="pd-card pj-story" aria-labelledby={titleId}>
      <p className="pj-story-hint">{hint}</p>
      <h3 id={titleId} className="pj-story-title">
        <span className="pj-story-num">{number}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function StoryText({
  value,
  onChange,
  placeholder,
  canEdit,
  label,
  max = PROJECT_LIMITS.story,
  rows = 6,
}) {
  return (
    <span className="pd-textarea-box pj-story-box">
      <textarea
        className={`pd-textarea pj-story-text${rows < 4 ? " pj-story-text--short" : ""}`}
        rows={rows}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        aria-label={label}
        readOnly={!canEdit}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="pd-count">
        {value.length} / {max}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------
   The Solution এর একটা অংশ যোগ / বদল
   --------------------------------------------------------------- */
function SolutionModal({ initial, onSave, onClose }) {
  const [item, setItem] = useState(initial ?? { icon: "sun", title: "", description: "" });
  const titleId = useId();
  const valid = item.title.trim() || item.description.trim();

  return (
    <Modal
      size="sm"
      onClose={onClose}
      labelledBy={titleId}
      footer={
        <>
          <button type="button" className="pd-btn pd-btn--line" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="pj-solution-form"
            className="pd-btn pd-btn--yellow"
            disabled={!valid}
          >
            Save
          </button>
        </>
      }
    >
      <form
        id="pj-solution-form"
        className="pd-modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          onSave({
            icon: item.icon,
            title: item.title.trim(),
            description: item.description.trim().replace(/\s+/g, " "),
          });
        }}
      >
        <div className="pd-modal-simple-head">
          <h2 id={titleId} className="pd-modal-title">
            {initial ? "Edit Feature" : "Add Feature"}
          </h2>
          <button type="button" className="pd-modal-x" onClick={onClose} aria-label="Close">
            <IconClose size={16} />
          </button>
        </div>

        <fieldset className="pd-icon-pick">
          <legend className="pd-label">Icon</legend>
          {Object.entries(PROJECT_ICONS).map(([key, { label, Icon }]) => (
            <label
              key={key}
              className={`pd-icon-choice${item.icon === key ? " is-on" : ""}`}
              title={label}
            >
              <input
                type="radio"
                name="solution-icon"
                className="sr-only"
                checked={item.icon === key}
                onChange={() => setItem((old) => ({ ...old, icon: key }))}
              />
              <Icon size={20} />
              <span className="sr-only">{label}</span>
            </label>
          ))}
        </fieldset>

        <label className="pd-field-wrap">
          <span className="pd-label">Title</span>
          <input
            className="pd-input"
            value={item.title}
            maxLength={PROJECT_LIMITS.solutionTitle}
            placeholder="Uniform, Glare-Free Light"
            data-autofocus
            onChange={(event) => setItem((old) => ({ ...old, title: event.target.value }))}
          />
        </label>

        <label className="pd-field-wrap">
          <span className="pd-label">Description</span>
          <span className="pd-textarea-box">
            <textarea
              className="pd-textarea"
              rows={3}
              value={item.description}
              maxLength={PROJECT_LIMITS.solutionText}
              placeholder="High-performance LED high bays deliver consistent, comfortable light across all spaces."
              onChange={(event) =>
                setItem((old) => ({ ...old, description: event.target.value }))
              }
            />
            <span className="pd-count">
              {item.description.length} / {PROJECT_LIMITS.solutionText}
            </span>
          </span>
        </label>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   Highlights — এক লাইনের তালিকা. Enter চাপলে নিচে নতুন সারি
   --------------------------------------------------------------- */
function Highlights({ items, onChange, canEdit }) {
  const listRef = useRef(null);
  const full = items.length >= PROJECT_LIMITS.highlights;

  /* নতুন সারিতে focus — নতুন ঘরটা পাতায় বসার সাথে সাথেই (layout
     effect), যাতে Enter এর পরপরই টাইপ করা অক্ষর আগের সারিতে না যায় */
  const pendingFocus = useRef(null);
  useLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    listRef.current?.querySelectorAll("input")?.[pendingFocus.current]?.focus();
    pendingFocus.current = null;
  });

  const focusRow = (index) => {
    pendingFocus.current = index;
  };

  const addAt = (index) => {
    if (full) return;
    onChange([...items.slice(0, index), "", ...items.slice(index)]);
    focusRow(index);
  };

  return (
    <section className="pd-card pj-side-block" aria-labelledby="pj-highlights-title">
      <div className="pd-card-row">
        <h3 id="pj-highlights-title" className="pd-card-title pd-card-title--sm">
          Highlights
        </h3>
        {canEdit && <AddButton onClick={() => addAt(items.length)} disabled={full} />}
      </div>

      {items.length ? (
        <ul className="pj-highlights" ref={listRef}>
          {items.map((item, index) => (
            <li key={index} className="pj-highlight">
              <input
                value={item}
                maxLength={PROJECT_LIMITS.highlight}
                placeholder="e.g. Lower energy consumption"
                aria-label={`Highlight ${index + 1}`}
                readOnly={!canEdit}
                onChange={(event) =>
                  onChange(items.map((old, i) => (i === index ? event.target.value : old)))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canEdit) {
                    event.preventDefault();
                    addAt(index + 1);
                  }
                }}
              />
              {canEdit && (
                <button
                  type="button"
                  className="pj-highlight-x"
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                  aria-label={`Delete highlight ${index + 1}`}
                  title="Delete"
                >
                  <IconTrash size={14} />
                </button>
              )}
              <IconTickCircle size={16} className="pj-highlight-tick" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="pd-hint">Short benefits shown as a checklist — one per line.</p>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------
   Call to Action
   --------------------------------------------------------------- */
function CallToAction({ cta, onChange, error: saveError, canEdit }) {
  /* save এ আটকালে তবেই লাল লেখা — তারপর ঠিক করতে করতেই বদলায়,
     ঠিক হলে সরে যায় */
  const error = saveError ? ctaProblem(cta) : "";
  return (
    <section className="pd-card pj-side-block" aria-labelledby="pj-cta-title">
      <div>
        <h3 id="pj-cta-title" className="pd-card-title pd-card-title--sm pj-cta-title">
          <IconSend size={16} />
          Call to Action
        </h3>
        <p className="pd-card-sub">Add a button to drive more engagement.</p>
      </div>

      <div className="pj-cta-fields">
        <label className="pd-field-wrap">
          <span className="pd-label">Button Text</span>
          <input
            id="pj-cta-text"
            className={`pd-input${error && !cta.text.trim() ? " is-bad" : ""}`}
            value={cta.text}
            maxLength={PROJECT_LIMITS.ctaText}
            placeholder="Explore Products"
            readOnly={!canEdit}
            onChange={(event) => onChange({ ...cta, text: event.target.value })}
          />
        </label>
        <label className="pd-field-wrap">
          <span className="pd-label">Link</span>
          <span className={`pd-input-box${error && cta.text.trim() ? " is-bad" : ""}`}>
            <input
              id="pj-cta-link"
              value={cta.link}
              maxLength={600}
              placeholder="/products"
              inputMode="url"
              readOnly={!canEdit}
              onChange={(event) => onChange({ ...cta, link: event.target.value })}
            />
            <IconLink size={14} className="pj-field-icon" />
          </span>
        </label>
      </div>

      <label className="pd-switch pj-cta-switch">
        <span>Open in new tab</span>
        <input
          type="checkbox"
          checked={cta.newTab}
          disabled={!canEdit}
          onChange={(event) => onChange({ ...cta, newTab: event.target.checked })}
        />
        <span className="pd-switch-track" aria-hidden="true" />
      </label>

      {error ? (
        <p className="pd-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="pd-hint">Leave both empty to hide the button.</p>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------
   পুরো ধাপ
   --------------------------------------------------------------- */
function StepStory({ project, setProject, errors = {}, canEdit }) {
  const [solutionEdit, setSolutionEdit] = useState(null); // null | "new" | index
  const ids = { challenge: useId(), solution: useId(), results: useId() };
  const solution = project.solution;
  const full = solution.length >= PROJECT_LIMITS.solutionFeatures;

  const setField = (field) => (value) => setProject((p) => ({ ...p, [field]: value }));

  return (
    <div className="pd-info">
      <div className="pd-info-main">
        <StoryCard
          number="01"
          title="The Challenge"
          titleId={ids.challenge}
          hint="Describe the problem, goal or challenge this project aimed to solve."
        >
          <StoryText
            label="The Challenge"
            value={project.challenge}
            onChange={setField("challenge")}
            canEdit={canEdit}
            placeholder="The facility needed uniform, low-glare light for its gyms, pools and common areas — while cutting energy and maintenance costs."
          />
        </StoryCard>

        <StoryCard
          number="02"
          title="The Solution"
          titleId={ids.solution}
          hint="Describe the lighting solution Filamento provided — one card per key part of it."
        >
          {/* উপরের ছোট বিবরণ (ঐচ্ছিক) — সাইটে "The Solution" এর ঠিক নিচে */}
          <StoryText
            label="Solution summary"
            value={project.solutionIntro ?? ""}
            onChange={setField("solutionIntro")}
            canEdit={canEdit}
            max={PROJECT_LIMITS.solutionIntro}
            rows={2}
            placeholder="Summary (optional) — e.g. Filamento provided a complete LED lighting solution designed to meet the center's performance and efficiency goals."
          />
          {solution.length > 0 && (
            <ul className="pj-solution">
              {solution.map((item, index) => {
                const Icon = iconOf(item.icon);
                return (
                  <li key={index} className="pj-solution-item">
                    <span className="pd-feature-icon">
                      <Icon size={18} />
                    </span>
                    <span className="pj-solution-text">
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </span>
                    {canEdit && (
                      <span className="pd-row-tools">
                        <button
                          type="button"
                          className="pd-icon-btn pd-icon-btn--bad pd-icon-btn--sm"
                          onClick={() =>
                            setProject((p) => ({
                              ...p,
                              solution: p.solution.filter((_, i) => i !== index),
                            }))
                          }
                          aria-label={`Delete ${item.title}`}
                          title="Delete"
                        >
                          <IconTrash size={16} />
                        </button>
                        <button
                          type="button"
                          className="pd-icon-btn pd-icon-btn--sm"
                          onClick={() => setSolutionEdit(index)}
                          aria-label={`Edit ${item.title}`}
                          title="Edit"
                        >
                          <IconPencil size={16} />
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {canEdit ? (
            <button
              type="button"
              className="pj-dashed-btn"
              onClick={() => setSolutionEdit("new")}
              disabled={full}
            >
              <IconPlus size={14} />
              Add Feature
            </button>
          ) : (
            !solution.length && <p className="pd-hint">No solution features yet.</p>
          )}
        </StoryCard>

        <StoryCard
          number="03"
          title="The Results"
          titleId={ids.results}
          hint="Share the positive impact and outcomes of this project."
        >
          <StoryText
            label="The Results"
            value={project.results}
            onChange={setField("results")}
            canEdit={canEdit}
            placeholder="Visitors now enjoy excellent visibility, and the center saves significantly on energy and maintenance."
          />
        </StoryCard>
      </div>

      <aside className="pd-info-side pj-side">
        <Highlights items={project.highlights} onChange={setField("highlights")} canEdit={canEdit} />
        <CallToAction
          cta={project.cta}
          onChange={setField("cta")}
          error={errors.cta}
          canEdit={canEdit}
        />
      </aside>

      {solutionEdit !== null && (
        <SolutionModal
          initial={solutionEdit === "new" ? null : solution[solutionEdit]}
          onClose={() => setSolutionEdit(null)}
          onSave={(item) => {
            setProject((p) => ({
              ...p,
              solution:
                solutionEdit === "new"
                  ? [...p.solution, item]
                  : p.solution.map((old, i) => (i === solutionEdit ? item : old)),
            }));
            setSolutionEdit(null);
          }}
        />
      )}
    </div>
  );
}

export default StepStory;
