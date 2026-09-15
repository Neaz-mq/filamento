import app from "./app.js";
import { closeDB } from "./config/db.js";

/* এই ফাইলটা শুধু local dev এর জন্য — `npm run dev` এটাই চালায়।

   Vercel এ এটা চলে না, কারণ serverless এ কোনো port থাকে না।
   ওখানে api/index.js সরাসরি app টাকে export করে দেয় */

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// nodemon বারবার restart করলে connection জমে যায়
const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    await closeDB();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
