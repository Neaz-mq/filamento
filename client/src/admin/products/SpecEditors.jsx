import { useEffect, useId, useRef } from "react";
import { moveItem, useSortable } from "./useSortable";
import { LIMITS, serial } from "./catalog";
import { IconClose, IconPencil, IconPlus, IconTrash } from "../icons";

/* ===============================================================
   Specification এর দুই রকম সম্পাদক

   ListEditor  — "01. 17,226 to 32,604 Lumens" এর মতো লাইনের তালিকা
   TableEditor — Lumen Maintenance, Amps @ Line Voltage, Ballast

   প্রতিটা ঘর সবসময় লেখার ঘর (input) — Figma তেও সেগুলো ঘরের মতো
   দেখায়. ✏️ বোতাম সেই ঘরে cursor নিয়ে যায়.

   দ্রুত লেখার জন্য:
     Enter      — ঠিক নিচে নতুন লাইন
     Backspace  — ফাঁকা লাইনে চাপলে লাইনটা মুছে উপরেরটায় যায়
   =============================================================== */

/* নতুন যোগ হওয়া ঘরে cursor — render শেষ হলে তবেই ঘরটা থাকে,
   তাই effect এ */
function useFocusLater(rootRef) {
  const pending = useRef(null);

  useEffect(() => {
    if (!pending.current || !rootRef.current) return;
    const target = rootRef.current.querySelector(pending.current);
    pending.current = null;
    if (target) {
      target.focus();
      target.select?.();
    }
  });

  return (selector) => {
    pending.current = selector;
  };
}

export function AddButton({ children = "Add", onClick, disabled }) {
  return (
    <button type="button" className="pd-add-btn" onClick={onClick} disabled={disabled}>
      <IconPlus size={14} />
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------
   তালিকা
   --------------------------------------------------------------- */
export function ListEditor({
  title,
  items,
  onChange,
  columns = 1,
  placeholder = "Type here…",
  max = LIMITS.specItems,
  maxLength = LIMITS.specItem,
  card = true,
  emptyText = "Nothing added yet.",
  slot = null,
}) {
  const rootRef = useRef(null);
  const focusLater = useFocusLater(rootRef);
  const sort = useSortable((from, to) => onChange((list) => moveItem(list, from, to)));

  const add = (at = items.length) => {
    if (items.length >= max) return;
    onChange((list) => [...list.slice(0, at), "", ...list.slice(at)]);
    focusLater(`[data-row="${at}"] input`);
  };

  const remove = (index) => {
    onChange((list) => list.filter((_, i) => i !== index));
  };

  const setAt = (index, value) =>
    onChange((list) => list.map((item, i) => (i === index ? value : item)));

  const body = (
    <>
      {items.length ? (
        <div
          {...sort.list}
          className={`pd-list${columns === 2 ? " pd-list--2" : ""}`}
        >
          {items.map((item, index) => (
            <div
              key={index}
              data-sort-row
              data-row={index}
              className={`pd-list-row ${sort.rowClass(index)}`}
            >
              <button {...sort.handle(index, items.length)} />
              <span className="pd-serial">{serial(index)}</span>
              <input
                className="pd-field"
                value={item}
                maxLength={maxLength}
                placeholder={placeholder}
                aria-label={`${title} ${index + 1}`}
                onChange={(event) => setAt(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    add(index + 1);
                  } else if (event.key === "Backspace" && !item && items.length > 0) {
                    event.preventDefault();
                    remove(index);
                    if (index > 0) focusLater(`[data-row="${index - 1}"] input`);
                  }
                }}
              />
              <span className="pd-row-tools">
                <button
                  type="button"
                  className="pd-icon-btn pd-icon-btn--bad pd-icon-btn--sm"
                  onClick={() => remove(index)}
                  aria-label={`Delete ${title} ${index + 1}`}
                  title="Delete"
                >
                  <IconTrash size={16} />
                </button>
                <button
                  type="button"
                  className="pd-icon-btn pd-icon-btn--sm"
                  onClick={(event) =>
                    event.currentTarget.closest("[data-row]")?.querySelector("input")?.focus()
                  }
                  aria-label={`Edit ${title} ${index + 1}`}
                  title="Edit"
                >
                  <IconPencil size={16} />
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <button type="button" className="pd-empty-row" onClick={() => add()}>
          {emptyText} <span>Add the first one</span>
        </button>
      )}
    </>
  );

  if (!card) {
    return <div ref={rootRef}>{body}</div>;
  }

  return (
    <section className="pd-card pd-spec-card" ref={rootRef}>
      <div className="pd-spec-head">
        <h3 className="pd-spec-title">{title}</h3>
        <AddButton onClick={() => add()} disabled={items.length >= max} />
      </div>
      {slot}
      {body}
    </section>
  );
}

/* ---------------------------------------------------------------
   টেবিল

   table = { title, caption, rowHeader, columns: [..], rows: [{ label, cells }] }

   numbered      — সারির আগে 01. 02. (Lumen Maintenance)
   fixedColumns  — কলাম যোগ/বাদ বন্ধ (Lumen এ শুধু দুইটা কলাম)
   multiline     — ঘরে একাধিক লাইন (Ballast: M98 / M110 / M143)
   titleEditable — শিরোনাম বদলানো যায় (Electrical এর টেবিল)
   showCaption   — শিরোনামের নিচের ধূসর পট্টি (VS / V4)
   onRemove      — পুরো টেবিল মোছা
   slot          — শিরোনাম আর টেবিলের মাঝখানে কিছু (Ballast এর বিবরণ)
   --------------------------------------------------------------- */
const blankRow = (table) => ({
  label: "",
  cells: table.columns.map(() => ""),
});

export function TableEditor({
  table,
  onChange,
  heading,
  numbered = false,
  fixedColumns = false,
  multiline = false,
  titleEditable = false,
  showCaption = false,
  onRemove,
  slot,
}) {
  const rootRef = useRef(null);
  const headingId = useId();
  const focusLater = useFocusLater(rootRef);
  const sort = useSortable((from, to) =>
    onChange((current) => ({ ...current, rows: moveItem(current.rows, from, to) })),
  );

  const columnCount = table.columns.length;

  const addRow = (at = table.rows.length) => {
    if (table.rows.length >= LIMITS.rows) return;
    onChange((current) => ({
      ...current,
      rows: [...current.rows.slice(0, at), blankRow(current), ...current.rows.slice(at)],
    }));
    focusLater(`[data-row="${at}"] [data-cell="label"]`);
  };

  const addColumn = () => {
    if (columnCount >= LIMITS.columns) return;
    onChange((current) => ({
      ...current,
      columns: [...current.columns, "New"],
      rows: current.rows.map((row) => ({ ...row, cells: [...row.cells, ""] })),
    }));
    focusLater(`[data-col="${columnCount}"]`);
  };

  const removeColumn = (index) => {
    const used = table.rows.some((row) => row.cells[index]?.trim());
    if (
      used &&
      !window.confirm(`Delete the “${table.columns[index]}” column and its values?`)
    ) {
      return;
    }
    onChange((current) => ({
      ...current,
      columns: current.columns.filter((_, i) => i !== index),
      rows: current.rows.map((row) => ({
        ...row,
        cells: row.cells.filter((_, i) => i !== index),
      })),
    }));
  };

  const setField = (field, value) =>
    onChange((current) => ({ ...current, [field]: value }));

  const setColumn = (index, value) =>
    onChange((current) => ({
      ...current,
      columns: current.columns.map((column, i) => (i === index ? value : column)),
    }));

  const setCell = (rowIndex, cellIndex, value) =>
    onChange((current) => ({
      ...current,
      rows: current.rows.map((row, i) =>
        i !== rowIndex
          ? row
          : cellIndex === -1
            ? { ...row, label: value }
            : {
                ...row,
                cells: row.cells.map((cell, c) => (c === cellIndex ? value : cell)),
              },
      ),
    }));

  const removeRow = (index) =>
    onChange((current) => ({
      ...current,
      rows: current.rows.filter((_, i) => i !== index),
    }));

  // গ্রিডের কলাম: হাতল | প্রথম কলাম | মানগুলো | Action
  const template = `28px minmax(96px, 1.15fr) repeat(${columnCount}, minmax(78px, 1fr)) 60px`;
  const minWidth = 28 + 96 + columnCount * 78 + 60 + (columnCount + 2) * 8;

  const Cell = multiline ? "textarea" : "input";
  const cellProps = (value) =>
    multiline ? { rows: Math.max(1, value.split("\n").length) } : {};

  return (
    <section className="pd-card pd-spec-card" ref={rootRef} aria-labelledby={headingId}>
      <div className="pd-spec-head">
        {titleEditable ? (
          <input
            id={headingId}
            className="pd-title-input"
            value={table.title}
            maxLength={80}
            placeholder="Table title"
            aria-label="Table title"
            onChange={(event) => setField("title", event.target.value)}
          />
        ) : (
          <h3 id={headingId} className="pd-spec-title">
            {heading ?? table.title}
          </h3>
        )}
        <span className="pd-spec-actions">
          <AddButton onClick={() => addRow()} disabled={table.rows.length >= LIMITS.rows}>
            Add Row
          </AddButton>
          {!fixedColumns && (
            <AddButton onClick={addColumn} disabled={columnCount >= LIMITS.columns}>
              Add Column
            </AddButton>
          )}
          {onRemove && (
            <button
              type="button"
              className="pd-icon-btn pd-icon-btn--bad"
              onClick={onRemove}
              aria-label="Delete this table"
              title="Delete table"
            >
              <IconTrash size={16} />
            </button>
          )}
        </span>
      </div>

      {slot}

      <div className="pd-grid-scroll">
        <div className="pd-grid" style={{ minWidth }}>
          {showCaption && (
            <div className="pd-grid-caption">
              <input
                value={table.caption}
                maxLength={40}
                placeholder="Group (e.g. VS)"
                aria-label="Table group label"
                onChange={(event) => setField("caption", event.target.value)}
              />
            </div>
          )}

          {!showCaption && table.title && heading && heading !== table.title && (
            <div className="pd-grid-caption pd-grid-caption--static">{table.title}</div>
          )}

          <div className="pd-grid-head" style={{ gridTemplateColumns: template }}>
            <span />
            <input
              className="pd-head-input"
              value={table.rowHeader}
              maxLength={40}
              aria-label="First column name"
              onChange={(event) => setField("rowHeader", event.target.value)}
            />
            {table.columns.map((column, index) => (
              <span className="pd-head-cell" key={index}>
                <input
                  className="pd-head-input"
                  data-col={index}
                  value={column}
                  maxLength={40}
                  aria-label={`Column ${index + 1} name`}
                  readOnly={fixedColumns}
                  onChange={(event) => setColumn(index, event.target.value)}
                />
                {!fixedColumns && columnCount > 1 && (
                  <button
                    type="button"
                    className="pd-col-x"
                    onClick={() => removeColumn(index)}
                    aria-label={`Delete column ${column || index + 1}`}
                    title="Delete column"
                  >
                    <IconClose size={12} />
                  </button>
                )}
              </span>
            ))}
            <span className="pd-head-action">Action</span>
          </div>

          {table.rows.length ? (
            <div {...sort.list} className="pd-grid-body">
              {table.rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  data-sort-row
                  data-row={rowIndex}
                  className={`pd-grid-row ${sort.rowClass(rowIndex)}`}
                  style={{ gridTemplateColumns: template }}
                >
                  <button {...sort.handle(rowIndex, table.rows.length)} />
                  <span className="pd-grid-label">
                    {numbered && <span className="pd-serial">{serial(rowIndex)}</span>}
                    <input
                      className="pd-cell pd-cell--label"
                      data-cell="label"
                      value={row.label}
                      maxLength={60}
                      aria-label={`Row ${rowIndex + 1} ${table.rowHeader || "name"}`}
                      onChange={(event) => setCell(rowIndex, -1, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addRow(rowIndex + 1);
                        }
                      }}
                    />
                  </span>
                  {row.cells.map((cell, cellIndex) => (
                    <Cell
                      key={cellIndex}
                      className="pd-cell"
                      value={cell}
                      maxLength={LIMITS.cell}
                      aria-label={`Row ${rowIndex + 1}, ${table.columns[cellIndex] || `column ${cellIndex + 1}`}`}
                      onChange={(event) => setCell(rowIndex, cellIndex, event.target.value)}
                      {...cellProps(cell)}
                    />
                  ))}
                  <span className="pd-row-tools">
                    <button
                      type="button"
                      className="pd-icon-btn pd-icon-btn--bad pd-icon-btn--sm"
                      onClick={() => removeRow(rowIndex)}
                      aria-label={`Delete row ${rowIndex + 1}`}
                      title="Delete row"
                    >
                      <IconTrash size={16} />
                    </button>
                    <button
                      type="button"
                      className="pd-icon-btn pd-icon-btn--sm"
                      onClick={(event) =>
                        event.currentTarget
                          .closest("[data-row]")
                          ?.querySelector("[data-cell='label']")
                          ?.focus()
                      }
                      aria-label={`Edit row ${rowIndex + 1}`}
                      title="Edit"
                    >
                      <IconPencil size={16} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <button type="button" className="pd-empty-row" onClick={() => addRow()}>
              No rows yet. <span>Add the first row</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
