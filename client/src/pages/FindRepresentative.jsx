import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import {
  FILAMENTO,
  REGIONS,
  mapHref,
  regionOf,
  representativesFor,
  searchRepresentatives,
  telHref,
} from "./representatives";
import "./FindRepresentative.css";

/* ===============================================================
   SHOP / FIND A REPRESENTATIVE — "How to Buy" পাতা (Figma র ৩ অংশ)

     ১. Hero (Frame 285)        ধূসর card — শিরোনাম + ডানে আলোর নকশা
     ২. Directory (Frame 507)   খোঁজা + অঞ্চল ট্যাব + territory তালিকা
                                → নিচে representative card
     ৩. Direct contact          কালো card — সরাসরি Filamento

   একই পাতা দুই ঠিকানায়: /shop (navbar) আর /find-a-representative
   (footer). representative দের তথ্য representatives.js এ.

   কোন অঞ্চল / territory বাছা আর কী খোঁজা হচ্ছে — সব URL এ থাকে
   (?region=usa&territory=alabama&q=…), তাই link share করলে বা back
   চাপলে একই অবস্থা ফেরে
   =============================================================== */

const DEFAULT_REGION = "usa";
// এর চেয়ে সরু পর্দায় territory বাছার পর তালিকা গুটিয়ে result এ নামে
const COMPACT_QUERY = "(max-width: 640px)";

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

const SlidersIcon = (props) => (
  <Icon {...props}>
    <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
  </Icon>
);

/* ট্যাবের শিরোনাম — অন্য পাতাগুলোর মতোই */
function usePageMeta(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | Filamento`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/* হলুদ চৌকো + বড় হাতের লেবেল — তিন অংশেই একই */
function SectionLabel({ children, tone }) {
  return (
    <p className={`fr-label${tone ? ` is-${tone}` : ""}`}>
      <span className="fr-label-mark" aria-hidden="true" />
      {children}
    </p>
  );
}

/* ---------------------------------------------------------------
   ১. Hero — Figma "Frame 285"
   --------------------------------------------------------------- */
function Hero() {
  const { t } = useTranslation();
  const regionCount = String(REGIONS.length).padStart(2, "0");

  return (
    <section className="section fr-hero" aria-labelledby="fr-hero-title">
      <div className="container fr-hero-inner">
        <div className="fr-hero-copy">
          <SectionLabel tone="yellow">{t("findRep.hero.label")}</SectionLabel>
          <h1 id="fr-hero-title" className="fr-hero-title">
            {t("findRep.hero.title")}
          </h1>
          <p className="fr-hero-intro">
            <Trans
              i18nKey="findRep.hero.intro"
              components={{
                sales: <a href={`mailto:${FILAMENTO.email}`} />,
                phone: <a href={telHref(FILAMENTO.phoneLink)} />,
                intl: <a href={`mailto:${FILAMENTO.internationalEmail}`} />,
              }}
            />
          </p>
        </div>

        {/* Figma "Light study" — শুধু নকশা, screen reader এ পড়ার দরকার নেই */}
        <div className="fr-light" aria-hidden="true">
          <span className="fr-light-beam" />
          <span className="fr-light-halo" />
          <span className="fr-light-ring" />
          <span className="fr-light-aperture" />
          <span className="fr-light-caption">
            <span className="fr-light-caption-title">{t("findRep.hero.lightCaption")}</span>
            <span className="fr-light-caption-detail">{t("findRep.hero.lightDetail")}</span>
          </span>
          <span className="fr-light-count">
            <span className="fr-light-count-value">{regionCount}</span>
            <span className="fr-light-count-label">{t("findRep.hero.regions")}</span>
          </span>
        </div>
      </div>
    </section>
  );
}

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
   Representative card — Figma "Representative card"

   selected — বাছা territory র নিজের লোক: হলুদ border, "Selected"
   badge আর গাঢ় Email বোতাম
   --------------------------------------------------------------- */
function RepCard({ rep, location, badge, selected }) {
  const { t } = useTranslation();
  const name = rep.person ? `${rep.person}, ${rep.company}` : rep.company;

  return (
    <article className={`fr-card${selected ? " is-selected" : ""}`}>
      <div className="fr-card-head">
        <div className="fr-card-meta">
          <span className="fr-card-location">{location}</span>
          {badge && <span className="fr-card-badge">{badge}</span>}
        </div>
        <h3 className="fr-card-company">{rep.company}</h3>
        {rep.person && <p className="fr-card-person">{rep.person}</p>}
      </div>

      <span className="fr-card-divider" aria-hidden="true" />

      <ul className="fr-card-details">
        <li>
          <a href={`mailto:${rep.email}`}>
            <EmailText email={rep.email} />
          </a>
          <SmsIcon />
        </li>
        <li>
          <a href={telHref(rep.phone)}>{rep.phone}</a>
          <CallIcon />
        </li>
        <li>
          <a href={mapHref(rep.address)} target="_blank" rel="noreferrer">
            {rep.address}
            <span className="sr-only"> {t("findRep.results.opensMap")}</span>
          </a>
          <LocationIcon />
        </li>
      </ul>

      <div className="fr-card-actions">
        <a
          className={`fr-card-action${selected ? " is-primary" : ""}`}
          href={`mailto:${rep.email}`}
          aria-label={t("findRep.results.emailAria", { name })}
        >
          {t("findRep.results.email")}
          <SmsIcon />
        </a>
        <a
          className="fr-card-action"
          href={telHref(rep.phone)}
          aria-label={t("findRep.results.callAria", { name })}
        >
          {t("findRep.results.call")}
          <CallIcon />
        </a>
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
   ২. Directory — Figma "Frame 507"
   --------------------------------------------------------------- */
function Directory() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef(null);
  const tabRefs = useRef([]);

  /* URL থেকে অবস্থা — ভুল বা পুরনো মান এলে চুপচাপ default এ ফেরে */
  const region = regionOf(searchParams.get("region") ?? DEFAULT_REGION);
  const territory =
    region.territories.find((item) => item.id === searchParams.get("territory")) ??
    region.territories[0] ??
    null;
  const query = searchParams.get("q") ?? "";
  const trimmedQuery = query.trim();
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

  const searchResults = useMemo(() => searchRepresentatives(trimmedQuery), [trimmedQuery]);
  const isSearching = trimmedQuery.length > 0;

  // খোঁজার সময় যে territory তে মিল আছে — বাকিগুলো হালকা দেখায়
  const matchedTerritories = useMemo(() => {
    const ids = new Set();
    for (const result of searchResults) {
      for (const item of result.territories) ids.add(`${item.regionId}/${item.id}`);
    }
    return ids;
  }, [searchResults]);

  // হিসাব খুব হালকা (৪৭টা territory) — memo র দরকার নেই
  const nearbyResult = representativesFor(territory);

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
    const last = REGIONS.length - 1;
    const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: last };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const target = (moves[event.key] + REGIONS.length) % REGIONS.length;
    selectRegion(REGIONS[target]);
    tabRefs.current[target]?.focus();
  };

  const regionName = t(region.labelKey);
  const territoryCount = region.territories.length;

  /* ------------ result এর শিরোনাম আর card ------------ */
  let resultsTitle;
  let resultsSummary;
  let sortLabel;
  let cards;

  if (isSearching) {
    resultsTitle = t("findRep.results.searchTitle", { query: trimmedQuery });
    resultsSummary = t("findRep.results.searchCount", { count: searchResults.length });
    sortLabel = searchResults.length ? t("findRep.results.sortedName") : "";
    cards = searchResults.map(({ rep, territories }) => {
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
    sortLabel = t("findRep.results.sortedProximity");

    const parts = [
      exact.length
        ? t("findRep.results.exactCount", { count: exact.length })
        : t("findRep.results.noExact"),
    ];
    if (nearby.length) parts.push(t("findRep.results.nearbyCount", { count: nearby.length }));
    resultsSummary = parts.join(" · ");
    if (!exact.length && !nearby.length) sortLabel = "";

    cards = [
      ...(exact.length
        ? exact.map(({ rep }) => (
            <RepCard
              key={rep.email}
              rep={rep}
              location={territory.name}
              badge={t("findRep.results.selectedBadge")}
              selected
            />
          ))
        : [<FallbackCard key="filamento" region={region} location={place} />]),
      ...nearby.map(({ rep, territory: other }) => (
        <RepCard key={rep.email} rep={rep} location={other.name} />
      )),
    ];
  }

  return (
    <section className="section fr-directory" aria-labelledby="fr-directory-title">
      <div className="container fr-directory-inner">
        {/* Figma "Directory heading" */}
        <header className="fr-directory-head">
          <div className="fr-directory-copy">
            <SectionLabel>{t("findRep.directory.label")}</SectionLabel>
            <h2 id="fr-directory-title" className="fr-directory-title">
              {t("findRep.directory.title")}
            </h2>
            <p className="fr-directory-desc">{t("findRep.directory.description")}</p>
          </div>
          <p className="fr-status">
            {t("findRep.directory.status", { count: territoryCount, region: regionName })}
            <span className="fr-status-dot" aria-hidden="true" />
          </p>
        </header>

        {/* Figma "Finder controls" */}
        <div className="fr-finder">
          <div className="fr-search-row" role="search">
            <label className={`fr-search${query ? " has-query" : ""}`}>
              <SearchIcon size={18} />
              <span className="sr-only">{t("findRep.directory.searchLabel")}</span>
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
            </label>
            {query && (
              <button
                type="button"
                className="fr-search-clear"
                onClick={() => updateParams({ q: "" })}
                aria-label={t("findRep.directory.clearSearch")}
              >
                <CloseCircleIcon size={24} />
              </button>
            )}

            {/* Figma "Location selector" — territory তালিকা খোলে/গুটায় */}
            <button
              type="button"
              className={`fr-selector${panelOpen ? " is-open" : ""}`}
              aria-expanded={panelOpen}
              aria-controls="fr-territory-panel"
              onClick={() => setPanelOpen((open) => !open)}
            >
              <span className="fr-selector-copy">
                <span className="fr-selector-label">{t("findRep.directory.selectorLabel")}</span>
                <span className="fr-selector-value">
                  {territory?.name ?? t("findRep.directory.selectorNone")}
                </span>
              </span>
              <ChevronIcon size={20} />
            </button>
          </div>

          <div id="fr-territory-panel" className="fr-panel" hidden={!panelOpen}>
            {/* Figma "Region tabs" */}
            <div className="fr-tabs" role="tablist" aria-label={t("findRep.directory.regionsLabel")}>
              {REGIONS.map((item, index) => {
                const active = item.id === region.id;
                return (
                  <button
                    key={item.id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`fr-tab-${item.id}`}
                    className={`fr-tab${active ? " is-active" : ""}`}
                    aria-selected={active}
                    aria-controls="fr-territory-options"
                    tabIndex={active ? 0 : -1}
                    onClick={() => selectRegion(item)}
                    onKeyDown={(event) => onTabKeyDown(event, index)}
                  >
                    {t(item.labelKey)}
                  </button>
                );
              })}
            </div>

            {/* Figma "Location options" */}
            <div
              id="fr-territory-options"
              className="fr-options"
              role="tabpanel"
              aria-labelledby={`fr-tab-${region.id}`}
            >
              <div className="fr-options-head">
                <span>{t("findRep.directory.chooseTerritory", { region: regionName })}</span>
                <span>{t("findRep.directory.locations", { count: territoryCount })}</span>
              </div>

              {territoryCount ? (
                <ul className="fr-territories">
                  {region.territories.map((item) => {
                    const selected = item.id === territory?.id;
                    const dimmed =
                      isSearching && !matchedTerritories.has(`${item.regionId}/${item.id}`);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`fr-territory${selected ? " is-selected" : ""}${
                            dimmed ? " is-dimmed" : ""
                          }`}
                          aria-pressed={selected}
                          onClick={() => selectTerritory(item)}
                        >
                          <span className="fr-territory-dot" aria-hidden="true" />
                          {item.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="fr-options-empty">
                  {t("findRep.directory.noTerritories", { region: regionName })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Figma "Results heading" + "Representative results" */}
        <div className="fr-results" ref={resultsRef}>
          <div className="fr-results-head">
            <div className="fr-results-copy">
              <p className="fr-results-summary" aria-live="polite">
                {resultsSummary}
              </p>
              <h3 className="fr-results-title">{resultsTitle}</h3>
            </div>
            {/* শুধু Filamento র card থাকলে সাজানোর কিছু নেই */}
            {sortLabel && (
              <p className="fr-results-sort">
                {sortLabel}
                <SlidersIcon />
              </p>
            )}
          </div>

          {cards.length > 0 ? (
            <div className="fr-cards">{cards}</div>
          ) : (
            <div className="fr-empty">
              <p>{t("findRep.results.searchEmpty", { query: trimmedQuery })}</p>
              <button type="button" className="fr-empty-action" onClick={() => updateParams({ q: "" })}>
                {t("findRep.directory.clearSearch")}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   ৩. Direct contact — Figma "Direct company contact"
   --------------------------------------------------------------- */
function DirectContact() {
  const { t } = useTranslation();

  const details = [
    {
      key: "phone",
      icon: <CallIcon />,
      label: t("findRep.contact.northAmerica"),
      value: FILAMENTO.phoneDisplay,
      href: telHref(FILAMENTO.phoneLink),
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
    <section className="section fr-contact" aria-labelledby="fr-contact-title">
      <div className="container">
        <div className="fr-contact-card">
          <span className="fr-contact-glow" aria-hidden="true" />

          <div className="fr-contact-intro">
            <SectionLabel tone="yellow">{t("findRep.contact.label")}</SectionLabel>
            <h2 id="fr-contact-title" className="fr-contact-title">
              {t("findRep.contact.title")}
            </h2>
            <p className="fr-contact-desc">{t("findRep.contact.description")}</p>
            <div className="fr-contact-actions">
              <a className="fr-contact-action is-primary" href={`mailto:${FILAMENTO.email}`}>
                {t("findRep.contact.emailSales")}
                <SmsIcon />
              </a>
              <a className="fr-contact-action" href={telHref(FILAMENTO.phoneLink)}>
                {t("findRep.contact.callCompany")}
                <CallIcon />
              </a>
            </div>
          </div>

          <span className="fr-contact-divider" aria-hidden="true" />

          <ul className="fr-contact-details">
            {details.map((item) => (
              <li key={item.key} className="fr-contact-detail">
                <span className="fr-contact-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="fr-contact-detail-copy">
                  <span className="fr-contact-detail-label">{item.label}</span>
                  <a
                    className="fr-contact-detail-value"
                    href={item.href}
                    {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    {item.value}
                  </a>
                </span>
              </li>
            ))}
          </ul>

          {/* Figma "Tagline lockup" — নকশা */}
          <div className="fr-tagline" aria-hidden="true">
            <span className="fr-tagline-text">{t("findRep.contact.tagline")}</span>
            <span className="fr-tagline-ring">
              <span className="fr-tagline-core" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function FindRepresentative() {
  const { t } = useTranslation();
  usePageMeta(t("findRep.metaTitle"));

  return (
    <div className="find-rep">
      <Hero />
      <Directory />
      <DirectContact />
    </div>
  );
}

export default FindRepresentative;
