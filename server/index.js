import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB, closeDB } from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

/* production এ এটা নির্দিষ্ট origin এ restrict করবেন, যেমন:
   cors({ origin: process.env.CLIENT_URL }) */
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Filamento API is running...");
});

app.use("/api/products", productRoutes);

/* ---------- 404 ----------
   আগে অজানা route এ Express এর default HTML error page আসত, JSON না —
   frontend এ res.json() করতে গিয়ে parse error খেতেন */
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

/* ---------- global error handler ----------
   চারটা argument থাকতেই হবে, নাহলে Express একে error handler হিসেবে
   চিনবে না। next অব্যবহৃত হলেও রাখতে হয়। */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("💥", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await closeDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer();
