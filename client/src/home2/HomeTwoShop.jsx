import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocaleLink } from "../i18n/useLocaleLink";
import { usePageTitle } from "../pages/projectCatalog";
import { useRegions } from "../pages/useRegions";
import {
  FILAMENTO,
  mapHref,
  regionOf,
  representativesFor,
  searchRepresentatives,
  telHref,
} from "../pages/representatives";

/* Manrope — Figma র font (HomeTwo এর মতোই, একই package) */
import "@fontsource-variable/manrope";
import "./HomeTwo.css";
import "./HomeTwoShop.css";

import NhHeader from "./NhHeader";
import NhFooter from "./NhFooter";
import { IMAGES, cloud, srcSet } from "./data";
import { ChevronRight } from "./icons";
import { useReveal } from "./motion";

/* ===============================================================
   Shop — দ্বিতীয় নকশা  /home/shop  (/ja/home/shop …)

   Figma র "Shop" frame (1440 px):
     Hero (কালো, গুদামের ছবি, breadcrumb "Home > Shop", শিরোনাম, বিবরণ)
       → Find Local Lighting Expertise (search, territory বাছাই)
       → Representatives for … (সাজানো, card এর সারি)
       → Direct contact (কালো ছবির card)
       → (পরের অংশগুলো পরে) → Footer

   মূল Shop পাতা (/shop — Find a Representative) অক্ষত — এটা তার
   পাশাপাশি দ্বিতীয় সংস্করণ. তথ্য মূল পাতার মতোই একই জায়গা থেকে:
     useRegions()  → GET /api/representatives (না চললে বাঁধা তালিকা)
     representatives.js → কাছের লোক, খোঁজা, ফোন/ঠিকানার link
   admin এর Representatives পাতায় যা বদলায় এখানেও সেটাই দেখায়.

   ঠিকানায় থাকে (মূল পাতার সাথে একই নাম, তাই link বদলাবদলি চলে):
     ?region=usa&territory=alabama&q=…&sort=company&show=nearby

   ⚠️ এখন Hero + Directory + Results + Direct contact. বাকি অংশ
   পরে এই <main> এর ভেতরে ShopContact এর নিচে বসবে.

   header আর footer Home এর (/home) থেকেই
   =============================================================== */

const DEFAULT_REGION = "usa";

/* সাজানো — ?sort=… (তালিকার প্রথমটা default, URL এ লাগে না)
   • territory বাছা থাকলে: proximity, company, person
   • খোঁজার সময় দূরত্বের মানে নেই: শুধু company, person */
const SORTS_BROWSE = ["proximity", "company", "person"];
const SORTS_SEARCH = ["company", "person"];

/* দেখানো — ?show=… ("Filters" মেনু): সব / শুধু বাছা territory র লোক / শুধু কাছের */
const SHOWS = ["all", "local", "nearby"];
const SHOW_KEY = { all: "filterAll", local: "filterLocal", nearby: "filterNearby" };

// ভাষা ধরে A–Z, বড়-ছোট হাতের ভেদ নেই
const byText = (a, b) =>
  String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" });

// এর চেয়ে সরু পর্দায় territory বাছার পর তালিকা গুটিয়ে result এ নামে
const COMPACT_QUERY = "(max-width: 639px)";

/* ---------------------------------------------------------------
   Icon — Figma র vuesax "linear" সেট (24 এর grid, stroke 1.5)
   --------------------------------------------------------------- */
function Icon({ size = 16, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const SmsIcon = (props) => (
  <Icon {...props}>
    <path d="M17 20.5H7c-3 0-5-1.5-5-5v-7c0-3.5 2-5 5-5h10c3 0 5 1.5 5 5v7c0 3.5-2 5-5 5Z" />
    <path d="m17 9-3.13 2.5c-1.03.82-2.72.82-3.75 0L7 9" />
  </Icon>
);

const CallIcon = (props) => (
  <Icon {...props}>
    <path d="M21.97 18.33c0 .36-.08.73-.25 1.09-.17.36-.39.7-.68 1.02-.49.54-1.03.93-1.64 1.18-.6.25-1.25.38-1.95.38-1.02 0-2.11-.24-3.26-.73s-2.3-1.15-3.44-1.98a28.75 28.75 0 0 1-3.28-2.8 28.42 28.42 0 0 1-2.79-3.27c-.82-1.14-1.48-2.28-1.96-3.41C2.24 8.67 2 7.58 2 6.54c0-.68.12-1.33.36-1.93.24-.61.62-1.17 1.15-1.67C4.15 2.31 4.85 2 5.59 2c.28 0 .56.06.81.18.26.12.49.3.67.56l2.32 3.27c.18.25.31.48.4.7.09.21.14.42.14.61 0 .24-.07.48-.21.71-.13.23-.32.47-.56.71l-.76.79c-.11.11-.16.24-.16.4 0 .08.01.15.03.23.03.08.06.14.08.2.18.33.49.76.93 1.28.45.52.93 1.05 1.45 1.58.54.53 1.06 1.02 1.59 1.47.52.44.95.74 1.29.92.05.02.11.05.18.08.08.03.16.04.25.04.17 0 .3-.06.41-.17l.76-.75c.25-.25.49-.44.72-.56.23-.14.46-.21.71-.21.19 0 .39.04.61.13.22.09.45.22.7.39l3.31 2.35c.26.18.44.39.55.64.1.25.16.5.16.78Z" />
  </Icon>
);

const LocationIcon = (props) => (
  <Icon {...props}>
    <path d="M12 13.43a3.12 3.12 0 1 0 0-6.24 3.12 3.12 0 0 0 0 6.24Z" />
    <path d="M3.62 8.49c1.97-8.66 14.8-8.65 16.76.01 1.15 5.08-2.01 9.38-4.78 12.04a5.19 5.19 0 0 1-7.21 0c-2.76-2.66-5.92-6.97-4.77-12.05Z" />
  </Icon>
);

const SearchIcon = (props) => (
  <Icon {...props}>
    <path d="M11.5 21a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19Z" />
    <path d="m22 22-2-2" />
  </Icon>
);

const CloseCircleIcon = (props) => (
  <Icon {...props}>
    <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10Z" />
    <path d="m9.17 14.83 5.66-5.66M14.83 14.83 9.17 9.17" />
  </Icon>
);

const ChevronIcon = (props) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

const FilterIcon = (props) => (
  <Icon {...props}>
    <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
  </Icon>
);

const CheckIcon = (props) => (
  <Icon {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

/* লম্বা email সরু card এ ভাঙলে "@" এর পরেই ভাঙে —
   "…@lightingsolutionsal.co / m" এর মতো বিশ্রী ভাঙন হয় না */
function EmailText({ email }) {
  const at = email.indexOf("@");
  if (at < 0) return email;
  return (
    <>
      {email.slice(0, at + 1)}
      <wbr />
      {email.slice(at + 1)}
    </>
  );
}

/* ---------------------------------------------------------------
   ছোট মেনু — "Sort by" আর "Filters" দুটোই এটা দিয়ে.
   বাইরে ক্লিক বা Esc এ বন্ধ, ↑ ↓ Home End এ চলা যায়, Tab দিয়ে বেরোলেও বন্ধ
   --------------------------------------------------------------- */
function ChoiceMenu({ menuLabel, options, value, onChange, children, marked }) {
  const menuId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    itemRefs.current.find((node) => node?.getAttribute("aria-checked") === "true")?.focus();

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (key) => {
    onChange(key);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" && !open) {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onItemKeyDown = (event, index) => {
    const last = options.length - 1;
    const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: last };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const target = (moves[event.key] + options.length) % options.length;
    itemRefs.current[target]?.focus();
  };

  return (
    <div
      className="nsh-menu-wrap"
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        ref={triggerRef}
        className={`nsh-fill${open ? " is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
      >
        {children}
        {marked && <span className="nsh-fill-mark" aria-hidden="true" />}
      </button>

      {open && (
        <ul id={menuId} className="nsh-menu" role="menu" aria-label={menuLabel}>
          {options.map((option, index) => {
            const active = option.key === value;
            return (
              <li key={option.key} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  className={`nsh-menu-item${active ? " is-active" : ""}`}
                  onClick={() => choose(option.key)}
                  onKeyDown={(event) => onItemKeyDown(event, index)}
                >
                  <span>{option.label}</span>
                  {active && <CheckIcon size={16} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Representative card — Figma "Representative card" (308 x 333)

   selected — বাছা territory র নিজের লোক: "Selected" badge আর হলুদ Email
   বোতাম. বাকিদের badge জায়গা নেয় কিন্তু দেখা যায় না, তাই সব card
   এর লেখা একই উচ্চতায় শুরু হয়

   admin এ ফোন বা ঠিকানা ফাঁকা রাখা যায় — তখন ওই সারি আর Call বোতাম
   বাদ যায় (ফাঁকা সারি বা কাজ না করা "tel:" link দেখায় না)
   --------------------------------------------------------------- */
function RepCard({ rep, location, badge, selected }) {
  const { t } = useTranslation();
  const name = rep.person ? `${rep.person}, ${rep.company}` : rep.company;

  return (
    <article className="nsh-card">
      <div className="nsh-card-body">
        <div className="nsh-card-head">
          <div className="nsh-card-meta">
            <span className="nsh-card-location">{location}</span>
            {badge && <span className="nsh-card-badge">{badge}</span>}
          </div>
          <div className="nsh-card-names">
            <h3 className="nsh-card-company">{rep.company}</h3>
            {rep.person && <p className="nsh-card-person">{rep.person}</p>}
          </div>
        </div>

        <span className="nsh-card-divider" aria-hidden="true" />

        <ul className="nsh-card-details">
          <li>
            <SmsIcon />
            <a href={`mailto:${rep.email}`}>
              <EmailText email={rep.email} />
            </a>
          </li>
          {rep.phone && (
            <li>
              <CallIcon />
              <a href={telHref(rep.phone)}>{rep.phone}</a>
            </li>
          )}
          {rep.address && (
            <li>
              <LocationIcon />
              <a href={mapHref(rep.address)} target="_blank" rel="noreferrer">
                {rep.address}
                <span className="nsh-sr"> {t("findRep.results.opensMap")}</span>
              </a>
            </li>
          )}
        </ul>
      </div>

      <div className="nsh-card-actions">
        <a
          className={`nsh-card-action${selected ? " is-primary" : ""}`}
          href={`mailto:${rep.email}`}
          aria-label={t("findRep.results.emailAria", { name })}
        >
          <span>{t("findRep.results.email")}</span>
          <SmsIcon size={18} />
        </a>
        {rep.phone && (
          <a
            className="nsh-card-action"
            href={telHref(rep.phone)}
            aria-label={t("findRep.results.callAria", { name })}
          >
            <span>{t("findRep.results.call")}</span>
            <CallIcon size={18} />
          </a>
        )}
      </div>
    </article>
  );
}

/* যে territory বা অঞ্চলে এখনো কেউ নেই — Filamento নিজে, একই card এর
   নকশায়. অঞ্চল অনুযায়ী ঠিক email (ইউরোপ/এশিয়া → Ella) */
function FallbackCard({ region, location }) {
  const { t } = useTranslation();
  return (
    <RepCard
      selected
      location={location}
      badge={t("findRep.results.directBadge")}
      rep={{
        company: "Filamento",
        person: t("findRep.results.fallbackPerson"),
        email: region.contactEmail,
        phone: FILAMENTO.phoneDisplay,
        address: FILAMENTO.address,
      }}
    />
  );
}

/* ---------------------------------------------------------------
   Directory + Results — Figma "Frame 2147237482" আর "Frame 2147237488"
   --------------------------------------------------------------- */
function ShopDirectory() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef(null);
  const tabRefs = useRef([]);

  /* অঞ্চল → territory → representative — server থেকে (না পারলে বাঁধা
     তালিকা). loading এ থাকলে নিচে শুধু "Loading" দেখানো হয় */
  const { regions, loading } = useRegions();

  /* URL থেকে অবস্থা — ভুল বা পুরনো মান এলে চুপচাপ default এ ফেরে */
  const region = regionOf(regions, searchParams.get("region") ?? DEFAULT_REGION);
  const territory =
    region.territories.find((item) => item.id === searchParams.get("territory")) ??
    region.territories[0] ??
    null;
  const query = searchParams.get("q") ?? "";
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  // territory তালিকা খোলা কিনা — Figma র মতো শুরুতে খোলা
  const [panelOpen, setPanelOpen] = useState(true);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    /* replace — প্রতিটা অক্ষর বা click এ history ভরে না.
       preventScrollReset — পাতা উপরে লাফিয়ে যায় না */
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };

  const searchResults = useMemo(
    () => searchRepresentatives(regions, trimmedQuery),
    [regions, trimmedQuery],
  );

  // খোঁজার সময় যে territory তে মিল আছে — বাকিগুলো হালকা দেখায়
  const matchedTerritories = useMemo(() => {
    const ids = new Set();
    for (const result of searchResults) {
      for (const item of result.territories) ids.add(`${item.regionId}/${item.id}`);
    }
    return ids;
  }, [searchResults]);

  const totalTerritories = useMemo(
    () => regions.reduce((sum, item) => sum + item.territories.length, 0),
    [regions],
  );

  // হিসাব খুব হালকা (৪৭টা territory) — memo র দরকার নেই
  const nearbyResult = representativesFor(regions, territory);

  const selectRegion = (nextRegion) => {
    updateParams({ region: nextRegion.id, territory: nextRegion.territories[0]?.id ?? "" });
  };

  const selectTerritory = (item) => {
    const compact = window.matchMedia(COMPACT_QUERY).matches;
    // অন্য territory বাছলে খোঁজা মুছে যায় — নইলে result বদলায় না
    updateParams({ territory: item.id, q: "" });
    if (compact) {
      setPanelOpen(false);
      // মোবাইলে লম্বা তালিকা পেরিয়ে result এ নামতে হত — নিজেই নামিয়ে দিই
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  /* ট্যাবে ← → Home End — ARIA tabs এর নিয়ম */
  const onTabKeyDown = (event, index) => {
    const last = regions.length - 1;
    const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: last };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const target = (moves[event.key] + regions.length) % regions.length;
    selectRegion(regions[target]);
    tabRefs.current[target]?.focus();
  };

  const regionName = t(region.labelKey);
  const territoryCount = region.territories.length;

  /* ------------ সাজানো ------------ */
  const sortOptions = isSearching ? SORTS_SEARCH : SORTS_BROWSE;
  const requestedSort = searchParams.get("sort");
  // ভুল বা এই অবস্থায় অচল মান (যেমন খোঁজার সময় proximity) → default
  const activeSort = sortOptions.includes(requestedSort) ? requestedSort : sortOptions[0];

  /* ------------ result এর শিরোনাম আর card ------------ */
  let resultsTitle;
  let resultsSummary;
  let cards;
  // সাজানোর মতো কয়টা card আছে — ১টা বা শুধু Filamento র card হলে বোতাম লুকানো
  let sortableCount;
  // "Filters" — শুধু যখন local আর nearby দুটোই আছে, নইলে বাছার কিছু নেই
  let canFilter = false;
  let activeShow = "all";

  if (isSearching) {
    resultsTitle = t("findRep.results.searchTitle", { query: trimmedQuery });
    resultsSummary = t("findRep.results.searchCount", { count: searchResults.length });

    // searchRepresentatives আগে থেকেই company অনুযায়ী সাজানো
    const ordered =
      activeSort === "person"
        ? [...searchResults].sort((a, b) => byText(a.rep.person, b.rep.person))
        : searchResults;
    sortableCount = ordered.length;

    cards = ordered.map(({ rep, territories }) => {
      const [first, ...rest] = territories;
      const location = rest.length
        ? `${first.name} ${t("findRep.results.moreTerritories", { count: rest.length })}`
        : first.name;
      return <RepCard key={rep.email} rep={rep} location={location} />;
    });
  } else {
    const place = territory?.name ?? regionName;
    const { exact, nearby } = nearbyResult;
    resultsTitle = t("findRep.results.title", { place });

    const parts = [
      exact.length
        ? t("findRep.results.exactCount", { count: exact.length })
        : t("findRep.results.noExact"),
    ];
    if (nearby.length) parts.push(t("findRep.results.nearbyCount", { count: nearby.length }));
    resultsSummary = parts.join(" · ");

    canFilter = exact.length > 0 && nearby.length > 0;
    const requestedShow = searchParams.get("show");
    activeShow = canFilter && SHOWS.includes(requestedShow) ? requestedShow : "all";

    // proximity: exact আগে, তারপর দূরত্বের ক্রমে nearby — representativesFor
    // ঠিক এই ক্রমেই দেয়, তাই এখানে কিছু করতে হয় না
    const entries = [
      ...(activeShow === "nearby"
        ? []
        : exact.map(({ rep }) => ({ rep, location: territory.name, selected: true }))),
      ...(activeShow === "local"
        ? []
        : nearby.map(({ rep, territory: other }) => ({
            rep,
            location: other.name,
            selected: false,
          }))),
    ];
    sortableCount = entries.length;

    if (activeSort !== "proximity") {
      const field = activeSort === "company" ? "company" : "person";
      entries.sort((a, b) => byText(a.rep[field], b.rep[field]));
    }

    cards = [
      // বাছা territory তে কেউ না থাকলে Filamento র card সবসময় প্রথমে
      ...(exact.length
        ? []
        : [<FallbackCard key="filamento" region={region} location={place} />]),
      ...entries.map(({ rep, location, selected }) => (
        <RepCard
          key={rep.email}
          rep={rep}
          location={location}
          {...(selected ? { badge: t("findRep.results.selectedBadge"), selected: true } : {})}
        />
      )),
    ];
  }

  const sortChoices = sortOptions.map((option) => ({
    key: option,
    label: t(`findRep.results.sortOptions.${option}`),
  }));
  const showChoices = SHOWS.map((option) => ({
    key: option,
    label: t(`home2.shop.${SHOW_KEY[option]}`),
  }));

  return (
    <section className="nsh-main" aria-labelledby="nsh-directory-title">
      <div className="nh-wrap nsh-inner">
        {/* ---------- Find Local Lighting Expertise ---------- */}
        <div className="nsh-finder">
          <div className="nsh-head">
            <h2 id="nsh-directory-title" className="nsh-title">
              {t("home2.shop.directoryTitle")}
            </h2>
            {/* সংখ্যাটা server এর তথ্য থেকে — আসার আগে দেখালে ভুল সংখ্যা ঝলকাত */}
            {!loading && (
              <p className="nsh-pill">
                <span className="nsh-dot" aria-hidden="true" />
                <span>{t("home2.shop.totalTerritories", { count: totalTerritories })}</span>
              </p>
            )}
          </div>

          {loading ? (
            <div className="nsh-loading" role="status">
              <span className="nsh-loading-dot" aria-hidden="true" />
              {t("findRep.directory.loading")}
            </div>
          ) : (
            <div className="nsh-controls">
              {/* Search Bar */}
              <div className="nsh-bar" role="search">
                <label className="nsh-search">
                  <SearchIcon size={24} />
                  <span className="nsh-sr">{t("findRep.directory.searchLabel")}</span>
                  <input
                    type="search"
                    value={query}
                    placeholder={t("findRep.directory.searchPlaceholder")}
                    onChange={(event) => updateParams({ q: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === "Escape" && query) {
                        event.preventDefault();
                        updateParams({ q: "" });
                      }
                    }}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  {query && (
                    <button
                      type="button"
                      className="nsh-search-clear"
                      onClick={() => updateParams({ q: "" })}
                      aria-label={t("findRep.directory.clearSearch")}
                    >
                      <CloseCircleIcon size={22} />
                    </button>
                  )}
                </label>

                {/* "Selected location" — territory তালিকা খোলে/গুটায় */}
                <button
                  type="button"
                  className={`nsh-selector${panelOpen ? " is-open" : ""}`}
                  aria-expanded={panelOpen}
                  aria-controls="nsh-territory-panel"
                  aria-label={`${t("findRep.directory.selectorLabel")}: ${
                    territory?.name ?? t("findRep.directory.selectorNone")
                  }`}
                  onClick={() => setPanelOpen((open) => !open)}
                >
                  <span className="nsh-selector-value">
                    {territory?.name ?? t("findRep.directory.selectorNone")}
                  </span>
                  <ChevronIcon size={16} />
                </button>
              </div>

              <div id="nsh-territory-panel" className="nsh-panel" hidden={!panelOpen}>
                {/* Region tabs */}
                <div
                  className="nsh-tabs"
                  role="tablist"
                  aria-label={t("findRep.directory.regionsLabel")}
                >
                  {regions.map((item, index) => {
                    const active = item.id === region.id;
                    return (
                      <button
                        key={item.id}
                        ref={(node) => {
                          tabRefs.current[index] = node;
                        }}
                        type="button"
                        role="tab"
                        id={`nsh-tab-${item.id}`}
                        className={`nsh-tab${active ? " is-active" : ""}`}
                        aria-selected={active}
                        aria-controls="nsh-territory-options"
                        tabIndex={active ? 0 : -1}
                        onClick={() => selectRegion(item)}
                        onKeyDown={(event) => onTabKeyDown(event, index)}
                      >
                        {t(item.labelKey)}
                      </button>
                    );
                  })}
                </div>

                {/* Location options */}
                <div
                  id="nsh-territory-options"
                  className="nsh-options"
                  role="tabpanel"
                  aria-labelledby={`nsh-tab-${region.id}`}
                >
                  <div className="nsh-options-head">
                    <h3 className="nsh-options-title">
                      {t("findRep.directory.chooseTerritory", { region: regionName })}
                    </h3>
                    <p className="nsh-pill nsh-pill--white">
                      <span className="nsh-dot" aria-hidden="true" />
                      <span>{t("findRep.directory.locations", { count: territoryCount })}</span>
                    </p>
                  </div>

                  {territoryCount ? (
                    <ul className="nsh-territories">
                      {region.territories.map((item) => {
                        const selected = item.id === territory?.id;
                        const dimmed =
                          isSearching && !matchedTerritories.has(`${item.regionId}/${item.id}`);
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              className={`nsh-territory${selected ? " is-selected" : ""}${
                                dimmed ? " is-dimmed" : ""
                              }`}
                              aria-pressed={selected}
                              onClick={() => selectTerritory(item)}
                            >
                              {item.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="nsh-options-empty">
                      {t("findRep.directory.noTerritories", { region: regionName })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---------- Representatives for … ---------- */}
        {!loading && (
          <div className="nsh-results" ref={resultsRef}>
            <div className="nsh-results-head">
              <h2 className="nsh-title">{resultsTitle}</h2>
              <p className="nsh-sr" aria-live="polite">
                {resultsSummary}
              </p>

              <div className="nsh-tools">
                {sortableCount > 1 && (
                  <div className="nsh-sort">
                    <span className="nsh-sort-caption">{t("productsPage.sort.labelColon")}</span>
                    <ChoiceMenu
                      menuLabel={t("findRep.results.sortMenuLabel")}
                      options={sortChoices}
                      value={activeSort}
                      onChange={(key) =>
                        updateParams({ sort: key === sortOptions[0] ? "" : key })
                      }
                    >
                      <span>{t(`findRep.results.sortOptions.${activeSort}`)}</span>
                      <ChevronIcon size={16} />
                    </ChoiceMenu>
                  </div>
                )}

                {canFilter && (
                  <ChoiceMenu
                    menuLabel={t("home2.shop.filterMenuLabel")}
                    options={showChoices}
                    value={activeShow}
                    marked={activeShow !== "all"}
                    onChange={(key) => updateParams({ show: key === "all" ? "" : key })}
                  >
                    <FilterIcon size={16} />
                    <span>{t("productsPage.filters.title")}</span>
                  </ChoiceMenu>
                )}
              </div>
            </div>

            {cards.length > 0 ? (
              <div className="nsh-cards">{cards}</div>
            ) : (
              <div className="nsh-empty">
                <p>{t("findRep.results.searchEmpty", { query: trimmedQuery })}</p>
                <button
                  type="button"
                  className="nsh-empty-action"
                  onClick={() => updateParams({ q: "" })}
                >
                  {t("findRep.directory.clearSearch")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Direct contact — Figma "Frame 2147228032" (1280 x 345, radius 30)
   বাঁয়ে লেখা আর দুই বোতাম, ডানে সাদা card এ Filamento র নিজের যোগাযোগ.
   তথ্য মূল পাতার মতোই representatives.js এর FILAMENTO থেকে, লেখা
   findRep.contact.* থেকে — তাই দুই পাতায় একই জিনিস বদলালেই চলে
   --------------------------------------------------------------- */
function ShopContact() {
  const { t } = useTranslation();

  const details = [
    {
      key: "phone",
      icon: <CallIcon />,
      label: t("findRep.contact.northAmerica"),
      value: FILAMENTO.phoneDisplay,
      href: `tel:${FILAMENTO.phoneLink}`,
    },
    {
      key: "email",
      icon: <SmsIcon />,
      label: t("findRep.contact.sales"),
      value: FILAMENTO.email,
      href: `mailto:${FILAMENTO.email}`,
    },
    {
      key: "address",
      icon: <LocationIcon />,
      label: t("findRep.contact.headquarters"),
      value: FILAMENTO.address,
      href: mapHref(FILAMENTO.address),
      external: true,
    },
  ];

  return (
    <section className="nsh-contact" aria-labelledby="nsh-contact-title">
      <div className="nh-wrap">
        <div className="nsh-contact-card">
          <img
            className="nsh-contact-media"
            src={cloud(IMAGES.shopContact, 1440)}
            srcSet={srcSet(IMAGES.shopContact, [720, 1080, 1440, 1920])}
            sizes="(min-width: 1360px) 1280px, 100vw"
            alt=""
            loading="lazy"
            decoding="async"
          />
          <div className="nsh-contact-shade" aria-hidden="true" />

          <div className="nsh-contact-inner">
            <div className="nsh-contact-copy">
              <div className="nsh-contact-text">
                <span className="nsh-contact-tag">{t("findRep.contact.label")}</span>
                <h2 id="nsh-contact-title" className="nsh-contact-title">
                  {t("findRep.contact.title")}
                </h2>
                <p className="nsh-contact-desc">{t("findRep.contact.description")}</p>
              </div>

              <div className="nsh-contact-actions">
                <a className="nsh-contact-action is-primary" href={`mailto:${FILAMENTO.email}`}>
                  <span>{t("findRep.contact.emailSales")}</span>
                  <SmsIcon size={18} />
                </a>
                <a className="nsh-contact-action" href={`tel:${FILAMENTO.phoneLink}`}>
                  <span>{t("findRep.contact.callCompany")}</span>
                  <CallIcon size={18} />
                </a>
              </div>
            </div>

            <ul className="nsh-contact-details">
              {details.map((item) => (
                <li key={item.key}>
                  <span className="nsh-contact-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="nsh-contact-detail">
                    <span className="nsh-contact-label">{item.label}</span>
                    <a
                      className="nsh-contact-value"
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {item.value}
                      {item.external && (
                        <span className="nsh-sr"> {t("findRep.results.opensMap")}</span>
                      )}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Hero
   --------------------------------------------------------------- */
function ShopHero() {
  const { t } = useTranslation();
  const localeLink = useLocaleLink();
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="nsh-hero" aria-labelledby="nsh-hero-title">
      <div className="nsh-hero-media" data-loaded={loaded ? "" : undefined}>
        <img
          src={cloud(IMAGES.shopHero, 1920)}
          srcSet={srcSet(IMAGES.shopHero, [960, 1440, 1920, 2560])}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </div>
      <div className="nsh-hero-shade nsh-hero-shade--top" aria-hidden="true" />
      <div className="nsh-hero-shade nsh-hero-shade--bottom" aria-hidden="true" />

      <div className="nh-wrap nsh-hero-inner">
        <nav
          className="nsh-crumb nh-hero-in"
          aria-label={t("home2.shop.breadcrumb")}
          style={{ "--d": 0 }}
        >
          <Link to={localeLink("/home")}>{t("home2.footer.nav.home")}</Link>
          <ChevronRight size={12} />
          <span aria-current="page">{t("nav.shop")}</span>
        </nav>

        <h1 id="nsh-hero-title" className="nsh-hero-title nh-hero-in" style={{ "--d": 1 }}>
          {t("home2.shop.heroTitle")}
        </h1>
        <p className="nsh-hero-text nh-hero-in" style={{ "--d": 2 }}>
          {t("home2.shop.heroText")}
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   পাতা
   --------------------------------------------------------------- */
function HomeTwoShop() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  // header কালো হবে কখন — পাতার একদম উপরের অদৃশ্য দাগটা সরলে
  const sentinelRef = useRef(null);

  usePageTitle(t("nav.shop"));

  // footer এর পর্দায়-আসার animation (Home এর মতোই)
  useReveal(rootRef);

  return (
    <div className="nh-page nsh-root" ref={rootRef}>
      <div className="nh-sentinel" ref={sentinelRef} aria-hidden="true" />
      <NhHeader
        sentinelRef={sentinelRef}
        productsTo="/home/products"
        projectsTo="/home/projects"
        shopTo="/home/shop"
        contactTo="/home#contact"
        current="nav.shop"
      />

      <main>
        <ShopHero />
        <ShopDirectory />
        <ShopContact />
      </main>

      <NhFooter homePath="/home" />
    </div>
  );
}

export default HomeTwoShop;