import app from "../app.js";

/* Vercel এর Node runtime default export টাকে (req, res) দিয়ে ডাকে।
   Express app নিজেই একটা (req, res) function, তাই সরাসরি export
   করলেই চলে — আলাদা adapter লাগে না।

   vercel.json এর rewrite সব request কে এখানে পাঠায়, কিন্তু আসল
   path (যেমন /api/products) req.url এ অক্ষত থাকে — তাই Express এর
   route গুলো যেমন আছে তেমনই কাজ করে */
export default app;
