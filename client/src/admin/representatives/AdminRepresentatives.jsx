import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useConfirm } from "../../components/useConfirm";
import { useAdminAuth, useDocumentTitle } from "../AdminAuth";
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconTrash,
  IconUsersGroup,
} from "../icons";
import "./representatives.css";

/* ===============================================================
   Representatives — "Find a Representative" (Shop) পাতার তথ্য

   সাইটের /shop পাতায় যাদের নাম দেখানো হয় (Illuminate, Vertex
   Solutions …) তাদের তালিকা এখান থেকেই বদলানো যায় — কোডের ফাইল
   খুলতে হয় না.

   এক জন মানুষ = এক সারি. একই জন কয়েকটা territory সামলালে একবারই
   লিখে একাধিক territory বেছে নিলেই হয়.

   যে করতে পারে:
     owner, admin — যোগ, বদল, লুকানো/দেখানো, মোছা
     editor       — শুধু দেখা

   ⚠️ এই পাতার পাহারা শুধু চোখের জন্য (কোন বোতাম দেখা যাবে).
   আসল পাহারা server এ — requireAdmin + role check
   =============================================================== */

// সাইটের ট্যাবের নামের মতোই
const REGION_LABELS = {
  usa: "USA / Puerto Rico",
  europe: "Europe",
  asia: "Asia",
  canada: "Canada",
  mexico: "Mexico",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "On the website" },
  { id: "hidden", label: "Hidden" },
];

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = {
  company: "",
  person: "",
  email: "",
  phone: "",
  address: "",
  position: "",
  active: true,
  territories: [],
};

const toForm = (item) => ({
  company: item.company,
  person: item.person,
  email: item.email,
  phone: item.phone,
  address: item.address,
  position: String(item.position),
  active: item.active,
  territories: item.territories,
});

// সাইটে যে ক্রমে আসে সেই ক্রমেই — ছোট position আগে
const byOrder = (a, b) =>
  a.position - b.position || a.company.localeCompare(b.company);

const regionLabel = (id) =>
  REGION_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);

function AdminRepresentatives() {
  useDocumentTitle("Representatives");

  const { admin } = useAdminAuth();
  const canEdit = admin?.role === "owner" || admin?.role === "admin";

  // window.confirm() এর বদলে সাইটের নিজস্ব ডায়ালগ
  const { confirm, dialog } = useConfirm();

  const [items, setItems] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // ফর্ম: বন্ধ | নতুন (editingId = "") | পুরনোটা বদল (editingId = id)
  const [formRequested, setFormRequested] = useState(false);
  const [editingId, setEditingId] = useState("");

  /* ফর্ম "খোলা" ধরা হয় তখনই যখন ঠিকানায় ?form=… আছে. ফর্ম খুললে ব্রাউজারের
     history তে একটা entry যোগ হয় — তাই Back চাপলে আগের পেজে (যেমন
     Application) না গিয়ে এই পেজেই থেকে শুধু ফর্ম বন্ধ হয় */
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const pushedFormRef = useRef(false);
  const formOpen = formRequested && searchParams.has("form");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  // কোন সারিতে এখন কাজ চলছে — সেই সারির বোতাম বন্ধ থাকে
  const [busyId, setBusyId] = useState("");
  const [rowError, setRowError] = useState("");

  const formRef = useRef(null);
  const companyRef = useRef(null);

  /* তালিকা আনা. setState গুলো .then/.catch এর ভেতরে (effect এর ভেতরে
     সরাসরি নয়) — react-hooks lint এ ধরা পড়ে না, আর পাতা ছেড়ে গেলে
     পরে আসা উত্তর ফেলে দেওয়া হয়. "Try again" reloadKey বাড়িয়ে আবার আনায় */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api
      .adminListRepresentatives()
      .then((data) => {
        if (cancelled) return;
        setItems(data.representatives || []);
        setTerritories(data.territories || []);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        /* 404 মানে server এ এই route টা এখনো বসেনি — আলাদা করে বলা,
           নাহলে "Route not found" দেখে বোঝা যেত না */
        setLoadError(
          error.status === 404
            ? "The server route for this page is not live yet."
            : error.message,
        );
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setStatus("loading");
    setReloadKey((key) => key + 1);
  };

  /* ফর্ম খুললে সেখানে নামিয়ে প্রথম ঘরে কার্সর — লম্বা তালিকার নিচে
     থেকে "Edit" চাপলে ফর্মটা যেন চোখের বাইরে না থেকে যায় */
  useEffect(() => {
    if (!formOpen) return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    companyRef.current?.focus({ preventScroll: true });
  }, [formOpen, editingId]);

  /* ---------- territory র নাম ও গোষ্ঠী ---------- */
  const nameOf = useMemo(
    () => new Map(territories.map((item) => [item.key, item.name])),
    [territories],
  );

  const groups = useMemo(() => {
    const order = [...new Set(territories.map((item) => item.region))];
    return order.map((id) => ({
      id,
      label: regionLabel(id),
      options: territories.filter((item) => item.region === id),
    }));
  }, [territories]);

  /* ---------- তালিকা ছাঁকা ---------- */
  const counts = useMemo(
    () => ({
      all: items.length,
      active: items.filter((item) => item.active).length,
      hidden: items.filter((item) => !item.active).length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      if (filter === "active" && !item.active) return false;
      if (filter === "hidden" && item.active) return false;
      if (!words.length) return true;

      const haystack = [
        item.company,
        item.person,
        item.email,
        item.phone,
        ...item.territories.map((key) => nameOf.get(key) ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [items, query, filter, nameOf]);

  /* ---------- ফর্ম ---------- */
  // ফর্ম খোলা: ঠিকানায় ?form=new | ?form=edit. আগে থেকে খোলা থাকলে নতুন
  // history entry নয় (নইলে এক Back এ ফর্ম বন্ধ হত না)
  const showForm = (mode) => {
    const alreadyOpen = formOpen;
    setFormRequested(true);
    if (!alreadyOpen) pushedFormRef.current = true;
    setSearchParams({ form: mode }, { replace: alreadyOpen });
  };

  // ফর্ম বন্ধ: আমরা যে entry যোগ করেছিলাম সেটা ফেরত নিই (Back এর মতোই)
  const hideForm = () => {
    setFormError("");
    setFormRequested(false);
    if (pushedFormRef.current) {
      pushedFormRef.current = false;
      navigate(-1);
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const openNew = () => {
    setEditingId("");
    setForm(EMPTY_FORM);
    setFormError("");
    showForm("new");
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm(toForm(item));
    setFormError("");
    setNotice("");
    showForm("edit");
  };

  const closeForm = () => hideForm();

  const setField = (name) => (event) =>
    setForm((current) => ({ ...current, [name]: event.target.value }));

  const toggleTerritory = (key) =>
    setForm((current) => ({
      ...current,
      territories: current.territories.includes(key)
        ? current.territories.filter((item) => item !== key)
        : [...current.territories, key],
    }));

  // একটা অঞ্চলের সবগুলো বাছা / সব ছাড়া
  const setGroup = (group, selected) =>
    setForm((current) => {
      const keys = new Set(group.options.map((item) => item.key));
      const rest = current.territories.filter((key) => !keys.has(key));
      return {
        ...current,
        territories: selected ? [...rest, ...keys] : rest,
      };
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const company = form.company.trim();
    const person = form.person.trim();
    const email = form.email.trim();

    let problem = "";
    if (!company) problem = "Company name is required.";
    else if (!person) problem = "Contact person is required.";
    else if (!EMAIL_SHAPE.test(email)) problem = "Enter a valid email address.";
    else if (!form.territories.length) problem = "Choose at least one territory.";

    const payload = {
      company,
      person,
      email,
      phone: form.phone.trim(),
      address: form.address.trim(),
      territories: form.territories,
      active: form.active,
    };

    // ক্রম ফাঁকা থাকলে — নতুনের জন্য server সবার শেষে বসায়, পুরনোর আগেরটাই থাকে
    if (!problem && form.position.trim() !== "") {
      const position = Number(form.position);
      if (!Number.isInteger(position) || position < 0 || position > 99999) {
        problem = "Order must be a whole number between 0 and 99999.";
      } else {
        payload.position = position;
      }
    }

    if (problem) {
      setFormError(problem);
      return;
    }

    setSaving(true);
    setFormError("");
    setRowError("");

    try {
      if (editingId) {
        const data = await api.updateRepresentative(editingId, payload);
        setItems((list) =>
          list
            .map((item) => (item.id === editingId ? data.representative : item))
            .sort(byOrder),
        );
        setNotice(`${data.representative.company} — ${data.representative.person} was updated.`);
      } else {
        const data = await api.createRepresentative(payload);
        setItems((list) => [...list, data.representative].sort(byOrder));
        setNotice(`${data.representative.company} — ${data.representative.person} was added.`);
      }
      hideForm();
    } catch (error) {
      // যেমন "A representative with this email already exists."
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- সারির কাজ ---------- */
  const handleToggleActive = async (item) => {
    setBusyId(item.id);
    setRowError("");
    try {
      const data = await api.updateRepresentative(item.id, { active: !item.active });
      setItems((list) =>
        list.map((entry) => (entry.id === item.id ? data.representative : entry)),
      );
      setNotice(
        data.representative.active
          ? `${item.person} is on the website again.`
          : `${item.person} is hidden from the website.`,
      );
    } catch (error) {
      setRowError(error.message);
    } finally {
      setBusyId("");
    }
  };

  const handleRemove = async (item) => {
    const sure = await confirm({
      title: "Delete representative?",
      message: `Delete ${item.person} (${item.company})? They will be removed from every territory. You can hide them instead if you may need them again.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!sure) return;

    setBusyId(item.id);
    setRowError("");
    try {
      await api.deleteRepresentative(item.id);
      setItems((list) => list.filter((entry) => entry.id !== item.id));
      if (editingId === item.id && formOpen) hideForm();
      setNotice(`${item.person} was deleted.`);
    } catch (error) {
      setRowError(error.message);
    } finally {
      setBusyId("");
    }
  };

  /* ---------- দেখা ---------- */
  return (
    <section className="adm-panel">
      <div className="adm-panel-head">
        <div className="adm-panel-head-left">
          <span className="adm-panel-icon">
            <IconUsersGroup />
          </span>
          <h2 className="adm-panel-title">Representatives</h2>
        </div>

        {canEdit && status === "ready" && !formOpen && (
          <button type="button" className="adm-btn" onClick={openNew}>
            <IconPlus size={18} />
            Add representative
          </button>
        )}
      </div>

      <p className="adm-help">
        These are the local sales companies shown on the website&apos;s{" "}
        <strong>Shop → Find a Representative</strong> page. A territory with no
        one on it shows Filamento&apos;s own contact details instead.
      </p>

      {!canEdit && (
        <p className="adm-help">
          Only an owner or admin can change representatives. You can see the
          list.
        </p>
      )}

      {notice && (
        <p className="adm-banner adm-banner--ok" role="status">
          {notice}
        </p>
      )}

      {rowError && (
        <p className="adm-banner adm-banner--bad" role="alert">
          {rowError}
        </p>
      )}

      {/* ---- নতুন / বদলের ফর্ম ---- */}
      {canEdit && formOpen && (
        <form className="adm-form" ref={formRef} onSubmit={handleSubmit} noValidate>
          <h3 className="adm-rep-form-title">
            {editingId ? "Edit representative" : "Add representative"}
          </h3>

          <div className="adm-form-grid">
            <div className="admin-field">
              <label className="admin-label" htmlFor="rep-company">
                Company *
              </label>
              <input
                id="rep-company"
                ref={companyRef}
                className="admin-input"
                value={form.company}
                onChange={setField("company")}
                maxLength={160}
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label className="admin-label" htmlFor="rep-person">
                Contact person *
              </label>
              <input
                id="rep-person"
                className="admin-input"
                value={form.person}
                onChange={setField("person")}
                maxLength={120}
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label className="admin-label" htmlFor="rep-email">
                Email *
              </label>
              <input
                id="rep-email"
                className="admin-input"
                type="email"
                value={form.email}
                onChange={setField("email")}
                autoCapitalize="none"
                spellCheck="false"
                maxLength={200}
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label className="admin-label" htmlFor="rep-phone">
                Phone
              </label>
              <input
                id="rep-phone"
                className="admin-input"
                type="tel"
                value={form.phone}
                onChange={setField("phone")}
                maxLength={40}
                disabled={saving}
              />
            </div>

            <div className="admin-field adm-rep-wide">
              <label className="admin-label" htmlFor="rep-address">
                Address
              </label>
              <input
                id="rep-address"
                className="admin-input"
                value={form.address}
                onChange={setField("address")}
                maxLength={240}
                disabled={saving}
                aria-describedby="rep-address-help"
              />
              <p className="adm-hint" id="rep-address-help">
                One line, e.g. 44 6th Road, Woburn, MA 01801. Visitors can open
                it in Google Maps.
              </p>
            </div>

            <div className="admin-field">
              <label className="admin-label" htmlFor="rep-position">
                Order
              </label>
              <input
                id="rep-position"
                className="admin-input"
                type="number"
                min="0"
                max="99999"
                step="1"
                value={form.position}
                onChange={setField("position")}
                disabled={saving}
                aria-describedby="rep-position-help"
              />
              <p className="adm-hint" id="rep-position-help">
                Optional. When several people share a territory, the smaller
                number comes first. Leave empty to put a new person last.
              </p>
            </div>

            <div className="admin-field">
              <span className="admin-label">Website</span>
              <label className="adm-rep-check">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, active: event.target.checked }))
                  }
                  disabled={saving}
                />
                Show on the website
              </label>
            </div>
          </div>

          {/* ---- territory বাছাই ---- */}
          <fieldset className="adm-rep-picker" disabled={saving}>
            <legend className="admin-label">
              Territories * <span className="adm-rep-count">{form.territories.length} selected</span>
            </legend>

            {groups.map((group) => {
              const chosen = group.options.filter((item) =>
                form.territories.includes(item.key),
              ).length;
              return (
                <div className="adm-rep-group" key={group.id}>
                  <div className="adm-rep-group-head">
                    <span className="adm-rep-group-name">
                      {group.label}
                      <span className="adm-rep-count">
                        {chosen}/{group.options.length}
                      </span>
                    </span>
                    <span className="adm-rep-group-actions">
                      <button
                        type="button"
                        className="adm-link-btn"
                        onClick={() => setGroup(group, true)}
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        className="adm-link-btn"
                        onClick={() => setGroup(group, false)}
                      >
                        Clear
                      </button>
                    </span>
                  </div>

                  <div className="adm-rep-options">
                    {group.options.map((item) => {
                      const checked = form.territories.includes(item.key);
                      return (
                        <label
                          key={item.key}
                          className={`adm-rep-option${checked ? " is-checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTerritory(item.key)}
                          />
                          {item.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </fieldset>

          {formError && (
            <p className="admin-auth-error" role="alert">
              {formError}
            </p>
          )}

          <div className="adm-rep-form-actions">
            <button type="submit" className="adm-btn" disabled={saving} aria-busy={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add representative"}
            </button>
            <button
              type="button"
              className="adm-btn-ghost"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ---- তালিকা ---- */}
      {status === "loading" && <p className="adm-help">Loading…</p>}

      {status === "error" && (
        <div className="adm-banner adm-banner--bad" role="alert">
          {loadError}{" "}
          <button type="button" className="adm-link-btn" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="adm-rep-toolbar">
            <input
              className="admin-input adm-rep-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, person, email or territory"
              aria-label="Search representatives"
              autoComplete="off"
              spellCheck="false"
            />

            <div className="adm-rep-filters" role="group" aria-label="Show">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`adm-rep-filter${filter === item.id ? " is-active" : ""}`}
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label} <span>{counts[item.id]}</span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="adm-help">
              {items.length === 0
                ? "No representatives yet."
                : "No one matches. Try a different search."}
            </p>
          ) : (
            <table className="adm-table adm-table--stack">
              <thead>
                <tr>
                  <th scope="col">Representative</th>
                  <th scope="col">Territories</th>
                  <th scope="col">Website</th>
                  {canEdit && (
                    <th scope="col" className="adm-th-end">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const busy = busyId === item.id;
                  const names = item.territories.map((key) => nameOf.get(key) ?? key);
                  const extra = names.length - 3;

                  return (
                    <tr key={item.id}>
                      <td data-label="Representative">
                        <div className="adm-lead-cell">
                          <span className="adm-cell-icon adm-cell-icon--solid">
                            {item.company.charAt(0).toUpperCase()}
                          </span>
                          <span className="adm-cell-text">
                            <span className="adm-cell-title">{item.company}</span>
                            <span className="adm-cell-note">{item.person}</span>
                            <span className="adm-cell-note">{item.email}</span>
                          </span>
                        </div>
                      </td>

                      <td data-label="Territories">
                        <span className="adm-rep-chips" title={names.join(", ")}>
                          {names.slice(0, 3).map((name) => (
                            <span className="adm-rep-chip" key={name}>
                              {name}
                            </span>
                          ))}
                          {extra > 0 && (
                            <span className="adm-rep-chip adm-rep-chip--more">+{extra} more</span>
                          )}
                        </span>
                      </td>

                      <td data-label="Website">
                        <span
                          className={
                            item.active ? "adm-pill adm-pill--green" : "adm-pill adm-pill--grey"
                          }
                        >
                          {item.active ? "Live" : "Hidden"}
                        </span>
                      </td>

                      {canEdit && (
                        <td data-label="Actions" className="adm-td-end">
                          <span className="adm-rep-actions">
                            <button
                              type="button"
                              className="adm-btn-ghost"
                              onClick={() => openEdit(item)}
                              disabled={busy}
                              aria-label={`Edit ${item.person}`}
                            >
                              <IconPencil size={16} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="adm-btn-ghost"
                              onClick={() => handleToggleActive(item)}
                              disabled={busy}
                              aria-label={`${item.active ? "Hide" : "Show"} ${item.person}`}
                            >
                              <IconEye size={16} />
                              {item.active ? "Hide" : "Show"}
                            </button>
                            <button
                              type="button"
                              className="adm-btn-ghost adm-btn-ghost--bad"
                              onClick={() => handleRemove(item)}
                              disabled={busy}
                              aria-label={`Delete ${item.person}`}
                            >
                              <IconTrash size={16} />
                              Delete
                            </button>
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      <p className="adm-help">
        Changes show on the website within about a minute.
      </p>

      {dialog}
    </section>
  );
}

export default AdminRepresentatives;