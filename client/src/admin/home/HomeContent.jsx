import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useBlocker, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAdminAuth, useDocumentTitle } from "../AdminAuth";
import AdminClock from "../AdminClock";
import { OLD_HOME_SLUGS, homeSections } from "../dashboardData";
import { ConfirmModal } from "../products/Modal";
import { snapshot, stepProblem } from "./homeShape";
import { StepComparison, StepFeatured, StepHero, StepTestimonials, StepVideos } from "./HomeSteps";
import { IconArrowLeft, IconCalendar, IconCheck, IconClose } from "../icons";
import "../products/products.css";
import "../projects/projects.css";
import "./home.css";

/* ===============================================================
   Home Page Content — /admin/home/<ধাপ>

   উপরে পাঁচটা ট্যাব (Hero, Featured Products, Comparison, Videos,
   Testimonials). প্রতিটা ট্যাব landing page এর একটা অংশ.

   কীভাবে চলে:
     • পাতা খুললে server থেকে পাঁচটা ধাপ একসাথে আসে. যে ধাপ কখনো
       save হয়নি, সেখানে এখনকার landing page এর লেখা-ছবিই থাকে
     • modal এ Save → শুধু খসড়ায় বসে
     • নিচের "Save Change" → এই ট্যাবটা database এ যায়
     • "Cancel" → এই ট্যাবের না-save করা বদল ফেলে দেয়
     • ট্যাব বদলালে খসড়া হারায় না (হলুদ বিন্দু = save বাকি);
       admin এর অন্য পাতায় যেতে চাইলে জিজ্ঞেস করে
     • Ctrl/⌘ + S এ save

   ট্যাবের সবুজ ✓ মানে ধাপটা অন্তত একবার save হয়েছে আর এখন কোনো
   বদল বাকি নেই

   ⚠️ landing page এখনো নিজের লেখা (en.json) থেকেই চলে — এই পাতা
   শুধু database এ রাখে. GET /api/site-content/home তৈরি আছে,
   landing page সেটা পড়া শুরু করলেই এখানকার বদল সাইটে দেখা যাবে
   =============================================================== */

const dayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const savedFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const STEP_VIEWS = {
  hero: StepHero,
  featured: StepFeatured,
  comparison: StepComparison,
  videos: StepVideos,
  testimonials: StepTestimonials,
};

const STEP_KEYS = homeSections.map((section) => section.step);

// server এর উত্তর → পাতার অবস্থা
const fromServer = ({ content, steps, products }) => ({
  content,
  saved: Object.fromEntries(STEP_KEYS.map((key) => [key, snapshot(content[key])])),
  meta: steps,
  products: products ?? {},
});

function HomeContent() {
  const { step: slugParam } = useParams();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const canEdit = ["owner", "admin", "editor"].includes(admin?.role);

  const slug = slugParam ?? "hero";
  const index = homeSections.findIndex((section) => section.slug === slug);
  const section = homeSections[index];
  const step = section?.step;

  /* ---------- তথ্য আনা ---------- */
  const [state, setState] = useState(null); // { content, saved, meta, products }
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .adminHomeContent()
      .then((data) => {
        if (!alive) return;
        setLoadError("");
        setState(fromServer(data));
      })
      .catch((error) => {
        if (alive) setLoadError(error.message);
      });
    return () => {
      alive = false;
    };
  }, [reload]);

  const dirtyOf = (key) => Boolean(state && snapshot(state.content[key]) !== state.saved[key]);
  const dirtySteps = state ? STEP_KEYS.filter(dirtyOf) : [];
  const dirty = Boolean(step && dirtyOf(step));

  const update = (change) =>
    setState((old) => ({
      ...old,
      content: { ...old.content, [step]: change(old.content[step]) },
    }));

  const setProducts = (change) => setState((old) => ({ ...old, products: change(old.products) }));

  /* ---------- save ---------- */
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null); // { tone, text }
  const [confirmCancel, setConfirmCancel] = useState(false);

  const save = async () => {
    if (!canEdit || saving || !state || !step) return;
    const data = state.content[step];

    const problem = stepProblem(step, data);
    if (problem) {
      setErrors({ [problem.field]: problem.message });
      setNotice({ tone: "bad", text: problem.message });
      window.requestAnimationFrame(() => {
        const target =
          document.getElementById(`hc-${step}-${problem.field}`) ||
          document.querySelector(".hc-page .pd-error");
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") target.focus({ preventScroll: true });
      });
      return;
    }

    setErrors({});
    setSaving(true);
    const sent = snapshot(data);

    try {
      const result = await api.saveHomeStep(step, data);
      /* উত্তর আসার ফাঁকে admin আরও কিছু বদলে থাকলে সেগুলো হারানো
         চলবে না — তখন শুধু "শেষ save" এর ছাপ বদলায় */
      setState((old) => {
        const untouched = snapshot(old.content[step]) === sent;
        return {
          ...old,
          content: { ...old.content, [step]: untouched ? result.content[step] : old.content[step] },
          saved: { ...old.saved, [step]: snapshot(result.content[step]) },
          meta: { ...old.meta, [step]: result.steps[step] },
          products: { ...old.products, ...result.products },
        };
      });
      setNotice({ tone: "ok", text: `${section.name} saved.` });
    } catch (error) {
      setNotice({ tone: "bad", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setState((old) => ({
      ...old,
      content: { ...old.content, [step]: JSON.parse(old.saved[step]) },
    }));
    setErrors({});
    setConfirmCancel(false);
    setNotice({ tone: "ok", text: "Changes discarded." });
  };

  /* ---------- বার্তা কিছুক্ষণ পরে নিজে থেকে সরে ---------- */
  useEffect(() => {
    if (!notice || notice.tone === "bad") return undefined;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  /* ---------- save না করে বেরোনো ----------
     ট্যাব বদলানো (/admin/home/…) আটকায় না — খসড়া থেকেই যায় */
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirtySteps.length > 0;
  });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirtyRef.current &&
      currentLocation.pathname !== nextLocation.pathname &&
      !nextLocation.pathname.startsWith("/admin/home"),
  );

  const anyDirty = dirtySteps.length > 0;
  useEffect(() => {
    if (!anyDirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyDirty]);

  /* ---------- Ctrl/⌘ + S ---------- */
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ছোট পর্দায় ট্যাবের সারি পাশে সরে — চালু ট্যাবটা মাঝখানে আনা,
     নাহলে ফোনে "Comparison" এ থেকেও শুধু Hero দেখা যেত */
  const tabsRef = useRef(null);
  const loaded = Boolean(state);
  useEffect(() => {
    const list = tabsRef.current;
    const active = list?.querySelector("[aria-current]");
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    const box = list.getBoundingClientRect();
    const tab = active.getBoundingClientRect();
    list.scrollTo({
      left: list.scrollLeft + (tab.left - box.left) - (box.width - tab.width) / 2,
      behavior: "smooth",
    });
  }, [slug, loaded]);

  useDocumentTitle(section ? `Home · ${section.name}` : "Home Page Content");

  /* ---------- পুরনো বা ভুল ঠিকানা ---------- */
  if (!section) {
    const moved = OLD_HOME_SLUGS[slug];
    return <Navigate to={moved ? `/admin/home/${moved}` : "/admin/home"} replace />;
  }

  const goTo = (next) => {
    setErrors({});
    setNotice(null);
    navigate(`/admin/home/${homeSections[next].slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- মাথার সারি ---------- */
  const meta = state?.meta?.[step];
  const saveState = !state
    ? ""
    : saving
      ? "Saving…"
      : dirty
        ? "Unsaved changes"
        : meta?.saved
          ? `Saved ${meta.updatedAt ? savedFormat.format(new Date(meta.updatedAt)) : ""}${
              meta.updatedBy ? ` by ${meta.updatedBy}` : ""
            }`
          : "Showing the current website content";

  const head = (
    <div className="pd-head">
      <div className="pd-head-left">
        <h1 className="pd-title">Home Page Content</h1>
        {saveState && (
          <span className={`pd-save-state${dirty ? " is-dirty" : ""}`} aria-live="polite">
            {saveState}
          </span>
        )}
      </div>
      <div className="pd-head-tools">
        <span className="adm-chip">
          <IconCalendar size={20} />
          {dayFormat.format(new Date())}
        </span>
        <AdminClock />
      </div>
    </div>
  );

  /* ---------- ট্যাবের সারি ---------- */
  const tabs = (
    <nav className="pd-card pd-steps hc-steps" aria-label="Home page sections">
      <ol ref={tabsRef}>
        {homeSections.map((item, position) => {
          const on = position === index;
          const pending = state && dirtyOf(item.step);
          const done = !on && !pending && state?.meta?.[item.step]?.saved;
          return (
            <li key={item.slug}>
              <Link
                to={`/admin/home/${item.slug}`}
                className={`pd-step${on ? " is-on" : done ? " is-done" : ""}`}
                aria-current={on ? "page" : undefined}
                onClick={() => {
                  setErrors({});
                  setNotice(null);
                }}
              >
                <span className="pd-step-num">{done ? <IconCheck size={12} /> : position + 1}</span>
                <span className="pd-step-label">{item.name}</span>
                {pending && (
                  <span className="hc-step-dot" title="Unsaved changes">
                    <span className="sr-only">(unsaved changes)</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );

  if (!state) {
    return (
      <div className="pd-page hc-page">
        {head}
        {tabs}
        {loadError ? (
          <section className="pd-card pd-empty">
            <p className="pd-empty-title">Could not load the home page content.</p>
            <p className="pd-hint">{loadError}</p>
            <button type="button" className="pd-btn pd-btn--yellow" onClick={() => setReload((n) => n + 1)}>
              Try again
            </button>
          </section>
        ) : (
          <section className="pd-card pd-loading-card" aria-busy="true">
            <span className="admin-spinner" />
          </section>
        )}
      </div>
    );
  }

  const StepView = STEP_VIEWS[step];

  return (
    <div className="pd-page hc-page">
      {head}
      {tabs}

      {notice && (
        <p
          className={`adm-banner ${notice.tone === "bad" ? "adm-banner--bad" : "adm-banner--ok"} pd-notice`}
          role={notice.tone === "bad" ? "alert" : "status"}
        >
          {notice.text}
          {notice.tone === "bad" && (
            <button type="button" className="pd-notice-x" onClick={() => setNotice(null)} aria-label="Dismiss">
              <IconClose size={14} />
            </button>
          )}
        </p>
      )}

      {!canEdit && (
        <p className="adm-banner adm-banner--bad">You can view the home page content but not change it.</p>
      )}

      <StepView
        key={step}
        data={state.content[step]}
        update={update}
        errors={errors}
        canEdit={canEdit}
        products={state.products}
        setProducts={setProducts}
      />

      <div className="pd-foot hc-foot">
        <div>
          {index > 0 && (
            <button type="button" className="pd-btn pd-btn--line hc-prev" onClick={() => goTo(index - 1)}>
              <IconArrowLeft size={14} />
              Previous
            </button>
          )}
        </div>
        {canEdit && (
          <div className="pd-foot-right">
            <button
              type="button"
              className="pd-btn pd-btn--line hc-foot-btn"
              onClick={() => setConfirmCancel(true)}
              disabled={!dirty || saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="pd-btn pd-btn--yellow hc-foot-btn hc-save"
              onClick={save}
              disabled={saving || (!dirty && meta?.saved)}
            >
              {saving ? "Saving…" : "Save Change"}
            </button>
          </div>
        )}
      </div>

      {confirmCancel && (
        <ConfirmModal
          title="Discard changes?"
          confirmLabel="Discard changes"
          cancelLabel="Keep editing"
          onClose={() => setConfirmCancel(false)}
          onConfirm={discard}
        >
          <p>Your unsaved changes on the {section.name} tab will be lost.</p>
        </ConfirmModal>
      )}

      {blocker.state === "blocked" && (
        <ConfirmModal
          title="Leave without saving?"
          confirmLabel="Leave without saving"
          cancelLabel="Stay"
          onClose={() => blocker.reset()}
          onConfirm={() => blocker.proceed()}
        >
          <p>
            These tabs have changes that are not saved yet:{" "}
            {dirtySteps.map((key) => homeSections.find((item) => item.step === key)?.name).join(", ")}.
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}

export default HomeContent;
