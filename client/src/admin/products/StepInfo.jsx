import { useId, useRef, useState } from "react";
import Modal from "./Modal";
import {
  CATEGORIES,
  COLORS,
  FEATURE_ICONS,
  LIMITS,
  UPLOADS,
  categoryOf,
  serial,
} from "./catalog";
import { checkFile, isHttpsUrl, thumb, uploadFile } from "./upload";
import { moveItem } from "./useSortable";
import { AddButton } from "./SpecEditors";
import { ProductThumb } from "./ProductLibrary";
import {
  IconClose,
  IconGalleryAdd,
  IconLink,
  IconPencil,
  IconPlus,
  IconStar,
  IconTrash,
} from "../icons";

/* ===============================================================
   ধাপ ১ — Product Info (Figma: 1030 × 884)

   বাঁয়ে: Basic Information আর Key Features
          (Mounting Base এ Category র পাশে Color — catalog.js এর
          color: true দেখে)
   ডানে:  Product Image (upload) আর Video URLs

   ছবি তোলা শুরু হলে ঘরে সাথে সাথে ছবিটা (browser এর নিজের কপি)
   আর কত % হলো দেখায় — Cloudinary থেকে উত্তর এলে আসল ঠিকানা বসে.
   প্রথম ছবিটাই মূল ছবি (তালিকায় আর সাইটে ওটা দেখায়); ★ দিয়ে
   অন্য যেকোনোটাকে প্রথমে আনা যায়
   =============================================================== */

const SERIES_SUGGESTIONS = [
  "High Bay Lights",
  "Low Bay Lights",
  "Aisle Lighting",
  "Linear Lights",
  "Flood Lights",
];

let uploadSeed = 0;

/* ---------------------------------------------------------------
   Key Feature যোগ / বদল
   --------------------------------------------------------------- */
function FeatureModal({ initial, onSave, onClose }) {
  const [feature, setFeature] = useState(
    initial ?? { icon: "bolt", title: "", subtitle: "" },
  );
  const titleId = useId();
  const valid = feature.title.trim() || feature.subtitle.trim();

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
            form="pd-feature-form"
            className="pd-btn pd-btn--yellow"
            disabled={!valid}
          >
            Save
          </button>
        </>
      }
    >
      <form
        id="pd-feature-form"
        className="pd-modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          onSave({
            icon: feature.icon,
            title: feature.title.trim(),
            subtitle: feature.subtitle.trim(),
          });
        }}
      >
        <div className="pd-modal-simple-head">
          <h2 id={titleId} className="pd-modal-title">
            {initial ? "Edit Key Feature" : "Add Key Feature"}
          </h2>
          <button type="button" className="pd-modal-x" onClick={onClose} aria-label="Close">
            <IconClose size={16} />
          </button>
        </div>

        <fieldset className="pd-icon-pick">
          <legend className="pd-label">Icon</legend>
          {Object.entries(FEATURE_ICONS).map(([key, { label, Icon }]) => (
            <label
              key={key}
              className={`pd-icon-choice${feature.icon === key ? " is-on" : ""}`}
              title={label}
            >
              <input
                type="radio"
                name="feature-icon"
                className="sr-only"
                checked={feature.icon === key}
                onChange={() => setFeature((f) => ({ ...f, icon: key }))}
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
            value={feature.title}
            maxLength={LIMITS.featureText}
            placeholder="Up to 50%"
            data-autofocus
            onChange={(event) => setFeature((f) => ({ ...f, title: event.target.value }))}
          />
        </label>

        <label className="pd-field-wrap">
          <span className="pd-label">Subtitle</span>
          <input
            className="pd-input"
            value={feature.subtitle}
            maxLength={LIMITS.featureText}
            placeholder="energy savings"
            onChange={(event) => setFeature((f) => ({ ...f, subtitle: event.target.value }))}
          />
        </label>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   Product Image
   --------------------------------------------------------------- */
function ImagesCard({ product, setProduct, canEdit }) {
  const inputRef = useRef(null);
  const [selected, setSelected] = useState(0);
  const [uploads, setUploads] = useState([]);
  const [problem, setProblem] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");

  const images = product.images;
  const room = LIMITS.images - images.length - uploads.length;
  const current = images[Math.min(selected, images.length - 1)];

  const addImage = (image) =>
    setProduct((p) =>
      p.images.length >= LIMITS.images ? p : { ...p, images: [...p.images, image] },
    );

  const startUploads = (fileList) => {
    setProblem("");
    const files = [...fileList].slice(0, Math.max(0, room));
    if (fileList.length > files.length) {
      setProblem(`You can add up to ${LIMITS.images} images.`);
    }

    for (const file of files) {
      const error = checkFile(file, "image");
      if (error) {
        setProblem(error);
        continue;
      }

      uploadSeed += 1;
      const id = `up-${uploadSeed}`;
      const preview = URL.createObjectURL(file);
      setUploads((list) => [...list, { id, preview, progress: 0 }]);

      uploadFile(file, "image", {
        onProgress: (progress) =>
          setUploads((list) =>
            list.map((item) => (item.id === id ? { ...item, progress } : item)),
          ),
      })
        .then((result) => {
          addImage({
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
          });
        })
        .catch((error) => setProblem(error.message))
        .finally(() => {
          URL.revokeObjectURL(preview);
          setUploads((list) => list.filter((item) => item.id !== id));
        });
    }
  };

  const removeCurrent = () => {
    if (!current) return;
    setProduct((p) => ({
      ...p,
      images: p.images.filter((_, index) => index !== selected),
    }));
    setSelected((index) => Math.max(0, index - 1));
  };

  const makeMain = () => {
    setProduct((p) => ({ ...p, images: moveItem(p.images, selected, 0) }));
    setSelected(0);
  };

  const addLink = (event) => {
    event.preventDefault();
    if (!isHttpsUrl(link)) {
      setProblem("Paste an image link that starts with https://");
      return;
    }
    addImage({ url: link.trim(), publicId: "", width: null, height: null });
    setLink("");
    setLinkOpen(false);
    setProblem("");
    setSelected(images.length);
  };

  return (
    <section className="pd-image-block" aria-labelledby="pd-image-title">
      <div className="pd-card-row">
        <h3 id="pd-image-title" className="pd-card-title pd-card-title--sm">
          Product Image <span className="pd-required">*</span>
        </h3>
        {canEdit && current && (
          <button
            type="button"
            className="pd-icon-btn pd-icon-btn--bad"
            onClick={removeCurrent}
            aria-label="Delete this image"
            title="Delete this image"
          >
            <IconTrash size={16} />
          </button>
        )}
      </div>

      <div
        className={`pd-image-stage${dragOver ? " is-over" : ""}`}
        onDragOver={(event) => {
          if (!canEdit) return;
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (canEdit && event.dataTransfer.files?.length) {
            startUploads(event.dataTransfer.files);
          }
        }}
      >
        {current ? (
          <img src={thumb(current.url, 640)} alt={`${product.name || "Product"} — image ${selected + 1}`} />
        ) : uploads[0] ? (
          <img src={uploads[0].preview} alt="" className="is-uploading" />
        ) : (
          <button
            type="button"
            className="pd-image-empty"
            onClick={() => inputRef.current?.click()}
            disabled={!canEdit}
          >
            <span className="pd-drop-icon">
              <IconGalleryAdd size={24} />
            </span>
            <strong>Drop images here or click to upload</strong>
            <span>{UPLOADS.image.hint}</span>
          </button>
        )}

        {current && selected > 0 && canEdit && (
          <button type="button" className="pd-main-btn" onClick={makeMain}>
            <IconStar size={14} />
            Set as main image
          </button>
        )}
        {current && selected === 0 && images.length > 1 && (
          <span className="pd-main-tag">Main image</span>
        )}
      </div>

      <div className="pd-thumbs">
        {images.map((image, index) => (
          <button
            key={`${image.url}-${index}`}
            type="button"
            className={`pd-thumb-btn${index === selected ? " is-on" : ""}`}
            onClick={() => setSelected(index)}
            aria-label={`Show image ${index + 1}`}
            aria-pressed={index === selected}
          >
            <img src={thumb(image.url, 160)} alt="" loading="lazy" />
          </button>
        ))}

        {uploads.map((item) => (
          <span key={item.id} className="pd-thumb-btn is-uploading" role="status">
            <img src={item.preview} alt="" />
            <span className="pd-thumb-progress">{item.progress}%</span>
          </span>
        ))}

        {canEdit && room > 0 && (
          <button
            type="button"
            className="pd-thumb-btn pd-thumb-add"
            onClick={() => inputRef.current?.click()}
            aria-label="Upload images"
            title="Upload images"
          >
            <IconPlus size={18} />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={UPLOADS.image.accept}
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files?.length) startUploads(event.target.files);
          event.target.value = "";
        }}
      />

      {canEdit && room > 0 && (
        linkOpen ? (
          <form className="pd-link-form" onSubmit={addLink}>
            <input
              className="pd-input pd-input--sm"
              type="url"
              value={link}
              placeholder="https://…/image.png"
              aria-label="Image link"
              onChange={(event) => setLink(event.target.value)}
              autoFocus
            />
            <button type="submit" className="pd-btn pd-btn--yellow pd-btn--sm">
              Add
            </button>
            <button
              type="button"
              className="pd-icon-btn"
              onClick={() => setLinkOpen(false)}
              aria-label="Cancel"
            >
              <IconClose size={14} />
            </button>
          </form>
        ) : (
          <button type="button" className="pd-text-btn" onClick={() => setLinkOpen(true)}>
            <IconLink size={14} />
            or paste an image link
          </button>
        )
      )}

      {problem && (
        <p className="pd-error" role="alert">
          {problem}
        </p>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------
   Video URLs — বাইরের link (YouTube ইত্যাদি). ধাপ ৩ এ আসল ফাইল
   --------------------------------------------------------------- */
function VideoUrls({ product, setProduct, canEdit }) {
  const listRef = useRef(null);
  const urls = product.videoUrls;

  const setAt = (index, value) =>
    setProduct((p) => ({
      ...p,
      videoUrls: p.videoUrls.map((url, i) => (i === index ? value : url)),
    }));

  const add = () => {
    setProduct((p) =>
      p.videoUrls.length >= LIMITS.videoUrls
        ? p
        : { ...p, videoUrls: [...p.videoUrls, ""] },
    );
    window.requestAnimationFrame(() => {
      const inputs = listRef.current?.querySelectorAll("input");
      inputs?.[inputs.length - 1]?.focus();
    });
  };

  return (
    <div className="pd-video-urls" ref={listRef}>
      <div className="pd-card-row">
        <h3 className="pd-card-title pd-card-title--sm">Video URLs</h3>
        {canEdit && (
          <AddButton onClick={add} disabled={urls.length >= LIMITS.videoUrls}>
            Add Video
          </AddButton>
        )}
      </div>

      {urls.length ? (
        <div className="pd-list">
          {urls.map((url, index) => {
            const bad = url.trim() && !isHttpsUrl(url.trim());
            return (
              <div key={index} data-sort-row className="pd-list-row pd-list-row--plain">
                <span className="pd-serial">{serial(index)}</span>
                <input
                  className={`pd-field${bad ? " is-bad" : ""}`}
                  type="url"
                  value={url}
                  placeholder="Paste video URL"
                  aria-label={`Video URL ${index + 1}`}
                  aria-invalid={bad || undefined}
                  readOnly={!canEdit}
                  onChange={(event) => setAt(index, event.target.value)}
                />
                {canEdit && (
                  <span className="pd-row-tools">
                    <button
                      type="button"
                      className="pd-icon-btn pd-icon-btn--bad pd-icon-btn--sm"
                      onClick={() =>
                        setProduct((p) => ({
                          ...p,
                          videoUrls: p.videoUrls.filter((_, i) => i !== index),
                        }))
                      }
                      aria-label={`Delete video URL ${index + 1}`}
                      title="Delete"
                    >
                      <IconTrash size={16} />
                    </button>
                    <button
                      type="button"
                      className="pd-icon-btn pd-icon-btn--sm"
                      onClick={(event) =>
                        event.currentTarget.closest("[data-sort-row]")?.querySelector("input")?.focus()
                      }
                      aria-label={`Edit video URL ${index + 1}`}
                      title="Edit"
                    >
                      <IconPencil size={16} />
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="pd-hint">YouTube or other video links, if any.</p>
      )}
      {urls.some((url) => url.trim() && !isHttpsUrl(url.trim())) && (
        <p className="pd-error">Links must start with https://</p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   পুরো ধাপ
   --------------------------------------------------------------- */
function StepInfo({ product, setProduct, errors = {}, canEdit }) {
  const [featureEdit, setFeatureEdit] = useState(null); // null | "new" | index

  const set = (field) => (event) => {
    const value = event.target.value;
    setProduct((p) => ({ ...p, [field]: value }));
  };

  const features = product.keyFeatures;
  const hasColor = Boolean(categoryOf(product.category).color);
  // পুরনো product এ তালিকার বাইরের কোনো রং থাকলে সেটাও দেখাতে হবে
  const colors =
    product.color && !COLORS.includes(product.color)
      ? [...COLORS, product.color]
      : COLORS;

  return (
    <div className="pd-info">
      <div className="pd-info-main">
        {/* ---- Basic Information ---- */}
        <section className="pd-card pd-form-card" aria-labelledby="pd-basic-title">
          <h3 id="pd-basic-title" className="pd-card-title pd-card-title--sm">
            Basic Information
          </h3>

          <label className="pd-field-wrap">
            <span className="pd-label">
              Product Name <span className="pd-required">*</span>
            </span>
            <span className={`pd-input-box${errors.name ? " is-bad" : ""}`}>
              <input
                id="pd-name"
                value={product.name}
                maxLength={LIMITS.name}
                placeholder="LA1 High Bay: Linear Distribution"
                aria-invalid={Boolean(errors.name) || undefined}
                readOnly={!canEdit}
                onChange={set("name")}
              />
              <span className="pd-count">
                {product.name.length} / {LIMITS.name}
              </span>
            </span>
            {errors.name && <span className="pd-error">{errors.name}</span>}
          </label>

          <label className="pd-field-wrap">
            <span className="pd-label">
              Short Description <span className="pd-required">*</span>
            </span>
            <span className={`pd-textarea-box${errors.shortDescription ? " is-bad" : ""}`}>
              <textarea
                className="pd-textarea"
                rows={3}
                value={product.shortDescription}
                maxLength={LIMITS.shortDescription}
                placeholder="Up to 50% Less Energy and 50% fewer fixtures"
                readOnly={!canEdit}
                onChange={set("shortDescription")}
              />
              <span className="pd-count">
                {product.shortDescription.length} / {LIMITS.shortDescription}
              </span>
            </span>
            {errors.shortDescription && (
              <span className="pd-error">{errors.shortDescription}</span>
            )}
          </label>

          <div className={hasColor ? "pd-two" : undefined}>
            <label className="pd-field-wrap">
              <span className="pd-label">
                Category <span className="pd-required">*</span>
              </span>
              <select
                className="pd-input pd-select"
                value={product.category}
                disabled={!canEdit}
                onChange={set("category")}
              >
                {CATEGORIES.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Figma: Mounting Base এ Category র পাশে Color */}
            {hasColor && (
              <label className="pd-field-wrap">
                <span className="pd-label">
                  Color <span className="pd-required">*</span>
                </span>
                <select
                  id="pd-color"
                  className={`pd-input pd-select${!product.color ? " is-placeholder" : ""}`}
                  value={product.color}
                  disabled={!canEdit}
                  onChange={set("color")}
                >
                  <option value="">Select color</option>
                  {colors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="pd-two">
            <label className="pd-field-wrap">
              <span className="pd-label">Series</span>
              <input
                className="pd-input"
                value={product.series}
                maxLength={LIMITS.series}
                list="pd-series-list"
                placeholder={product.category === "lamp-fixture" ? "High Bay Lights" : "Optional"}
                readOnly={!canEdit}
                onChange={set("series")}
              />
              <datalist id="pd-series-list">
                {SERIES_SUGGESTIONS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>

            <label className="pd-field-wrap">
              <span className="pd-label">Stock</span>
              <input
                className="pd-input"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={product.stock ?? ""}
                placeholder="0"
                readOnly={!canEdit}
                onChange={(event) => {
                  const raw = event.target.value;
                  setProduct((p) => ({
                    ...p,
                    stock: raw === "" ? null : Math.max(0, Math.round(Number(raw))),
                  }));
                }}
              />
            </label>
          </div>
        </section>

        {/* ---- Key Features ---- */}
        <section className="pd-card pd-form-card" aria-labelledby="pd-features-title">
          <div className="pd-card-row">
            <h3 id="pd-features-title" className="pd-card-title pd-card-title--sm">
              Key Features
            </h3>
            {canEdit && (
              <AddButton
                onClick={() => setFeatureEdit("new")}
                disabled={features.length >= LIMITS.keyFeatures}
              />
            )}
          </div>

          {features.length ? (
            <ul className="pd-features">
              {features.map((feature, index) => {
                const Icon = (FEATURE_ICONS[feature.icon] ?? FEATURE_ICONS.bolt).Icon;
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
                            setProduct((p) => ({
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
              Short highlights shown on the product card — for example “Up to
              50% energy savings”.
            </p>
          )}
        </section>
      </div>

      <aside className="pd-info-side">
        <div className="pd-card pd-side-card">
          <ImagesCard product={product} setProduct={setProduct} canEdit={canEdit} />
          {!product.images.length && (
            <div className="pd-sample">
              <ProductThumb category={product.category} size={40} />
              <span>
                Until you add a photo, the product list shows this sample
                picture.
              </span>
            </div>
          )}
          {errors.images && <p className="pd-error">{errors.images}</p>}
          <VideoUrls product={product} setProduct={setProduct} canEdit={canEdit} />
        </div>
      </aside>

      {featureEdit !== null && (
        <FeatureModal
          initial={featureEdit === "new" ? null : features[featureEdit]}
          onClose={() => setFeatureEdit(null)}
          onSave={(feature) => {
            setProduct((p) => ({
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

export default StepInfo;
