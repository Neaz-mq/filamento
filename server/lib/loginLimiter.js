import { getDB } from "../config/db.js";

/* ===============================================================
   ভুল password এর সীমা — কেউ অনুমান করে করে password খুঁজতে
   না পারে (brute force).

   গণনা MongoDB তে রাখা, memory তে নয় — Vercel এ অনেকগুলো server
   instance একসাথে চলে, memory তে রাখলে প্রতিটা আলাদা গুনত.
   15 মিনিট পরে MongoDB নিজেই পুরনো রেকর্ড মুছে দেয় (TTL index).

   দুই রকম সীমা:
     একটা ইমেইলে  — 15 মিনিটে 5 বার ভুল  (একজন admin কে লক্ষ্য করে)
     একটা IP থেকে — 15 মিনিটে 20 বার ভুল (এক জায়গা থেকে অনেক ইমেইল)
   =============================================================== */

const ATTEMPTS = "login_attempts";
const WINDOW_SECONDS = 15 * 60;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

let indexesReady;

const ensureIndexes = () => {
  if (!indexesReady) {
    const collection = getDB().collection(ATTEMPTS);
    indexesReady = Promise.all([
      collection.createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: WINDOW_SECONDS },
      ),
      collection.createIndex({ key: 1, createdAt: 1 }),
    ]).catch((error) => {
      indexesReady = undefined;
      throw error;
    });
  }
  return indexesReady;
};

const since = () => new Date(Date.now() - WINDOW_SECONDS * 1000);

/* true হলে আটকানো — login এর চেষ্টাই করা হবে না */
export async function isLoginBlocked(ip, email) {
  await ensureIndexes();
  const collection = getDB().collection(ATTEMPTS);
  const after = since();

  const [emailCount, ipCount] = await Promise.all([
    email
      ? collection.countDocuments({ key: `email:${email}`, createdAt: { $gt: after } })
      : 0,
    collection.countDocuments({ key: `ip:${ip}`, createdAt: { $gt: after } }),
  ]);

  return emailCount >= MAX_PER_EMAIL || ipCount >= MAX_PER_IP;
}

export async function recordFailedLogin(ip, email) {
  await ensureIndexes();
  const createdAt = new Date();
  const docs = [{ key: `ip:${ip}`, createdAt }];
  if (email) docs.push({ key: `email:${email}`, createdAt });
  await getDB().collection(ATTEMPTS).insertMany(docs);
}

/* সফল login — ওই ইমেইলের পুরনো ভুলগুলো মুছে যায়
   (IP এর গণনা থাকে, যাতে একটা সঠিক account দিয়ে সীমা ফাঁকি দেওয়া না যায়) */
export async function clearFailedLogins(email) {
  await getDB().collection(ATTEMPTS).deleteMany({ key: `email:${email}` });
}

export const RETRY_AFTER_SECONDS = WINDOW_SECONDS;