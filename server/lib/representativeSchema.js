import { REGION_IDS, TERRITORIES, TERRITORY_KEYS, territoryKey } from "./territories.js";

/* ===============================================================
   Representative — তথ্যের কাঠামো (src/lib/ এ রাখুন — server)

   এক জন মানুষ = একটা document. একই জন কয়েকটা territory সামলালে
   territories এ কয়েকটা key থাকে — তাই একই তথ্য বারবার লিখতে হয় না,
   আর বদলাতে হলে একবারেই সব জায়গায় বদলে যায়.

   {
     company, person, email, emailKey (ছোট হাতের — একই email দুইবার
     ঠেকাতে), phone, address,
     territories: ["usa/connecticut", "usa/maine", …],
     active:   true হলে সাইটে দেখায়, false হলে লুকানো (মোছা ছাড়াই)
     position: ক্রম — ছোট সংখ্যা আগে. একই territory তে কয়েকজন থাকলে
               এই ক্রমে card আসে
   }
   =============================================================== */

export const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// string না হলে ফাঁকা, খুব লম্বা হলে কাটা
const text = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/* ---------------------------------------------------------------
   ফর্মের তথ্য যাচাই আর পরিষ্কার

   partial: false (নতুন বানানো) — দরকারি ঘরগুলো না থাকলে ভুল
   partial: true  (PATCH)        — শুধু যেগুলো পাঠানো হয়েছে সেগুলো দেখে

   ফেরত: { value } অথবা { error: "বার্তা" }
   --------------------------------------------------------------- */
export function cleanRepresentative(body, { partial = false } = {}) {
  const input = body && typeof body === "object" ? body : {};
  const has = (key) => Object.hasOwn(input, key);
  // নতুন বানাতে সব দরকারি; PATCH এ শুধু পাঠানোগুলো
  const check = (key) => !partial || has(key);
  const value = {};

  if (check("company")) {
    const company = text(input.company, 160);
    if (!company) return { error: "Company name is required." };
    value.company = company;
  }

  if (check("person")) {
    const person = text(input.person, 120);
    if (!person) return { error: "Contact person is required." };
    value.person = person;
  }

  if (check("email")) {
    const email = text(input.email, 200);
    if (!EMAIL_SHAPE.test(email)) return { error: "Enter a valid email address." };
    value.email = email;
    value.emailKey = email.toLowerCase();
  }

  if (has("phone")) value.phone = text(input.phone, 40);
  else if (!partial) value.phone = "";

  if (has("address")) value.address = text(input.address, 240);
  else if (!partial) value.address = "";

  if (check("territories")) {
    if (!Array.isArray(input.territories)) {
      return { error: "Choose at least one territory." };
    }
    const keys = [...new Set(input.territories.map(String))];
    const unknown = keys.find((key) => !TERRITORY_KEYS.has(key));
    if (unknown) return { error: `Unknown territory: ${unknown}` };
    if (!keys.length) return { error: "Choose at least one territory." };
    value.territories = keys;
  }

  if (has("active")) value.active = input.active === true;
  else if (!partial) value.active = true;

  if (has("position")) {
    const position = Number(input.position);
    if (!Number.isInteger(position) || position < 0 || position > 99999) {
      return { error: "Position must be a whole number between 0 and 99999." };
    }
    value.position = position;
  }

  return { value };
}

/* ---------------------------------------------------------------
   public সাইটের জন্য — যা বাইরে যায় (শুধু যা card এ দেখানো হয়)
   --------------------------------------------------------------- */
const publicRep = (doc) => ({
  id: doc._id.toString(),
  company: doc.company ?? "",
  person: doc.person ?? "",
  email: doc.email ?? "",
  phone: doc.phone ?? "",
  address: doc.address ?? "",
});

/* representative দের territory ধরে সাজানো.

   ফল: [{ id: "usa", territories: [{ id, name, lat, lng, reps: [...] }] }]
   — client এর আগের REGIONS এর আকারেই, যাতে সাইটের খোঁজা/কাছের/সাজানোর
   কোড বদলাতে না হয়.

   reps অবশ্যই আগে থেকে position অনুযায়ী সাজানো থাকতে হবে — একই
   territory র ভেতরে সেই ক্রমই থাকে. কেউ না থাকলেও territory টা আসে
   (reps: []) — তখন সাইট Filamento র নিজের card দেখায় */
export function groupByRegion(reps) {
  const byTerritory = new Map();
  for (const rep of reps) {
    for (const key of rep.territories ?? []) {
      if (!byTerritory.has(key)) byTerritory.set(key, []);
      byTerritory.get(key).push(publicRep(rep));
    }
  }

  return REGION_IDS.map((regionId) => ({
    id: regionId,
    territories: TERRITORIES.filter((territory) => territory.region === regionId).map(
      (territory) => ({
        id: territory.id,
        name: territory.name,
        lat: territory.lat,
        lng: territory.lng,
        reps: byTerritory.get(territoryKey(territory)) ?? [],
      }),
    ),
  }));
}

/* ---------------------------------------------------------------
   admin এর জন্য — পুরো তথ্য. পুরনো বা অর্ধেক document এও যেন admin
   panel না ভাঙে, তাই প্রতিটা ঘরের নিরাপদ মান
   --------------------------------------------------------------- */
export const adminShape = (doc) => ({
  id: doc._id.toString(),
  company: doc.company ?? "",
  person: doc.person ?? "",
  email: doc.email ?? "",
  phone: doc.phone ?? "",
  address: doc.address ?? "",
  territories: Array.isArray(doc.territories)
    ? doc.territories.filter((key) => TERRITORY_KEYS.has(key))
    : [],
  active: doc.active !== false,
  position: typeof doc.position === "number" ? doc.position : 0,
  createdAt: doc.createdAt ?? null,
  updatedAt: doc.updatedAt ?? doc.createdAt ?? null,
});

// admin এর territory বাছার তালিকা
export const territoryOptions = () =>
  TERRITORIES.map((territory) => ({
    key: territoryKey(territory),
    region: territory.region,
    id: territory.id,
    name: territory.name,
  }));