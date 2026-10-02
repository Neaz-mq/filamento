import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useLocaleLink } from "../i18n/useLocaleLink";
import ProductCard, { ProductImage } from "../components/products/ProductCard";
import {
  ArrowRight,
  Chevron,
  CloseIcon,
  DocIcon,
  DownloadIcon,
  ExternalIcon,
  FeatureIcon,
  LongArrow,
  PlayIcon,
} from "../components/products/ProductIcons";
import {
  COMPONENT_STEPS,
  FILTER_GROUPS,
  SPEC_GROUPS,
  categoryOf,
  compareDefault,
  humanize,
  imageSrcSet,
  optionLabel,
  sizedImage,
  splitName,
  useCatalog,
  usePageTitle,
} from "./productCatalog";
import "./ProductDetail.css";

/* ===============================================================
   PRODUCT DETAILS — /products/:slug (Figma "Product Details")

   Frame 355 (1408, padding 64 84):
     ┌──────────┬────────────────────────────────┬──────────┐
     │ ‹ (64)   │  বড় ছবি 920 x 595               │ album    │
     │          │  (পেছনে হালকা "FIXTURES")       │ 128 x 128│
     │ ↑ আগের   │                                 │ ×4, ↑ ↓  │
     │ ↓ পরের   │                                 │          │
     └──────────┼────────────────────────────────┼──────────┘
                │ নাম 46px · নিচে ছোট নাম 20px     │
                │            [Specs | Contact →] │
                │ Key features (৪টা, 96 উঁচু)      │
   Frame 551 — Full Specification | Resources & Downloads (ট্যাব)
   Frame 552 — Related products (৩টা card) + "Compare these →"

   কী কী কাজ করে:
     • ছোট বা পুরনো ঠিকানা (/products/la1-high-bay) server খুঁজে
       আসল product দেয়, পাতা ঠিকানাটা আসল slug এ বদলে নেয়
     • album এ ক্লিক বা ↑ ↓ দিয়ে বড় ছবি বদলায় (keyboard এও)
     • "Specs" চাপলে Full Specification এ নামে
     • বাঁ পাশের তালিকা থেকে একটা group, অথবা "See All" এ সব
     • ফাঁকা group, ফাঁকা টেবিল দেখায় না
     • Compare these → একটা টেবিলে এই product আর Related গুলো
       পাশাপাশি (Power, CRI, CCT …)
     • পাতা খুললে একবার view গোনা হয় ("Most Popular" এর জন্য)
   =============================================================== */

const RELATED_COUNT = 3;

/* একই product একই খোলায় দুইবার গোনা না হয় (React এর dev mode এ
   effect দুইবার চলে, আর ফিরে ফিরে এলেও) */
const countedViews = new Set();

const isNumeric = (value) => /^[\d.,]+$/.test(String(value).trim());

/* "95" → "95%", "95%" যেমন আছে */
const percent = (value) => {
  const clean = String(value ?? "").trim();
  if (!clean) return "";
  return isNumeric(clean) ? `${clean}%` : clean;
};

/* "30000" → "30,000"; ">100,000" যেমন আছে */
const hours = (value) => {
  const clean = String(value ?? "").trim();
  if (/^\d+$/.test(clean)) return Number(clean).toLocaleString("en-US");
  return clean;
};

const hasTableData = (table) =>
  Array.isArray(table?.rows) && table.rows.some((row) => row.label || row.cells?.some(Boolean));

const fileFormat = (item) => {
  const format = String(item?.format ?? "").trim();
  if (format) return format.toUpperCase();
  const match = /\.([a-z0-9]{2,5})(?:$|[?#])/i.exec(item?.url ?? "");
  return match ? match[1].toUpperCase() : "";
};

const hostName = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/* ---------------------------------------------------------------
   Specification এর group গুলো — ক্রমে, শুধু যেগুলোতে কিছু আছে
   --------------------------------------------------------------- */
function specSections(product) {
  const specs = product?.specs ?? {};
  const known = new Set(SPEC_GROUPS.map((group) => group.id));
  const unknown = Object.keys(specs)
    .filter((id) => !known.has(id))
    .map((id) => ({ id, label: humanize(id) }));

  return [...SPEC_GROUPS, ...unknown].filter((group) => {
    if (group.id === "components") {
      return Object.values(product?.components ?? {}).some((step) => step?.options?.length);
    }
    const data = specs[group.id];
    if (!data) return false;
    return (
      Boolean(data.description?.trim()) ||
      data.items?.some((item) => item?.trim()) ||
      data.tables?.some(hasTableData)
    );
  });
}

/* ---------------------------------------------------------------
   টেবিল — Figma: header #F8FAFC, ঘর 52 উঁচু, 12px, border #EBEBEC,
   radius 10. প্রথম কলাম (Watt/Type) 600
   --------------------------------------------------------------- */
function SpecTable({ table }) {
  const columns = table.columns ?? [];
  const rows = (table.rows ?? []).filter((row) => row.label || row.cells?.some(Boolean));
  const hasRowHeader = Boolean(table.rowHeader) || rows.some((row) => row.label);

  return (
    <div className="pdp-table-scroll">
      <table className="pdp-table" style={{ "--cols": columns.length + (hasRowHeader ? 1 : 0) }}>
        <thead>
          <tr>
            {hasRowHeader && <th scope="col">{table.rowHeader}</th>}
            {columns.map((column, index) => (
              <th key={index} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {hasRowHeader && <th scope="row">{row.label}</th>}
              {columns.map((_, cellIndex) => (
                <td key={cellIndex}>{row.cells?.[cellIndex] || "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Lumen Maintenance — admin এ খাড়া (প্রতি সারিতে ঘণ্টা আর %), Figma তে
   আড়াআড়ি: উপরে "Hours", তার নিচে ঘণ্টার সারি, তারপর % এর সারি */
function HoursTable({ table }) {
  const { t } = useTranslation();
  const rows = (table.rows ?? []).filter((row) => row.label || row.cells?.[0]);

  return (
    <div className="pdp-table-scroll">
      <table className="pdp-table pdp-table--hours" style={{ "--cols": rows.length }}>
        <caption className="sr-only">{table.title || t("productsPage.spec.groups.lumenMaintenance")}</caption>
        <thead>
          <tr>
            <th colSpan={rows.length} scope="colgroup">
              {t("productsPage.spec.hours")}
            </th>
          </tr>
          <tr>
            {rows.map((row, index) => (
              <th key={index} scope="col">
                {hours(row.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {rows.map((row, index) => (
              <td key={index}>{percent(row.cells?.[0]) || "—"}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Bullets({ items }) {
  const clean = (items ?? []).filter((item) => item?.trim());
  if (!clean.length) return null;
  return (
    <ul className="pdp-bullets">
      {clean.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/* Configurator এর ধাপ — প্রতিটা ধাপে কোন কোন অংশ বাছা যায় */
function ComponentsList({ components }) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

  return COMPONENT_STEPS.filter((step) => components?.[step.key]?.options?.length).map((step) => (
    <div key={step.key} className="pdp-step">
      <h4 className="pdp-sub-title">
        {t(step.labelKey)}
        {components[step.key].required && (
          <span className="pdp-badge">{t("productsPage.spec.required")}</span>
        )}
      </h4>
      <ul className="pdp-bullets">
        {components[step.key].options.map((option) => (
          <li key={option.product}>
            {option.item?.slug ? (
              <Link to={localeLink(`/products/${option.item.slug}`)} className="pdp-inline-link">
                {splitName(option.item.name).title}
              </Link>
            ) : (
              <span>{option.item?.name ?? option.code}</span>
            )}
            {option.code && <span className="pdp-code">{option.code}</span>}
            {option.isDefault && <span className="pdp-badge">{t("productsPage.spec.default")}</span>}
          </li>
        ))}
      </ul>
    </div>
  ));
}

function SpecGroup({ group, product, headingLevel = 3 }) {
  const { t } = useTranslation();
  const data = product.specs?.[group.id] ?? {};
  const Heading = `h${headingLevel}`;
  const title = group.titleKey
    ? t(group.titleKey)
    : group.labelKey
      ? t(group.labelKey)
      : group.label;
  const tables = (data.tables ?? []).filter(hasTableData);

  return (
    <section className="pdp-spec-group" aria-label={title}>
      <Heading className="pdp-spec-title">{title}</Heading>
      <div className="pdp-spec-box">
        {group.id === "components" ? (
          <ComponentsList components={product.components} />
        ) : (
          <>
            {data.description?.trim() && <p className="pdp-spec-text">{data.description}</p>}
            <Bullets items={data.items} />
            {tables.map((table, index) =>
              group.layout === "hours" ? (
                <HoursTable key={index} table={table} />
              ) : (
                <div key={index} className="pdp-table-block">
                  {(table.title || table.caption) && (
                    <h4 className="pdp-sub-title">
                      {table.title}
                      {table.caption && <span className="pdp-badge">{table.caption}</span>}
                    </h4>
                  )}
                  <SpecTable table={table} />
                </div>
              ),
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Full Specification — বাঁয়ে তালিকা (250), ডানে বাছা group বা সব
   --------------------------------------------------------------- */
function SpecPanel({ product }) {
  const { t } = useTranslation();
  const sections = useMemo(() => specSections(product), [product]);
  const [selected, setSelected] = useState(sections[0]?.id ?? "all");
  const current = sections.some((section) => section.id === selected) ? selected : "all";
  const contentRef = useRef(null);

  if (!sections.length) {
    return <p className="pdp-empty">{t("productsPage.spec.empty")}</p>;
  }

  const choose = (id) => {
    setSelected(id);
    // ফোনে তালিকা উপরে, লেখা নিচে — বাছার পর লেখাটা চোখের সামনে আনা
    const box = contentRef.current;
    if (box && box.getBoundingClientRect().top < 0) box.scrollIntoView({ block: "start" });
  };

  const navItems = [
    ...sections.map((section) => ({
      id: section.id,
      label: section.labelKey ? t(section.labelKey) : section.label,
    })),
    { id: "all", label: t("productsPage.spec.seeAll") },
  ];

  return (
    <div className="pdp-spec">
      <nav className="pdp-spec-nav" aria-label={t("productsPage.spec.navLabel")}>
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={item.id === current ? "is-active" : undefined}
                aria-pressed={item.id === current}
                onClick={() => choose(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="pdp-spec-content" ref={contentRef} aria-live="polite">
        {(current === "all"
          ? sections
          : sections.filter((section) => section.id === current)
        ).map((section) => (
          <SpecGroup key={section.id} group={section} product={product} />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Resources & Downloads — দুই কলামে ফাইলের সারি, নিচে engineer এর বাক্স
   --------------------------------------------------------------- */
function ResourcesPanel({ product }) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();

  const rows = [
    ...(product.documents ?? [])
      .filter((doc) => doc?.url)
      .map((doc, index) => ({
        key: `doc-${index}`,
        name: doc.name || t("productsPage.resources.document"),
        url: doc.url,
        format: fileFormat(doc),
        kind: "doc",
      })),
    ...(product.videos ?? [])
      .filter((video) => video?.url)
      .map((video, index) => ({
        key: `video-${index}`,
        name: video.title || t("productsPage.resources.video", { number: index + 1 }),
        url: video.url,
        format: fileFormat(video) || "MP4",
        kind: "video",
      })),
    ...(product.videoUrls ?? [])
      .filter(Boolean)
      .map((url, index) => ({
        key: `link-${index}`,
        name: t("productsPage.resources.videoLink", {
          number: index + 1,
          site: hostName(url) || "",
        }),
        url,
        format: t("productsPage.resources.link"),
        kind: "link",
      })),
  ];

  return (
    <div className="pdp-resources">
      {rows.length ? (
        <ul className="pdp-resource-list">
          {rows.map((row) => (
            <li key={row.key}>
              <a
                className="pdp-resource"
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(
                  row.kind === "link" ? "productsPage.resources.open" : "productsPage.resources.download",
                  { name: row.name, format: row.format },
                )}
              >
                <span className="pdp-resource-name">
                  <span className="pdp-resource-icon">
                    {row.kind === "doc" ? <DocIcon /> : <PlayIcon />}
                  </span>
                  <span className="pdp-resource-text">{row.name}</span>
                </span>
                <span className="pdp-resource-end">
                  {row.format && <span className="pdp-resource-format">{row.format}</span>}
                  {row.kind === "link" ? <ExternalIcon /> : <DownloadIcon />}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pdp-empty">{t("productsPage.resources.empty")}</p>
      )}

      <div className="pdp-engineer">
        <p>{t("productsPage.resources.engineerText")}</p>
        <Link to={localeLink("/contact")} className="pdp-engineer-link">
          {t("productsPage.resources.engineerLink")}
          <ArrowRight size={10} />
        </Link>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Compare — এই product আর Related গুলো পাশাপাশি. browser এর নিজের
   <dialog>: Esc এ বন্ধ, focus ভেতরেই থাকে, পেছনের পাতা ঢাকা
   --------------------------------------------------------------- */
function CompareDialog({ open, onClose, items }) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const valueOf = (product, groupKey) => {
    const group = FILTER_GROUPS.find((item) => item.key === groupKey);
    const picked = product.filters?.[groupKey] ?? [];
    const labels = group.options
      .filter((option) => picked.includes(option.value))
      .map((option) => optionLabel(t, option));
    return labels.length ? labels.join(", ") : "—";
  };

  const rows = [
    {
      key: "category",
      label: t("productsPage.compare.category"),
      value: (product) => t(categoryOf(product.category).labelKey),
    },
    {
      key: "series",
      label: t("productsPage.compare.series"),
      value: (product) => product.series || "—",
    },
    ...FILTER_GROUPS.map((group) => ({
      key: group.key,
      label: t(group.labelKey),
      value: (product) => valueOf(product, group.key),
    })),
    {
      key: "certifications",
      label: t("productsPage.compare.certifications"),
      value: (product) => (product.certifications?.length ? product.certifications.join(", ") : "—"),
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      className="pdp-compare"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // বাক্সের বাইরে (পেছনের কালো অংশে) ক্লিক করলে বন্ধ
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="pdp-compare-inner">
        <div className="pdp-compare-head">
          <h2 id={titleId}>{t("productsPage.compare.title")}</h2>
          <button
            type="button"
            className="pdp-compare-close"
            onClick={onClose}
            aria-label={t("productsPage.compare.close")}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="pdp-compare-scroll">
          <table className="pdp-compare-table">
            <thead>
              <tr>
                <td />
                {items.map((product) => (
                  <th key={product.id} scope="col">
                    <Link
                      to={localeLink(`/products/${product.slug || product.id}`)}
                      className="pdp-compare-product"
                      onClick={onClose}
                    >
                      <span className="pdp-compare-image">
                        <ProductImage product={product} widths={[240, 360]} sizes="180px" />
                      </span>
                      <span className="pdp-compare-name">{splitName(product.name).title}</span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  {items.map((product) => (
                    <td key={product.id}>{row.value(product)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </dialog>
  );
}

/* ---------------------------------------------------------------
   আগের / পরের product (Figma "Frame 371")
   --------------------------------------------------------------- */
function Neighbour({ product, direction }) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const title = splitName(product.name).title;
  const label = t(direction === "up" ? "productsPage.detail.previous" : "productsPage.detail.next");

  const image = (
    <span className="pdp-neighbour-image">
      <ProductImage product={product} widths={[240, 360]} sizes="120px" />
    </span>
  );
  const text = (
    <span className="pdp-neighbour-text">
      <LongArrow direction={direction} />
      <span className="pdp-neighbour-name">{title}</span>
    </span>
  );

  return (
    <Link
      to={localeLink(`/products/${product.slug || product.id}`)}
      className={`pdp-neighbour pdp-neighbour--${direction}`}
      aria-label={`${label}: ${title}`}
    >
      {direction === "up" ? (
        <>
          {image}
          {text}
        </>
      ) : (
        <>
          {text}
          {image}
        </>
      )}
    </Link>
  );
}

/* ---------------------------------------------------------------
   পাতা
   --------------------------------------------------------------- */
function ProductDetail() {
  const { slug = "" } = useParams();
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const navigate = useNavigate();
  const location = useLocation();
  const catalog = useCatalog();

  /* ---------- product নামানো ----------
     state.key = কোন ঠিকানার জন্য আনা. ঠিকানা বদলালে key মেলে না,
     তাই আগের product না দেখিয়ে "loading" — effect এ আলাদা করে
     loading বসাতে হয় না */
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: "", status: "loading", product: null });
  const requestKey = `${slug}#${attempt}`;
  const resolved = useRef({ key: "", product: null });

  useEffect(() => {
    // ঠিকানা আসল slug এ বদলানোর পর একই product আবার নামানোর দরকার নেই
    if (resolved.current.key === requestKey) return undefined;
    let alive = true;
    api
      .getProduct(slug)
      .then((data) => {
        if (!alive) return;
        const product = data?.product ?? null;
        if (product?.slug && product.slug !== slug) {
          const canonical = `${product.slug}#${attempt}`;
          resolved.current = { key: canonical, product };
          setResult({ key: canonical, status: "ready", product });
          navigate(
            { pathname: localeLink(`/products/${product.slug}`), search: location.search },
            { replace: true, preventScrollReset: true },
          );
          return;
        }
        resolved.current = { key: requestKey, product };
        setResult({ key: requestKey, status: product ? "ready" : "missing", product });
      })
      .catch((error) => {
        if (!alive) return;
        setResult({
          key: requestKey,
          status: error?.status === 404 ? "missing" : "error",
          product: null,
        });
      });
    return () => {
      alive = false;
    };
    // location.search, navigate, localeLink শুধু ঠিকানা বদলানোর সময় লাগে
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const status = result.key === requestKey ? result.status : "loading";
  const product = status === "ready" ? result.product : null;

  /* view গোনা — একবার, ভুল হলে চুপচাপ */
  const productId = product?.id;
  useEffect(() => {
    if (!productId || countedViews.has(productId)) return;
    countedViews.add(productId);
    api.addProductView(productId).catch(() => {});
  }, [productId]);

  const { title, subtitle } = splitName(product?.name ?? "");
  usePageTitle(
    status === "ready"
      ? title
      : status === "missing"
        ? t("productsPage.detail.notFoundTitle")
        : t("nav.products"),
  );

  /* ---------- ছবি ---------- */
  const images = useMemo(
    () => (product?.images ?? []).filter((image) => image?.url),
    [product],
  );
  const [imageState, setImageState] = useState({ key: "", index: 0 });
  const activeIndex =
    imageState.key === product?.id ? Math.min(imageState.index, Math.max(0, images.length - 1)) : 0;
  const setActiveImage = (index) =>
    setImageState({ key: product?.id, index: Math.max(0, Math.min(images.length - 1, index)) });
  const [brokenImages, setBrokenImages] = useState(() => new Set());
  const mainImage = images[activeIndex];

  const albumRef = useRef(null);
  useEffect(() => {
    const album = albumRef.current;
    const thumb = album?.children[activeIndex];
    if (!album || !thumb) return;
    // শুধু album এর ভেতরে সরে — পুরো পাতা নড়ে না
    const vertical = album.scrollHeight > album.clientHeight;
    if (vertical) {
      const top = thumb.offsetTop - album.offsetTop;
      if (top < album.scrollTop || top + thumb.offsetHeight > album.scrollTop + album.clientHeight) {
        album.scrollTo({ top: top - (album.clientHeight - thumb.offsetHeight) / 2, behavior: "smooth" });
      }
    } else {
      const left = thumb.offsetLeft - album.offsetLeft;
      if (left < album.scrollLeft || left + thumb.offsetWidth > album.scrollLeft + album.clientWidth) {
        album.scrollTo({ left: left - (album.clientWidth - thumb.offsetWidth) / 2, behavior: "smooth" });
      }
    }
  }, [activeIndex]);

  const onAlbumKey = (event) => {
    const moves = {
      ArrowDown: activeIndex + 1,
      ArrowRight: activeIndex + 1,
      ArrowUp: activeIndex - 1,
      ArrowLeft: activeIndex - 1,
      Home: 0,
      End: images.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(images.length - 1, moves[event.key]));
    setActiveImage(next);
    albumRef.current?.children[next]?.querySelector("button")?.focus();
  };

  /* ---------- তালিকা থেকে আগের/পরের আর Related ---------- */
  const catalogRow = useMemo(
    () => catalog.products.find((item) => item.id === product?.id) ?? null,
    [catalog.products, product],
  );

  const neighbours = useMemo(() => {
    if (!product) return { previous: null, next: null };
    const ordered = [...catalog.products].sort(compareDefault);
    const sameCategory = ordered.filter((item) => item.category === product.category);
    const list = sameCategory.length >= 2 ? sameCategory : ordered;
    const index = list.findIndex((item) => item.id === product.id);
    if (index < 0 || list.length < 2) return { previous: null, next: null };
    const next = list[(index + 1) % list.length];
    const previous = list[(index - 1 + list.length) % list.length];
    return { previous: previous.id === next.id ? null : previous, next };
  }, [catalog.products, product]);

  const related = useMemo(() => {
    if (!product) return [];
    return catalog.products
      .filter((item) => item.id !== product.id && item.category === product.category)
      .sort(
        (a, b) =>
          Number(Boolean(product.series) && b.series === product.series) -
            Number(Boolean(product.series) && a.series === product.series) ||
          compareDefault(a, b),
      )
      .slice(0, RELATED_COUNT);
  }, [catalog.products, product]);

  const compareItems = useMemo(() => {
    if (!product) return [];
    const self = catalogRow ?? {
      ...product,
      image: product.images?.[0]?.url ?? "",
      certifications: product.specs?.certifications?.items ?? [],
    };
    return [self, ...related];
  }, [catalogRow, product, related]);
  const [compareOpen, setCompareOpen] = useState(false);

  /* ---------- ট্যাব ---------- */
  const [tab, setTab] = useState("spec");
  const tabsId = useId();
  const tabsRef = useRef(null);
  const tabKeys = ["spec", "resources"];

  const onTabKey = (event) => {
    const index = tabKeys.indexOf(tab);
    const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabKeys.length - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = tabKeys[(moves[event.key] + tabKeys.length) % tabKeys.length];
    setTab(next);
    document.getElementById(`${tabsId}-${next}-tab`)?.focus();
  };

  const goToSpecs = () => {
    setTab("spec");
    tabsRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  /* ---------- পেছনে ফেরা — তালিকা থেকে এলে সেই filter আর পাতাতেই
     ফেরে; সরাসরি link এ এলে Products পাতায় ---------- */
  const goBack = () => {
    if (location.key !== "default" && window.history.length > 1) navigate(-1);
    else navigate(localeLink("/products"));
  };

  const category = product ? categoryOf(product.category) : null;
  const watermark = category?.watermark ?? "Fixtures";

  /* ---------- না পেলে / ভুল হলে ---------- */
  if (status === "missing" || status === "error") {
    return (
      <section className="section pdp">
        <div className="container">
          <div className="pdp-message" role={status === "error" ? "alert" : undefined}>
            <h1>
              {t(
                status === "missing"
                  ? "productsPage.detail.notFoundTitle"
                  : "productsPage.detail.errorTitle",
              )}
            </h1>
            <p>
              {t(
                status === "missing"
                  ? "productsPage.detail.notFoundText"
                  : "productsPage.detail.errorText",
              )}
            </p>
            <div className="pdp-message-actions">
              {status === "error" && (
                <button
                  type="button"
                  className="pdp-message-button"
                  onClick={() => setAttempt((count) => count + 1)}
                >
                  {t("productsPage.retry")}
                </button>
              )}
              <Link to={localeLink("/products")} className="pdp-message-button is-light">
                {t("productsPage.detail.browseAll")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const loading = status === "loading";

  return (
    <section className="section pdp" aria-busy={loading}>
      <div className="container pdp-inner">
        {/* ------------------------- উপরের অংশ ------------------------- */}
        <div className="pdp-hero">
          <button
            type="button"
            className="pdp-back"
            onClick={goBack}
            aria-label={t("productsPage.detail.back")}
          >
            <Chevron direction="left" />
          </button>

          {(neighbours.previous || neighbours.next) && (
            <nav className="pdp-neighbours" aria-label={t("productsPage.detail.moreProducts")}>
              {neighbours.previous && <Neighbour product={neighbours.previous} direction="up" />}
              {neighbours.previous && neighbours.next && (
                <span className="pdp-neighbours-line" aria-hidden="true" />
              )}
              {neighbours.next && <Neighbour product={neighbours.next} direction="down" />}
            </nav>
          )}

          <div className={`pdp-stage${loading ? " is-loading" : ""}`}>
            <span
              className="pdp-watermark"
              aria-hidden="true"
              style={{ "--chars": watermark.length }}
            >
              {watermark}
            </span>
            {!loading && (
              <div className="pdp-stage-image" key={`${product.id}-${activeIndex}`}>
                {mainImage && !brokenImages.has(mainImage.url) ? (
                  <img
                    src={sizedImage(mainImage.url, 1200)}
                    srcSet={imageSrcSet(mainImage.url, [640, 960, 1200, 1600])}
                    sizes="(max-width: 899px) 92vw, 808px"
                    alt={t("productsPage.detail.imageAlt", {
                      name: title,
                      number: activeIndex + 1,
                      total: Math.max(1, images.length),
                    })}
                    fetchPriority="high"
                    decoding="async"
                    onError={() =>
                      setBrokenImages((previous) => new Set(previous).add(mainImage.url))
                    }
                  />
                ) : (
                  <ProductImage product={{ category: product.category }} />
                )}
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="pdp-album">
              <button
                type="button"
                className="pdp-album-arrow"
                onClick={() => setActiveImage(activeIndex - 1)}
                disabled={activeIndex === 0}
                aria-label={t("productsPage.detail.previousImage")}
              >
                <Chevron direction="up" size={20} />
              </button>
              <ul
                className="pdp-album-list"
                ref={albumRef}
                aria-label={t("productsPage.detail.gallery")}
                onKeyDown={onAlbumKey}
              >
                {images.map((image, index) => (
                  <li key={`${image.url}-${index}`}>
                    <button
                      type="button"
                      className={`pdp-thumb${index === activeIndex ? " is-active" : ""}`}
                      onClick={() => setActiveImage(index)}
                      aria-pressed={index === activeIndex}
                      aria-label={t("productsPage.detail.showImage", {
                        number: index + 1,
                        total: images.length,
                      })}
                      tabIndex={index === activeIndex ? 0 : -1}
                    >
                      <ProductImage
                        product={{ image: image.url, category: product.category }}
                        widths={[160, 256]}
                        sizes="128px"
                      />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="pdp-album-arrow"
                onClick={() => setActiveImage(activeIndex + 1)}
                disabled={activeIndex === images.length - 1}
                aria-label={t("productsPage.detail.nextImage")}
              >
                <Chevron direction="down" size={20} />
              </button>
            </div>
          )}

          <div className="pdp-info">
            <div className="pdp-title-row">
              <div className="pdp-title-block">
                {loading ? (
                  <>
                    <span className="pdp-skeleton pdp-skeleton--title" />
                    <span className="pdp-skeleton pdp-skeleton--text" />
                  </>
                ) : (
                  <>
                    <h1 className="pdp-title">{title}</h1>
                    {(subtitle || product.shortDescription) && (
                      <p className="pdp-subtitle">{subtitle || product.shortDescription}</p>
                    )}
                  </>
                )}
              </div>

              <div className="pdp-actions">
                <button type="button" className="pdp-action" onClick={goToSpecs}>
                  {t("productsPage.detail.specs")}
                </button>
                <Link to={localeLink("/contact")} className="pdp-action pdp-action--primary">
                  {t("productsPage.detail.contact")}
                  <ArrowRight size={10} />
                </Link>
              </div>
            </div>

            {!loading && product.keyFeatures?.length > 0 && (
              <ul className="pdp-features" aria-label={t("productsPage.detail.featuresLabel")}>
                {product.keyFeatures.map((feature, index) => (
                  <li key={index} className="pdp-feature">
                    <FeatureIcon name={feature.icon} />
                    <span className="pdp-feature-text">
                      <strong>{feature.title}</strong>
                      {feature.subtitle && <span>{feature.subtitle}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ------------------- Specification / Resources ------------------- */}
        {!loading && (
          <div className="pdp-tabs-block" ref={tabsRef}>
            <div
              className="pdp-tabs"
              role="tablist"
              aria-label={t("productsPage.detail.tabsLabel")}
              onKeyDown={onTabKey}
            >
              {tabKeys.map((key) => (
                <button
                  key={key}
                  id={`${tabsId}-${key}-tab`}
                  type="button"
                  role="tab"
                  className={`pdp-tab${tab === key ? " is-active" : ""}`}
                  aria-selected={tab === key}
                  aria-controls={`${tabsId}-${key}-panel`}
                  tabIndex={tab === key ? 0 : -1}
                  onClick={() => setTab(key)}
                >
                  {t(key === "spec" ? "productsPage.tabs.spec" : "productsPage.tabs.resources")}
                </button>
              ))}
            </div>

            {tabKeys.map((key) => (
              <div
                key={key}
                id={`${tabsId}-${key}-panel`}
                role="tabpanel"
                aria-labelledby={`${tabsId}-${key}-tab`}
                hidden={tab !== key}
                className="pdp-tab-panel"
              >
                {tab === key &&
                  (key === "spec" ? (
                    <SpecPanel key={product.id} product={product} />
                  ) : (
                    <ResourcesPanel product={product} />
                  ))}
              </div>
            ))}
          </div>
        )}

        {/* ------------------------ Related products ------------------------ */}
        {!loading && related.length > 0 && (
          <section className="pdp-related" aria-labelledby={`${tabsId}-related`}>
            <div className="pdp-related-head">
              <div>
                <h2 id={`${tabsId}-related`} className="pdp-related-title">
                  {t("productsPage.related.title")}
                </h2>
                <p className="pdp-related-text">
                  {t("productsPage.related.text", { family: t(category.familyKey) })}
                </p>
              </div>
              <button
                type="button"
                className="pdp-compare-button"
                onClick={() => setCompareOpen(true)}
                aria-haspopup="dialog"
              >
                {t("productsPage.related.compare")}
                <ArrowRight size={10} />
              </button>
            </div>

            <ul className="pdp-related-grid">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} to={localeLink(`/products/${item.slug || item.id}`)} />
                </li>
              ))}
            </ul>

            <CompareDialog
              open={compareOpen}
              onClose={() => setCompareOpen(false)}
              items={compareItems}
            />
          </section>
        )}
      </div>
    </section>
  );
}

export default ProductDetail;
