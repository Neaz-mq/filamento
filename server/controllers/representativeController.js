import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { logActivity } from "../lib/activity.js";
import {
  adminShape,
  cleanRepresentative,
  groupByRegion,
  territoryOptions,
} from "../lib/representativeSchema.js";

/* ===============================================================
   Representative — database এর কাজ (src/controllers/ এ রাখুন)

   দুই ধরনের পাঠক:
     public সাইট  — "Find a Representative" পাতা. শুধু active লোক
     admin panel  — সবাই (inactive সহ), আর territory বাছার তালিকা

   collection: representatives — গঠন lib/representativeSchema.js এ
   =============================================================== */

const representatives = () => getDB().collection("representatives");

let indexesReady;

const ensureIndexes = () => {
  if (!indexesReady) {
    indexesReady = Promise.all([
      // একই email দুইবার নয় (ছোট হাতের রূপে মেলানো)
      representatives().createIndex({ emailKey: 1 }, { unique: true }),
      representatives().createIndex({ active: 1, position: 1 }),
    ]).catch((error) => {
      indexesReady = undefined; // পরের request আবার চেষ্টা করবে
      console.warn("⚠️ Representative indexes:", error.message);
    });
  }
  return indexesReady;
};

const toObjectId = (value) => {
  try {
    return new ObjectId(String(value));
  } catch {
    return null;
  }
};

const who = (admin) => ({
  id: admin._id,
  name: admin.name ?? admin.email,
});

const DUPLICATE_EMAIL = "A representative with this email already exists.";
const isDuplicateKey = (error) => error?.code === 11000;

// ক্রম: ছোট position আগে, একই হলে যে আগে যোগ হয়েছে সে
const ORDER = { position: 1, createdAt: 1 };

/* GET /api/representatives — public */
export async function getRepresentatives(req, res, next) {
  try {
    const docs = await representatives().find({ active: true }).sort(ORDER).toArray();

    /* admin বদলালে সর্বোচ্চ ~১ মিনিটে নতুন তথ্য দেখা যায় (CDN) */
    res.set(
      "Cache-Control",
      "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
    );
    res.json({ regions: groupByRegion(docs) });
  } catch (error) {
    next(error);
  }
}

/* GET /api/representatives/admin/list — সব + territory র তালিকা + সংখ্যা */
export async function adminListRepresentatives(req, res, next) {
  try {
    const docs = await representatives().find({}).sort(ORDER).toArray();
    const items = docs.map(adminShape);

    res.set("Cache-Control", "no-store");
    res.json({
      representatives: items,
      territories: territoryOptions(),
      counts: {
        total: items.length,
        active: items.filter((item) => item.active).length,
        inactive: items.filter((item) => !item.active).length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* POST /api/representatives */
export async function createRepresentative(req, res, next) {
  try {
    await ensureIndexes();

    const { value, error } = cleanRepresentative(req.body);
    if (error) return res.status(400).json({ message: error });

    /* position না দিলে সবার শেষে (সবচেয়ে বড় + 10) */
    if (value.position === undefined) {
      const [last] = await representatives()
        .find({}, { projection: { position: 1 } })
        .sort({ position: -1 })
        .limit(1)
        .toArray();
      value.position = (typeof last?.position === "number" ? last.position : 0) + 10;
    }

    const now = new Date();
    const doc = {
      ...value,
      createdAt: now,
      updatedAt: now,
      createdBy: who(req.admin),
      updatedBy: who(req.admin),
    };

    try {
      const result = await representatives().insertOne(doc);
      doc._id = result.insertedId;
    } catch (insertError) {
      if (isDuplicateKey(insertError)) {
        return res.status(409).json({ message: DUPLICATE_EMAIL });
      }
      throw insertError;
    }

    await logActivity(req.admin, "representative.create", {
      representativeId: doc._id.toString(),
      name: `${doc.company} — ${doc.person}`,
    });

    res.status(201).json({ representative: adminShape(doc) });
  } catch (error) {
    next(error);
  }
}

/* PATCH /api/representatives/:id — শুধু পাঠানো ঘরগুলো বদলায় */
export async function updateRepresentative(req, res, next) {
  try {
    await ensureIndexes();

    const _id = toObjectId(req.params.id);
    const existing = _id ? await representatives().findOne({ _id }) : null;
    if (!existing) return res.status(404).json({ message: "Representative not found" });

    const { value, error } = cleanRepresentative(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });

    const changes = { ...value, updatedAt: new Date(), updatedBy: who(req.admin) };

    let updated;
    try {
      updated = await representatives().findOneAndUpdate(
        { _id },
        { $set: changes },
        { returnDocument: "after" },
      );
    } catch (updateError) {
      if (isDuplicateKey(updateError)) {
        return res.status(409).json({ message: DUPLICATE_EMAIL });
      }
      throw updateError;
    }
    // driver এর সংস্করণ ভেদে ফল সরাসরি আসে বা .value তে
    const doc = updated?.value !== undefined ? updated.value : updated;

    /* শুধু "সাইটে দেখাও / লুকাও" বদলালে আলাদা নামে লেখা — Activity
       Logs এ খুঁজে পাওয়া সহজ হয় */
    const action =
      typeof value.active === "boolean" && value.active !== (existing.active !== false)
        ? value.active
          ? "representative.activate"
          : "representative.deactivate"
        : "representative.update";

    await logActivity(req.admin, action, {
      representativeId: _id.toString(),
      name: `${doc.company} — ${doc.person}`,
    });

    res.json({ representative: adminShape(doc) });
  } catch (error) {
    next(error);
  }
}

/* DELETE /api/representatives/:id */
export async function deleteRepresentative(req, res, next) {
  try {
    const _id = toObjectId(req.params.id);
    const existing = _id ? await representatives().findOne({ _id }) : null;
    if (!existing) return res.status(404).json({ message: "Representative not found" });

    await representatives().deleteOne({ _id });

    await logActivity(req.admin, "representative.delete", {
      representativeId: _id.toString(),
      name: `${existing.company} — ${existing.person}`,
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}