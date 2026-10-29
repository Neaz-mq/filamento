/* ===============================================================
   How to Buy: Find a Representative — representative দের তথ্য আর হিসাব

   🔌 এখন সাইট তথ্য পড়ে server (API) থেকে — admin এর
   Representatives পাতায় যা বদলানো হয় সাইটে সেটাই দেখায়
   (useRegions.js, GET /api/representatives).

   এই ফাইলের REPS / TERRITORIES তালিকা এখন শুধু **ভরসার বিকল্প**
   (FALLBACK_REGIONS): server না চললে বা কিছু না পাঠালে সাইট এটা
   দেখায়, যাতে পাতা কখনো ফাঁকা না থাকে. নতুন লোক যোগ / বদল করতে হলে
   admin পাতা ব্যবহার করুন — এখানে হাত দেওয়ার দরকার নেই.

   উৎস: filamento.com/find-a-rep (বর্তমান সাইট), Figma র ক্রমেই.
   শুধু দুইটা স্পষ্ট ভুল ঠিক করা হয়েছে:
     • "MA 1801" / "CT 6074" — zip এর শুরুর 0 হারিয়ে গিয়েছিল
       (01801, 06074)
     • "Jason Fsher" → "Jason Fisher" (email jfisher@…, Figma তেও Fisher)

   lat / lng — territory র মোটামুটি মাঝখান. শুধু "কাছের representative"
   সাজাতে (Sorted by proximity) লাগে, তাই একদম নিখুঁত হওয়ার দরকার নেই.
   server কোনো territory র lat/lng না পাঠালে এখানের মান ব্যবহার হয়
   =============================================================== */

/* Filamento নিজে — নিচের কালো "Direct contact" অংশ আর যে territory তে
   কেউ নেই সেখানে */
export const FILAMENTO = {
  email: "Sales@Filamento.com",
  // এশিয়া-প্যাসিফিক আর ইউরোপ (বর্তমান সাইটের লেখা অনুযায়ী)
  internationalEmail: "Ella@Filamento.com",
  phoneDisplay: "+1 (408) 475 - 0038",
  phoneLink: "+14084750038",
  // ⚠️ Figma থেকে — একবার মিলিয়ে নেবেন
  address: "3031 Tisch Way, 110 Plaza West, San Jose, CA 95128, United States",
};

const rep = (company, person, email, phone, address) => ({
  company,
  person,
  email,
  phone,
  address,
});

/* ---------------------------------------------------------------
   Representative — key দিয়ে, যাতে একই লোক কয়েক জায়গায় থাকলে
   একবারই লিখতে হয়
   --------------------------------------------------------------- */
const REPS = {
  lightingSolutions: rep(
    "Lighting Solutions",
    "Steven Kornegay",
    "skornegay@lightingsolutionsal.com",
    "(334) 798-2532",
    "3180 Cahaba Heights Rd, Vestavia Hills, AL 35243",
  ),
  lightingSystems: rep(
    "Lighting Systems",
    "Jim Boyd",
    "jimb@ltgsys.com",
    "(510) 812-7495",
    "2322 6th Street, Berkeley, CA 94710",
  ),
  delSol: rep(
    "Del Sol Resources",
    "Ron Padilla",
    "ron@delsolresources.com",
    "(760) 407-1410",
    "249 Hwy 101, Solana Beach, CA 92075",
  ),
  lightingAgency: rep(
    "The Lighting Agency",
    "Jason Fisher",
    "jfisher@thelightingagency.com",
    "(303) 455-1012",
    "2661 17th Street, Denver, CO 80211",
  ),
  illuminateReese: rep(
    "Illuminate",
    "Sean Reese",
    "sreese@illuminatene.com",
    "(781) 935-8500",
    "44 6th Road, Woburn, MA 01801",
  ),
  illuminateVasilakos: rep(
    "Illuminate",
    "Jason Vasilakos",
    "jvasilakos@illuminatene.com",
    "(203) 695-2059",
    "333 Pleasant Valley Rd, South Windsor, CT 06074",
  ),
  diversified: rep(
    "Diversified Lighting Associates",
    "Tom Jordan",
    "tjordan@divphl.com",
    "(215) 852-7405",
    "1 Ivybrook Blvd., Suite 100, Warminster, PA 18974",
  ),
  alesco: rep(
    "ALESCO",
    "Tim Moore",
    "timm@alesco.us",
    "(912) 536-3441",
    "115 Cone Street, Statesboro, GA 30458",
  ),
  bellMcCoy: rep(
    "Bell & McCoy - North",
    "Brennen Matthews",
    "bmatthews@bellandmccoy.com",
    "(770) 545-8961",
    "5854 Peachtree Corners E, Suite 100, Peachtree Corners, GA 30092",
  ),
  eight3six: rep(
    "EIGHT3SIX",
    "Greg Cavlovic",
    "gregc@eight3six.com",
    "(208) 287-3996",
    "420 W Main St., Ste #306, Boise, ID 87302",
  ),
  lightingAssociates: rep(
    "Lighting Associates",
    "Paul Kuhlmann",
    "pk@laiweb.net",
    "(314) 606-6414",
    "3216 S Brentwood Blvd., Webster Groves, MO 63119",
  ),
  grace: rep(
    "Grace Lighting",
    "Renfred Miller",
    "renfred@grace.lighting",
    "(319) 400-9980",
    "1550 Willow Creek Drive Ste 2, Iowa City, IA 52246",
  ),
  repcoKimball: rep(
    "Repco II",
    "Phillip Kimball",
    "phillipkimball@repcoii.com",
    "(412) 563-6229",
    "1201 Chappel Ave, Pittsburgh, PA 15216",
  ),
  repcoCasciato: rep(
    "REPCO II",
    "Angel Casciato",
    "angelcasciato@repcoii.com",
    "(412) 440-9191",
    "1201 Chappel Ave, Pittsburgh, PA 15216",
  ),
  lumenation: rep(
    "Lumenation",
    "Mark Weber",
    "mark@lumenation.net",
    "(502) 491-8811",
    "312 New Venture Drive, Louisville, KY 40214",
  ),
  deporter: rep(
    "DePorter Dominick, and Associates",
    "Dave DePorter",
    "dave@ddallc.com",
    "(410) 905-3861",
    "7390 Merrit Park Drive, Suite 160-C, Manassas, VA 20109",
  ),
  rothQuotes: rep(
    "Roth Lighting",
    "Quotes Department",
    "quotes@rothlighting.net",
    "(702) 534-6526",
    "5915 Edmond St #125, Las Vegas, NV 89118",
  ),
  rothTschillard: rep(
    "Roth Lighting",
    "Zac Tschillard",
    "ztschillard@rothlighting.net",
    "(702) 534-6526",
    "2950 E Sunset Road #125, Las Vegas, NV 89118",
  ),
  metroBroitman: rep(
    "Metro Area Sales",
    "Andy Broitman",
    "Andy@MetroLtg.com",
    "(516) 933-9330",
    "960 So. Broadway, Suite 130, Hicksville, NY 11801",
  ),
  metroGrant: rep(
    "Metro Area Sales",
    "Burt Grant",
    "burt@metroltg.com",
    "(516) 933-9330",
    "960 So. Broadway, Hicksville, NY 11801",
  ),
  vertex: rep(
    "Vertex Solutions",
    "Dan Suriani",
    "dsuriani@vertex-ny.com",
    "(716) 362-3500",
    "220 Dingens Street, Buffalo, NY 14206",
  ),
  triangle: rep(
    "Triangle Lighting Solutions",
    "Tom Salter",
    "tom@trianglelightingsolutions.com",
    "(919) 308-7160",
    "9941 Koupela Dr, Raleigh, NC 27614",
  ),
  ssSally: rep(
    "S&S Sales",
    "Linda Sally",
    "lsally@ss-sales.com",
    "(757) 495-7233",
    "748 Lord Dunmore Dr, Suite 105, Virginia Beach, VA 23464",
  ),
  ssRich: rep(
    "S&S Sales",
    "Amanda Rich",
    "arich@ss-sales.com",
    "(804) 266-2627",
    "6400 Rigsby Road, Richmond, VA 23226",
  ),
  ilumen: rep(
    "ILumen",
    "David Hickson",
    "dhickson@mhscenergy.com",
    "(979) 704-6323",
    "11990 Old Wellborn Road, Ste.6, College Station, TX 77845",
  ),
  columbiaPacific: rep(
    "Columbia Pacific Sales",
    "Dawn Doberenz",
    "dawn@columbiapacificsales.com",
    "(503) 867-0736",
    "P.O. Box 871271, Vancouver, WA 98687",
  ),
  caribbean: rep(
    "Caribbean Energy Savings",
    "Julian Herencia",
    "julian.herencia@cesgrouppr.com",
    "(787) 397-8364",
    "RR2 Box 4034, Toa Alta, PR 00953",
  ),
  lightingGroupUtah: rep(
    "Lighting Group - Utah",
    "Donny Durrant",
    "donny@lightinggrouputah.com",
    "(801) 281-2329",
    "12271 S. 800 Ste C, Draper, UT 84020",
  ),
  lightingGroup: rep(
    "The Lighting Group",
    "George Stringer",
    "gstringer@lightinggroup.com",
    "(206) 669-4117",
    "1201 South Bailey Street, Seattle, WA 98108",
  ),
  nextGeneration: rep(
    "Next Generation Led NV",
    "Erwin Eeckhaut",
    "erwin@nextgenerationled.be",
    "+32 475 733 528",
    "Bergemeersenstraat 137, 9300 Aalst, Belgium",
  ),
  luminance: rep(
    "SAS Luminance Consulting",
    "Jean-Christophe Oliveri",
    "jc.oliveri@luminance-consulting.com",
    "+33 562 551 801",
    "1, Route de Bartrés, ADE 65100, France",
  ),
  exceedation: rep(
    "Exceedation Sales GmbH",
    "Gerhard Rieser",
    "gerhard.rieser@exceedation.com",
    "+43 676 7804868",
    "Europastrasse 2a, 6170 Zirl, Austria",
  ),
  smartLighting: rep(
    "Smart Lighting sp. z o.o.",
    "Piotr Jagiełło",
    "info@smartlighting.com.pl",
    "+48 669 536 171",
    "66-008 Letnica 79, Poland",
  ),
  prosperity: rep(
    "Prosperity Lamps & Components Ltd.",
    "Benny Chan",
    "benny.chan@prosperitylamps.com",
    "+852 9036 6029",
    "20/F Cornell Ctr., 30 Wing Tai Road, Chai Wan, Hong Kong",
  ),
  shinyu: rep(
    "ShinyU Light Japan Co., Ltd.",
    "Kaku Gun",
    "kakugun@shinyu-jp.com",
    "+81 45 294 9399",
    "6C, Daiichitosho Bld., 1-5 Hanasaki-cho, Naka-ku, Yokohama-shi, Kanagawa 231-0063",
  ),
  takemina: rep(
    "Takemina",
    "Yoshimasa Konishi",
    "support@takemina.com",
    "+81 42 843 1970",
    "Capital Hill Hino 503, 1-18-7 Shinmachi, Hino-shi, Tokyo, Japan 191-0002",
  ),
  innomiles: rep(
    "Innomiles International Co., Ltd.",
    "Jesse Yen",
    "jesse.yen@innomiles.com",
    "+886-2-8773-613",
    "No. 137, Sec. 1, Fuxing S. Rd., Da'an Dist., Taipei, Taiwan 106",
  ),
  upperCanada: rep(
    "Upper Canada Industries",
    "Sales Department",
    "sales@uppercanadaindustries.com",
    "(416) 529-7353",
    "30 Gilbank Drive, Aurora, Ontario L4G 5G4, Canada",
  ),
  mills: rep(
    "Mills Architectural Lighting",
    "Church Lighting - Canada",
    "results@millslighting.com",
    "1 (800) 268-1526",
    "106 Birmingham Street, Toronto, Ontario M8V 4E6, Canada",
  ),
};

/* ---------------------------------------------------------------
   Territory — Figma র ক্রমেই (বাঁ থেকে ডানে, উপর থেকে নিচে)
   --------------------------------------------------------------- */
const t = (name, lat, lng, reps = []) => ({ name, lat, lng, reps });

const USA = [
  t("Alabama", 32.8, -86.8, ["lightingSolutions"]),
  t("California - Northern", 38.6, -121.5, ["lightingSystems"]),
  t("California - Southern", 34.0, -117.5, ["delSol"]),
  t("Colorado", 39.0, -105.5, ["lightingAgency"]),
  t("Connecticut", 41.6, -72.7, ["illuminateReese", "illuminateVasilakos"]),
  t("Delaware", 39.0, -75.5, ["diversified"]),
  t("Florida - Central", 28.5, -81.6),
  t("Florida - Eastern", 28.2, -80.7, ["alesco"]),
  t("Florida - Northern", 30.4, -84.0, ["lightingSolutions", "alesco"]),
  t("Georgia - Northern", 34.0, -84.3, ["bellMcCoy"]),
  t("Georgia - Southern", 31.5, -82.5, ["alesco"]),
  t("Idaho", 44.2, -114.6, ["eight3six"]),
  t("Illinois", 40.0, -89.2, ["lightingAssociates"]),
  t("Indiana", 39.9, -86.3),
  t("Iowa", 42.0, -93.5, ["grace"]),
  t("Kentucky", 37.5, -85.3, ["repcoKimball", "lumenation", "repcoCasciato"]),
  t("Maine", 45.3, -69.2, ["illuminateReese", "illuminateVasilakos"]),
  t("Maryland", 39.0, -76.8, ["deporter"]),
  t("Massachusetts", 42.3, -71.8, ["illuminateReese", "illuminateVasilakos"]),
  t("Michigan", 43.6, -84.7),
  t("Mississippi", 32.7, -89.7, ["lightingSolutions"]),
  t("Missouri", 38.4, -92.5, ["lightingAssociates"]),
  t("Montana", 47.0, -109.6, ["lightingAgency"]),
  t("Nebraska", 41.5, -99.8, ["grace"]),
  t("Nevada - Northern", 39.5, -118.0, ["lightingSystems"]),
  t("Nevada - Southern", 36.2, -115.2, ["rothQuotes", "rothTschillard"]),
  t("New Hampshire", 43.7, -71.6, ["illuminateReese", "illuminateVasilakos"]),
  t("New Jersey - Eastern", 40.4, -74.2, ["metroBroitman"]),
  t("New Jersey - Northern", 40.9, -74.5, ["metroBroitman"]),
  t("New Jersey - Southern", 39.6, -74.8, ["diversified"]),
  t("New York", 42.9, -75.5, ["vertex", "metroGrant"]),
  t("North Carolina", 35.5, -79.4, ["triangle", "ssSally"]),
  t("Ohio", 40.3, -82.8, ["repcoKimball"]),
  t("Oklahoma", 35.5, -97.5, ["ilumen"]),
  t("Oregon", 44.0, -120.5, ["columbiaPacific"]),
  t("Pennsylvania", 40.9, -77.8, ["repcoKimball", "diversified", "repcoCasciato"]),
  t("Puerto Rico", 18.2, -66.5, ["caribbean"]),
  t("Rhode Island", 41.7, -71.5, ["illuminateReese", "illuminateVasilakos"]),
  t("Texas", 31.0, -99.0, ["ilumen"]),
  t("Utah", 39.3, -111.7, ["lightingGroupUtah"]),
  t("Vermont", 44.0, -72.7, ["illuminateReese", "illuminateVasilakos"]),
  t("Virginia", 37.5, -78.8, ["deporter", "ssSally", "ssRich"]),
  t("Washington", 47.4, -121.5, ["lightingGroup"]),
  t("Washington - Southern", 46.0, -121.0, ["columbiaPacific"]),
  t("Washington D.C.", 38.9, -77.0, ["deporter"]),
  t("Wisconsin", 44.6, -89.9),
  t("Wyoming", 43.0, -107.5, ["lightingAgency"]),
];

const EUROPE = [
  t("Belgium", 50.8, 4.4, ["nextGeneration"]),
  t("France", 46.6, 2.2, ["luminance"]),
  t("Germany/Austria", 49.5, 11.0, ["exceedation"]),
  t("Poland", 52.0, 19.0, ["smartLighting"]),
];

const ASIA = [
  t("Hong Kong", 22.3, 114.2, ["prosperity"]),
  t("Japan", 36.0, 138.0, ["shinyu", "takemina"]),
  t("Singapore", 1.35, 103.8),
  t("South Korea", 36.5, 127.8),
  t("Taiwan", 23.7, 121.0, ["innomiles"]),
];

const CANADA = [t("Ontario", 50.0, -85.0, ["upperCanada", "mills"])];

/* "California - Northern" → "california-northern" (ঠিকানায় ব্যবহার) */
const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* অঞ্চল — ট্যাবের ক্রম Figma র মতো. labelKey — অনুবাদের key.
   contactEmail — এই অঞ্চলে কেউ না থাকলে কাকে লিখবে.
   ট্যাব সবসময় এই পাঁচটাই — server যা-ই পাঠাক */
export const REGION_META = [
  { id: "usa", labelKey: "findRep.regions.usa", contactEmail: FILAMENTO.email },
  { id: "europe", labelKey: "findRep.regions.europe", contactEmail: FILAMENTO.internationalEmail },
  { id: "asia", labelKey: "findRep.regions.asia", contactEmail: FILAMENTO.internationalEmail },
  { id: "canada", labelKey: "findRep.regions.canada", contactEmail: FILAMENTO.email },
  { id: "mexico", labelKey: "findRep.regions.mexico", contactEmail: FILAMENTO.email },
];

const BUNDLED = { usa: USA, europe: EUROPE, asia: ASIA, canada: CANADA, mexico: [] };

/* ভরসার বিকল্প — উপরের তালিকা থেকে, server এর তথ্যের মতো একই গড়নে */
export const FALLBACK_REGIONS = REGION_META.map((meta) => ({
  ...meta,
  territories: BUNDLED[meta.id].map((territory) => ({
    ...territory,
    id: slug(territory.name),
    regionId: meta.id,
    reps: territory.reps.map((key) => ({ id: key, ...REPS[key] })),
  })),
}));

/* ---------------------------------------------------------------
   server এর তথ্য → পাতার গড়ন

   server পাঠায়:
     [{ id: "usa", territories: [{ id, name, lat, lng,
        reps: [{ id, company, person, email, phone, address }] }] }]

   এখানে সব কিছু সাবধানে পড়া হয় — খারাপ বা অসম্পূর্ণ তথ্য এলেও
   কখনো error হয় না, আর ট্যাব সবসময় পাঁচটাই থাকে. lat/lng না এলে
   ওই territory র মান ভরসার তালিকা থেকে নেওয়া হয় (না থাকলে null —
   তখন "কাছের" সাজানোয় সবার শেষে যায়)
   --------------------------------------------------------------- */
const isObject = (value) => value !== null && typeof value === "object";

const text = (value) => (value === null || value === undefined ? "" : String(value));

const toNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  return null;
};

const BUNDLED_COORDS = new Map(
  FALLBACK_REGIONS.flatMap((region) =>
    region.territories.map((item) => [`${region.id}/${item.id}`, { lat: item.lat, lng: item.lng }]),
  ),
);

export function buildRegions(apiRegions) {
  const incoming = Array.isArray(apiRegions) ? apiRegions.filter(isObject) : [];

  return REGION_META.map((meta) => {
    const match = incoming.find((region) => region.id === meta.id);
    const territories = Array.isArray(match?.territories) ? match.territories.filter(isObject) : [];

    return {
      ...meta,
      territories: territories
        .map((territory) => {
          const id = text(territory.id);
          const known = BUNDLED_COORDS.get(`${meta.id}/${id}`);
          const reps = Array.isArray(territory.reps) ? territory.reps.filter(isObject) : [];

          return {
            id,
            name: text(territory.name) || id,
            lat: toNumber(territory.lat) ?? known?.lat ?? null,
            lng: toNumber(territory.lng) ?? known?.lng ?? null,
            regionId: meta.id,
            reps: reps.map((item) => ({
              id: item.id,
              company: text(item.company),
              person: text(item.person),
              email: text(item.email),
              phone: text(item.phone),
              address: text(item.address),
            })),
          };
        })
        .filter((territory) => territory.id !== ""),
    };
  });
}

export const regionOf = (regions, id) =>
  regions.find((region) => region.id === id) ?? regions[0];

/* একই লোক কয়েক জায়গায় থাকলে এক ধরা হয় — email দিয়ে (না থাকলে id) */
const repKey = (item) => text(item.email || item.id).toLowerCase();

/* ---------------------------------------------------------------
   কাছের representative — বাছা territory থেকে দূরত্ব (km) মেপে, একই
   অঞ্চলের ভেতরে. যে লোক আগেই তালিকায় আছে (একই email) সে আবার আসে না
   --------------------------------------------------------------- */
const toRad = (deg) => (deg * Math.PI) / 180;

// lat/lng না থাকলে অসীম দূর — সবার শেষে যায়, কিছু ভাঙে না
function distanceKm(a, b) {
  if (![a.lat, a.lng, b.lat, b.lng].every(Number.isFinite)) return Infinity;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// Infinity − Infinity = NaN হয়, তাই আলাদা করে তুলনা
const byDistance = (a, b) => (a.km === b.km ? 0 : a.km < b.km ? -1 : 1);

/* { exact: [{rep, territory}], nearby: [{rep, territory, km}] }
   nearby — সব মিলিয়ে অন্তত `fill` টা card হওয়া পর্যন্ত, সর্বোচ্চ `max` */
export function representativesFor(regions, territory, { fill = 4, max = 3 } = {}) {
  if (!territory) return { exact: [], nearby: [] };
  const seen = new Set();
  const exact = territory.reps
    .filter((item) => {
      const key = repKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => ({ rep: item, territory }));

  const want = Math.min(max, Math.max(0, fill - exact.length));
  const nearby = [];
  if (want > 0) {
    const others = regionOf(regions, territory.regionId)
      .territories.filter((other) => other.id !== territory.id && other.reps.length)
      .map((other) => ({ territory: other, km: distanceKm(territory, other) }))
      .sort(byDistance);

    for (const { territory: other, km } of others) {
      for (const item of other.reps) {
        const key = repKey(item);
        if (seen.has(key)) continue;
        seen.add(key);
        nearby.push({ rep: item, territory: other, km });
        if (nearby.length >= want) break;
      }
      if (nearby.length >= want) break;
    }
  }
  return { exact, nearby };
}

/* খোঁজা — company বা লোকের নাম (বড়/ছোট হাতের অক্ষর আর accent এর
   পার্থক্য ধরা হয় না), সব অঞ্চলে. একই লোক কয়েক territory তে থাকলে
   একবারই আসে, তার সব territory এর নাম সহ */
const normalize = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // এগুলো ভেঙে সাধারণ অক্ষর হয় না, তাই হাতে (Jagiełło → jagiello)
    .replace(/ł/g, "l")
    .replace(/ø/g, "o")
    .replace(/ß/g, "ss");

export function searchRepresentatives(regions, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const byEmail = new Map();
  for (const region of regions) {
    for (const territory of region.territories) {
      for (const item of territory.reps) {
        const haystack = normalize(`${item.company} ${item.person}`);
        if (!words.every((word) => haystack.includes(word))) continue;
        const key = repKey(item);
        const found = byEmail.get(key);
        if (found) found.territories.push(territory);
        else byEmail.set(key, { rep: item, territory, territories: [territory] });
      }
    }
  }
  return [...byEmail.values()].sort((a, b) => a.rep.company.localeCompare(b.rep.company));
}

/* ফোন → tel: link এর জন্য শুধু অঙ্ক (আর শুরুর +) */
export const telHref = (phone) => `tel:${String(phone).replace(/(?!^\+)[^\d]/g, "")}`;

/* ঠিকানা → Google Maps এ খোঁজা */
export const mapHref = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;