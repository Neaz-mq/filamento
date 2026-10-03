/* ===============================================================
   Project এর তথ্য — ফাঁকা project, server এর উত্তর থেকে পাতার
   state, আর পাতার state থেকে server এ পাঠানোর আকার

   products — শুধু product এর id এর তালিকা (ক্রম সহ). নাম আর ছবি
   দেখানোর জন্য items এ { id: { name, image … } } রাখা হয় — এটা
   server এ যায় না
   =============================================================== */

export const DEFAULT_CTA = { text: "Explore Products", link: "/products", newTab: false };

export const emptyProject = () => ({
  id: null,
  ref: "",
  slug: "",
  title: "",
  company: "",
  shortDescription: "",
  projectType: "",
  category: "",
  location: "",
  date: "",
  status: "draft",
  images: [],
  videoUrls: [],
  keyFeatures: [],
  challenge: "",
  solutionIntro: "",
  solution: [],
  results: "",
  highlights: [],
  cta: { ...DEFAULT_CTA },
  products: [],
  items: {},
  updatedAt: null,
});

export const fromServer = (project) => {
  const items = {};
  for (const item of project.productItems ?? []) items[item.id] = item;
  const rest = { ...project };
  delete rest.productItems;
  return {
    ...emptyProject(),
    ...rest,
    cta: { ...DEFAULT_CTA, ...(project.cta ?? {}) },
    products: project.products ?? [],
    items,
  };
};

export function toServer(project) {
  return {
    title: project.title.trim(),
    company: project.company.trim(),
    shortDescription: project.shortDescription.trim(),
    projectType: project.projectType,
    category: project.category,
    location: project.location.trim(),
    date: project.date,
    status: project.status,
    images: project.images.map(({ url, publicId, width, height }) => ({
      url,
      publicId,
      width,
      height,
    })),
    videoUrls: project.videoUrls.map((url) => url.trim()).filter(Boolean),
    keyFeatures: project.keyFeatures,
    challenge: project.challenge.trim(),
    solutionIntro: (project.solutionIntro ?? "").trim(),
    solution: project.solution,
    results: project.results.trim(),
    highlights: project.highlights.map((item) => item.trim()).filter(Boolean),
    cta: {
      text: project.cta.text.trim(),
      link: project.cta.link.trim(),
      newTab: project.cta.newTab,
    },
    products: project.products,
  };
}

/* publish (Completed / In Progress) এর আগে যা না থাকলেই নয় —
   Figma তে * দেওয়া ঘর. server এর missingForPublish এর সাথে মিলিয়ে */
export function missingForPublish(project) {
  const missing = [];
  if (!project.title.trim()) missing.push("Project title");
  if (!project.company.trim()) missing.push("Company name");
  if (!project.shortDescription.trim()) missing.push("Short description");
  if (!project.projectType) missing.push("Project type");
  if (!project.category) missing.push("Category");
  if (!project.location.trim()) missing.push("Location");
  if (!project.date) missing.push("Date");
  if (!project.images.length) missing.push("At least one project image");
  return missing;
}

/* Call to Action — লেখা আর link দুইটাই থাকবে, নয়তো কোনোটাই না.
   link: সাইটের ভেতরের পথ (/products) অথবা https://… */
export function ctaProblem(cta) {
  const text = cta.text.trim();
  const link = cta.link.trim();
  if (!text && !link) return "";
  if (!text) return "Add the button text, or clear the link.";
  if (!link) return "Add a link for the button, or clear the text.";
  if (link.startsWith("/")) {
    return link.startsWith("//") || /\s/.test(link) ? "Use a path like /products." : "";
  }
  try {
    return new URL(link).protocol === "https:" ? "" : "Links must start with https:// or /";
  } catch {
    return "Use a path like /products or a full https:// link.";
  }
}

/* তুলনার জন্য — এই দুইটা এক হলে "save হয়নি এমন বদল" নেই */
export const snapshot = (project) => JSON.stringify(toServer(project));
