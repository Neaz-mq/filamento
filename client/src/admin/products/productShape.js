import { categoryOf } from "./catalog";

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
  images: [],
  videoUrls: [],
  keyFeatures: [],
  specs: {},
  videos: [],
  documents: [],
  updatedAt: null,
});

export const fromServer = (product) => ({
  ...emptyProduct(product.category),
  ...product,
  stock: typeof product.stock === "number" ? product.stock : null,
  color: product.color ?? "",
});

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
    done: groups.filter((group) => groupFilled(product.specs, group.id)).length,
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
    images: product.images.map(({ url, publicId, width, height }) => ({
      url,
      publicId,
      width,
      height,
    })),
    videoUrls: product.videoUrls.map((url) => url.trim()).filter(Boolean),
    keyFeatures: product.keyFeatures,
    specs,
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
  if (!product.images.length) missing.push("At least one product image");
  return missing;
}

/* তুলনার জন্য — এই দুইটা এক হলে "save হয়নি এমন বদল" নেই */
export const snapshot = (product) => JSON.stringify(toServer(product));
