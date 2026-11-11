import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProductImage } from "./products/ProductCard";
import { CATEGORIES, compareDefault, loadCatalog, splitName } from "../pages/productCatalog";
import { useLocaleLink } from "../i18n/useLocaleLink";
import "./ProductsMegaMenu.css";

/* ===============================================================
   Navbar এর "Products" mega menu — Figma (1408 x 495)

   আচরণ:
     • মাউস "Products" এর উপর নিলে (hover) বড় সাদা বাক্স নামে, আর
       পেছনের পাতা কালচে blur হয়ে যায়
     • "Products" এ ক্লিক করলে সরাসরি Products পাতায় যায় (এটা আসলে
       একটা সাধারণ link — hover শুধু বাড়তি)
     • মাউস সরে গেলে, Esc চাপলে, কালো অংশে মাউস নিলে বা কোনো link এ
       ক্লিক করলে বন্ধ
     • touch ডিভাইসে hover নেই — ট্যাপ করলে সরাসরি Products পাতায়

   বাঁয়ের ৮টা product আসে সাইটের আসল তালিকা থেকে (Products
   পাতার একই API, একই cache) — admin এ বদলালে এখানেও বদলায়.
   তালিকা নামে প্রথমবার hover/focus এ — পাতা খোলার সময় নয়.

   ডানের মেনু:
     High Bay Series — "Lamp/Fixture" category র প্রথম ৩টা product
                       (dynamic) + All Products
     Build Fixture   — category link (Products পাতা ওই category তে খোলে)
     Accessories     — category link

   শুধু বড় পর্দায় (≥1100px) — ছোট পর্দায় Navbar এর burger মেনু আছে
   =============================================================== */

const MENU_COUNT = 8;
const SERIES_COUNT = 3;

const BUILD_KEYS = ["luminaire-configurator", "reflector", "control-cap"];
const ACCESSORY_KEYS = ["lamp-accessory", "reflector-accessory", "other"];

const OPEN_DELAY = 90; // মাউস ঝট করে পাশ দিয়ে গেলে মেনু যেন ঝলক না দেয়
const CLOSE_DELAY = 180; // "Products" থেকে বাক্সে নামার পথে যেন বন্ধ না হয়

// Featured আগে, তারপর Products পাতার "Default" ক্রম — প্রথম ৮টা
const pickProducts = (list) =>
  [...list]
    .sort(
      (a, b) =>
        Number(b.featured === true) - Number(a.featured === true) || compareDefault(a, b),
    )
    .slice(0, MENU_COUNT);

// ডানের "High Bay Series" — Lamp/Fixture category র প্রথম ৩টা
const pickSeries = (list) =>
  list
    .filter((product) => product.category === "lamp-fixture")
    .sort(compareDefault)
    .slice(0, SERIES_COUNT);

const categoryLabelKey = (key) => CATEGORIES.find((category) => category.key === key)?.labelKey;

function ProductsMegaMenu({ to = "/products" }) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const { pathname } = useLocation();
  const menuId = useId();

  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ status: "idle", list: [] });

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const started = useRef(false);
  const timer = useRef(0);

  /* পাতা বদলালে বন্ধ — render এর সময় তুলনা (Navbar এর মতোই) */
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  /* তালিকা আনা — একবারই (ভুল হলে আবার চেষ্টা করা যায়) */
  const load = useCallback((force = false) => {
    if (started.current && !force) return;
    started.current = true;
    setState((previous) => ({ ...previous, status: "loading" }));
    loadCatalog({ force })
      .then((list) => setState({ status: "ready", list }))
      .catch(() => {
        started.current = false;
        setState({ status: "error", list: [] });
      });
  }, []);

  const clearTimer = () => window.clearTimeout(timer.current);

  const schedule = (value, delay) => {
    clearTimer();
    if (delay <= 0) {
      setOpen(value);
      return;
    }
    timer.current = window.setTimeout(() => setOpen(value), delay);
  };

  // unmount হলে বাকি থাকা timer বাতিল
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /* খোলা থাকলে Esc এ বন্ধ */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      if (rootRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* ---------- hover — শুধু মাউসে (touch এ ট্যাপ = সরাসরি পাতায় যাওয়া) ---------- */
  const onEnter = (event) => {
    if (event.pointerType !== "mouse") return;
    load();
    schedule(true, OPEN_DELAY);
  };

  const onLeave = (event) => {
    if (event.pointerType !== "mouse") return;
    schedule(false, CLOSE_DELAY);
  };

  /* ---------- keyboard — Tab দিয়ে "Products" এ এলে খোলে ---------- */
  const onFocus = (event) => {
    // মাউস ক্লিকের focus এ খুলবে না — শুধু keyboard এর focus-visible এ
    if (!event.target.matches?.(":focus-visible")) return;
    load();
    clearTimer();
    setOpen(true);
  };

  const onBlur = (event) => {
    if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false);
  };

  // ক্লিক = পাতায় যাওয়া. বাকি থাকা "খোলার" timer থাকলে সেটাও বাতিল
  const close = () => {
    clearTimer();
    setOpen(false);
  };

  const { status, list } = state;
  const products = useMemo(() => pickProducts(list), [list]);
  const series = useMemo(() => pickSeries(list), [list]);

  const productLink = (product) => localeLink(`/products/${product.slug || product.id}`);
  const categoryLink = (key) => localeLink(`/products?category=${key}`);

  const renderCategoryLinks = (keys) =>
    keys.map((key) => (
      <li key={key}>
        <Link to={categoryLink(key)} className="mm-link" onClick={close}>
          {t(categoryLabelKey(key))}
        </Link>
      </li>
    ));

  return (
    <div
      ref={rootRef}
      className={`mm${open ? " is-open" : ""}`}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {/* সাধারণ link — ক্লিক করলে Products পাতা */}
      <NavLink
        ref={triggerRef}
        to={localeLink(to)}
        className="mm-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={close}
      >
        {t("nav.products")}
      </NavLink>

      {/* পেছনের কালো blur — Figma "Overlay Shape". এর উপর মাউস গেলেই বন্ধ */}
      <div
        className="mm-overlay"
        aria-hidden="true"
        onPointerEnter={(event) => event.pointerType === "mouse" && schedule(false, 0)}
        onClick={close}
      />

      <div
        id={menuId}
        className="mm-panel"
        role="region"
        aria-label={t("megaMenu.label")}
        inert={!open}
        onPointerEnter={(event) => event.pointerType === "mouse" && clearTimer()}
      >
        <div className="mm-inner">
          {/* ---------- বাঁ: ৮টা product (৪ x ২) ---------- */}
          <div className="mm-products" aria-busy={status === "loading"}>
            {status === "error" && (
              <div className="mm-note" role="alert">
                <p>{t("productsPage.error")}</p>
                <button type="button" onClick={() => load(true)}>
                  {t("productsPage.retry")}
                </button>
              </div>
            )}

            {status === "ready" && products.length === 0 && (
              <div className="mm-note">
                <p>{t("productsPage.empty")}</p>
              </div>
            )}

            {(status === "idle" || status === "loading") && (
              <ul className="mm-grid" aria-hidden="true">
                {Array.from({ length: MENU_COUNT }, (_, index) => (
                  <li key={index} className="mm-skeleton" />
                ))}
              </ul>
            )}

            {status === "ready" && products.length > 0 && (
              <ul className="mm-grid">
                {products.map((product) => (
                  <li key={product.id} className="mm-card">
                    <Link to={productLink(product)} className="mm-card-link" onClick={close}>
                      <span className="mm-card-media">
                        <ProductImage product={product} widths={[160, 256, 384]} sizes="128px" />
                      </span>
                      <span className="mm-card-name">{splitName(product.name).title}</span>
                    </Link>
                    {/* আলাদা link — link এর ভেতর link বসানো যায় না */}
                    <Link to={localeLink("/contact")} className="mm-quote" onClick={close}>
                      {t("megaMenu.getQuote")}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <span className="mm-divider" aria-hidden="true" />

          {/* ---------- ডান: category মেনু ---------- */}
          <div className="mm-aside">
            <section className="mm-group">
              <h3 className="mm-group-title">{t("megaMenu.highBay")}</h3>
              <ul className="mm-links">
                {series.map((product) => (
                  <li key={product.id}>
                    <Link to={productLink(product)} className="mm-link" onClick={close}>
                      {splitName(product.name).title}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to={localeLink(to)} className="mm-link" onClick={close}>
                    {t("productsPage.categories.all")}
                  </Link>
                </li>
              </ul>
            </section>

            <section className="mm-group">
              <h3 className="mm-group-title">{t("megaMenu.buildFixture")}</h3>
              <ul className="mm-links">{renderCategoryLinks(BUILD_KEYS)}</ul>
            </section>

            <section className="mm-group">
              <h3 className="mm-group-title">{t("megaMenu.accessories")}</h3>
              <ul className="mm-links">{renderCategoryLinks(ACCESSORY_KEYS)}</ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsMegaMenu;