import { categoryOf, COMPONENT_STEPS, CONFIGURATOR } from "./catalog";

/* ===============================================================
   Product এর তথ্য — ফাঁকা product, server এর উত্তর থেকে পাতার
   state, আর পাতার state থেকে server এ পাঠানোর আকার
   =============================================================== */

export const emptyGroup = () => ({ items: [], tables: [], description: "" });

export const emptyProduct = (category = "lamp-fixture") => ({
  id: null,
  slug: "",
  name: "",
  shortDescription: "",
  category,
  series: "",
  color: "",
  stock: null,
  status: "draft",
  featured: false,
  filters: {},
  images: [],
  videoUrls: [],
  keyFeatures: [],
  specs: {},
  components: {},
  videos: [],
  documents: [],
  updatedAt: null,
});

export const fromServer = (product) => ({
  ...emptyProduct(product.category),
  ...product,
  stock: typeof product.stock === "number" ? product.stock : null,
  color: product.color ?? "",
  featured: product.featured === true,
  filters: product.filters ?? {},
  components: product.components ?? {},
});

/* ---------------------------------------------------------------
   Configurator এর একটা ধাপ — এখনো ছোঁয়া না হলে catalog এর শুরুর
   মান (Lamp আর Mounting Base "Required"). option:
     { product: id, code: "LA1", isDefault, item: { name, image … } }
   item টা server পড়ার সময় জুড়ে দেয় — পাঠানোর সময় বাদ যায়
   --------------------------------------------------------------- */
export const getStep = (components, step) => ({
  required: step.required,
  options: [],
  ...(components?.[step.key] ?? {}),
});

export const componentCount = (components) =>
  COMPONENT_STEPS.reduce((sum, step) => sum + getStep(components, step).options.length, 0);

// "Required" ধাপ ফাঁকা থাকলে publish হবে না — server এর সাথে মিলিয়ে
export function missingComponents(components) {
  const missing = COMPONENT_STEPS.filter((step) => {
    const data = getStep(components, step);
    return data.required && !data.options.length;
  }).map((step) => `${step.label} options`);
  if (!missing.length && !componentCount(components)) missing.push("At least one component");
  return missing;
}

/* বাঁ পাশের সবুজ ✓ — Components এর তথ্য specs এ না, product.components এ */
export const groupDone = (product, group) =>
  group.kind === "components"
    ? componentCount(product.components) > 0
    : groupFilled(product.specs, group.id);

export const getGroup = (specs, id) => ({ ...emptyGroup(), ...(specs?.[id] ?? {}) });

// একটা Specification group এ কিছু লেখা আছে কি না — বাঁ পাশের সবুজ ✓
export const groupFilled = (specs, id) => {
  const group = getGroup(specs, id);
  return (
    group.items.some((item) => item.trim()) ||
    Boolean(group.description.trim()) ||
    group.tables.some((table) =>
      table.rows.some((row) => row.label.trim() || row.cells.some((cell) => cell.trim())),
    )
  );
};

export const specProgress = (product) => {
  const groups = categoryOf(product.category).specGroups;
  return {
    done: groups.filter((group) => groupDone(product, group)).length,
    total: groups.length,
  };
};

/* server এ পাঠানোর আগে — ফাঁকা সারি বাদ. id, slug, updatedAt
   server নিজে রাখে, পাঠানোর দরকার নেই */
export function toServer(product) {
  const specs = {};
  for (const [id, raw] of Object.entries(product.specs ?? {})) {
    const group = { ...emptyGroup(), ...raw };
    specs[id] = {
      items: group.items.map((item) => item.trim()).filter(Boolean),
      description: group.description.trim(),
      tables: group.tables.map((table) => ({
        ...table,
        rows: table.rows.filter(
          (row) => row.label.trim() || row.cells.some((cell) => cell.trim()),
        ),
      })),
    };
  }

  return {
    name: product.name.trim(),
    shortDescription: product.shortDescription.trim(),
    category: product.category,
    series: product.series.trim(),
    color: product.color.trim(),
    stock: product.stock === "" ? null : product.stock,
    status: product.status,
    featured: product.featured,
    filters: product.filters,
    images: product.images.map(({ url, publicId, width, height }) => ({
      url,
      publicId,
      width,
      height,
    })),
    videoUrls: product.videoUrls.map((url) => url.trim()).filter(Boolean),
    keyFeatures: product.keyFeatures,
    specs,
    components:
      product.category === CONFIGURATOR
        ? Object.fromEntries(
            COMPONENT_STEPS.map((step) => {
              const data = getStep(product.components, step);
              return [
                step.key,
                {
                  required: data.required,
                  options: data.options.map(({ product: id, code, isDefault }) => ({
                    product: id,
                    code: code.trim(),
                    isDefault,
                  })),
                },
              ];
            }),
          )
        : {},
    videos: product.videos,
    documents: product.documents,
  };
}

/* publish এর আগে যা না থাকলেই নয় — server এর missingForPublish এর
   সাথে মিলিয়ে. draft এ এগুলো ফাঁকা থাকতে পারে */
export function missingForPublish(product) {
  const missing = [];
  if (!product.name.trim()) missing.push("Product name");
  if (!product.shortDescription.trim()) missing.push("Short description");
  if (categoryOf(product.category).color && !product.color.trim()) {
    missing.push("Color");
  }
  for (const group of categoryOf(product.category).specGroups) {
    if (group.descriptionRequired && !getGroup(product.specs, group.id).description.trim()) {
      missing.push(`${group.label} short description`);
    }
  }
  if (product.category === CONFIGURATOR) missing.push(...missingComponents(product.components));
  if (!product.images.length) missing.push("At least one product image");
  return missing;
}

/* তুলনার জন্য — এই দুইটা এক হলে "save হয়নি এমন বদল" নেই */
export const snapshot = (product) => JSON.stringify(toServer(product));
