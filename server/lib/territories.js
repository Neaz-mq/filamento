/* ===============================================================
   territories — "Find a Representative" এর অঞ্চল আর territory র তালিকা
   (src/lib/ এ রাখুন — server)

   এগুলো প্রায় কখনো বদলায় না (আমেরিকার ৪৭টা অঞ্চল, ইউরোপ ইত্যাদি),
   তাই database এ নয় — কোডে. বদলায় শুধু কোন representative কোন
   territory সামলায়, সেটা database এ (representatives collection).

   key — "<region>/<id>" (যেমন "usa/connecticut"). representative এর
   territories ঘরে এই key গুলোই থাকে.

   lat / lng — territory র মোটামুটি মাঝখান. শুধু "Sorted by proximity" এ
   কাছের representative বাছতে লাগে, তাই একদম নিখুঁত হওয়ার দরকার নেই.
   নতুন territory যোগ করলে আনুমানিক মান দিলেই চলবে.

   ⚠️ client এও তালিকা আছে (client/src/pages/representatives.js) — পরের
   ধাপে সেটা এই API থেকে নেওয়া হবে, তখন ওখানের কপি মুছে যাবে
   =============================================================== */

// অঞ্চলের ক্রম — সাইটের ট্যাবের ক্রম
export const REGION_IDS = ["usa", "europe", "asia", "canada", "mexico"];

export const TERRITORIES = [
  { region: "usa", id: "alabama", name: "Alabama", lat: 32.8, lng: -86.8 },
  { region: "usa", id: "california-northern", name: "California - Northern", lat: 38.6, lng: -121.5 },
  { region: "usa", id: "california-southern", name: "California - Southern", lat: 34, lng: -117.5 },
  { region: "usa", id: "colorado", name: "Colorado", lat: 39, lng: -105.5 },
  { region: "usa", id: "connecticut", name: "Connecticut", lat: 41.6, lng: -72.7 },
  { region: "usa", id: "delaware", name: "Delaware", lat: 39, lng: -75.5 },
  { region: "usa", id: "florida-central", name: "Florida - Central", lat: 28.5, lng: -81.6 },
  { region: "usa", id: "florida-eastern", name: "Florida - Eastern", lat: 28.2, lng: -80.7 },
  { region: "usa", id: "florida-northern", name: "Florida - Northern", lat: 30.4, lng: -84 },
  { region: "usa", id: "georgia-northern", name: "Georgia - Northern", lat: 34, lng: -84.3 },
  { region: "usa", id: "georgia-southern", name: "Georgia - Southern", lat: 31.5, lng: -82.5 },
  { region: "usa", id: "idaho", name: "Idaho", lat: 44.2, lng: -114.6 },
  { region: "usa", id: "illinois", name: "Illinois", lat: 40, lng: -89.2 },
  { region: "usa", id: "indiana", name: "Indiana", lat: 39.9, lng: -86.3 },
  { region: "usa", id: "iowa", name: "Iowa", lat: 42, lng: -93.5 },
  { region: "usa", id: "kentucky", name: "Kentucky", lat: 37.5, lng: -85.3 },
  { region: "usa", id: "maine", name: "Maine", lat: 45.3, lng: -69.2 },
  { region: "usa", id: "maryland", name: "Maryland", lat: 39, lng: -76.8 },
  { region: "usa", id: "massachusetts", name: "Massachusetts", lat: 42.3, lng: -71.8 },
  { region: "usa", id: "michigan", name: "Michigan", lat: 43.6, lng: -84.7 },
  { region: "usa", id: "mississippi", name: "Mississippi", lat: 32.7, lng: -89.7 },
  { region: "usa", id: "missouri", name: "Missouri", lat: 38.4, lng: -92.5 },
  { region: "usa", id: "montana", name: "Montana", lat: 47, lng: -109.6 },
  { region: "usa", id: "nebraska", name: "Nebraska", lat: 41.5, lng: -99.8 },
  { region: "usa", id: "nevada-northern", name: "Nevada - Northern", lat: 39.5, lng: -118 },
  { region: "usa", id: "nevada-southern", name: "Nevada - Southern", lat: 36.2, lng: -115.2 },
  { region: "usa", id: "new-hampshire", name: "New Hampshire", lat: 43.7, lng: -71.6 },
  { region: "usa", id: "new-jersey-eastern", name: "New Jersey - Eastern", lat: 40.4, lng: -74.2 },
  { region: "usa", id: "new-jersey-northern", name: "New Jersey - Northern", lat: 40.9, lng: -74.5 },
  { region: "usa", id: "new-jersey-southern", name: "New Jersey - Southern", lat: 39.6, lng: -74.8 },
  { region: "usa", id: "new-york", name: "New York", lat: 42.9, lng: -75.5 },
  { region: "usa", id: "north-carolina", name: "North Carolina", lat: 35.5, lng: -79.4 },
  { region: "usa", id: "ohio", name: "Ohio", lat: 40.3, lng: -82.8 },
  { region: "usa", id: "oklahoma", name: "Oklahoma", lat: 35.5, lng: -97.5 },
  { region: "usa", id: "oregon", name: "Oregon", lat: 44, lng: -120.5 },
  { region: "usa", id: "pennsylvania", name: "Pennsylvania", lat: 40.9, lng: -77.8 },
  { region: "usa", id: "puerto-rico", name: "Puerto Rico", lat: 18.2, lng: -66.5 },
  { region: "usa", id: "rhode-island", name: "Rhode Island", lat: 41.7, lng: -71.5 },
  { region: "usa", id: "texas", name: "Texas", lat: 31, lng: -99 },
  { region: "usa", id: "utah", name: "Utah", lat: 39.3, lng: -111.7 },
  { region: "usa", id: "vermont", name: "Vermont", lat: 44, lng: -72.7 },
  { region: "usa", id: "virginia", name: "Virginia", lat: 37.5, lng: -78.8 },
  { region: "usa", id: "washington", name: "Washington", lat: 47.4, lng: -121.5 },
  { region: "usa", id: "washington-southern", name: "Washington - Southern", lat: 46, lng: -121 },
  { region: "usa", id: "washington-d-c", name: "Washington D.C.", lat: 38.9, lng: -77 },
  { region: "usa", id: "wisconsin", name: "Wisconsin", lat: 44.6, lng: -89.9 },
  { region: "usa", id: "wyoming", name: "Wyoming", lat: 43, lng: -107.5 },
  { region: "europe", id: "belgium", name: "Belgium", lat: 50.8, lng: 4.4 },
  { region: "europe", id: "france", name: "France", lat: 46.6, lng: 2.2 },
  { region: "europe", id: "germany-austria", name: "Germany/Austria", lat: 49.5, lng: 11 },
  { region: "europe", id: "poland", name: "Poland", lat: 52, lng: 19 },
  { region: "asia", id: "hong-kong", name: "Hong Kong", lat: 22.3, lng: 114.2 },
  { region: "asia", id: "japan", name: "Japan", lat: 36, lng: 138 },
  { region: "asia", id: "singapore", name: "Singapore", lat: 1.35, lng: 103.8 },
  { region: "asia", id: "south-korea", name: "South Korea", lat: 36.5, lng: 127.8 },
  { region: "asia", id: "taiwan", name: "Taiwan", lat: 23.7, lng: 121 },
  { region: "canada", id: "ontario", name: "Ontario", lat: 50, lng: -85 },
];

export const territoryKey = (territory) => `${territory.region}/${territory.id}`;

export const TERRITORY_KEYS = new Set(TERRITORIES.map(territoryKey));