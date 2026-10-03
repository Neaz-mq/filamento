import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useLocaleLink } from "../i18n/useLocaleLink";
import { ProductImage } from "../components/products/ProductCard";
import {
  ArrowRight,
  CheckCircle,
  Chevron,
  PinIcon,
  ProjectIcon,
} from "../components/projects/ProjectIcons";
import {
  isResultLine,
  listSearch,
  paragraphs,
  photoSrcSet,
  photoUrl,
  projectPhotos,
  usePageTitle,
  useProjectList,
} from "./projectCatalog";
import "./ProjectDetail.css";

/* ===============================================================
   PROJECT DETAILS — /projects/:slug (Figma "Projects Details")

   Frame 355 (1408, হালকা ধূসর, radius 40):
     hero 1408 x 540 — ছবি, নিচে কালো আভা
        উপরে বাঁয়ে  ‹ ALL PROJECTS
        নিচে বাঁয়ে  [Gymnasium] 📍 Salem, OR  /  বড় নাম
        নিচে ডানে   ছোট ছবির সারি (‹ ৩টা ছবি ›) — ক্লিকে বড় ছবি বদলায়
     সংখ্যার বার 1240 x 134 (hero এর ঠিক নিচে, নিচের কোণ গোল)
     দুই কলাম, gap 32:
        বাঁয়ে 760 — 01 The Challenge · 02 The Solution · 03 The Results
        ডানে 448  — Highlights (+ বোতাম) · Products Used (+ বোতাম)
   Frame 479 — আগের / পরের project এর card (604 x 134, gap 32)

   যে অংশে কিছু লেখা নেই সেটা দেখায় না, আর ক্রমিক নম্বর (01, 02 …)
   বাকিগুলো ধরে আবার গোনা হয়
   =============================================================== */

const HERO_WIDTHS = [800, 1200, 1600, 2000];
const THUMB_WIDTHS = [200, 300];

/* ---------------------------------------------------------------
   hero এর ছোট ছবির সারি — ‹ › বা ছবিতে ক্লিক করলে বড় ছবি বদলায়.
   keyboard: ← → Home End
   --------------------------------------------------------------- */
function Gallery({ photos, active, onChange, title }) {
  const { t } = useTranslation();
  const listRef = useRef(null);

  // বাছা ছবিটা সারির ভেতরে চোখের সামনে আনা — পুরো পাতা নড়ে না
  useEffect(() => {
    const list = listRef.current;
    const thumb = list?.children[active];
    if (!list || !thumb) return;
    const left = thumb.offsetLeft - list.offsetLeft;
    const right = left + thumb.offsetWidth;
    if (left < list.scrollLeft || right > list.scrollLeft + list.clientWidth) {
      list.scrollTo({
        left: left - (list.clientWidth - thumb.offsetWidth) / 2,
        behavior: "smooth",
      });
    }
  }, [active]);

  const onKey = (event) => {
    const moves = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: photos.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(photos.length - 1, moves[event.key]));
    onChange(next);
    listRef.current?.children[next]?.querySelector("button")?.focus();
  };

  return (
    <div className="pjd-gallery">
      <button
        type="button"
        className="pjd-gallery-arrow"
        onClick={() => onChange(active - 1)}
        disabled={active === 0}
        aria-label={t("projects.detail.previousImage")}
      >
        <Chevron direction="left" size={16} />
      </button>

      <ul
        className="pjd-gallery-list"
        ref={listRef}
        aria-label={t("projects.detail.gallery")}
        onKeyDown={onKey}
      >
        {photos.map((url, index) => (
          <li key={`${url}-${index}`}>
            <button
              type="button"
              className={`pjd-thumb${index === active ? " is-active" : ""}`}
              onClick={() => onChange(index)}
              aria-pressed={index === active}
              aria-label={t("projects.detail.showImage", {
                number: index + 1,
                total: photos.length,
                name: title,
              })}
              tabIndex={index === active ? 0 : -1}
            >
              <img
                src={photoUrl(url, 300)}
                srcSet={photoSrcSet(url, THUMB_WIDTHS)}
                sizes="100px"
                alt=""
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="pjd-gallery-arrow"
        onClick={() => onChange(active + 1)}
        disabled={active === photos.length - 1}
        aria-label={t("projects.detail.nextImage")}
      >
        <Chevron direction="right" size={16} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------
   বড় ছবি — নামতে না পারলে type এর নমুনা ছবি
   --------------------------------------------------------------- */
function HeroImage({ url, fallback, alt }) {
  const [failed, setFailed] = useState("");
  const src = failed === url ? fallback : url;

  return (
    <img
      key={src}
      className="pjd-hero-image"
      src={photoUrl(src, 1600)}
      srcSet={photoSrcSet(src, HERO_WIDTHS)}
      sizes="100vw"
      alt={alt}
      fetchPriority="high"
      decoding="async"
      draggable="false"
      onError={() => {
        if (src !== fallback) setFailed(url);
      }}
    />
  );
}

/* ---------------------------------------------------------------
   01 / 02 / 03 এর একটা ধাপ — বাঁয়ে হলুদ নম্বর আর খাড়া দাগ
   --------------------------------------------------------------- */
function StoryStep({ number, title, children, id }) {
  return (
    <li className="pjd-step" aria-labelledby={id}>
      <div className="pjd-step-rail" aria-hidden="true">
        <span className="pjd-step-number">{number}</span>
        <span className="pjd-step-line" />
      </div>
      <div className="pjd-step-body">
        <h2 id={id} className="pjd-step-title">
          {title}
        </h2>
        {children}
      </div>
    </li>
  );
}

function Paragraphs({ text }) {
  return paragraphs(text).map((part, index) =>
    isResultLine(part) ? (
      <p key={index} className="pjd-text pjd-text--strong">
        {part}
      </p>
    ) : (
      <p key={index} className="pjd-text">
        {part}
      </p>
    ),
  );
}

/* ---------------------------------------------------------------
   আগের / পরের project (Figma "Frame 476/478")
   --------------------------------------------------------------- */
function NeighbourCard({ project, direction }) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const photo = projectPhotos(project)[0];
  const label = t(direction === "previous" ? "projects.detail.previous" : "projects.detail.next");

  return (
    <Link
      to={localeLink(`/projects/${project.slug || project.id}`)}
      className={`pjd-neighbour pjd-neighbour--${direction}`}
      aria-label={`${label}: ${project.title}`}
    >
      <img
        className="pjd-neighbour-image"
        src={photoUrl(photo, 300)}
        srcSet={photoSrcSet(photo, [300, 450])}
        sizes="150px"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span className="pjd-neighbour-text">
        <span className="pjd-neighbour-label">{label}</span>
        <span className="pjd-neighbour-name">{project.title}</span>
      </span>
    </Link>
  );
}

/* ---------------------------------------------------------------
   পাতা
   --------------------------------------------------------------- */
function ProjectDetail() {
  const { slug = "" } = useParams();
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const list = useProjectList();
  const ids = { challenge: useId(), solution: useId(), results: useId() };

  /* ---------- project নামানো ----------
     result.key = কোন ঠিকানার জন্য আনা. ঠিকানা বদলালে (আগের/পরের
     project) key মেলে না, তাই আগেরটা না দেখিয়ে "loading" */
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: "", status: "loading", project: null });
  const requestKey = `${slug}#${attempt}`;

  useEffect(() => {
    let alive = true;
    api
      .getProject(slug)
      .then((data) => {
        if (!alive) return;
        const project = data?.project ?? null;
        setResult({ key: requestKey, status: project ? "ready" : "missing", project });
      })
      .catch((error) => {
        if (!alive) return;
        setResult({
          key: requestKey,
          status: error?.status === 404 ? "missing" : "error",
          project: null,
        });
      });
    return () => {
      alive = false;
    };
    // requestKey এর ভেতরেই slug আছে
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const status = result.key === requestKey ? result.status : "loading";
  const project = status === "ready" ? result.project : null;

  usePageTitle(
    status === "ready"
      ? project.title
      : status === "missing"
        ? t("projects.detail.notFoundTitle")
        : t("projects.title"),
  );

  /* ---------- ছবি ---------- */
  const photos = useMemo(() => (project ? projectPhotos(project) : []), [project]);
  const fallback = useMemo(
    () => projectPhotos({ projectType: project?.projectType })[0],
    [project],
  );
  const [imageState, setImageState] = useState({ key: "", index: 0 });
  const activePhoto =
    imageState.key === project?.id ? Math.min(imageState.index, photos.length - 1) : 0;
  const showPhoto = (index) =>
    setImageState({
      key: project?.id,
      index: Math.max(0, Math.min(photos.length - 1, index)),
    });

  /* ---------- আগের / পরের — তালিকার ক্রমেই (নতুন আগে) ---------- */
  const neighbours = useMemo(() => {
    const index = list.projects.findIndex((item) => item.id === project?.id);
    if (index < 0) return { previous: null, next: null };
    return {
      previous: list.projects[index - 1] ?? null,
      next: list.projects[index + 1] ?? null,
    };
  }, [list.projects, project]);

  const allProjectsHref = localeLink(`/projects${listSearch()}`);

  /* ---------- না পেলে / ভুল হলে ---------- */
  if (status === "missing" || status === "error") {
    return (
      <section className="section pjd-message-section">
        <div className="container">
          <div className="pjd-message" role={status === "error" ? "alert" : undefined}>
            <h1>
              {t(
                status === "missing"
                  ? "projects.detail.notFoundTitle"
                  : "projects.detail.errorTitle",
              )}
            </h1>
            <p>
              {t(
                status === "missing"
                  ? "projects.detail.notFoundText"
                  : "projects.detail.errorText",
              )}
            </p>
            <div className="pjd-message-actions">
              {status === "error" && (
                <button
                  type="button"
                  className="pjd-message-button"
                  onClick={() => setAttempt((count) => count + 1)}
                >
                  {t("projects.retry")}
                </button>
              )}
              <Link to={allProjectsHref} className="pjd-message-button is-yellow">
                {t("projects.detail.browseAll")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- নামার সময় ---------- */
  if (status === "loading") {
    return (
      <section className="section pjd" aria-busy="true">
        <div className="pjd-hero is-loading">
          <span className="sr-only">{t("projects.detail.loading")}</span>
        </div>
        <div className="pjd-body">
          <div className="container pjd-skeletons" aria-hidden="true">
            <span className="pjd-skeleton pjd-skeleton--bar" />
            <span className="pjd-skeleton pjd-skeleton--text" />
            <span className="pjd-skeleton pjd-skeleton--text" />
          </div>
        </div>
      </section>
    );
  }

  /* ---------- কী কী অংশ আছে ---------- */
  const typeLabel = project.projectType
    ? t(`projects.categories.${project.projectType}`, project.projectTypeLabel)
    : "";
  const features = (project.keyFeatures ?? []).filter((item) => item.title || item.subtitle);
  const solution = (project.solution ?? []).filter((item) => item.title || item.description);
  const hasSolution = Boolean(project.solutionIntro?.trim()) || solution.length > 0;
  const steps = [
    paragraphs(project.challenge).length && "challenge",
    hasSolution && "solution",
    paragraphs(project.results).length && "results",
  ].filter(Boolean);
  const highlights = (project.highlights ?? []).filter(Boolean);
  const products = project.products ?? [];

  /* Highlights এর বোতাম — admin এর Call to Action; না থাকলে Figma র
     "Plan a similar project" → Contact */
  const cta = project.cta?.text && project.cta?.link ? project.cta : null;
  const ctaText = cta?.text ?? t("projects.detail.planSimilar");
  const ctaLink = cta?.link ?? "/contact";
  const ctaExternal = /^https?:\/\//i.test(ctaLink);

  const number = (key) => String(steps.indexOf(key) + 1).padStart(2, "0");

  return (
    <>
      <section className="section pjd">
        {/* ------------------------------ hero ------------------------------ */}
        <header className="pjd-hero">
          <HeroImage
            url={photos[activePhoto]}
            fallback={fallback}
            alt={t("projects.detail.imageAlt", {
              name: project.title,
              number: activePhoto + 1,
              total: photos.length,
            })}
          />
          <span className="pjd-hero-shade" aria-hidden="true" />

          <div className="pjd-hero-inner">
            <Link to={allProjectsHref} className="pjd-back">
              <Chevron direction="left" size={24} />
              <span>{t("projects.detail.allProjects")}</span>
            </Link>

            <div className="pjd-hero-bottom">
              <div className="pjd-hero-info">
                <div className="pjd-hero-meta">
                  {typeLabel && <span className="pjd-badge">{typeLabel}</span>}
                  {project.location && (
                    <span className="pjd-location">
                      <PinIcon />
                      <span>{project.location}</span>
                    </span>
                  )}
                </div>
                <h1 className="pjd-title">{project.title}</h1>
              </div>

              {photos.length > 1 && (
                <Gallery
                  photos={photos}
                  active={activePhoto}
                  onChange={showPhoto}
                  title={project.title}
                />
              )}
            </div>
          </div>
        </header>

        <div className="pjd-body">
          <div className="container pjd-inner">
            {/* -------------------- সংখ্যার বার (Key Features) -------------------- */}
            {features.length > 0 && (
              <ul
                className={`pjd-stats${features.length > 4 ? " is-wrap" : ""}`}
                aria-label={t("projects.detail.keyFacts")}
              >
                {features.map((feature, index) => (
                  <li key={index} className="pjd-stat">
                    <span className="pjd-stat-icon">
                      <ProjectIcon name={feature.icon} size={64} stroke={4} />
                    </span>
                    <span className="pjd-stat-text">
                      <strong>{feature.title}</strong>
                      {feature.subtitle && <span>{feature.subtitle}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className={`pjd-columns${steps.length ? "" : " is-single"}`}>
              {/* ---------------- 01 Challenge · 02 Solution · 03 Results --------------- */}
              {steps.length > 0 && (
                <ol className="pjd-story">
                  {steps.includes("challenge") && (
                    <StoryStep
                      number={number("challenge")}
                      title={t("projects.detail.challenge")}
                      id={ids.challenge}
                    >
                      <Paragraphs text={project.challenge} />
                    </StoryStep>
                  )}

                  {steps.includes("solution") && (
                    <StoryStep
                      number={number("solution")}
                      title={t("projects.detail.solution")}
                      id={ids.solution}
                    >
                      {project.solutionIntro?.trim() && (
                        <p className="pjd-text">{project.solutionIntro}</p>
                      )}
                      {solution.length > 0 && (
                        <ul className="pjd-solution">
                          {solution.map((item, index) => (
                            <li key={index} className="pjd-solution-item">
                              <span className="pjd-solution-icon">
                                <ProjectIcon name={item.icon} size={24} stroke={1.5} />
                              </span>
                              <span className="pjd-solution-text">
                                {item.title && <strong>{item.title}:</strong>}
                                {item.description && <span>{item.description}</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </StoryStep>
                  )}

                  {steps.includes("results") && (
                    <StoryStep
                      number={number("results")}
                      title={t("projects.detail.results")}
                      id={ids.results}
                    >
                      <Paragraphs text={project.results} />
                    </StoryStep>
                  )}
                </ol>
              )}

              {/* ------------------- ডানে Highlights আর Products Used ------------------- */}
              <aside className="pjd-aside">
                <section className="pjd-card" aria-label={t("projects.detail.highlights")}>
                  {highlights.length > 0 && (
                    <>
                      <h2 className="pjd-card-title">{t("projects.detail.highlights")}</h2>
                      <ul className="pjd-highlights">
                        {highlights.map((item, index) => (
                          <li key={index}>
                            <CheckCircle />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {ctaExternal ? (
                    <a
                      href={ctaLink}
                      className="pjd-cta"
                      target={cta?.newTab ? "_blank" : undefined}
                      rel={cta?.newTab ? "noopener noreferrer" : undefined}
                    >
                      {ctaText}
                      <ArrowRight />
                    </a>
                  ) : (
                    <Link
                      to={localeLink(ctaLink)}
                      className="pjd-cta"
                      target={cta?.newTab ? "_blank" : undefined}
                      rel={cta?.newTab ? "noopener noreferrer" : undefined}
                    >
                      {ctaText}
                      <ArrowRight />
                    </Link>
                  )}
                </section>

                {products.length > 0 && (
                  <section className="pjd-card pjd-card--products" aria-label={t("projects.detail.productsUsed")}>
                    <div className="pjd-card-head">
                      <h2 className="pjd-card-title">{t("projects.detail.productsUsed")}</h2>
                      <p className="pjd-card-text">{t("projects.detail.productsUsedText")}</p>
                    </div>

                    <ul className="pjd-products">
                      {products.map((item) => (
                        <li key={item.id}>
                          <Link
                            to={localeLink(`/products/${item.slug || item.id}`)}
                            className="pjd-product"
                          >
                            <span className="pjd-product-image">
                              <ProductImage
                                product={item}
                                widths={[160, 240]}
                                sizes="94px"
                              />
                            </span>
                            <span className="pjd-product-text">
                              <strong>{item.name}</strong>
                              {item.shortDescription && <span>{item.shortDescription}</span>}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    <Link to={localeLink("/products")} className="pjd-cta">
                      {t("projects.detail.viewAllProducts")}
                      <ArrowRight />
                    </Link>
                  </section>
                )}
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------- আগের / পরের project ---------------------- */}
      {(neighbours.previous || neighbours.next) && (
        <nav className="section pjd-neighbours" aria-label={t("projects.detail.moreProjects")}>
          <div className="container pjd-neighbours-row">
            {neighbours.previous ? (
              <NeighbourCard project={neighbours.previous} direction="previous" />
            ) : (
              <span className="pjd-neighbour-gap" aria-hidden="true" />
            )}
            {neighbours.next ? (
              <NeighbourCard project={neighbours.next} direction="next" />
            ) : (
              <span className="pjd-neighbour-gap" aria-hidden="true" />
            )}
          </div>
        </nav>
      )}
    </>
  );
}

export default ProjectDetail;
