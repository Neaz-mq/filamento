import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import NhTag from "./NhTag";
import NhSelect from "./NhSelect";
import { COUNTRIES } from "./flags";
import {
  EMAIL,
  FACILITY_TYPES,
  IMAGES,
  LOCATION,
  PHONE_DISPLAY,
  PHONE_LINK,
  PROJECT_SIZES,
  cloud,
  srcSet,
} from "./data";
import { ArrowRight } from "./icons";

/* ===============================================================
   Contact Us — Figma "Frame 2147228147"

   রাতের রাস্তার ছবি (গোল কোণার বড় card), বাঁ দিক থেকে কালো আভা.
   বাঁয়ে শিরোনাম আর যোগাযোগের তথ্য, ডানে সাদা form.

   form জমা হয় মূল পাতার form এর মতোই — server এর
   /api/quote-requests এ (source: "home2", যাতে Leads এ বোঝা যায়
   কোন পাতা থেকে এসেছে). নাম দুই ঘরে, server এ যায় একসাথে.

   ফোনের দেশ: পাতার ভাষা থেকে শুরু — ইংরেজি US (+1), জাপানি JP
   (+81), চীনা TW (+886). দর্শক বদলাতে পারেন
   =============================================================== */

const START_COUNTRY = { en: "US", ja: "JP", "zh-Hant": "TW" };

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  facilityType: "",
  projectSize: "",
  details: "",
  website: "", // ফাঁদ (honeypot) — মানুষ দেখে না, bot ভরে
};

/* একটা লেখার ঘর — উপরে label, নিচে ধূসর বাক্স */
function Field({ id, label, error, children }) {
  return (
    <div className="nh-field" data-invalid={error ? "" : undefined}>
      <label htmlFor={id} id={`${id}-label`} className="nh-label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="nh-field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function NhContact() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;

  const [form, setForm] = useState(EMPTY);
  const [country, setCountry] = useState(START_COUNTRY[language] ?? "US");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  /* দেশের নাম ব্রাউজার নিজেই পাতার ভাষায় দেয় — "Japan", "日本" …
     পুরনো ব্রাউজারে Intl.DisplayNames না থাকলে শুধু কোড (JP) */
  const countryOptions = useMemo(() => {
    let names = null;
    try {
      names = new Intl.DisplayNames([language], { type: "region" });
    } catch {
      names = null;
    }
    return COUNTRIES.map((item) => ({
      value: item.code,
      label: names?.of(item.code) ?? item.code,
      dial: item.dial,
      flag: item.flag,
    }));
  }, [language]);

  const facilityOptions = FACILITY_TYPES.map((value) => ({
    value,
    label: t(`home2.contact.facilityTypes.${value}`),
  }));

  const sizeOptions = PROJECT_SIZES.map((value) => ({
    value,
    label: t(`contact.projectSizes.${value}`),
  }));

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (status === "success" || status === "error") setStatus("idle");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === "sending") return;

    const found = {};
    if (!form.firstName.trim()) found.firstName = t("contact.errors.required");
    if (!form.email.trim()) found.email = t("contact.errors.required");
    else if (!EMAIL_SHAPE.test(form.email.trim())) found.email = t("contact.errors.email");
    setErrors(found);

    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      // প্রথম ভুল ঘরে focus — keyboard আর screen reader এর জন্য জরুরি
      event.currentTarget.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    const dial = COUNTRIES.find((item) => item.code === country)?.dial ?? "";
    const phone = form.phone.trim();

    setStatus("sending");
    try {
      await api.createQuoteRequest({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        phone: phone ? `${dial} ${phone}` : "",
        email: form.email.trim(),
        facilityType: form.facilityType,
        projectSize: form.projectSize,
        details: form.details.trim(),
        website: form.website,
        locale: language,
        source: "home2",
      });
      setForm(EMPTY);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const sending = status === "sending";

  return (
    <section id="contact" className="nh-section nh-contact" aria-labelledby="nh-contact-title">
      <div className="nh-wrap">
        <div className="nh-contact-card" data-reveal="zoom">
          {/* ছবি আর আভা আলাদা খোপে, গোল কোণায় কাটা — card নিজে কাটা
              নয়, তাই form এর dropdown card এর বাইরেও খুলতে পারে */}
          <div className="nh-contact-bg" aria-hidden="true">
            <img
              src={cloud(IMAGES.contact, 1600)}
              srcSet={srcSet(IMAGES.contact, [800, 1280, 1600, 2400])}
              sizes="(max-width: 1440px) 92vw, 1280px"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <div className="nh-contact-shade" />
          </div>

          <div className="nh-contact-inner">
            <div className="nh-contact-intro">
              <div className="nh-contact-copy">
                <NhTag number="5" label={t("home2.contact.tag")} tone="night" data-reveal="" />
                <h2
                  id="nh-contact-title"
                  className="nh-contact-title"
                  data-reveal=""
                  style={{ "--d": 1 }}
                >
                  {t("contact.title")}
                </h2>
                <p className="nh-contact-text" data-reveal="" style={{ "--d": 2 }}>
                  {t("contact.text")}
                </p>
              </div>

              <div className="nh-contact-info" data-reveal="" style={{ "--d": 3 }}>
                <div className="nh-contact-info-col">
                  <span className="nh-contact-info-label">{t("home2.contact.infoLabel")}</span>
                  <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                </div>
                <div className="nh-contact-info-col">
                  <span>{LOCATION}</span>
                  <a href={`tel:${PHONE_LINK}`}>{PHONE_DISPLAY}</a>
                </div>
              </div>
            </div>

            <form
              className="nh-form"
              onSubmit={handleSubmit}
              noValidate
              data-reveal=""
              style={{ "--d": 2 }}
            >
              <div className="nh-form-fields">
                <div className="nh-form-row">
                  <Field id="nh-first" label={t("home2.contact.fields.firstName")} error={errors.firstName}>
                    <input
                      id="nh-first"
                      name="firstName"
                      className="nh-input"
                      value={form.firstName}
                      onChange={(event) => update("firstName", event.target.value)}
                      placeholder={t("home2.contact.placeholders.firstName")}
                      autoComplete="given-name"
                      maxLength={60}
                      aria-invalid={errors.firstName ? "true" : undefined}
                      aria-describedby={errors.firstName ? "nh-first-error" : undefined}
                    />
                  </Field>
                  <Field id="nh-last" label={t("home2.contact.fields.lastName")}>
                    <input
                      id="nh-last"
                      name="lastName"
                      className="nh-input"
                      value={form.lastName}
                      onChange={(event) => update("lastName", event.target.value)}
                      placeholder={t("home2.contact.placeholders.lastName")}
                      autoComplete="family-name"
                      maxLength={60}
                    />
                  </Field>
                </div>

                <Field id="nh-phone" label={t("home2.contact.fields.phone")}>
                  <div className="nh-phone">
                    <NhSelect
                      className="nh-select--country"
                      labelId="nh-phone-label"
                      ariaLabel={t("home2.contact.countryLabel")}
                      value={country}
                      options={countryOptions}
                      onChange={setCountry}
                      renderValue={(option) => (
                        <>
                          <img className="nh-flag" src={option.flag} alt="" width="20" height="20" />
                          <span>{option.dial}</span>
                        </>
                      )}
                      renderOption={(option) => (
                        <>
                          <img className="nh-flag" src={option.flag} alt="" width="20" height="20" loading="lazy" />
                          <span className="nh-country-name">{option.label}</span>
                          <span className="nh-country-dial">{option.dial}</span>
                        </>
                      )}
                    />
                    <span className="nh-phone-divider" aria-hidden="true" />
                    <input
                      id="nh-phone"
                      name="phone"
                      className="nh-phone-input"
                      type="tel"
                      value={form.phone}
                      onChange={(event) => update("phone", event.target.value)}
                      placeholder={t("home2.contact.placeholders.phone")}
                      autoComplete="tel-national"
                      maxLength={30}
                    />
                  </div>
                </Field>

                <Field id="nh-email" label={t("home2.contact.fields.email")} error={errors.email}>
                  <input
                    id="nh-email"
                    name="email"
                    type="email"
                    className="nh-input"
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    placeholder={t("home2.contact.placeholders.email")}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    maxLength={200}
                    aria-invalid={errors.email ? "true" : undefined}
                    aria-describedby={errors.email ? "nh-email-error" : undefined}
                  />
                </Field>

                <div className="nh-form-row">
                  <div className="nh-field">
                    <span id="nh-facility-label" className="nh-label">
                      {t("contact.fields.facilityType")}
                    </span>
                    <NhSelect
                      labelId="nh-facility-label"
                      value={form.facilityType}
                      options={facilityOptions}
                      onChange={(value) => update("facilityType", value)}
                      placeholder={t("home2.contact.placeholders.select")}
                    />
                  </div>
                  <div className="nh-field">
                    <span id="nh-size-label" className="nh-label">
                      {t("contact.fields.projectSize")}
                    </span>
                    <NhSelect
                      className="nh-select--end"
                      labelId="nh-size-label"
                      value={form.projectSize}
                      options={sizeOptions}
                      onChange={(value) => update("projectSize", value)}
                      placeholder={t("home2.contact.placeholders.select")}
                    />
                  </div>
                </div>

                <Field id="nh-details" label={t("home2.contact.fields.description")}>
                  <textarea
                    id="nh-details"
                    name="details"
                    className="nh-input nh-textarea"
                    value={form.details}
                    onChange={(event) => update("details", event.target.value)}
                    placeholder={t("home2.contact.placeholders.description")}
                    maxLength={2000}
                    rows={3}
                  />
                </Field>
              </div>

              {/* ফাঁদ — চোখে দেখা যায় না, Tab এ থামে না */}
              <div className="nh-trap" aria-hidden="true">
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

              <div className="nh-form-foot">
                <p className="nh-form-status" data-status={status} role="status" aria-live="polite">
                  {status === "success" && t("contact.success")}
                  {status === "error" && t("contact.error", { email: EMAIL })}
                </p>
                <button type="submit" className="nh-btn-submit" disabled={sending} aria-busy={sending}>
                  <span>{sending ? t("contact.sending") : t("contact.submit")}</span>
                  <ArrowRight size={18} strokeWidth={1.2} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NhContact;
