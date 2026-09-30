import { useId, useRef, useState } from "react";
import Modal from "./Modal";
import {
  DOC_TYPES,
  LIMITS,
  UPLOADS,
  docTypeOf,
  formatBytes,
  formatDate,
  formatTime,
  guessDocType,
} from "./catalog";
import { checkFile, isHttpsUrl, uploadFile } from "./upload";
import { moveItem, useSortable } from "./useSortable";
import {
  IconClose,
  IconDocument,
  IconEye,
  IconLink,
  IconPencil,
  IconTrash,
  IconUploadCloud,
} from "../icons";

/* ===============================================================
   ধাপ ৪ — Documents & Resources (Figma: 1030 × 1001)

   উপরে: ফাইল বাছাই (টেনে এনে ছাড়া বা click) + Document Type + Upload
   নিচে:  তোলা ফাইলগুলোর টেবিল — 👁 খুলে দেখা, 🗑 মোছা, ✏️ নাম/ধরন বদল

   ফাইল বাছাই করলেই নাম দেখে ধরন আন্দাজ করা হয় (.ies → IES File,
   "warranty" → Warranty …), admin চাইলে বদলাতে পারে
   =============================================================== */

function DocEditModal({ doc, onSave, onClose }) {
  const titleId = useId();
  const [name, setName] = useState(doc.name);
  const [type, setType] = useState(doc.type);

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
            form="pd-doc-form"
            className="pd-btn pd-btn--yellow"
            disabled={!name.trim()}
          >
            Save
          </button>
        </>
      }
    >
      <form
        id="pd-doc-form"
        className="pd-modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) onSave({ ...doc, name: name.trim(), type });
        }}
      >
        <div className="pd-modal-simple-head">
          <h2 id={titleId} className="pd-modal-title">
            Edit Document
          </h2>
          <button type="button" className="pd-modal-x" onClick={onClose} aria-label="Close">
            <IconClose size={16} />
          </button>
        </div>
        <label className="pd-field-wrap">
          <span className="pd-label">Document Name</span>
          <input
            className="pd-input"
            value={name}
            maxLength={LIMITS.documentName}
            data-autofocus
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="pd-field-wrap">
          <span className="pd-label">Document Type</span>
          <select
            className="pd-input pd-select"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {DOC_TYPES.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </form>
    </Modal>
  );
}

function StepDocuments({ product, setProduct, canEdit }) {
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const typeId = useId();

  const [file, setFile] = useState(null);
  const [type, setType] = useState("");
  const [upload, setUpload] = useState(null); // { progress }
  const [problem, setProblem] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState({ url: "", name: "" });

  const docs = product.documents;
  const full = docs.length >= LIMITS.documents;

  const sort = useSortable((from, to) =>
    setProduct((p) => ({ ...p, documents: moveItem(p.documents, from, to) })),
  );

  const pick = (chosen) => {
    if (!chosen) return;
    const error = checkFile(chosen, "document");
    setProblem(error);
    if (error) return;
    setFile(chosen);
    const guess = guessDocType(chosen.name);
    if (guess) setType(guess);
  };

  const addDoc = (doc) =>
    setProduct((p) =>
      p.documents.length >= LIMITS.documents
        ? p
        : { ...p, documents: [...p.documents, doc] },
    );

  const send = async () => {
    if (!file) {
      setProblem("Choose a file first.");
      inputRef.current?.click();
      return;
    }
    if (!type) {
      setProblem("Choose the document type.");
      document.getElementById(typeId)?.focus();
      return;
    }

    setProblem("");
    setUpload({ progress: 0 });
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await uploadFile(file, "document", {
        signal: controller.signal,
        onProgress: (progress) => setUpload({ progress }),
      });
      addDoc({
        name: file.name.slice(0, LIMITS.documentName),
        type,
        url: result.url,
        publicId: result.publicId,
        resourceType: result.resourceType || "raw",
        bytes: result.bytes,
        format: result.format,
        uploadedAt: new Date().toISOString(),
      });
      setFile(null);
      setType("");
    } catch (error) {
      if (!error.cancelled) setProblem(error.message);
    } finally {
      abortRef.current = null;
      setUpload(null);
    }
  };

  const addLink = (event) => {
    event.preventDefault();
    if (!isHttpsUrl(link.url.trim())) {
      setProblem("Paste a link that starts with https://");
      return;
    }
    if (!type) {
      setProblem("Choose the document type.");
      return;
    }
    const fromUrl = decodeURIComponent(new URL(link.url.trim()).pathname.split("/").pop() || "");
    addDoc({
      name: (link.name.trim() || fromUrl || "Document").slice(0, LIMITS.documentName),
      type,
      url: link.url.trim(),
      publicId: "",
      resourceType: "raw",
      bytes: null,
      format: (fromUrl.split(".").pop() || "").toLowerCase().slice(0, 12),
      uploadedAt: new Date().toISOString(),
    });
    setLink({ url: "", name: "" });
    setType("");
    setLinkOpen(false);
    setProblem("");
  };

  return (
    <div className="pd-docs">
      {canEdit && (
        <section className="pd-card pd-form-card" aria-labelledby="pd-upload-title">
          <h3 id="pd-upload-title" className="pd-card-title pd-card-title--sm">
            Upload New Document
          </h3>

          <div className="pd-upload-row">
            <div
              className={`pd-drop pd-drop--row${dragOver ? " is-over" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                if (!upload) pick(event.dataTransfer.files?.[0]);
              }}
            >
              <button
                type="button"
                className="pd-drop-row-btn"
                onClick={() => inputRef.current?.click()}
                disabled={Boolean(upload) || full}
              >
                <span className="pd-drop-circle">
                  <IconUploadCloud size={22} />
                </span>
                <span className="pd-drop-row-text">
                  {file ? (
                    <>
                      <strong className="pd-file-name">{file.name}</strong>
                      <span>{formatBytes(file.size)} · click to choose another file</span>
                    </>
                  ) : (
                    <>
                      <strong>
                        Drag &amp; drop files here or <em>click to browse</em>
                      </strong>
                      <span>{UPLOADS.document.hint}</span>
                    </>
                  )}
                </span>
              </button>
              {upload && (
                <span className="pd-bar pd-bar--float" role="status" aria-label={`Uploading ${upload.progress}%`}>
                  <span style={{ width: `${upload.progress}%` }} />
                </span>
              )}
            </div>

            <div className="pd-upload-side">
              <label className="pd-field-wrap" htmlFor={typeId}>
                <span className="pd-label">Document Type</span>
                <select
                  id={typeId}
                  className="pd-input pd-select"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  disabled={Boolean(upload)}
                >
                  <option value="">Select document type</option>
                  {DOC_TYPES.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {upload ? (
                <button
                  type="button"
                  className="pd-btn pd-btn--line pd-btn--block"
                  onClick={() => abortRef.current?.abort()}
                >
                  Uploading {upload.progress}% — Cancel
                </button>
              ) : (
                <button
                  type="button"
                  className="pd-btn pd-btn--yellow pd-btn--block"
                  onClick={send}
                  disabled={full}
                >
                  Upload Document
                </button>
              )}
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={UPLOADS.document.accept}
            hidden
            onChange={(event) => {
              pick(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          {linkOpen ? (
            <form className="pd-link-form pd-link-form--wide" onSubmit={addLink}>
              <input
                className="pd-input pd-input--sm"
                type="url"
                value={link.url}
                placeholder="https://…/install-guide.pdf"
                aria-label="Document link"
                onChange={(event) => {
                  const url = event.target.value;
                  setLink((l) => ({ ...l, url }));
                }}
                autoFocus
              />
              <input
                className="pd-input pd-input--sm"
                value={link.name}
                maxLength={LIMITS.documentName}
                placeholder="Name (optional)"
                aria-label="Document name"
                onChange={(event) => {
                  const name = event.target.value;
                  setLink((l) => ({ ...l, name }));
                }}
              />
              <button type="submit" className="pd-btn pd-btn--yellow pd-btn--sm">
                Add link
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
              or add a link to a file that is already online
            </button>
          )}

          {problem && (
            <p className="pd-error" role="alert">
              {problem}
            </p>
          )}
        </section>
      )}

      <section className="pd-card pd-form-card" aria-label="Documents">
        {docs.length ? (
          <div className="pd-doc-table">
            <div className="pd-doc-head" aria-hidden="true">
              <span />
              <span>Document Name</span>
              <span>Type</span>
              <span>File Size</span>
              <span>Uploaded On</span>
              <span className="pd-end">Actions</span>
            </div>

            <div {...sort.list} role="list">
              {docs.map((doc, index) => {
                const docType = docTypeOf(doc.type);
                return (
                  <div
                    key={`${doc.url}-${index}`}
                    role="listitem"
                    data-sort-row
                    className={`pd-doc-row ${sort.rowClass(index)}`}
                  >
                    {canEdit ? <button {...sort.handle(index, docs.length)} /> : <span />}
                    <span className="pd-doc-name">
                      <span className="pd-doc-icon">
                        <IconDocument size={18} />
                      </span>
                      <span className="pd-doc-title" title={doc.name}>
                        {doc.name}
                      </span>
                    </span>
                    <span data-label="Type">
                      <span className={`pd-type pd-type--${docType.tone}`}>{docType.label}</span>
                    </span>
                    <span data-label="File size" className="pd-doc-muted">
                      {formatBytes(doc.bytes) || "—"}
                    </span>
                    <span data-label="Uploaded" className="pd-doc-when">
                      <span>{formatDate(doc.uploadedAt)}</span>
                      <span>{formatTime(doc.uploadedAt)}</span>
                    </span>
                    <span className="pd-row-tools pd-end">
                      <a
                        className="pd-icon-btn"
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`Open ${doc.name}`}
                        title="Open"
                      >
                        <IconEye size={18} />
                      </a>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className="pd-icon-btn pd-icon-btn--bad"
                            onClick={() =>
                              setProduct((p) => ({
                                ...p,
                                documents: p.documents.filter((_, i) => i !== index),
                              }))
                            }
                            aria-label={`Delete ${doc.name}`}
                            title="Delete"
                          >
                            <IconTrash size={18} />
                          </button>
                          <button
                            type="button"
                            className="pd-icon-btn"
                            onClick={() => setEditing(index)}
                            aria-label={`Edit ${doc.name}`}
                            title="Edit"
                          >
                            <IconPencil size={18} />
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="pd-empty-row pd-empty-row--tall pd-empty-row--static">
            <IconDocument size={22} />
            No documents yet. Installation guides, IES files and certificates
            show up here.
          </p>
        )}
      </section>

      {editing !== null && (
        <DocEditModal
          doc={docs[editing]}
          onClose={() => setEditing(null)}
          onSave={(doc) => {
            setProduct((p) => ({
              ...p,
              documents: p.documents.map((item, i) => (i === editing ? doc : item)),
            }));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

export default StepDocuments;
