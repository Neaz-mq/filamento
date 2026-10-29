import { closeDB, connectDB, getDB } from "../config/db.js";

/* ===============================================================
   Representative — প্রথম তথ্য database এ তোলা (একবারের কাজ)

   উৎস: filamento.com/find-a-rep (বর্তমান সাইট) — ৩৯ জন মানুষ.
   শুধু দুইটা স্পষ্ট ভুল ঠিক করা:
     • "MA 1801" / "CT 6074" → 01801 / 06074 (zip এর শুরুর 0)
     • "Jason Fsher" → "Jason Fisher" (email jfisher@…)

   server ফোল্ডারে:
     npm run seed-representatives            নতুনগুলো যোগ করে
     npm run seed-representatives -- --reset আগের seed করা লোক মুছে আবার যোগ

   একই email আগে থেকে থাকলে ছোঁয়া হয় না — তাই আবার চালালে admin এ
   করা বদল হারায় না.
   ⚠️ --reset শুধু এই script এর বানানো লোক মোছে (seed: true). admin এ
   এদের কারো তথ্য বদলালেও সে seed: true ই থাকে, মুছে যাবে — আসল
   তথ্য হাতে থাকলে --reset চালাবেন না
   =============================================================== */

const SEED = [
  {
    company: "Lighting Solutions",
    person: "Steven Kornegay",
    email: "skornegay@lightingsolutionsal.com",
    phone: "(334) 798-2532",
    address: "3180 Cahaba Heights Rd, Vestavia Hills, AL 35243",
    territories: ["usa/alabama", "usa/florida-northern", "usa/mississippi"],
    position: 10,
  },
  {
    company: "Lighting Systems",
    person: "Jim Boyd",
    email: "jimb@ltgsys.com",
    phone: "(510) 812-7495",
    address: "2322 6th Street, Berkeley, CA 94710",
    territories: ["usa/california-northern", "usa/nevada-northern"],
    position: 20,
  },
  {
    company: "Del Sol Resources",
    person: "Ron Padilla",
    email: "ron@delsolresources.com",
    phone: "(760) 407-1410",
    address: "249 Hwy 101, Solana Beach, CA 92075",
    territories: ["usa/california-southern"],
    position: 30,
  },
  {
    company: "The Lighting Agency",
    person: "Jason Fisher",
    email: "jfisher@thelightingagency.com",
    phone: "(303) 455-1012",
    address: "2661 17th Street, Denver, CO 80211",
    territories: ["usa/colorado", "usa/montana", "usa/wyoming"],
    position: 40,
  },
  {
    company: "Illuminate",
    person: "Sean Reese",
    email: "sreese@illuminatene.com",
    phone: "(781) 935-8500",
    address: "44 6th Road, Woburn, MA 01801",
    territories: ["usa/connecticut", "usa/maine", "usa/massachusetts", "usa/new-hampshire", "usa/rhode-island", "usa/vermont"],
    position: 50,
  },
  {
    company: "Illuminate",
    person: "Jason Vasilakos",
    email: "jvasilakos@illuminatene.com",
    phone: "(203) 695-2059",
    address: "333 Pleasant Valley Rd, South Windsor, CT 06074",
    territories: ["usa/connecticut", "usa/maine", "usa/massachusetts", "usa/new-hampshire", "usa/rhode-island", "usa/vermont"],
    position: 60,
  },
  {
    company: "Diversified Lighting Associates",
    person: "Tom Jordan",
    email: "tjordan@divphl.com",
    phone: "(215) 852-7405",
    address: "1 Ivybrook Blvd., Suite 100, Warminster, PA 18974",
    territories: ["usa/delaware", "usa/new-jersey-southern", "usa/pennsylvania"],
    position: 135,
  },
  {
    company: "ALESCO",
    person: "Tim Moore",
    email: "timm@alesco.us",
    phone: "(912) 536-3441",
    address: "115 Cone Street, Statesboro, GA 30458",
    territories: ["usa/florida-eastern", "usa/florida-northern", "usa/georgia-southern"],
    position: 80,
  },
  {
    company: "Bell & McCoy - North",
    person: "Brennen Matthews",
    email: "bmatthews@bellandmccoy.com",
    phone: "(770) 545-8961",
    address: "5854 Peachtree Corners E, Suite 100, Peachtree Corners, GA 30092",
    territories: ["usa/georgia-northern"],
    position: 90,
  },
  {
    company: "EIGHT3SIX",
    person: "Greg Cavlovic",
    email: "gregc@eight3six.com",
    phone: "(208) 287-3996",
    address: "420 W Main St., Ste #306, Boise, ID 87302",
    territories: ["usa/idaho"],
    position: 100,
  },
  {
    company: "Lighting Associates",
    person: "Paul Kuhlmann",
    email: "pk@laiweb.net",
    phone: "(314) 606-6414",
    address: "3216 S Brentwood Blvd., Webster Groves, MO 63119",
    territories: ["usa/illinois", "usa/missouri"],
    position: 110,
  },
  {
    company: "Grace Lighting",
    person: "Renfred Miller",
    email: "renfred@grace.lighting",
    phone: "(319) 400-9980",
    address: "1550 Willow Creek Drive Ste 2, Iowa City, IA 52246",
    territories: ["usa/iowa", "usa/nebraska"],
    position: 120,
  },
  {
    company: "Repco II",
    person: "Phillip Kimball",
    email: "phillipkimball@repcoii.com",
    phone: "(412) 563-6229",
    address: "1201 Chappel Ave, Pittsburgh, PA 15216",
    territories: ["usa/kentucky", "usa/ohio", "usa/pennsylvania"],
    position: 130,
  },
  {
    company: "Lumenation",
    person: "Mark Weber",
    email: "mark@lumenation.net",
    phone: "(502) 491-8811",
    address: "312 New Venture Drive, Louisville, KY 40214",
    territories: ["usa/kentucky"],
    position: 140,
  },
  {
    company: "REPCO II",
    person: "Angel Casciato",
    email: "angelcasciato@repcoii.com",
    phone: "(412) 440-9191",
    address: "1201 Chappel Ave, Pittsburgh, PA 15216",
    territories: ["usa/kentucky", "usa/pennsylvania"],
    position: 150,
  },
  {
    company: "DePorter Dominick, and Associates",
    person: "Dave DePorter",
    email: "dave@ddallc.com",
    phone: "(410) 905-3861",
    address: "7390 Merrit Park Drive, Suite 160-C, Manassas, VA 20109",
    territories: ["usa/maryland", "usa/virginia", "usa/washington-d-c"],
    position: 160,
  },
  {
    company: "Roth Lighting",
    person: "Quotes Department",
    email: "quotes@rothlighting.net",
    phone: "(702) 534-6526",
    address: "5915 Edmond St #125, Las Vegas, NV 89118",
    territories: ["usa/nevada-southern"],
    position: 170,
  },
  {
    company: "Roth Lighting",
    person: "Zac Tschillard",
    email: "ztschillard@rothlighting.net",
    phone: "(702) 534-6526",
    address: "2950 E Sunset Road #125, Las Vegas, NV 89118",
    territories: ["usa/nevada-southern"],
    position: 180,
  },
  {
    company: "Metro Area Sales",
    person: "Andy Broitman",
    email: "Andy@MetroLtg.com",
    phone: "(516) 933-9330",
    address: "960 So. Broadway, Suite 130, Hicksville, NY 11801",
    territories: ["usa/new-jersey-eastern", "usa/new-jersey-northern"],
    position: 190,
  },
  {
    company: "Vertex Solutions",
    person: "Dan Suriani",
    email: "dsuriani@vertex-ny.com",
    phone: "(716) 362-3500",
    address: "220 Dingens Street, Buffalo, NY 14206",
    territories: ["usa/new-york"],
    position: 200,
  },
  {
    company: "Metro Area Sales",
    person: "Burt Grant",
    email: "burt@metroltg.com",
    phone: "(516) 933-9330",
    address: "960 So. Broadway, Hicksville, NY 11801",
    territories: ["usa/new-york"],
    position: 210,
  },
  {
    company: "Triangle Lighting Solutions",
    person: "Tom Salter",
    email: "tom@trianglelightingsolutions.com",
    phone: "(919) 308-7160",
    address: "9941 Koupela Dr, Raleigh, NC 27614",
    territories: ["usa/north-carolina"],
    position: 220,
  },
  {
    company: "S&S Sales",
    person: "Linda Sally",
    email: "lsally@ss-sales.com",
    phone: "(757) 495-7233",
    address: "748 Lord Dunmore Dr, Suite 105, Virginia Beach, VA 23464",
    territories: ["usa/north-carolina", "usa/virginia"],
    position: 230,
  },
  {
    company: "ILumen",
    person: "David Hickson",
    email: "dhickson@mhscenergy.com",
    phone: "(979) 704-6323",
    address: "11990 Old Wellborn Road, Ste.6, College Station, TX 77845",
    territories: ["usa/oklahoma", "usa/texas"],
    position: 240,
  },
  {
    company: "Columbia Pacific Sales",
    person: "Dawn Doberenz",
    email: "dawn@columbiapacificsales.com",
    phone: "(503) 867-0736",
    address: "P.O. Box 871271, Vancouver, WA 98687",
    territories: ["usa/oregon", "usa/washington-southern"],
    position: 250,
  },
  {
    company: "Caribbean Energy Savings",
    person: "Julian Herencia",
    email: "julian.herencia@cesgrouppr.com",
    phone: "(787) 397-8364",
    address: "RR2 Box 4034, Toa Alta, PR 00953",
    territories: ["usa/puerto-rico"],
    position: 260,
  },
  {
    company: "Lighting Group - Utah",
    person: "Donny Durrant",
    email: "donny@lightinggrouputah.com",
    phone: "(801) 281-2329",
    address: "12271 S. 800 Ste C, Draper, UT 84020",
    territories: ["usa/utah"],
    position: 270,
  },
  {
    company: "S&S Sales",
    person: "Amanda Rich",
    email: "arich@ss-sales.com",
    phone: "(804) 266-2627",
    address: "6400 Rigsby Road, Richmond, VA 23226",
    territories: ["usa/virginia"],
    position: 280,
  },
  {
    company: "The Lighting Group",
    person: "George Stringer",
    email: "gstringer@lightinggroup.com",
    phone: "(206) 669-4117",
    address: "1201 South Bailey Street, Seattle, WA 98108",
    territories: ["usa/washington"],
    position: 290,
  },
  {
    company: "Next Generation Led NV",
    person: "Erwin Eeckhaut",
    email: "erwin@nextgenerationled.be",
    phone: "+32 475 733 528",
    address: "Bergemeersenstraat 137, 9300 Aalst, Belgium",
    territories: ["europe/belgium"],
    position: 300,
  },
  {
    company: "SAS Luminance Consulting",
    person: "Jean-Christophe Oliveri",
    email: "jc.oliveri@luminance-consulting.com",
    phone: "+33 562 551 801",
    address: "1, Route de Bartrés, ADE 65100, France",
    territories: ["europe/france"],
    position: 310,
  },
  {
    company: "Exceedation Sales GmbH",
    person: "Gerhard Rieser",
    email: "gerhard.rieser@exceedation.com",
    phone: "+43 676 7804868",
    address: "Europastrasse 2a, 6170 Zirl, Austria",
    territories: ["europe/germany-austria"],
    position: 320,
  },
  {
    company: "Smart Lighting sp. z o.o.",
    person: "Piotr Jagiełło",
    email: "info@smartlighting.com.pl",
    phone: "+48 669 536 171",
    address: "66-008 Letnica 79, Poland",
    territories: ["europe/poland"],
    position: 330,
  },
  {
    company: "Prosperity Lamps & Components Ltd.",
    person: "Benny Chan",
    email: "benny.chan@prosperitylamps.com",
    phone: "+852 9036 6029",
    address: "20/F Cornell Ctr., 30 Wing Tai Road, Chai Wan, Hong Kong",
    territories: ["asia/hong-kong"],
    position: 340,
  },
  {
    company: "ShinyU Light Japan Co., Ltd.",
    person: "Kaku Gun",
    email: "kakugun@shinyu-jp.com",
    phone: "+81 45 294 9399",
    address: "6C, Daiichitosho Bld., 1-5 Hanasaki-cho, Naka-ku, Yokohama-shi, Kanagawa 231-0063",
    territories: ["asia/japan"],
    position: 350,
  },
  {
    company: "Takemina",
    person: "Yoshimasa Konishi",
    email: "support@takemina.com",
    phone: "+81 42 843 1970",
    address: "Capital Hill Hino 503, 1-18-7 Shinmachi, Hino-shi, Tokyo, Japan 191-0002",
    territories: ["asia/japan"],
    position: 360,
  },
  {
    company: "Innomiles International Co., Ltd.",
    person: "Jesse Yen",
    email: "jesse.yen@innomiles.com",
    phone: "+886-2-8773-613",
    address: "No. 137, Sec. 1, Fuxing S. Rd., Da'an Dist., Taipei, Taiwan 106",
    territories: ["asia/taiwan"],
    position: 370,
  },
  {
    company: "Upper Canada Industries",
    person: "Sales Department",
    email: "sales@uppercanadaindustries.com",
    phone: "(416) 529-7353",
    address: "30 Gilbank Drive, Aurora, Ontario L4G 5G4, Canada",
    territories: ["canada/ontario"],
    position: 380,
  },
  {
    company: "Mills Architectural Lighting",
    person: "Church Lighting - Canada",
    email: "results@millslighting.com",
    phone: "1 (800) 268-1526",
    address: "106 Birmingham Street, Toronto, Ontario M8V 4E6, Canada",
    territories: ["canada/ontario"],
    position: 390,
  },
];

const reset = process.argv.includes("--reset");

async function main() {
  await connectDB();
  const collection = getDB().collection("representatives");
  await collection.createIndex({ emailKey: 1 }, { unique: true });
  await collection.createIndex({ active: 1, position: 1 });

  if (reset) {
    const { deletedCount } = await collection.deleteMany({ seed: true });
    console.log(`🗑️  ${deletedCount} seeded representative(s) removed.`);
  }

  let added = 0;
  for (const item of SEED) {
    const emailKey = item.email.toLowerCase();

    if (await collection.findOne({ emailKey }, { projection: { _id: 1 } })) {
      console.log(`↷ ${item.person} (${item.company}) already exists — skipped.`);
      continue;
    }

    const now = new Date();
    await collection.insertOne({
      ...item,
      emailKey,
      active: true,
      seed: true,
      createdAt: now,
      updatedAt: now,
      createdBy: { id: null, name: "Seed data" },
      updatedBy: { id: null, name: "Seed data" },
    });
    added += 1;
    console.log(`✅ ${item.person} — ${item.company}`);
  }

  console.log(`\nDone — ${added} representative(s) added.`);
}

main()
  .catch((error) => {
    console.error("❌", error.message);
    process.exitCode = 1;
  })
  .finally(() => closeDB());