import readline from "node:readline";
import bcrypt from "bcryptjs";
import { closeDB, connectDB } from "../config/db.js";
import {
  ADMINS,
  destroyAllSessions,
  ensureAuthIndexes,
  normalizeEmail,
} from "../lib/auth.js";

/* ===============================================================
   Admin তৈরি — terminal থেকে (সাইটে কোনো sign up পাতা নেই)

   server ফোল্ডারে:
     npm run create-admin -- --email you@filamento.com --name "Your Name"

   password জিজ্ঞেস করবে (টাইপ করার সময় দেখা যাবে না).
   ভূমিকা (role) না দিলে "owner" — সব কিছু করতে পারে.
     --role owner | admin | editor

   একই ইমেইলে আবার চালালে password বদলে যায় (ভুলে গেলে কাজে লাগে)
   =============================================================== */

const ROLES = ["owner", "admin", "editor"];
const MIN_PASSWORD = 12;

/* --email x  বা  --email=x  দুইভাবেই চলে.

   ⚠️ npm কখনো কখনো --email আর --name কে নিজের setting মনে করে খেয়ে
   ফেলে (Windows এর PowerShell এ বিশেষ করে). তখন script এর কাছে শুধু
   মানগুলো পৌঁছায়:

     node scripts/create-admin.js neazmorshed666@gmail.com Neaz

   তাই flag না পেলে অবশিষ্ট শব্দগুলো থেকেই বুঝে নেওয়া হয় — যেটাতে
   @ আছে সেটা ইমেইল, শেষেরটা যদি বৈধ role হয় সেটা role, বাকিটা নাম.
   ফলে `npm run create-admin` আর `node scripts/create-admin.js`
   দুইভাবেই কাজ করে */
const parseArgs = (argv) => {
  const flags = {};
  const loose = [];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("--")) {
      loose.push(token);
      continue;
    }

    const equals = token.indexOf("=");

    if (equals > -1) {
      // --email=x
      flags[token.slice(2, equals)] = token.slice(equals + 1);
      continue;
    }

    // --email x  (পরের শব্দটা আরেকটা flag হলে মান ধরা হয় না)
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags[token.slice(2)] = next;
      i += 1;
    }
  }

  if (!flags.email) {
    const index = loose.findIndex((value) => value.includes("@"));
    if (index > -1) flags.email = loose.splice(index, 1)[0];
  }

  if (!flags.name && loose.length) {
    /* "Neaz Morshed" quote হারিয়ে দুই শব্দ হয়ে যেতে পারে — তাই
       শেষের শব্দটা শুধু তখনই role, যখন সেটা সত্যিই একটা বৈধ role */
    if (!flags.role && loose.length > 1 && ROLES.includes(loose.at(-1))) {
      flags.role = loose.pop();
    }
    flags.name = loose.join(" ");
  }

  return flags;
};

// টাইপ করা অক্ষর পর্দায় দেখায় না
const askHidden = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.stdoutMuted = false;
    rl._writeToOutput = (text) => {
      if (!rl.stdoutMuted || text.includes("\n")) rl.output.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    rl.stdoutMuted = true;
  });

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = normalizeEmail(args.email);
  const name = (args.name ?? "").trim();
  const role = args.role ?? "owner";

  const usage =
    'ব্যবহার: node scripts/create-admin.js --email you@filamento.com --name "Your Name"';

  if (!email || !email.includes("@")) {
    throw new Error(`ইমেইল পাওয়া যায়নি.\n   ${usage}`);
  }
  if (!name) throw new Error(`নাম পাওয়া যায়নি.\n   ${usage}`);
  if (!ROLES.includes(role)) {
    throw new Error(`role হবে এগুলোর একটা: ${ROLES.join(", ")}`);
  }

  // CI বা script থেকে চালালে ADMIN_PASSWORD env দিয়েও দেওয়া যায়
  const password =
    process.env.ADMIN_PASSWORD ?? (await askHidden("Password: "));
  if (password.length < MIN_PASSWORD) {
    throw new Error(`password অন্তত ${MIN_PASSWORD} অক্ষরের হতে হবে`);
  }
  if (!process.env.ADMIN_PASSWORD) {
    const again = await askHidden("আবার password: ");
    if (again !== password) throw new Error("দুইটা password মেলেনি");
  }

  const db = await connectDB();
  await ensureAuthIndexes();

  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await db
    .collection(ADMINS)
    .updateOne(
      { email },
      {
        $set: { name, role, passwordHash, status: "active", updatedAt: now },
        $setOnInsert: { email, createdAt: now },
      },
      { upsert: true },
    );

  /* পুরনো admin এর password বদলালে — আগের সব login বাতিল.
     password ফাঁস হয়ে থাকলে যে ঢুকে বসে আছে, সেও বেরিয়ে যায় */
  if (!result.upsertedCount) {
    const admin = await db.collection(ADMINS).findOne({ email });
    await destroyAllSessions(admin._id);
  }

  console.log(
    result.upsertedCount
      ? `✅ নতুন admin তৈরি হয়েছে: ${email} (${role})`
      : `✅ ${email} এর তথ্য ও password বদলানো হয়েছে`,
  );
}

main()
  .catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => closeDB().catch(() => {}));