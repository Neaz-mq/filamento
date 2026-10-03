import { useState } from "react";
import { ProductThumb } from "../products/ProductLibrary";
import { moveItem, useSortable } from "../products/useSortable";
import { HOME_LIMITS, HOME_LISTS, guessIcon, serial } from "./homeShape";
import { FixturePicker, ItemModal, PlayerModal } from "./HomeModals";
import {
  EmptyRow,
  FeatureIcon,
  RowTools,
  SectionCard,
  Stars,
  TextField,
  Thumb,
  VideoThumb,
} from "./HomeParts";
import { IconImage, IconVideo } from "../icons";

/* ===============================================================
   Home Page Content এর পাঁচটা ধাপ

   প্রতিটা ধাপ পায়:
     data    — এই ধাপের খসড়া
     update  — খসড়া বদলানো: update(old => new)
     errors  — Save এর আগে ধরা পড়া ভুল { ঘরের নাম: বার্তা }
     canEdit — বদলানোর অনুমতি আছে কি না

   "+ Add" আর ✏️ একটা modal খোলে (HomeModals.jsx → ItemModal).
   modal এর Save শুধু খসড়ায় বসায় — database এ যায় পাতার নিচের
   "Save Change" চাপলে
   =============================================================== */

const L = HOME_LIMITS;

/* ---------------------------------------------------------------
   তালিকার modal — কোন তালিকা, কোন form, কত নম্বর (null = নতুন)
   --------------------------------------------------------------- */
function useListModal(data, update, prepare = (form, item) => item) {
  const [editing, setEditing] = useState(null); // { list, form, index }

  const open = (list, form, index = null) => setEditing({ list, form, index });
  const close = () => setEditing(null);

  const modal = editing ? (
    <ItemModal
      form={editing.form}
      initial={editing.index === null ? null : data[editing.list][editing.index]}
      onClose={close}
      onSave={(item) => {
        const { list, form, index } = editing;
        update((old) => {
          const previous = index === null ? null : old[list][index];
          const next = prepare(form, item, previous);
          return {
            ...old,
            [list]: index === null ? [...old[list], next] : old[list].map((row, i) => (i === index ? next : row)),
          };
        });
        close();
      }}
    />
  ) : null;

  return { open, modal };
}

const removeAt = (update, list, index) =>
  update((old) => ({ ...old, [list]: old[list].filter((_, i) => i !== index) }));

const fullTitle = (list, label) =>
  `You can add up to ${HOME_LISTS[list].max} ${label}. Delete one to add another.`;

// Key Features / Featured Points — শিরোনাম পড়ে icon
const withIcon = (form, item, previous) =>
  form === "feature" || form === "point"
    ? {
        ...item,
        icon: guessIcon(`${item.title} ${item.subtitle ?? item.text ?? ""}`, previous?.icon),
      }
    : item;

function ListError({ message }) {
  return message ? (
    <p className="pd-error" role="alert">
      {message}
    </p>
  ) : null;
}

/* ===============================================================
   ১. HERO
   =============================================================== */
export function StepHero({ data, update, errors, canEdit }) {
  const { open, modal } = useListModal(data, update, withIcon);

  return (
    <div className="hc-stack">
      {/* ---- Hero Section ---- */}
      <SectionCard
        id="hc-hero-slides"
        title="Hero Section"
        onAdd={canEdit ? () => open("slides", "slide") : null}
        addDisabled={data.slides.length >= HOME_LISTS.slides.max}
        addTitle={fullTitle("slides", "hero sections")}
      >
        {data.slides.length ? (
          <div className="hc-list">
            {data.slides.map((item, index) => (
              <div key={item.id} className="hc-row">
                <Thumb src={item.image?.url} className="hc-thumb--wide" fit="cover" />
                <div className="hc-row-text">
                  <span className="hc-pill">{item.label}</span>
                  <strong className="hc-row-title">{item.title}</strong>
                  <span className="hc-row-sub hc-clamp-2">{item.description}</span>
                </div>
                {canEdit && (
                  <RowTools
                    name={item.title}
                    onDelete={() => removeAt(update, "slides", index)}
                    deleteDisabled={data.slides.length <= HOME_LISTS.slides.min}
                    deleteTitle="The home page needs at least one hero section."
                    onEdit={() => open("slides", "slide", index)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyRow onClick={() => canEdit && open("slides", "slide")} disabled={!canEdit}>
            <IconImage size={22} />
            No hero section yet. {canEdit && <span>Add one</span>}
          </EmptyRow>
        )}
        <ListError message={errors.slides} />
      </SectionCard>

      {/* ---- Key Features ---- */}
      <SectionCard
        id="hc-hero-features"
        title="Key Features"
        onAdd={canEdit ? () => open("features", "feature") : null}
        addDisabled={data.features.length >= HOME_LISTS.features.max}
        addTitle={fullTitle("features", "key features")}
      >
        {data.features.length ? (
          <div className="hc-grid">
            {data.features.map((item, index) => (
              <div key={item.id} className="hc-tile">
                <FeatureIcon name={item.icon} />
                <div className="hc-tile-text">
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                </div>
                {canEdit && (
                  <RowTools
                    name={`${item.title} ${item.subtitle}`}
                    onDelete={() => removeAt(update, "features", index)}
                    onEdit={() => open("features", "feature", index)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyRow onClick={() => canEdit && open("features", "feature")} disabled={!canEdit}>
            No key features yet. {canEdit && <span>Add a feature</span>}
          </EmptyRow>
        )}
        <ListError message={errors.features} />
      </SectionCard>

      {/* ---- Featured Products (hero র নিচের কার্ড) ---- */}
      <SectionCard
        id="hc-hero-products"
        title="Featured Products"
        onAdd={canEdit ? () => open("products", "card") : null}
        addDisabled={data.products.length >= HOME_LISTS.products.max}
        addTitle={fullTitle("products", "featured products")}
      >
        {data.products.length ? (
          <div className="hc-list">
            {data.products.map((item, index) => (
              <div key={item.id} className="hc-row">
                <Thumb src={item.image?.url} className="hc-thumb--wide" />
                <div className="hc-row-text">
                  <strong className="hc-row-title">{item.title}</strong>
                  <span className="hc-row-sub">{item.subtitle}</span>
                  <span className="hc-row-link">{item.link || "/products"}</span>
                </div>
                {canEdit && (
                  <RowTools
                    name={item.title}
                    onDelete={() => removeAt(update, "products", index)}
                    onEdit={() => open("products", "card", index)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyRow onClick={() => canEdit && open("products", "card")} disabled={!canEdit}>
            No featured products yet. {canEdit && <span>Add a product card</span>}
          </EmptyRow>
        )}
        <ListError message={errors.products} />
      </SectionCard>

      {/* ---- Client Logos ---- */}
      <SectionCard
        id="hc-hero-logos"
        title="Client Logos"
        badge={`${data.logos.length} brand${data.logos.length === 1 ? "" : "s"}`}
        onAdd={canEdit ? () => open("logos", "logo") : null}
        addDisabled={data.logos.length >= HOME_LISTS.logos.max}
        addTitle={fullTitle("logos", "logos")}
      >
        {data.logos.length ? (
          <div className="hc-grid">
            {data.logos.map((item, index) => (
              <div key={item.id} className="hc-tile">
                <Thumb src={item.image?.url} className="hc-thumb--logo" alt={item.name} />
                <div className="hc-tile-text">
                  <strong className="hc-upper">{item.name}</strong>
                </div>
                {canEdit && (
                  <RowTools
                    name={item.name}
                    onDelete={() => removeAt(update, "logos", index)}
                    onEdit={() => open("logos", "logo", index)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyRow onClick={() => canEdit && open("logos", "logo")} disabled={!canEdit}>
            No client logos yet. {canEdit && <span>Add a logo</span>}
          </EmptyRow>
        )}
        <ListError message={errors.logos} />
      </SectionCard>

      {modal}
    </div>
  );
}

/* ===============================================================
   ২. FEATURED PRODUCTS ("Three Fixtures" অংশ)
   =============================================================== */
export function StepFeatured({ data, update, errors, canEdit, products, setProducts }) {
  const { open, modal } = useListModal(data, update, withIcon);
  const [picking, setPicking] = useState(false);
  const [editingFixture, setEditingFixture] = useState(null); // index

  const set = (key) => (value) => update((old) => ({ ...old, [key]: value }));

  const sort = useSortable((from, to) =>
    update((old) => ({ ...old, fixtures: moveItem(old.fixtures, from, to) })),
  );

  /* picker থেকে ফেরা — আগের লেখা থাকে, নতুন product এর বিবরণ
     product এর short description থেকে শুরু. "Best For" ফাঁকা
     থাকলে সেটার modal নিজে খোলে */
  const applyPicked = (items) => {
    setProducts((old) => ({
      ...old,
      ...Object.fromEntries(items.filter((item) => item.name).map((item) => [item.id, item])),
    }));

    const byProduct = new Map(data.fixtures.map((row) => [row.productId, row]));
    const fixtures = items.map(
      (product) =>
        byProduct.get(product.id) ?? {
          id: `fx${product.id.slice(-8)}`,
          productId: product.id,
          scope: "",
          description: String(product.shortDescription ?? "").slice(0, L.fixtureDescription),
        },
    );
    update((old) => ({ ...old, fixtures }));
    setPicking(false);

    const firstEmpty = fixtures.findIndex((row) => !row.scope.trim());
    if (firstEmpty > -1) setEditingFixture(firstEmpty);
  };

  return (
    <div className="hc-stack">
      {/* ---- Featured Products Section ---- */}
      <SectionCard id="hc-featured-section" title="Featured Products Section">
        <div className="hc-two">
          <div className="hc-col">
            <TextField
              id="hc-featured-behindText"
              label="Behind Text"
              value={data.behindText}
              max={L.behindText}
              required
              placeholder="Fixtures"
              hint="The large faded word behind the title."
              error={errors.behindText}
              onChange={set("behindText")}
              disabled={!canEdit}
            />
            <TextField
              id="hc-featured-title"
              label="Title Text"
              value={data.title}
              max={L.sectionTitle}
              required
              placeholder="Three Fixtures. One Complete Solution."
              error={errors.title}
              onChange={set("title")}
              disabled={!canEdit}
            />
          </div>
          <TextField
            id="hc-featured-description"
            label="Short Description"
            value={data.description}
            max={L.shortDescription}
            required
            multiline
            rows={5}
            placeholder="Modular lamps, reflectors, mounts, and control caps…"
            error={errors.description}
            onChange={set("description")}
            disabled={!canEdit}
          />
        </div>
      </SectionCard>

      {/* ---- 3 Fixtures Featured Products ---- */}
      <SectionCard
        id="hc-featured-fixtures"
        title="3 Fixtures Featured Products"
        onAdd={canEdit ? () => setPicking(true) : null}
        addLabel={data.fixtures.length ? "Change" : "Add"}
      >
        {data.fixtures.length ? (
          <div {...sort.list} className="hc-list">
            {data.fixtures.map((item, index) => {
              const product = products[item.productId];
              const missing = !product;
              const draft = product && product.status !== "published";
              return (
                <div key={item.id} data-sort-row className={`hc-sort-row ${sort.rowClass(index)}`}>
                  {canEdit && data.fixtures.length > 1 && <button {...sort.handle(index, data.fixtures.length)} />}
                  <div className={`hc-row${missing || draft ? " is-warn" : ""}`}>
                    {product?.image ? (
                      <Thumb src={product.image} className="hc-thumb--wide" />
                    ) : (
                      <span className="hc-thumb hc-thumb--wide">
                        <ProductThumb image="" category={product?.category ?? "other"} size={46} />
                      </span>
                    )}
                    <div className="hc-row-text">
                      <strong className="hc-row-title">
                        {missing ? "Product not found" : product.name}
                        {draft && <span className="pd-status is-draft">Draft</span>}
                      </strong>
                      <span className={`hc-row-sub${item.scope ? "" : " is-missing"}`}>
                        {item.scope || "Add where this fixture works best"}
                      </span>
                      <span className="hc-row-small hc-clamp-2">
                        {missing
                          ? "This product was deleted. Pick another one."
                          : draft
                            ? "This product is a draft. Publish it or pick another one."
                            : item.description}
                      </span>
                    </div>
                    {canEdit && (
                      <RowTools
                        name={product?.name ?? "product"}
                        onDelete={() => removeAt(update, "fixtures", index)}
                        deleteDisabled={data.fixtures.length <= HOME_LISTS.fixtures.min}
                        deleteTitle="Keep at least one product. Use Change to swap it."
                        onEdit={() => setEditingFixture(index)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyRow onClick={() => canEdit && setPicking(true)} disabled={!canEdit}>
            No products picked yet. {canEdit && <span>Pick up to 3 fixtures</span>}
          </EmptyRow>
        )}
        <ListError message={errors.fixtures} />
      </SectionCard>

      {/* ---- Featured Points Section ---- */}
      <SectionCard
        id="hc-featured-points"
        title="Featured Points Section"
        onAdd={canEdit ? () => open("points", "point") : null}
        addDisabled={data.points.length >= HOME_LISTS.points.max}
        addTitle={fullTitle("points", "points")}
      >
        {data.points.length ? (
          <div className="hc-grid">
            {data.points.map((item, index) => (
              <div key={item.id} className="hc-tile hc-tile--tall">
                <FeatureIcon name={item.icon} />
                <div className="hc-tile-text">
                  <strong>{item.title}</strong>
                  <span className="hc-tile-long">{item.text}</span>
                </div>
                {canEdit && (
                  <RowTools
                    name={item.title}
                    onDelete={() => removeAt(update, "points", index)}
                    onEdit={() => open("points", "point", index)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyRow onClick={() => canEdit && open("points", "point")} disabled={!canEdit}>
            No featured points yet. {canEdit && <span>Add a point</span>}
          </EmptyRow>
        )}
        <ListError message={errors.points} />
      </SectionCard>

      {modal}

      {picking && (
        <FixturePicker
          chosen={data.fixtures.map((item) => item.productId)}
          products={products}
          onClose={() => setPicking(false)}
          onSave={applyPicked}
        />
      )}

      {editingFixture !== null && data.fixtures[editingFixture] && (
        <ItemModal
          form="fixture"
          initial={data.fixtures[editingFixture]}
          note={products[data.fixtures[editingFixture].productId]?.name}
          onClose={() => setEditingFixture(null)}
          onSave={(item) => {
            update((old) => ({
              ...old,
              fixtures: old.fixtures.map((row, i) => (i === editingFixture ? item : row)),
            }));
            setEditingFixture(null);
          }}
        />
      )}
    </div>
  );
}

/* ===============================================================
   ৩. COMPARISON
   =============================================================== */
export function StepComparison({ data, update, errors, canEdit }) {
  const { open, modal } = useListModal(data, update);
  const set = (key) => (value) => update((old) => ({ ...old, [key]: value }));
  const sort = useSortable((from, to) =>
    update((old) => ({ ...old, rows: moveItem(old.rows, from, to) })),
  );

  return (
    <div className="hc-stack">
      <SectionCard id="hc-comparison-section" title="Comparison Section">
        <TextField
          id="hc-comparison-title"
          label="Section Title"
          value={data.title}
          max={L.sectionTitle}
          required
          placeholder="A different class of industrial LED."
          error={errors.title}
          onChange={set("title")}
          disabled={!canEdit}
        />
        <TextField
          id="hc-comparison-description"
          label="Short Description"
          value={data.description}
          max={L.longDescription}
          required
          multiline
          rows={3}
          placeholder="We build our fixtures — optics, driver, dimming — in-house…"
          error={errors.description}
          onChange={set("description")}
          disabled={!canEdit}
        />
      </SectionCard>

      <SectionCard
        id="hc-comparison-table"
        title="Comparison Table"
        onAdd={canEdit ? () => open("rows", "row") : null}
        addDisabled={data.rows.length >= HOME_LISTS.rows.max}
        addTitle={fullTitle("rows", "comparison points")}
      >
        {data.rows.length ? (
          <div className="hc-table" role="table" aria-label="Comparison table">
            <div className="hc-table-head" role="row">
              <span className="hc-table-gap" aria-hidden="true" />
              <span role="columnheader">Feature / Metric</span>
              <span role="columnheader">Traditional LED</span>
              <span role="columnheader">Filamento</span>
              <span role="columnheader" className="hc-table-action">
                Action
              </span>
            </div>
            <div {...sort.list} className="hc-table-body" role="rowgroup">
              {data.rows.map((row, index) => (
                <div key={row.id} data-sort-row role="row" className={`hc-table-row ${sort.rowClass(index)}`}>
                  <span className="hc-table-gap">
                    {canEdit && <button {...sort.handle(index, data.rows.length)} />}
                    <span className="pd-serial">{serial(index)}</span>
                  </span>
                  <span role="cell" className="hc-cell" data-label="Feature / Metric">
                    {row.metric}
                  </span>
                  <span role="cell" className="hc-cell" data-label="Traditional LED">
                    {row.traditional}
                  </span>
                  <span role="cell" className="hc-cell hc-cell--ours" data-label="Filamento">
                    {row.filamento}
                  </span>
                  <span role="cell" className="hc-table-action">
                    {canEdit && (
                      <RowTools
                        name={row.metric}
                        onDelete={() => removeAt(update, "rows", index)}
                        deleteDisabled={data.rows.length <= HOME_LISTS.rows.min}
                        deleteTitle="The table needs at least one row."
                        onEdit={() => open("rows", "row", index)}
                      />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyRow onClick={() => canEdit && open("rows", "row")} disabled={!canEdit}>
            No comparison points yet. {canEdit && <span>Add a point</span>}
          </EmptyRow>
        )}
        <ListError message={errors.rows} />
        <p className="pd-tip">Tip: Drag and drop specifications within a group to quickly reorder them.</p>
      </SectionCard>

      {modal}
    </div>
  );
}

/* ===============================================================
   ৪. VIDEOS (Technologies অংশ)
   =============================================================== */
export function StepVideos({ data, update, errors, canEdit }) {
  const { open, modal } = useListModal(data, update);
  const [playing, setPlaying] = useState(null);
  const set = (key) => (value) => update((old) => ({ ...old, [key]: value }));
  const sort = useSortable((from, to) =>
    update((old) => ({ ...old, items: moveItem(old.items, from, to) })),
  );

  return (
    <div className="hc-stack">
      <SectionCard id="hc-videos-section" title="Videos Section">
        <TextField
          id="hc-videos-heading"
          label="Section Heading"
          value={data.heading}
          max={L.sectionTitle}
          required
          placeholder="Every fixture is a research project"
          error={errors.heading}
          onChange={set("heading")}
          disabled={!canEdit}
        />
        <TextField
          id="hc-videos-subtext"
          label="Section Subtext"
          value={data.subtext}
          max={L.longDescription}
          required
          multiline
          rows={3}
          placeholder="Explore the technologies behind superior illumination…"
          error={errors.subtext}
          onChange={set("subtext")}
          disabled={!canEdit}
        />
      </SectionCard>

      <SectionCard
        id="hc-videos-list"
        title="Upload Videos"
        addLabel="Add Video"
        onAdd={canEdit ? () => open("items", "video") : null}
        addDisabled={data.items.length >= HOME_LISTS.videos.max}
        addTitle={fullTitle("videos", "videos")}
      >
        {data.items.length ? (
          <div {...sort.list} className="hc-list">
            {data.items.map((item, index) => (
              <div key={item.id} data-sort-row className={`hc-sort-row ${sort.rowClass(index)}`}>
                {canEdit && <button {...sort.handle(index, data.items.length)} />}
                <span className="pd-serial">{serial(index)}</span>
                <div className="hc-row hc-row--video">
                  <VideoThumb item={item} onPlay={() => setPlaying(item)} />
                  <div className="hc-row-text">
                    <strong className="hc-row-title hc-row-title--light">{item.title}</strong>
                    <span className="hc-row-sub hc-clamp-2">{item.description}</span>
                  </div>
                  {canEdit && (
                    <RowTools
                      name={item.title}
                      size={20}
                      onDelete={() => removeAt(update, "items", index)}
                      deleteDisabled={data.items.length <= HOME_LISTS.videos.min}
                      deleteTitle="Keep at least one video."
                      onEdit={() => open("items", "video", index)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyRow onClick={() => canEdit && open("items", "video")} disabled={!canEdit}>
            <IconVideo size={22} />
            No videos yet. {canEdit && <span>Add a video</span>}
          </EmptyRow>
        )}
        <ListError message={errors.videos} />
        <p className="pd-tip">Tip: Drag and drop specifications within a group to quickly reorder them.</p>
      </SectionCard>

      {modal}
      {playing && <PlayerModal item={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

/* ===============================================================
   ৫. TESTIMONIALS
   =============================================================== */
export function StepTestimonials({ data, update, errors, canEdit }) {
  const { open, modal } = useListModal(data, update);
  const sort = useSortable((from, to) =>
    update((old) => ({ ...old, items: moveItem(old.items, from, to) })),
  );

  return (
    <div className="hc-stack">
      <SectionCard
        id="hc-testimonials-list"
        title="Testimonials Section"
        onAdd={canEdit ? () => open("items", "testimonial") : null}
        addDisabled={data.items.length >= HOME_LISTS.testimonials.max}
        addTitle={fullTitle("testimonials", "testimonials")}
      >
        {data.items.length ? (
          <div {...sort.list} className="hc-list">
            {data.items.map((item, index) => (
              <div key={item.id} data-sort-row className={`hc-sort-row ${sort.rowClass(index)}`}>
                {canEdit && <button {...sort.handle(index, data.items.length)} />}
                <span className="pd-serial">{serial(index)}</span>
                <div className="hc-review">
                  <div className="hc-review-person">
                    <Thumb src={item.image?.url} className="hc-thumb--avatar" fit="cover" width={160} />
                    <span className="hc-review-who">
                      <strong>{item.name}</strong>
                      <span>{item.designation}</span>
                      <small>{item.company}</small>
                    </span>
                  </div>
                  <div className="hc-review-col">
                    <span className="hc-review-rating">
                      <Stars value={item.rating} />
                      <strong>{item.rating}</strong>
                    </span>
                    <span className="hc-review-small hc-ellipsis" title={item.projectName}>
                      {item.projectName}
                    </span>
                  </div>
                  <div className="hc-review-col hc-review-col--wide">
                    <strong>Testimonial Quote</strong>
                    <span className="hc-review-small hc-ellipsis" title={item.quote}>
                      {item.quote}
                    </span>
                  </div>
                  <div className="hc-review-col">
                    <strong>Project Link</strong>
                    <span className="hc-review-small hc-ellipsis" title={item.projectLink}>
                      {item.projectLink}
                    </span>
                  </div>
                  {canEdit && (
                    <RowTools
                      name={item.name}
                      size={20}
                      onDelete={() => removeAt(update, "items", index)}
                      deleteDisabled={data.items.length <= HOME_LISTS.testimonials.min}
                      deleteTitle="Keep at least one testimonial."
                      onEdit={() => open("items", "testimonial", index)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyRow onClick={() => canEdit && open("items", "testimonial")} disabled={!canEdit}>
            No testimonials yet. {canEdit && <span>Add a testimonial</span>}
          </EmptyRow>
        )}
        <ListError message={errors.testimonials} />
        <p className="pd-tip">Tip: Drag and drop specifications within a group to quickly reorder them.</p>
      </SectionCard>

      {modal}
    </div>
  );
}
