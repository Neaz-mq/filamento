import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import "./Contact.css";

/* Figma "Frame 508" — বাঁয়ে শিরোনাম আর যোগাযোগের তথ্য, ডানে
   quote এর form. form জমা হলে backend এর MongoDB তে যায়
   (server/routes/quoteRequestRoutes.js).

   section এর id="contact" — পাতার যেকোনো জায়গা থেকে "#contact"
   link দিলে এখানে মসৃণভাবে scroll হয় (index.css এ smooth scroll) */

/* ---------------------------------------------------------------
   যোগাযোগের তথ্য — নাম ও নম্বর অনুবাদ হয় না, তাই locale এ নয়
   --------------------------------------------------------------- */
const EMAIL = "Sales@Filamento.com";
const PHONE_DISPLAY = "+1 (408) 475 - 0038";
const PHONE_LINK = "+14084750038";
const LOCATION = "Ella, Silicon Valley, USA";

/* ---------------------------------------------------------------
   dropdown এর বিকল্প — id গুলো server এ যায়, লেখা locale থেকে.
   ⚠️ server/routes/quoteRequestRoutes.js এর তালিকার সাথে মিলিয়ে
   রাখতে হবে, নাহলে server বিকল্পটা ফিরিয়ে দেবে
   --------------------------------------------------------------- */
const FACILITY_TYPES = ["warehouse", "manufacturing", "commercial", "other"];
const PROJECT_SIZES = ["under50", "from50to250", "from250to1000", "over1000"];

const EMPTY_FORM = {
  name: "",
  company: "",
  phone: "",
  email: "",
  facilityType: "",
  projectSize: "",
  details: "",
  website: "", // ফাঁদ — নিচে দেখুন
};

// সাধারণ পরীক্ষা: কিছু@কিছু.কিছু — আসল যাচাই server এও হয়
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Figma: Group 12 — 18 x 10.46, stroke 1.5, #0B121A */
function ArrowIcon() {
  return (
    <svg
      width="18"
      height="11"
      viewBox="0 0 18 11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1 5.5h15.5" />
      <path d="M12.5 1.5l4 4-4 4" />
    </svg>
  );
}

/* Figma: 10 x 5, stroke 1.5 */
function ChevronIcon() {
  return (
    <svg
      width="12"
      height="7"
      viewBox="0 0 12 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1 1l5 5 5-5" />
    </svg>
  );
}

/* ---------------------------------------------------------------
   একটা লেখার ঘর — Figma: লেখা 14px, নিচে 12px ফাঁক, 1px রেখা.
   label চোখে দেখা যায় না (Figma তে নেই), কিন্তু screen reader পড়ে
   --------------------------------------------------------------- */
function TextField({
  name,
  label,
  value,
  error,
  onChange,
  type = "text",
  multiline = false,
  ...rest
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const Tag = multiline ? "textarea" : "input";

  return (
    <div className="contact-field" data-invalid={error ? "true" : undefined}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Tag
        id={id}
        name={name}
        type={multiline ? undefined : type}
        rows={multiline ? 1 : undefined}
        className="contact-input"
        placeholder={label}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error && (
        <p id={errorId} className="contact-error">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Dropdown — Figma র নিজস্ব list (সাদা, গোল কোণা, hover এ হালকা
   ধূসর). ব্রাউজারের সাধারণ <select> এর খোলা list এভাবে সাজানো যায়
   না, তাই নিজে বানানো — তবে keyboard আর screen reader এ <select>
   এর মতোই কাজ করে:

     Enter / Space / ↓   খোলে
     ↑ ↓                 বিকল্প বদলায়
     Home / End          প্রথম / শেষ
     Enter / Space       বেছে নেয়
     Esc / Tab           বন্ধ
     বাইরে ক্লিক           বন্ধ

   focus সবসময় বোতামেই থাকে; কোন বিকল্প চিহ্নিত সেটা
   aria-activedescendant দিয়ে জানানো হয় (ARIA র listbox নিয়ম)
   --------------------------------------------------------------- */
function Dropdown({ name, label, value, options, onChange }) {
  const id = useId();
  const listId = `${id}-list`;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];

  const openList = () => {
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (index) => {
    onChange(name, options[index].value);
    setOpen(false);
  };

  // বাইরে ক্লিক বা touch করলে বন্ধ
  useEffect(() => {
    if (!open) return undefined;

    const handlePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, [open]);

  const handleKeyDown = (event) => {
    const last = options.length - 1;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlight((current) => Math.min(current + 1, last));
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlight((current) => Math.max(current - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setHighlight(0);
        break;
      case "End":
        event.preventDefault();
        setHighlight(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (highlight >= 0) choose(highlight);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false); // Tab এর স্বাভাবিক কাজ (পরের ঘরে যাওয়া) চলুক
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={rootRef}
      className="contact-field contact-select"
      data-open={open ? "true" : undefined}
    >
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      <button
        type="button"
        className="contact-input contact-select-button"
        data-empty={selected ? undefined : "true"}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        /* কিছু বাছা থাকলে "Project size, 50-250 fixtures" পড়ে;
           না থাকলে শুধু নাম — নাহলে নামটা দুইবার শোনা যেত */
        aria-labelledby={selected ? `${id}-label ${id}-value` : `${id}-label`}
        aria-activedescendant={
          open && highlight >= 0 ? `${id}-option-${highlight}` : undefined
        }
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
      >
        <span id={`${id}-value`} className="contact-select-value">
          {selected ? selected.label : label}
        </span>
        <ChevronIcon />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="contact-select-list"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              className="contact-select-option"
              data-highlight={index === highlight ? "true" : undefined}
              onPointerEnter={() => setHighlight(index)}
              /* mousedown এ বেছে নেওয়া — click পর্যন্ত অপেক্ষা করলে
                 বোতাম থেকে focus সরে যেত */
              onPointerDown={(event) => {
                event.preventDefault();
                choose(index);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Section
   --------------------------------------------------------------- */
function Contact() {
  const { t, i18n } = useTranslation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  // idle → sending → success | error
  const [status, setStatus] = useState("idle");

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // লেখা শুরু করলেই ওই ঘরের ভুলের বার্তা সরে যায়
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (status === "success" || status === "error") setStatus("idle");
  };

  const validate = () => {
    const found = {};
    if (!form.name.trim()) found.name = t("contact.errors.required");
    if (!form.company.trim()) found.company = t("contact.errors.required");
    if (!form.email.trim()) found.email = t("contact.errors.required");
    else if (!EMAIL_PATTERN.test(form.email.trim())) {
      found.email = t("contact.errors.email");
    }
    return found;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === "sending") return;

    const found = validate();
    setErrors(found);

    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      // প্রথম ভুল ঘরে focus — keyboard আর screen reader এর জন্য জরুরি
      event.currentTarget.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus("sending");

    try {
      await api.createQuoteRequest({
        ...form,
        name: form.name.trim(),
        company: form.company.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        details: form.details.trim(),
        locale: i18n.resolvedLanguage,
      });
      setForm(EMPTY_FORM);
      setStatus("success");
    } catch (error) {
      console.warn("Quote request failed:", error.message);
      setStatus("error");
    }
  };

  const facilityOptions = FACILITY_TYPES.map((value) => ({
    value,
    label: t(`contact.facilityTypes.${value}`),
  }));

  const sizeOptions = PROJECT_SIZES.map((value) => ({
    value,
    label: t(`contact.projectSizes.${value}`),
  }));

  const sending = status === "sending";

  return (
    <section
      id="contact"
      className="contact"
      aria-labelledby="contact-title"
    >
      <div className="contact-inner">
        {/* Figma: Frame 334 — বাঁয়ে, উপরে লেখা, নিচে তথ্য */}
        <div className="contact-intro">
          <div>
            <h2 id="contact-title" className="contact-title">
              {t("contact.title")}
            </h2>
            <p className="contact-text">{t("contact.text")}</p>
          </div>

          <div className="contact-info">
            <div className="contact-info-item">
              <span className="contact-info-label">{t("contact.mailUs")}</span>
              <a className="contact-info-value" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </div>
            <div className="contact-info-item">
              <span className="contact-info-label">{LOCATION}</span>
              <a className="contact-info-value" href={`tel:${PHONE_LINK}`}>
                {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>

        {/* Figma: Frame 327 — form */}
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="contact-grid">
            <TextField
              name="name"
              label={t("contact.fields.name")}
              value={form.name}
              error={errors.name}
              onChange={update}
              autoComplete="name"
              maxLength={120}
              required
            />
            <TextField
              name="company"
              label={t("contact.fields.company")}
              value={form.company}
              error={errors.company}
              onChange={update}
              autoComplete="organization"
              maxLength={160}
              required
            />
            <TextField
              name="phone"
              type="tel"
              label={t("contact.fields.phone")}
              value={form.phone}
              onChange={update}
              autoComplete="tel"
              maxLength={40}
            />
            <TextField
              name="email"
              type="email"
              label={t("contact.fields.email")}
              value={form.email}
              error={errors.email}
              onChange={update}
              autoComplete="email"
              maxLength={200}
              required
            />
            <Dropdown
              name="facilityType"
              label={t("contact.fields.facilityType")}
              value={form.facilityType}
              options={facilityOptions}
              onChange={update}
            />
            <Dropdown
              name="projectSize"
              label={t("contact.fields.projectSize")}
              value={form.projectSize}
              options={sizeOptions}
              onChange={update}
            />
            <TextField
              name="details"
              label={t("contact.fields.details")}
              value={form.details}
              onChange={update}
              multiline
              maxLength={2000}
            />
          </div>

          {/* ফাঁদ (honeypot) — মানুষ দেখে না, কিন্তু spam bot সব ঘর
              পূরণ করে. এটা ভরা থাকলে server চুপচাপ বাদ দেয় */}
          <div className="contact-trap" aria-hidden="true">
            <label>
              Website
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => update("website", event.target.value)}
              />
            </label>
          </div>

          <div className="contact-actions">
            <button
              type="submit"
              className="contact-submit"
              disabled={sending}
              aria-busy={sending}
            >
              <span>
                {sending ? t("contact.sending") : t("contact.submit")}
              </span>
              <ArrowIcon />
            </button>

            {/* ফলাফলের বার্তা — screen reader নিজে পড়ে শোনায় */}
            <p
              className="contact-status"
              data-status={status}
              role="status"
              aria-live="polite"
            >
              {status === "success" && t("contact.success")}
              {status === "error" && t("contact.error", { email: EMAIL })}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

export default Contact;