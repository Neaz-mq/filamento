import { useEffect, useRef, useState } from "react";
import { UPLOADS } from "../products/catalog";
import { checkFile, isHttpsUrl, thumb, uploadFile, videoThumbnail } from "../products/upload";
import { HOME_ICONS } from "./homeShape";
import {
  IconGalleryAdd,
  IconImage,
  IconLink,
  IconPencil,
  IconPlay,
  IconPlus,
  IconStar,
  IconTrash,
  IconVideo,
} from "../icons";

/* ===============================================================
   Home Page Content এর ছোট ছোট অংশ — card, লেখার ঘর, ছবি, তারা,
   ছবি/video তোলার ঘর. পাঁচটা ধাপ আর modal সবাই এগুলো ব্যবহার করে
   =============================================================== */

/* ---------------------------------------------------------------
   সাদা card — শিরোনাম, পাশে ছোট badge ("9 brands"), ডানে "+ Add"
   --------------------------------------------------------------- */
export function SectionCard({ id, title, badge, addLabel = "Add", onAdd, addDisabled, addTitle, children }) {
  return (
    <section className="pd-card hc-card" aria-labelledby={id}>
      <div className="pd-card-row">
        <div className="hc-card-head">
          <h3 id={id} className="hc-card-title">
            {title}
          </h3>
          {badge && <span className="hc-badge">{badge}</span>}
        </div>
        {onAdd && (
          <button
            type="button"
            className="pd-add-btn"
            onClick={onAdd}
            disabled={addDisabled}
            title={addDisabled ? addTitle : undefined}
          >
            <IconPlus size={14} />
            {addLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------
   লেখার ঘর — এক লাইন বা অনেক লাইন, ডানে "34/100"
   --------------------------------------------------------------- */
export function TextField({
  id,
  label,
  value,
  onChange,
  max,
  required = false,
  multiline = false,
  rows = 3,
  placeholder,
  error,
  hint,
  type = "text",
  disabled = false,
}) {
  const length = String(value ?? "").length;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="pd-field-wrap hc-field">
      <label className="pd-label" htmlFor={id}>
        {label}
        {required && <span className="pd-required"> *</span>}
      </label>

      {multiline ? (
        <span className={`pd-textarea-box${error ? " is-bad" : ""}`}>
          <textarea
            id={id}
            className="pd-textarea hc-textarea"
            rows={rows}
            value={value ?? ""}
            maxLength={max}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            onChange={(event) => onChange(event.target.value)}
          />
          {max && (
            <span className="pd-count" aria-hidden="true">
              {length} / {max}
            </span>
          )}
        </span>
      ) : (
        <span className={`pd-input-box${error ? " is-bad" : ""}`}>
          <input
            id={id}
            type={type}
            value={value ?? ""}
            maxLength={max}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            onChange={(event) => onChange(event.target.value)}
          />
          {max && (
            <span className="pd-count" aria-hidden="true">
              {length}/{max}
            </span>
          )}
        </span>
      )}

      {hint && !error && <span className="pd-hint">{hint}</span>}
      {error && (
        <span id={errorId} className="pd-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   ছবির ছোট ঘর — ধূসর পেছন, ছবি ভেতরে পুরোটা দেখা যায়.
   ছবি না এলে (link ভাঙা) icon দেখায়
   --------------------------------------------------------------- */
export function Thumb({ src, alt = "", className = "", width = 260, fit = "contain" }) {
  const [failed, setFailed] = useState("");
  const broken = !src || failed === src;

  return (
    <span className={`hc-thumb ${className}`}>
      {broken ? (
        <IconImage size={20} />
      ) : (
        <img
          src={thumb(src, width)}
          alt={alt}
          loading="lazy"
          style={{ objectFit: fit }}
          onError={() => setFailed(src)}
        />
      )}
    </span>
  );
}

// গোল ঘরে icon — Key Features / Featured Points
export function FeatureIcon({ name }) {
  const Icon = HOME_ICONS[name] ?? HOME_ICONS.spark;
  return (
    <span className="hc-icon-circle" aria-hidden="true">
      <Icon size={20} />
    </span>
  );
}

/* ---------------------------------------------------------------
   সারির ডানের দুই বোতাম — মোছা (লাল) আর সম্পাদনা
   --------------------------------------------------------------- */
export function RowTools({ name, onDelete, onEdit, size = 16, deleteDisabled, deleteTitle }) {
  return (
    <span className={`hc-tools${size > 16 ? " hc-tools--lg" : ""}`}>
      {onDelete && (
        <button
          type="button"
          className="pd-icon-btn pd-icon-btn--bad hc-tool"
          onClick={onDelete}
          disabled={deleteDisabled}
          aria-label={`Delete ${name}`}
          title={deleteDisabled ? deleteTitle : "Delete"}
        >
          <IconTrash size={size} />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          className="pd-icon-btn hc-tool"
          onClick={onEdit}
          aria-label={`Edit ${name}`}
          title="Edit"
        >
          <IconPencil size={size} />
        </button>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------
   তারা — ৪.৫ হলে সাড়ে চারটা ভরা
   --------------------------------------------------------------- */
export function Stars({ value, size = 20 }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="hc-stars" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, rating - index));
        return (
          <span key={index} className="hc-star" style={{ width: size, height: size }}>
            <IconStar size={size} />
            <span className="hc-star-fill" style={{ width: `${fill * 100}%` }}>
              <IconStar size={size} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

// তালিকা ফাঁকা থাকলে
export function EmptyRow({ children, onClick, disabled }) {
  return (
    <button type="button" className="pd-empty-row pd-empty-row--tall" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------
   video র ছোট ছবি — নিজের cover, নাহলে Cloudinary র ফ্রেম, নাহলে
   video র প্রথম ফ্রেম (browser নিজে দেখায়)
   --------------------------------------------------------------- */
export function VideoThumb({ item, onPlay, className = "" }) {
  const cover = item.cover?.url || videoThumbnail(item.video?.url);
  return (
    <button
      type="button"
      className={`hc-video-thumb ${className}`}
      onClick={onPlay}
      aria-label={`Play ${item.title || "video"}`}
    >
      {cover ? (
        <img src={thumb(cover, 240)} alt="" loading="lazy" />
      ) : item.video?.url ? (
        <video src={item.video.url} muted preload="metadata" playsInline tabIndex={-1} />
      ) : (
        <IconVideo size={20} />
      )}
      <span className="hc-video-shade" aria-hidden="true" />
      <span className="pd-play" aria-hidden="true">
        <IconPlay size={10} />
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------
   ছবি বা video তোলার ঘর (Figma: 182px উঁচু, "Drop images here …")

   ফাইল বাছার সাথে সাথে Cloudinary তে ওঠা শুরু হয় — ততক্ষণে বাকি
   ঘরগুলো লেখা যায়. Cloudinary ঠিক না থাকলে বা ফাইল অন্য কোথাও
   থাকলে "Use a link instead" দিয়ে https link দেওয়া যায়.

   onBusy(true/false) — তোলা চলার সময় modal এর Save বন্ধ থাকে
   poster — video র নিজের cover ছবি থাকলে সেটাই ছোট ছবিতে দেখায়
   --------------------------------------------------------------- */
export function MediaInput({ id, field, value, onChange, onBusy, error, poster }) {
  const isVideo = field.type === "video";
  const rule = UPLOADS[field.kind];
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const [upload, setUpload] = useState(null); // { name, progress }
  const [problem, setProblem] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [link, setLink] = useState("");

  // modal বন্ধ হলে চলতে থাকা upload থামানো
  useEffect(() => () => abortRef.current?.abort(), []);

  const start = (file) => {
    const issue = checkFile(file, field.kind);
    if (issue) {
      setProblem(issue);
      return;
    }
    setProblem("");
    setUpload({ name: file.name, progress: 0 });
    onBusy?.(true);

    const controller = new AbortController();
    abortRef.current = controller;

    uploadFile(file, field.kind, {
      signal: controller.signal,
      onProgress: (progress) => setUpload((old) => (old ? { ...old, progress } : old)),
    })
      .then((result) => onChange({ url: result.url, publicId: result.publicId }))
      .catch((failure) => {
        if (!failure.cancelled) setProblem(failure.message);
      })
      .finally(() => {
        abortRef.current = null;
        setUpload(null);
        onBusy?.(false);
      });
  };

  const applyLink = () => {
    const url = link.trim();
    if (!isHttpsUrl(url)) {
      setProblem(`Paste ${isVideo ? "a video" : "an image"} link that starts with https://`);
      return;
    }
    setProblem("");
    onChange({ url, publicId: "" });
    setLinkMode(false);
    setLink("");
  };

  const shown = problem || error;
  const noun = isVideo ? "video" : field.kind === "site-logo" ? "logo" : "image";

  return (
    <div className="pd-field-wrap hc-field">
      <span className="pd-label" id={`${id}-label`}>
        {field.label}
        {field.required && <span className="pd-required"> *</span>}
      </span>

      {linkMode ? (
        <span className="hc-link-row">
          <span className="pd-input-box">
            <input
              id={id}
              type="url"
              value={link}
              placeholder={isVideo ? "https://…/video.mp4" : "https://…/image.webp"}
              aria-labelledby={`${id}-label`}
              data-autofocus
              onChange={(event) => setLink(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
              }}
            />
          </span>
          <button type="button" className="pd-btn pd-btn--yellow pd-btn--sm" onClick={applyLink}>
            Use link
          </button>
        </span>
      ) : (
        <div
          className={`pd-drop hc-drop${dragOver ? " is-over" : ""}${shown ? " is-bad" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const file = event.dataTransfer.files?.[0];
            if (file && !upload) start(file);
          }}
        >
          {upload ? (
            <div className="pd-drop-progress" role="status">
              <strong>Uploading {upload.name}</strong>
              <span className="pd-bar">
                <span style={{ width: `${upload.progress}%` }} />
              </span>
              <span>{upload.progress}%</span>
              <button type="button" className="pd-text-btn" onClick={() => abortRef.current?.abort()}>
                Cancel upload
              </button>
            </div>
          ) : value?.url ? (
            <div className="pd-drop-file hc-drop-file">
              <span className={`pd-drop-preview hc-preview${isVideo ? " is-video" : ""}`}>
                {isVideo ? (
                  poster || videoThumbnail(value.url) ? (
                    <img src={poster ? thumb(poster, 360) : videoThumbnail(value.url)} alt="" />
                  ) : (
                    <video src={value.url} muted preload="metadata" playsInline />
                  )
                ) : (
                  <img src={thumb(value.url, 360)} alt="" />
                )}
              </span>
              <span className="pd-drop-meta">
                <strong>{isVideo ? "Video ready" : `${noun[0].toUpperCase()}${noun.slice(1)} ready`}</strong>
                <span className="hc-drop-url" title={value.url}>
                  {value.publicId ? "Uploaded to the media library" : value.url}
                </span>
              </span>
              <button
                type="button"
                className="pd-btn pd-btn--line pd-btn--sm"
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </button>
            </div>
          ) : (
            <button
              type="button"
              id={id}
              className="pd-drop-empty"
              onClick={() => inputRef.current?.click()}
              aria-describedby={`${id}-label`}
              data-autofocus
            >
              <span className="pd-drop-icon">
                {isVideo ? <IconVideo size={24} /> : <IconGalleryAdd size={24} />}
              </span>
              <strong>Drop {isVideo ? "a video" : "images"} here or click to upload</strong>
              <span>{rule?.hint}</span>
              <u>Browse File</u>
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={rule?.accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) start(file);
          event.target.value = "";
        }}
      />

      {!upload && (
        <button
          type="button"
          className="pd-text-btn"
          onClick={() => {
            setProblem("");
            setLinkMode((mode) => !mode);
          }}
        >
          <IconLink size={14} />
          {linkMode ? "Upload a file instead" : `Use ${isVideo ? "a video" : "an image"} link instead`}
        </button>
      )}

      {shown && (
        <span className="pd-error" role="alert">
          {shown}
        </span>
      )}
    </div>
  );
}
