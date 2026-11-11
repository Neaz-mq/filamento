import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import SoftLink from "../components/SoftLink";
import { HOME2_PRODUCT_LINKS_LIVE } from "../lib/siteLinks";
import { ProductImage } from "../components/products/ProductCard";
import { compareDefault, loadCatalog, splitName } from "../pages/productCatalog";
import { IMAGES, cloud, srcSet } from "./data";
import { ChevronDown, DoubleChevron } from "./icons";
import "./NhProductsMenu.css";

/* ===============================================================
   Header এর "Products" dropdown — Figma র দ্বিতীয় নকশা (1280 x 416)

   মাউস "Products" এর উপর নিলে (hover) সাদা বড় বাক্স নামে, আর পেছনের
   পাতা ঝাপসা (blur) হয়ে যায় — Figma র মতো. বাক্সটা এই রকম:
     বাঁয়ে দুই কলামে ৮টা product (ছোট ছবি, নাম, ছোট বিবরণ)
     ডানে হলুদ card — ছবি, "Explore Our Lighting Solutions" আর
     "View All Product" বোতাম

   product গুলো আসে সাইটের আসল তালিকা থেকে (Products পাতার একই
   API, একই cache) — তাই admin এ product বদলালে এখানেও বদলায়.
   তালিকা নামে প্রথমবার মাউস/focus/ক্লিক এ — পাতা খোলার সময় নয়,
   তাই Home এর গতিতে কোনো প্রভাব নেই.

   বন্ধ হয়: মাউস সরে গেলে, বাইরে ক্লিক, Esc, বা কোনো link এ ক্লিক

   ক্লিকের আচরণ:
     • মাউসে ক্লিক → সরাসরি Products পাতায় (hover এ তো আগেই খুলে গেছে)
     • touch / keyboard (Enter, Space) → খোলা-বন্ধ toggle, কারণ সেখানে
       hover নেই

   বাক্স খোলা থাকলে header কে জানানো হয় (onOpenChange) — যাতে "Home"
   এর হলুদ রঙ আর দাগ সরে যায়, শুধু "Products" হলুদ থাকে

   শুধু বড় পর্দায় (≥1100px) — ছোট পর্দায় header এর burger মেনু আছে,
   সেখানে Products সরাসরি Products পাতায় যায়
   =============================================================== */

const MENU_COUNT = 8;

const OPEN_DELAY = 90; // মাউস ঝট করে পাশ দিয়ে গেলে মেনু যেন ঝলক না দেয়
const CLOSE_DELAY = 200; // "Products" থেকে বাক্সে নামার পথে যেন বন্ধ না হয়

// Featured আগে, তারপর Products পাতার "Default" ক্রম — প্রথম ৮টা
const pickProducts = (list) =>
  [...list]
    .sort(
      (a, b) =>
        Number(b.featured === true) - Number(a.featured === true) || compareDefault(a, b),
    )
    .slice(0, MENU_COUNT);

function NhProductsMenu({ productsTo = "/products", current, onOpenChange }) {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const navigate = useNavigate();
  const menuId = useId();

  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false); // একবার হাত দেওয়া হয়েছে → ছবি নামানো শুরু
  const [state, setState] = useState({ status: "idle", products: [] });

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const started = useRef(false);
  const timer = useRef(0);
  const lastPointer = useRef("mouse"); // শেষ কোন ধরনের input — mouse / touch / pen

  /* তালিকা আনা — একবারই (ভুল হলে আবার চেষ্টা করা যায়) */
  const load = useCallback((force = false) => {
    setArmed(true);
    if (started.current && !force) return;
    started.current = true;
    setState((previous) => ({ ...previous, status: "loading" }));
    loadCatalog({ force })
      .then((list) => setState({ status: "ready", products: pickProducts(list) }))
      .catch(() => {
        started.current = false;
        setState({ status: "error", products: [] });
      });
  }, []);

  const clearTimer = () => window.clearTimeout(timer.current);

  const schedule = (value, delay) => {
    clearTimer();
    timer.current = window.setTimeout(() => setOpen(value), delay);
  };

  // unmount হলে বাকি থাকা timer বাতিল
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const close = useCallback(() => {
    window.clearTimeout(timer.current);
    setOpen(false);
  }, []);

  const toggle = () => {
    clearTimer();
    if (!open) load();
    setOpen((value) => !value);
  };

  /* header কে জানানো — খোলা থাকলে "Home" এর highlight সরাতে.
     unmount এ আবার false, যেন header এ "খোলা" দাগ আটকে না থাকে */
  useEffect(() => {
    onOpenChange?.(open);
    return () => onOpenChange?.(false);
  }, [open, onOpenChange]);

  /* ---------- hover — শুধু মাউসে (touch এ hover নেই, ট্যাপ = toggle) ---------- */
  const onEnter = (event) => {
    lastPointer.current = event.pointerType;
    if (event.pointerType !== "mouse") return;
    load();
    schedule(true, OPEN_DELAY);
  };

  const onLeave = (event) => {
    if (event.pointerType !== "mouse") return;
    schedule(false, CLOSE_DELAY);
  };

  // বাক্সের ভেতরে ঢুকলে "বন্ধ করার" timer বাতিল
  const onPanelEnter = (event) => {
    if (event.pointerType === "mouse") clearTimer();
  };

  /* ক্লিক: মাউসে → Products পাতা. keyboard এ event.detail 0 থাকে, touch এ
     pointerType "touch" — এই দুই ক্ষেত্রে toggle */
  const onTriggerClick = (event) => {
    if (lastPointer.current === "mouse" && event.detail > 0) {
      close();
      navigate(localeLink(productsTo));
      return;
    }
    toggle();
  };

  /* ছোট তীরটা "Products" এর ঠিক নিচে বসানো — খোলার সময় আর পর্দা
     বদলালে মাপা হয় */
  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      const a = trigger.getBoundingClientRect();
      const b = panel.getBoundingClientRect();
      panel.style.setProperty("--pm-arrow-x", `${a.left + a.width / 2 - b.left}px`);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  /* খোলা থাকলে: বাইরে ক্লিক বা Esc এ বন্ধ */
  useEffect(() => {
    if (!open) return undefined;

    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      if (rootRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const { status, products } = state;
  const heroImage = IMAGES.productsMenu;

  return (
    <div className="nh-pm" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`nh-nav-link nh-pm-trigger${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        aria-current={current === "nav.products" ? "page" : undefined}
        onClick={onTriggerClick}
        onPointerDown={(event) => {
          lastPointer.current = event.pointerType;
        }}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onFocus={() => load()}
      >
        <span>{t("nav.products")}</span>
        <span className="nh-pm-chevron" aria-hidden="true">
          <ChevronDown size={12} />
        </span>
      </button>

      <div
        id={menuId}
        ref={panelRef}
        className={`nh-pm-panel${open ? " is-open" : ""}`}
        role="region"
        aria-label={t("home2.productsMenu.label")}
        inert={!open}
        onPointerEnter={onPanelEnter}
        onPointerLeave={onLeave}
      >
        <div className="nh-pm-box">
          <div className="nh-pm-list-wrap" aria-busy={status === "loading"}>
            {status === "error" && (
              <div className="nh-pm-note" role="alert">
                <p>{t("productsPage.error")}</p>
                <button type="button" onClick={() => load(true)}>
                  {t("productsPage.retry")}
                </button>
              </div>
            )}

            {status === "ready" && products.length === 0 && (
              <div className="nh-pm-note">
                <p>{t("productsPage.empty")}</p>
              </div>
            )}

            {(status === "idle" || status === "loading") && (
              <ul className="nh-pm-list" aria-hidden="true">
                {Array.from({ length: MENU_COUNT }, (_, index) => (
                  <li key={index} className="nh-pm-skeleton" />
                ))}
              </ul>
            )}

            {status === "ready" && products.length > 0 && (
              <ul className="nh-pm-list">
                {products.map((product) => {
                  const { title } = splitName(product.name);
                  const text = product.shortDescription || product.series || "";
                  return (
                    <li key={product.id}>
                      <SoftLink
                        to={localeLink(`/products/${product.slug || product.id}`)}
                        live={HOME2_PRODUCT_LINKS_LIVE}
                        className="nh-pm-item"
                        onClick={close}
                      >
                        <span className="nh-pm-thumb">
                          <ProductImage product={product} widths={[120, 240, 360]} sizes="69px" />
                        </span>
                        <span className="nh-pm-text">
                          <span className="nh-pm-name">{title}</span>
                          {text && <span className="nh-pm-desc">{text}</span>}
                        </span>
                      </SoftLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="nh-pm-card">
            {armed && (
              <img
                className="nh-pm-card-img"
                src={cloud(heroImage, 640)}
                srcSet={srcSet(heroImage, [320, 640, 960])}
                sizes="318px"
                alt=""
                decoding="async"
              />
            )}
            <div className="nh-pm-card-copy">
              <h3>{t("home2.productsMenu.title")}</h3>
              <p>{t("home2.productsMenu.text")}</p>
              <Link to={localeLink(productsTo)} className="nh-pm-all" onClick={close}>
                <span className="nh-pm-all-box">
                  <DoubleChevron />
                </span>
                <span>{t("home2.productsMenu.viewAll")}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* পেছনের পাতার blur — Figma র মতো. body তে বসে (portal), কারণ header
          scroll এ transform নেয়, আর transform থাকলে ভেতরের "fixed" element
          পুরো পর্দা না ঢেকে header এর মাপে আটকে যায় */}
      {createPortal(
        <div
          className={`nh-pm-overlay${open ? " is-open" : ""}`}
          aria-hidden="true"
          onClick={close}
        />,
        document.body,
      )}
    </div>
  );
}

export default NhProductsMenu;