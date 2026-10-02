import { useEffect, useId, useState } from "react";
import { api } from "../../lib/api";
import Modal from "./Modal";
import { ProductThumb } from "./ProductLibrary";
import { AddButton } from "./SpecEditors";
import { moveItem, useSortable } from "./useSortable";
import { categoryOf, COMPONENT_STEPS, LIMITS, serial } from "./catalog";
import { getStep, missingComponents } from "./productShape";
import { IconClose, IconSearch, IconTrash } from "../icons";

/* ===============================================================
   Luminaire Configurator — Components (Specifications এর প্রথম group)

   উপরে "Default Build" — প্রতিটা ধাপের default অংশ আর মিলিয়ে
   ordering code (LA1-HK-C7). নিচে প্রতিটা ধাপের নিজের card:

     • "+ Add" — library থেকে ওই category র product বাছার modal
     • হাতল টেনে option এর ক্রম বদলানো (সাইটে এই ক্রমেই দেখাবে)
     • Code — ordering code এর অংশ
     • Default — configurator খুললে যেটা আগে থেকে বাছা থাকে
     • Required — চালু থাকলে গ্রাহককে এই ধাপে কিছু একটা বাছতেই
       হবে, আর অন্তত একটা option ছাড়া publish হবে না

   draft অংশ সাইটে দেখায় না (server সরিয়ে দেয়) — তাই এখানে
   হলুদ "Draft" চিহ্ন. library থেকে মুছে ফেলা অংশে লাল "Removed" —
   পরের save এ নিজে থেকেই বাদ পড়ে
   =============================================================== */

function PartStatus({ item }) {
  if (!item) {
    return (
      <span className="pd-status is-removed" title="This product was deleted from the library">
        <span className="pd-status-dot" aria-hidden="true" />
        Removed
      </span>
    );
  }
  if (item.status !== "published") {
    return (
      <span className="pd-status is-draft" title="Draft parts stay hidden on the website until published">
        <span className="pd-status-dot" aria-hidden="true" />
        Draft
      </span>
    );
  }
  return null;
}

/* ---------------------------------------------------------------
   Default Build — এক নজরে পুরো fixture
   --------------------------------------------------------------- */
function BuildSummary({ components }) {
  const parts = COMPONENT_STEPS.map((step) => ({
    step,
    pick: getStep(components, step).options.find((option) => option.isDefault),
  })).filter((part) => part.pick);

  const code = parts
    .map((part) => part.pick.code.trim())
    .filter(Boolean)
    .join("-");
  const missing = missingComponents(components);

  return (
    <section className="pd-card pd-spec-card pd-build">
      <div className="pd-spec-head">
        <div>
          <h3 className="pd-spec-title">Default Build</h3>
          <p className="pd-build-sub">
            What the configurator shows first. Customers can swap any part.
          </p>
        </div>
      </div>

      {parts.length ? (
        <ul className="pd-build-parts">
          {parts.map(({ step, pick }) => (
            <li key={step.key} className="pd-build-part">
              <ProductThumb image={pick.item?.image} category={step.category} size={36} />
              <span className="pd-build-text">
                <span className="pd-build-step">{step.label}</span>
                <span className="pd-build-name">{pick.item?.name ?? "Removed product"}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pd-build-empty">Add a lamp and a mounting base below to start the build.</p>
      )}

      <div className="pd-build-foot">
        <span className="pd-build-code">
          Ordering code: <strong>{code || "—"}</strong>
        </span>
        {missing.length > 0 && (
          <span className="pd-build-need">Needed to publish: {missing.join(", ")}</span>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   একটা ধাপ — Lamp, Mounting Base …
   --------------------------------------------------------------- */
function StepCard({ step, data, onChange, onAdd }) {
  const sort = useSortable((from, to) =>
    onChange((current) => ({ ...current, options: moveItem(current.options, from, to) })),
  );
  const count = data.options.length;
  const name = step.label.toLowerCase();

  const setOption = (index, change) =>
    onChange((current) => ({
      ...current,
      options: current.options.map((option, i) => (i === index ? change(option) : option)),
    }));

  const makeDefault = (index) =>
    onChange((current) => ({
      ...current,
      options: current.options.map((option, i) => ({ ...option, isDefault: i === index })),
    }));

  const remove = (index) =>
    onChange((current) => {
      const options = current.options.filter((_, i) => i !== index);
      // default টা মুছলে প্রথমটা default হয়
      if (options.length && !options.some((option) => option.isDefault)) {
        options[0] = { ...options[0], isDefault: true };
      }
      return { ...current, options };
    });

  return (
    <section className="pd-card pd-spec-card pd-part" aria-label={`${step.label} options`}>
      <div className="pd-spec-head">
        <h3 className="pd-spec-title pd-part-title">
          {step.label}
          {count > 0 && <span className="pd-part-count">{count}</span>}
        </h3>
        <div className="pd-part-actions">
          <label className="pd-switch">
            <input
              type="checkbox"
              checked={data.required}
              onChange={(event) =>
                onChange((current) => ({ ...current, required: event.target.checked }))
              }
            />
            <span className="pd-switch-track" aria-hidden="true" />
            Required
          </label>
          <AddButton onClick={onAdd} disabled={count >= LIMITS.componentOptions} />
        </div>
      </div>

      {count ? (
        <div {...sort.list} className="pd-list">
          {data.options.map((option, index) => (
            <div
              key={option.product}
              data-sort-row
              className={`pd-list-row pd-part-row ${sort.rowClass(index)}`}
            >
              <button {...sort.handle(index, count)} />
              <span className="pd-serial">{serial(index)}</span>

              <div className={`pd-part-item${option.isDefault ? " is-default" : ""}`}>
                <ProductThumb image={option.item?.image} category={step.category} size={40} />
                <span className="pd-part-text">
                  <span className="pd-part-name">{option.item?.name ?? "Removed product"}</span>
                  <PartStatus item={option.item} />
                </span>

                <input
                  className="pd-part-code"
                  value={option.code}
                  maxLength={LIMITS.componentCode}
                  placeholder="Code"
                  aria-label={`${step.label} ${index + 1} ordering code`}
                  onChange={(event) =>
                    setOption(index, (current) => ({
                      ...current,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                />

                <label className="pd-part-default">
                  <input
                    type="radio"
                    name={`pd-default-${step.key}`}
                    checked={option.isDefault}
                    onChange={() => makeDefault(index)}
                  />
                  Default
                </label>
              </div>

              <span className="pd-row-tools">
                <button
                  type="button"
                  className="pd-icon-btn pd-icon-btn--bad pd-icon-btn--sm"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${option.item?.name ?? "option"} from ${step.label}`}
                  title="Remove"
                >
                  <IconTrash size={16} />
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <button type="button" className="pd-empty-row" onClick={onAdd}>
          {data.required ? `A ${name} is required.` : `No ${name} options yet.`}{" "}
          <span>Add the first one</span>
        </button>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------
   Library থেকে বাছা — শুধু ওই ধাপের category র product. যেগুলো
   আগেই যোগ করা, সেগুলো "Added" লেখা আর বাছা যায় না
   --------------------------------------------------------------- */
function PartPicker({ step, taken, onClose, onAdd }) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState({ loading: true, items: [], error: "" });
  const [picked, setPicked] = useState([]);
  const label = categoryOf(step.category).label;

  // লেখা থামার একটু পরে খোঁজা — প্রতিটা অক্ষরে request না
  useEffect(() => {
    let live = true;
    const timer = window.setTimeout(
      () => {
        api
          .adminListProducts({ category: step.category, q: query.trim(), sort: "updated", limit: 50 })
          .then((data) => live && setResult({ loading: false, items: data.items ?? [], error: "" }))
          .catch(
            (error) =>
              live && setResult({ loading: false, items: [], error: error.message || "Could not load products." }),
          );
      },
      query ? 250 : 0,
    );
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query, step.category]);

  const toggle = (item) =>
    setPicked((current) =>
      current.some((one) => one.id === item.id)
        ? current.filter((one) => one.id !== item.id)
        : [...current, item],
    );

  return (
    <Modal
      size="md"
      onClose={onClose}
      labelledBy={titleId}
      className="pd-picker-modal"
      initialFocus=".pd-picker-search input"
      footer={
        <>
          <button type="button" className="pd-btn pd-btn--line pd-btn--lg" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="pd-btn pd-btn--yellow pd-btn--lg"
            disabled={!picked.length}
            onClick={() => onAdd(picked)}
          >
            {picked.length ? `Add ${picked.length}` : "Add"}
          </button>
        </>
      }
    >
      <div className="pd-modal-form">
        <div className="pd-modal-grey-head">
          <div>
            <h2 id={titleId} className="pd-modal-title">
              Add {step.label} Options
            </h2>
            <p className="pd-modal-sub">Choose from the {label} products in your library.</p>
          </div>
          <button type="button" className="pd-modal-x pd-modal-x--round" onClick={onClose} aria-label="Close">
            <IconClose size={18} />
          </button>
        </div>

        <label className="pd-search pd-picker-search">
          <IconSearch size={16} />
          <input
            type="search"
            value={query}
            placeholder={`Search ${label} products…`}
            aria-label={`Search ${label} products`}
            onChange={(event) => {
              setQuery(event.target.value);
              setResult((current) => ({ ...current, loading: true }));
            }}
          />
        </label>

        <div className="pd-picker-list" aria-busy={result.loading}>
          {result.loading && !result.items.length ? (
            <p className="pd-picker-note">Loading products…</p>
          ) : result.error ? (
            <p className="pd-picker-note pd-error">{result.error}</p>
          ) : !result.items.length ? (
            <p className="pd-picker-note">
              {query
                ? `No ${label} product matches “${query}”.`
                : `No ${label} products yet. Add one in the product library first.`}
            </p>
          ) : (
            result.items.map((item) => {
              const added = taken.has(item.id);
              const on = added || picked.some((one) => one.id === item.id);
              return (
                <label key={item.id} className={`pd-picker-row${added ? " is-taken" : ""}`}>
                  <input type="checkbox" checked={on} disabled={added} onChange={() => toggle(item)} />
                  <ProductThumb image={item.image} category={item.category} size={40} />
                  <span className="pd-part-text">
                    <span className="pd-part-name">{item.name}</span>
                    <span className="pd-picker-meta">
                      {item.series && <span>{item.series}</span>}
                      {item.status !== "published" && <PartStatus item={item} />}
                    </span>
                  </span>
                  {added && <span className="pd-picker-added">Added</span>}
                </label>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   মূল অংশ
   --------------------------------------------------------------- */
function ComponentsEditor({ components, onChange }) {
  const [picking, setPicking] = useState(null);

  // একটা ধাপ বদলানো — change হলো পুরনো ধাপ থেকে নতুন ধাপ
  const setStep = (step) => (change) =>
    onChange((current) => ({ ...current, [step.key]: change(getStep(current, step)) }));

  const addParts = (step, items) => {
    setStep(step)((current) => {
      const options = [
        ...current.options,
        ...items
          .filter((item) => !current.options.some((option) => option.product === item.id))
          .map((item) => ({
            product: item.id,
            code: "",
            isDefault: false,
            item: {
              id: item.id,
              name: item.name,
              category: item.category,
              status: item.status,
              image: item.image,
            },
          })),
      ].slice(0, LIMITS.componentOptions);
      if (options.length && !options.some((option) => option.isDefault)) {
        options[0] = { ...options[0], isDefault: true };
      }
      return { ...current, options };
    });
    setPicking(null);
  };

  return (
    <>
      <BuildSummary components={components} />
      {COMPONENT_STEPS.map((step) => (
        <StepCard
          key={step.key}
          step={step}
          data={getStep(components, step)}
          onChange={setStep(step)}
          onAdd={() => setPicking(step)}
        />
      ))}
      {picking && (
        <PartPicker
          step={picking}
          taken={new Set(getStep(components, picking).options.map((option) => option.product))}
          onClose={() => setPicking(null)}
          onAdd={(items) => addParts(picking, items)}
        />
      )}
    </>
  );
}

export default ComponentsEditor;
