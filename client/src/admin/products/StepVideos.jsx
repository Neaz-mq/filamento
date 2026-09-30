import { useId, useRef, useState } from "react";
import Modal from "./Modal";
import { LIMITS, UPLOADS, formatBytes, formatDate, formatDuration, serial } from "./catalog";
import {
  checkFile,
  isHttpsUrl,
  readVideoDuration,
  uploadFile,
  videoThumbnail,
} from "./upload";
import { moveItem, useSortable } from "./useSortable";
import { AddButton } from "./SpecEditors";
import {
  IconClose,
  IconGalleryAdd,
  IconLink,
  IconPencil,
  IconPlay,
  IconTrash,
  IconVideo,
} from "../icons";

/* ===============================================================
   ধাপ ৩ — Videos (Figma: 1030 × 655) আর Add Video Details modal

   video তোলা শুরু হয় ফাইল বাছাইয়ের সাথে সাথে — admin ততক্ষণে
   নাম আর বিবরণ লিখতে পারে. Save চাপা যায় তোলা শেষ হলে.

   Cloudinary ঠিক না থাকলে (বা video অন্য কোথাও থাকলে) "Use a video
   link instead" দিয়ে সরাসরি https link দেওয়া যায়
   =============================================================== */

function Thumbnail({ video, onPlay }) {
  const image = video.thumbnail || videoThumbnail(video.url);
  const duration = formatDuration(video.duration);

  return (
    <button
      type="button"
      className="pd-video-thumb"
      onClick={onPlay}
      aria-label={`Play ${video.title}`}
    >
      {image && <img src={image} alt="" loading="lazy" />}
      <span className="pd-play">
        <IconPlay size={10} />
      </span>
      {duration && <span className="pd-duration">{duration}</span>}
    </button>
  );
}

/* ---------------------------------------------------------------
   Add / Edit Video Details
   --------------------------------------------------------------- */
function VideoModal({ initial, onSave, onClose }) {
  const titleId = useId();
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const [video, setVideo] = useState(
    initial ?? {
      title: "",
      description: "",
      url: "",
      publicId: "",
      thumbnail: "",
      duration: null,
      bytes: null,
      format: "",
      uploadedAt: null,
    },
  );
  const [upload, setUpload] = useState(null); // { name, progress }
  const [problem, setProblem] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [linkMode, setLinkMode] = useState(Boolean(initial && !initial.publicId));
  const [checking, setChecking] = useState(false);

  const uploading = Boolean(upload);
  const ready = video.url && video.title.trim() && !uploading && !checking;

  const start = (file) => {
    const error = checkFile(file, "video");
    if (error) {
      setProblem(error);
      return;
    }

    setProblem("");
    setUpload({ name: file.name, progress: 0 });

    // নাম না লিখে থাকলে ফাইলের নাম থেকে একটা শুরু
    setVideo((v) => ({
      ...v,
      title: v.title || file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, LIMITS.videoTitle),
    }));

    const controller = new AbortController();
    abortRef.current = controller;

    uploadFile(file, "video", {
      signal: controller.signal,
      onProgress: (progress) => setUpload((u) => (u ? { ...u, progress } : u)),
    })
      .then((result) => {
        setVideo((v) => ({
          ...v,
          url: result.url,
          publicId: result.publicId,
          thumbnail: videoThumbnail(result.url),
          duration: result.duration,
          bytes: result.bytes,
          format: result.format,
          uploadedAt: new Date().toISOString(),
        }));
      })
      .catch((error) => {
        if (!error.cancelled) setProblem(error.message);
      })
      .finally(() => {
        abortRef.current = null;
        setUpload(null);
      });
  };

  const applyLink = async () => {
    const url = video.url.trim();
    if (!isHttpsUrl(url)) {
      setProblem("Paste a video link that starts with https://");
      return false;
    }
    setChecking(true);
    const duration = await readVideoDuration(url);
    setChecking(false);
    setVideo((v) => ({
      ...v,
      url,
      publicId: "",
      thumbnail: v.publicId ? "" : v.thumbnail,
      duration: duration ?? v.duration,
      uploadedAt: v.uploadedAt || new Date().toISOString(),
    }));
    return true;
  };

  const close = () => {
    abortRef.current?.abort();
    onClose();
  };

  const save = async (event) => {
    event.preventDefault();
    if (linkMode && !(await applyLink())) return;
    if (!video.url || !video.title.trim()) return;
    onSave({
      ...video,
      title: video.title.trim(),
      description: video.description.trim(),
      uploadedAt: video.uploadedAt || new Date().toISOString(),
    });
  };

  return (
    <Modal
      size="md"
      onClose={close}
      labelledBy={titleId}
      className="pd-video-modal"
      footer={
        <>
          <button type="button" className="pd-btn pd-btn--line pd-btn--lg" onClick={close}>
            Cancel
          </button>
          <button
            type="submit"
            form="pd-video-form"
            className="pd-btn pd-btn--yellow pd-btn--lg"
            disabled={linkMode ? !video.url.trim() || !video.title.trim() || checking : !ready}
          >
            {uploading ? "Uploading…" : checking ? "Checking…" : "Save"}
          </button>
        </>
      }
    >
      <form id="pd-video-form" className="pd-modal-form" onSubmit={save}>
        <div className="pd-modal-grey-head">
          <div>
            <h2 id={titleId} className="pd-modal-title">
              {initial ? "Edit Video Details" : "Add Video Details"}
            </h2>
            <p className="pd-modal-sub">Get a clear overview of the selected video.</p>
          </div>
          <button type="button" className="pd-modal-x pd-modal-x--round" onClick={close} aria-label="Close">
            <IconClose size={18} />
          </button>
        </div>

        <div className="pd-field-wrap">
          <span className="pd-label">
            {linkMode ? "Video Link" : "Upload Video"} <span className="pd-required">*</span>
          </span>

          {linkMode ? (
            <input
              className="pd-input"
              type="url"
              value={video.url}
              placeholder="https://…/video.mp4"
              aria-label="Video link"
              data-autofocus
              onChange={(event) => {
                const url = event.target.value;
                setVideo((v) => ({ ...v, url }));
              }}
            />
          ) : (
            <div
              className={`pd-drop${dragOver ? " is-over" : ""}${video.url ? " has-file" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                const file = event.dataTransfer.files?.[0];
                if (file && !uploading) start(file);
              }}
            >
              {uploading ? (
                <div className="pd-drop-progress" role="status">
                  <strong>Uploading {upload.name}</strong>
                  <span className="pd-bar">
                    <span style={{ width: `${upload.progress}%` }} />
                  </span>
                  <span>{upload.progress}%</span>
                  <button
                    type="button"
                    className="pd-text-btn"
                    onClick={() => abortRef.current?.abort()}
                  >
                    Cancel upload
                  </button>
                </div>
              ) : video.url ? (
                <div className="pd-drop-file">
                  <span className="pd-drop-preview">
                    {video.thumbnail || videoThumbnail(video.url) ? (
                      <img src={video.thumbnail || videoThumbnail(video.url)} alt="" />
                    ) : (
                      <IconVideo size={22} />
                    )}
                  </span>
                  <span className="pd-drop-meta">
                    <strong>Video ready</strong>
                    <span>
                      {[formatDuration(video.duration), formatBytes(video.bytes)]
                        .filter(Boolean)
                        .join(" · ") || "Uploaded"}
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
                  className="pd-drop-empty"
                  onClick={() => inputRef.current?.click()}
                  data-autofocus
                >
                  <span className="pd-drop-icon">
                    <IconGalleryAdd size={24} />
                  </span>
                  <strong>Drop a video here or click to upload</strong>
                  <span>{UPLOADS.video.hint}</span>
                  <u>Browse File</u>
                </button>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={UPLOADS.video.accept}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) start(file);
              event.target.value = "";
            }}
          />

          {!uploading && (
            <button
              type="button"
              className="pd-text-btn"
              onClick={() => {
                setProblem("");
                setLinkMode((mode) => !mode);
                if (!linkMode) setVideo((v) => ({ ...v, url: v.publicId ? "" : v.url, publicId: "" }));
              }}
            >
              <IconLink size={14} />
              {linkMode ? "Upload a file instead" : "Use a video link instead"}
            </button>
          )}
        </div>

        <label className="pd-field-wrap">
          <span className="pd-label">
            Video Title <span className="pd-required">*</span>
          </span>
          <span className="pd-input-box">
            <input
              value={video.title}
              maxLength={LIMITS.videoTitle}
              placeholder="Thermal Management"
              onChange={(event) => {
                const title = event.target.value;
                setVideo((v) => ({ ...v, title }));
              }}
            />
            <span className="pd-count">
              {video.title.length}/{LIMITS.videoTitle}
            </span>
          </span>
        </label>

        <label className="pd-field-wrap">
          <span className="pd-label">Video Description</span>
          <textarea
            className="pd-input pd-textarea-plain"
            rows={2}
            value={video.description}
            maxLength={LIMITS.videoDescription}
            placeholder="Clean, balanced lighting that outperforms conventional fixtures."
            onChange={(event) => {
              const description = event.target.value;
              setVideo((v) => ({ ...v, description }));
            }}
          />
        </label>

        {problem && (
          <p className="pd-error" role="alert">
            {problem}
          </p>
        )}
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   চালিয়ে দেখা
   --------------------------------------------------------------- */
function PlayerModal({ video, onClose }) {
  const titleId = useId();
  return (
    <Modal size="lg" onClose={onClose} labelledBy={titleId} className="pd-player">
      <div className="pd-modal-form">
      <div className="pd-modal-simple-head">
        <h2 id={titleId} className="pd-modal-title">
          {video.title}
        </h2>
        <button type="button" className="pd-modal-x" onClick={onClose} aria-label="Close">
          <IconClose size={16} />
        </button>
      </div>
      <video src={video.url} controls autoPlay playsInline poster={video.thumbnail || undefined} />
      {video.description && <p className="pd-modal-sub">{video.description}</p>}
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   পুরো ধাপ
   --------------------------------------------------------------- */
function StepVideos({ product, setProduct, canEdit }) {
  const [editing, setEditing] = useState(null); // null | "new" | index
  const [playing, setPlaying] = useState(null);
  const videos = product.videos;

  const sort = useSortable((from, to) =>
    setProduct((p) => ({ ...p, videos: moveItem(p.videos, from, to) })),
  );

  return (
    <section className="pd-card pd-form-card" aria-labelledby="pd-videos-title">
      <div className="pd-card-row">
        <h3 id="pd-videos-title" className="pd-card-title">
          Upload Videos
        </h3>
        {canEdit && (
          <AddButton onClick={() => setEditing("new")} disabled={videos.length >= LIMITS.videos}>
            Add Video
          </AddButton>
        )}
      </div>

      {videos.length ? (
        <div {...sort.list} className="pd-media-list">
          {videos.map((video, index) => (
            <div
              key={`${video.url}-${index}`}
              data-sort-row
              className={`pd-media-row ${sort.rowClass(index)}`}
            >
              {canEdit && <button {...sort.handle(index, videos.length)} />}
              <span className="pd-serial">{serial(index)}</span>
              <div className="pd-media-card">
                <Thumbnail video={video} onPlay={() => setPlaying(video)} />
                <div className="pd-media-text">
                  <strong>{video.title}</strong>
                  <span className="pd-media-meta">
                    {formatBytes(video.bytes) && (
                      <>
                        <span>{formatBytes(video.bytes)}</span>
                        <span className="pd-sep" aria-hidden="true" />
                      </>
                    )}
                    <span>
                      {video.uploadedAt ? `Uploaded on ${formatDate(video.uploadedAt)}` : "Link"}
                    </span>
                  </span>
                </div>
                {canEdit && (
                  <span className="pd-row-tools pd-row-tools--lg">
                    <button
                      type="button"
                      className="pd-icon-btn pd-icon-btn--bad"
                      onClick={() =>
                        setProduct((p) => ({
                          ...p,
                          videos: p.videos.filter((_, i) => i !== index),
                        }))
                      }
                      aria-label={`Delete ${video.title}`}
                      title="Delete"
                    >
                      <IconTrash size={20} />
                    </button>
                    <button
                      type="button"
                      className="pd-icon-btn"
                      onClick={() => setEditing(index)}
                      aria-label={`Edit ${video.title}`}
                      title="Edit"
                    >
                      <IconPencil size={20} />
                    </button>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          className="pd-empty-row pd-empty-row--tall"
          onClick={() => canEdit && setEditing("new")}
          disabled={!canEdit}
        >
          <IconVideo size={22} />
          No videos yet. {canEdit && <span>Add a product video</span>}
        </button>
      )}

      {editing !== null && (
        <VideoModal
          initial={editing === "new" ? null : videos[editing]}
          onClose={() => setEditing(null)}
          onSave={(video) => {
            setProduct((p) => ({
              ...p,
              videos:
                editing === "new"
                  ? [...p.videos, video]
                  : p.videos.map((item, i) => (i === editing ? video : item)),
            }));
            setEditing(null);
          }}
        />
      )}

      {playing && <PlayerModal video={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}

export default StepVideos;
