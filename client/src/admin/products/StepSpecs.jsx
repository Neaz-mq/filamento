import { categoryOf, LIMITS } from "./catalog";
import ComponentsEditor from "./ComponentsEditor";
import { getGroup, groupDone } from "./productShape";
import { AddButton, ListEditor, TableEditor } from "./SpecEditors";
import { IconCheck } from "../icons";

/* ===============================================================
   ধাপ ২ — Specifications

   বাঁয়ে group এর তালিকা (Applications … Ballast Compat.), ডানে
   বেছে নেওয়া group এর সম্পাদক. কোন category তে কোন group, আর
   কোনটা তালিকা আর কোনটা টেবিল — সব catalog.js এ.

   বাঁ পাশের চিহ্ন:
     সবুজ ✓  — এই group এ কিছু লেখা আছে
     হলুদ ●  — এখন এটা খোলা
   =============================================================== */

const clone = (value) => JSON.parse(JSON.stringify(value));

export function SpecNav({ product, active, onPick }) {
  const groups = categoryOf(product.category).specGroups;

  return (
    <nav className="pd-card pd-spec-nav" aria-label="Specification groups">
      {groups.map((group) => {
        const on = group.id === active;
        const filled = groupDone(product, group);
        const Icon = group.Icon;
        return (
          <button
            key={group.id}
            type="button"
            className={`pd-spec-link${on ? " is-on" : ""}`}
            onClick={() => onPick(group.id)}
            aria-current={on ? "step" : undefined}
          >
            <span className="pd-spec-link-main">
              <Icon size={16} />
              {group.label}
            </span>
            {on ? (
              <span className="pd-spec-dot" aria-hidden="true" />
            ) : filled ? (
              <span className="pd-spec-done" aria-label="has content">
                <IconCheck size={8} />
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function StepSpecs({ product, setProduct, active }) {
  const group =
    categoryOf(product.category).specGroups.find((item) => item.id === active) ??
    categoryOf(product.category).specGroups[0];

  const data = getGroup(product.specs, group.id);

  // একটা group বদলানো — change হলো পুরনো group থেকে নতুন group
  const updateGroup = (change) =>
    setProduct((current) => ({
      ...current,
      specs: {
        ...current.specs,
        [group.id]: change(getGroup(current.specs, group.id)),
      },
    }));

  const setItems = (change) =>
    updateGroup((current) => ({ ...current, items: change(current.items) }));

  /* টেবিল এখনো না থাকলে নকশার ফাঁকা টেবিলটা দেখানো হয় — প্রথম
     বদলের সাথে সাথে সেটা product এ বসে যায় */
  const tablesOf = (current) =>
    current.tables.length ? current.tables : [clone(group.template)];

  const setTable = (index) => (change) =>
    updateGroup((current) => {
      const tables = tablesOf(current);
      return {
        ...current,
        tables: tables.map((table, i) => (i === index ? change(table) : table)),
      };
    });

  const tables = data.tables.length ? data.tables : [group.template];
  const title = group.title ?? group.label;

  let editor = null;

  const setDescription = (value) =>
    updateGroup((current) => ({ ...current, description: value }));

  /* Luminaire Configurator — ধাপ আর option (product.components) */
  if (group.kind === "components") {
    editor = (
      <ComponentsEditor
        components={product.components}
        onChange={(change) =>
          setProduct((current) => ({ ...current, components: change(current.components ?? {}) }))
        }
      />
    );
  }

  if (group.kind === "list") {
    editor = (
      <ListEditor
        key={group.id}
        title={title}
        items={data.items}
        columns={group.columns}
        onChange={setItems}
      />
    );
  }

  /* বিবরণ + তালিকা (Figma: Reflector এর General) — উপরে একটা
     "Short Description", নিচে সাধারণ তালিকা */
  if (group.kind === "textList") {
    const max = group.descriptionMax ?? LIMITS.groupDescription;
    editor = (
      <ListEditor
        key={group.id}
        title={title}
        items={data.items}
        columns={group.columns}
        onChange={setItems}
        slot={
          <label className="pd-field-wrap">
            <span className="pd-label">
              Short Description
              {group.descriptionRequired && <span className="pd-required"> *</span>}
            </span>
            <span className="pd-textarea-box">
              <textarea
                id={`pd-spec-${group.id}-description`}
                className="pd-textarea"
                rows={3}
                value={data.description}
                maxLength={max}
                placeholder={group.descriptionPlaceholder ?? "A few sentences about this product."}
                onChange={(event) => setDescription(event.target.value)}
              />
              <span className="pd-count">
                {data.description.length} / {max}
              </span>
            </span>
          </label>
        }
      />
    );
  }

  if (group.kind === "table") {
    editor = (
      <TableEditor
        key={group.id}
        heading={title}
        table={tables[0]}
        numbered={group.numbered}
        fixedColumns={group.fixedColumns}
        onChange={setTable(0)}
      />
    );
  }

  if (group.kind === "listTables") {
    editor = (
      <>
        <ListEditor key={group.id} title={title} items={data.items} onChange={setItems} />
        {tables.map((table, index) => (
          <TableEditor
            key={`${group.id}-${index}`}
            table={table}
            titleEditable
            showCaption
            onChange={setTable(index)}
            onRemove={
              tables.length > 1
                ? () =>
                    updateGroup((current) => ({
                      ...current,
                      tables: tablesOf(current).filter((_, i) => i !== index),
                    }))
                : undefined
            }
          />
        ))}
        {tables.length < LIMITS.tables && (
          <div className="pd-add-table">
            <AddButton
              onClick={() =>
                updateGroup((current) => ({
                  ...current,
                  tables: [
                    ...tablesOf(current),
                    { ...clone(group.template), caption: "", rows: [] },
                  ],
                }))
              }
            >
              Add Table
            </AddButton>
          </div>
        )}
      </>
    );
  }

  if (group.kind === "textTable") {
    editor = (
      <TableEditor
        key={group.id}
        heading={title}
        table={tables[0]}
        multiline={group.multiline}
        onChange={setTable(0)}
        slot={
          <label className="pd-field-wrap">
            <span className="pd-label">Short Description</span>
            <span className="pd-textarea-box">
              <textarea
                className="pd-textarea"
                rows={4}
                value={data.description}
                maxLength={LIMITS.groupDescription}
                placeholder="Explain what the table below shows."
                onChange={(event) => setDescription(event.target.value)}
              />
              <span className="pd-count">
                {data.description.length} / {LIMITS.groupDescription}
              </span>
            </span>
          </label>
        }
      />
    );
  }

  return <div className="pd-spec-editor">{editor}</div>;
}

export default StepSpecs;
