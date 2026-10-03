import { useState } from "react";
import { FeatureModal, ImagesCard, VideoUrls } from "../products/StepInfo";
import { AddButton } from "../products/SpecEditors";
import {
  CATEGORIES,
  PROJECT_ICONS,
  PROJECT_LIMITS,
  PROJECT_TYPES,
  iconOf,
} from "./projectCatalog";
import { IconCalendar, IconLocation, IconPencil, IconTrash } from "../icons";
import AdminSelect from "../AdminSelect";

/* ===============================================================
   ধাপ ১ — Project Info (Figma: 1030 × 968)

   বাঁয়ে: Basic Information আর Key Features
   ডানে:  Project Image (upload) আর Video URLs

   ছবি আর Video URL এর অংশ Product পাতার টাই (StepInfo.jsx) — একই
   আচরণ: টেনে ছেড়ে upload, % দেখায়, ★ দিয়ে মূল ছবি বদল
   =============================================================== */

const FEATURE_EXAMPLES = { title: "50,000", subtitle: "SQ FT Facility" };

function StepProjectInfo({ project, setProject, errors = {}, canEdit }) {
  const [featureEdit, setFeatureEdit] = useState(null); // null | "new" | index

  const set = (field) => (event) => {
    const value = event.target.value;
    setProject((p) => ({ ...p, [field]: value }));
  };

  const features = project.keyFeatures;
  // নাম লিখে ফেললেই লাল লেখা সরে যায়
  const titleError = project.title.trim() ? "" : errors.title;

  return (
    <div className="pd-info">
      <div className="pd-info-main">
        {/* ---- Basic Information ---- */}
        <section className="pd-card pd-form-card" aria-labelledby="pj-basic-title">
          <h3 id="pj-basic-title" className="pd-card-title pd-card-title--sm">
            Basic Information
          </h3>

          <div className="pd-two">
            <label className="pd-field-wrap">
              <span className="pd-label">
                Project Title <span className="pd-required">*</span>
              </span>
              <span className={`pd-input-box${titleError ? " is-bad" : ""}`}>
                <input
                  id="pj-title"
                  value={project.title}
                  maxLength={PROJECT_LIMITS.title}
                  placeholder="e.g. Warehouse Lighting Upgrade"
                  aria-invalid={Boolean(titleError) || undefined}
                  readOnly={!canEdit}
                  onChange={set("title")}
                />
                <span className="pd-count">
                  {project.title.length} / {PROJECT_LIMITS.title}
                </span>
              </span>
              {titleError && <span className="pd-error">{titleError}</span>}
            </label>

            <label className="pd-field-wrap">
              <span className="pd-label">
                Company Name <span className="pd-required">*</span>
              </span>
              <input
                className="pd-input"
                value={project.company}
                maxLength={PROJECT_LIMITS.company}
                placeholder="e.g. ABC Corporation"
                autoComplete="organization"
                readOnly={!canEdit}
                onChange={set("company")}
              />
            </label>
          </div>

          <label className="pd-field-wrap">
            <span className="pd-label">
              Short Description <span className="pd-required">*</span>
            </span>
            <span className="pd-textarea-box">
              <textarea
                className="pd-textarea"
                rows={3}
                value={project.shortDescription}
                maxLength={PROJECT_LIMITS.shortDescription}
                placeholder="Write a short summary of the project (appears in the project list and preview)."
                readOnly={!canEdit}
                onChange={set("shortDescription")}
              />
              <span className="pd-count">
                {project.shortDescription.length} / {PROJECT_LIMITS.shortDescription}
              </span>
            </span>
          </label>

          <div className="pd-two">
            <label className="pd-field-wrap">
              <span className="pd-label">
                Project Type <span className="pd-required">*</span>
              </span>
              <AdminSelect
                className={`pd-input pd-select${!project.projectType ? " is-placeholder" : ""}`}
                value={project.projectType}
                disabled={!canEdit}
                onChange={set("projectType")}
              >
                <option value="">Select project type</option>
                {PROJECT_TYPES.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </AdminSelect>
            </label>

            <label className="pd-field-wrap">
              <span className="pd-label">
                Category <span className="pd-required">*</span>
              </span>
              <AdminSelect
                className={`pd-input pd-select${!project.category ? " is-placeholder" : ""}`}
                value={project.category}
                disabled={!canEdit}
                onChange={set("category")}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </AdminSelect>
            </label>
          </div>

          <div className="pd-two">
            <label className="pd-field-wrap">
              <span className="pd-label">
                Location <span className="pd-required">*</span>
              </span>
              <span className="pd-input-box">
                <input
                  value={project.location}
                  maxLength={PROJECT_LIMITS.location}
                  placeholder="e.g. New York, USA"
                  readOnly={!canEdit}
                  onChange={set("location")}
                />
                <IconLocation size={16} className="pj-field-icon" />
              </span>
              <span className="pj-field-note">City, Country — used for the location chart.</span>
            </label>

            <label className="pd-field-wrap">
              <span className="pd-label">
                Date <span className="pd-required">*</span>
              </span>
              <span className="pd-input-box pj-date">
                <input
                  type="date"
                  className={project.date ? undefined : "is-empty"}
                  value={project.date}
                  min="1950-01-01"
                  max="2100-12-31"
                  readOnly={!canEdit}
                  onChange={set("date")}
                />
                <IconCalendar size={16} className="pj-field-icon" />
              </span>
            </label>
          </div>
        </section>

        {/* ---- Key Features ---- */}
        <section className="pd-card pd-form-card" aria-labelledby="pj-features-title">
          <div className="pd-card-row">
            <h3 id="pj-features-title" className="pd-card-title pd-card-title--sm">
              Key Features
            </h3>
            {canEdit && (
              <AddButton
                onClick={() => setFeatureEdit("new")}
                disabled={features.length >= PROJECT_LIMITS.keyFeatures}
              />
            )}
          </div>

          {features.length ? (
            <ul className="pd-features">
              {features.map((feature, index) => {
                const Icon = iconOf(feature.icon);
                return (
                  <li key={index} className="pd-feature">
                    <span className="pd-feature-icon">
                      <Icon size={18} />
                    </span>
                    <span className="pd-feature-text">
                      <strong>{feature.title}</strong>
                      <span>{feature.subtitle}</span>
                    </span>
                    {canEdit && (
                      <span className="pd-row-tools">
                        <button
                          type="button"
                          className="pd-icon-btn pd-icon-btn--bad pd-icon-btn--sm"
                          onClick={() =>
                            setProject((p) => ({
                              ...p,
                              keyFeatures: p.keyFeatures.filter((_, i) => i !== index),
                            }))
                          }
                          aria-label={`Delete ${feature.title}`}
                          title="Delete"
                        >
                          <IconTrash size={16} />
                        </button>
                        <button
                          type="button"
                          className="pd-icon-btn pd-icon-btn--sm"
                          onClick={() => setFeatureEdit(index)}
                          aria-label={`Edit ${feature.title}`}
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
          ) : (
            <p className="pd-hint">
              The project in numbers — for example “50,000 SQ FT Facility” or “50%
              Energy savings”.
            </p>
          )}
        </section>
      </div>

      <aside className="pd-info-side">
        <div className="pd-card pd-side-card">
          <ImagesCard
            product={project}
            setProduct={setProject}
            canEdit={canEdit}
            kind="project-image"
            label="Project Image"
          />
          {errors.images && <p className="pd-error">{errors.images}</p>}
          <VideoUrls product={project} setProduct={setProject} canEdit={canEdit} />
        </div>
      </aside>

      {featureEdit !== null && (
        <FeatureModal
          icons={PROJECT_ICONS}
          examples={FEATURE_EXAMPLES}
          initial={featureEdit === "new" ? null : features[featureEdit]}
          onClose={() => setFeatureEdit(null)}
          onSave={(feature) => {
            setProject((p) => ({
              ...p,
              keyFeatures:
                featureEdit === "new"
                  ? [...p.keyFeatures, feature]
                  : p.keyFeatures.map((item, i) => (i === featureEdit ? feature : item)),
            }));
            setFeatureEdit(null);
          }}
        />
      )}
    </div>
  );
}

export default StepProjectInfo;
