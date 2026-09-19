import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAdminAuth, useDocumentTitle } from "./AdminAuth";
import { IconTrash, IconUserPlus, IconUsers } from "./icons";

/* ===============================================================
   Users & Roles

   একের বেশি admin থাকতে পারে — সবাই একই /admin panel এ ঢোকে,
   শুধু কে কী করতে পারবে সেটা ভূমিকা (role) দিয়ে ঠিক হয়:

     owner   — super admin. নতুন admin বানাতে, ভূমিকা বদলাতে আর
               সরাতে পারে. একের বেশি owner থাকতে পারে.
     admin   — সব বিষয়বস্তু (product, section, lead) সামলাতে পারে,
               কিন্তু অন্য admin কে ছুঁতে পারে না.
     editor  — শুধু লেখা আর ছবি বদলাতে পারে.

   ⚠️ এই পাতার সব পাহারা শুধু চোখের জন্য — কোন বোতাম দেখা যাবে
   সেটা ঠিক করে. আসল পাহারা server এ (requireAdmin + role check).
   browser এ কিছু বদলে কেউ সত্যিকারের কিছু করতে পারবে না
   =============================================================== */

const ROLES = [
  { value: "owner", label: "Owner (super admin)" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
];

const EMPTY_FORM = { name: "", email: "", password: "", role: "admin" };

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AdminUsers() {
  useDocumentTitle("Users & Roles");

  const { admin } = useAdminAuth();
  const isOwner = admin?.role === "owner";

  const [admins, setAdmins] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  // কোন সারিতে এখন কাজ চলছে — সেই সারির বোতাম বন্ধ থাকে
  const [busyId, setBusyId] = useState("");
  const [rowError, setRowError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await api.listAdmins();
      setAdmins(data.admins || []);
      setStatus("ready");
    } catch (error) {
      /* 404 মানে server এ এই route টা এখনো বসেনি — সেটা আলাদা করে
         বলা হচ্ছে, নাহলে "কিছু একটা ভুল" দেখে বোঝা যেত না */
      setLoadError(
        error.status === 404
          ? "The server route for this page is not live yet."
          : error.message,
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email || !form.password) {
      setFormError("Name, email and password are all needed.");
      return;
    }
    if (form.password.length < 12) {
      setFormError("Use a password of at least 12 characters.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const data = await api.createAdmin({
        name,
        email,
        password: form.password,
        role: form.role,
      });
      setAdmins((list) => [...list, data.admin]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setNotice(`${data.admin.name} can now sign in at /admin/login.`);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRole = async (id, role) => {
    setBusyId(id);
    setRowError("");
    try {
      const data = await api.updateAdmin(id, { role });
      setAdmins((list) =>
        list.map((item) => (item.id === id ? data.admin : item)),
      );
      setNotice(`${data.admin.name} is now ${role}.`);
    } catch (error) {
      setRowError(error.message);
    } finally {
      setBusyId("");
    }
  };

  const handleRemove = async (person) => {
    const sure = window.confirm(
      `Remove ${person.name} (${person.email})? They will be signed out and will not be able to sign in again.`,
    );
    if (!sure) return;

    setBusyId(person.id);
    setRowError("");
    try {
      await api.deleteAdmin(person.id);
      setAdmins((list) => list.filter((item) => item.id !== person.id));
      setNotice(`${person.name} was removed.`);
    } catch (error) {
      setRowError(error.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="adm-panel">
      <div className="adm-panel-head">
        <div className="adm-panel-head-left">
          <span className="adm-panel-icon">
            <IconUsers />
          </span>
          <h2 className="adm-panel-title">Users &amp; Roles</h2>
        </div>

        {isOwner && status === "ready" && (
          <button
            type="button"
            className="adm-btn"
            onClick={() => {
              setShowForm((value) => !value);
              setFormError("");
            }}
            aria-expanded={showForm}
          >
            <IconUserPlus size={18} />
            {showForm ? "Cancel" : "Add admin"}
          </button>
        )}
      </div>

      {!isOwner && (
        <p className="adm-note">
          Only an owner can add or change admins. You can see the list.
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

      {/* ---- নতুন admin এর ফর্ম ---- */}
      {isOwner && showForm && (
        <form className="adm-form" onSubmit={handleCreate} noValidate>
          <div className="adm-form-grid">
            <div className="admin-field">
              <label className="admin-label" htmlFor="new-admin-name">
                Name
              </label>
              <input
                id="new-admin-name"
                className="admin-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={80}
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label className="admin-label" htmlFor="new-admin-email">
                Email
              </label>
              <input
                id="new-admin-email"
                className="admin-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoCapitalize="none"
                spellCheck="false"
                maxLength={200}
                disabled={saving}
              />
            </div>

            <div className="admin-field">
              <label className="admin-label" htmlFor="new-admin-password">
                Temporary password
              </label>
              <input
                id="new-admin-password"
                className="admin-input"
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                maxLength={200}
                disabled={saving}
                aria-describedby="new-admin-password-help"
              />
              <p className="adm-hint" id="new-admin-password-help">
                At least 12 characters. Send it to them another way — not by
                email — and ask them to change it.
              </p>
            </div>

            <div className="admin-field">
              <label className="admin-label" htmlFor="new-admin-role">
                Role
              </label>
              <select
                id="new-admin-role"
                className="admin-input adm-select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={saving}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <p className="admin-auth-error" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="adm-btn"
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "Adding…" : "Add admin"}
          </button>
        </form>
      )}

      {/* ---- তালিকা ---- */}
      {status === "loading" && <p className="adm-note">Loading…</p>}

      {status === "error" && (
        <div className="adm-banner adm-banner--bad" role="alert">
          {loadError}{" "}
          <button type="button" className="adm-link-btn" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {status === "ready" && (
        <table className="adm-table adm-table--stack">
          <thead>
            <tr>
              <th scope="col">Person</th>
              <th scope="col">Role</th>
              <th scope="col">Added</th>
              <th scope="col" className="adm-th-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((person) => {
              const self = person.id === admin?.id;
              const busy = busyId === person.id;

              return (
                <tr key={person.id}>
                  <td data-label="Person">
                    <div className="adm-lead-cell">
                      <span className="adm-cell-icon adm-cell-icon--solid">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="adm-cell-text">
                        <span className="adm-cell-title">
                          {person.name}
                          {self && <span className="adm-you">you</span>}
                        </span>
                        <span className="adm-cell-note">{person.email}</span>
                      </span>
                    </div>
                  </td>

                  <td data-label="Role">
                    {/* নিজের ভূমিকা নিজে বদলানো যায় না — নাহলে শেষ
                        owner নিজেকে নামিয়ে দিলে আর কেউ ফেরাতে
                        পারত না. server ও এটা আটকায় */}
                    {isOwner && !self ? (
                      <select
                        className="admin-input adm-select adm-select--sm"
                        value={person.role}
                        onChange={(e) => handleRole(person.id, e.target.value)}
                        disabled={busy}
                        aria-label={`Role for ${person.name}`}
                      >
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={
                          person.role === "owner"
                            ? "adm-pill adm-pill--new"
                            : "adm-pill adm-pill--grey"
                        }
                      >
                        {person.role}
                      </span>
                    )}
                  </td>

                  <td data-label="Added">
                    <span className="adm-cell-muted">
                      {formatDate(person.createdAt)}
                    </span>
                  </td>

                  <td data-label="Actions" className="adm-td-end">
                    {isOwner && !self ? (
                      <button
                        type="button"
                        className="adm-btn-ghost adm-btn-ghost--bad"
                        onClick={() => handleRemove(person)}
                        disabled={busy}
                      >
                        <IconTrash size={16} />
                        Remove
                        <span className="sr-only"> {person.name}</span>
                      </button>
                    ) : (
                      <span className="adm-cell-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p className="adm-note">
        Everyone here signs in at the same place — <code>/admin/login</code>.
        There is no sign-up page; an owner creates every account.
      </p>
    </section>
  );
}

export default AdminUsers;