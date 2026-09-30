import crypto from "node:crypto";

/* ===============================================================
   Cloudinary — ছবি, video আর document রাখার জায়গা

   ফাইল server এর ভেতর দিয়ে যায় না. browser সরাসরি Cloudinary তে
   পাঠায়, server শুধু একটা "অনুমতিপত্র" (signature) দেয়.
   কারণ Vercel এর function এ একটা request এ সর্বোচ্চ ~4.5MB ঢোকে —
   100MB এর video এর ভেতর দিয়ে যাওয়া অসম্ভব.

   অনুমতিপত্র বানাতে API secret লাগে, আর সেটা শুধু server এ থাকে.
   তাই login করা admin ছাড়া কেউ আমাদের Cloudinary তে কিছু তুলতে
   পারে না.

   Vercel এ (API প্রজেক্টে) তিনটা env variable লাগবে:
     CLOUDINARY_CLOUD_NAME   dzi3u164c
     CLOUDINARY_API_KEY      Cloudinary → Settings → API Keys
     CLOUDINARY_API_SECRET   একই জায়গায় (কাউকে দেখাবেন না)
   =============================================================== */

export const cloudinaryConfig = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || "",
  apiKey: process.env.CLOUDINARY_API_KEY?.trim() || "",
  apiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || "",
});

export const cloudinaryReady = () => {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  return Boolean(cloudName && apiKey && apiSecret);
};

/* Cloudinary র নিয়ম: parameter গুলো নামের ক্রমে সাজিয়ে
   a=1&b=2 বানিয়ে শেষে secret জুড়ে SHA-1.
   file, api_key, resource_type, cloud_name সই এর মধ্যে পড়ে না */
export function signParams(params) {
  const { apiSecret } = cloudinaryConfig();

  const toSign = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}

/* একটা জিনিস মুছে ফেলা. ব্যর্থ হলে শুধু সতর্কবার্তা — product মোছা
   আটকায় না (Cloudinary তে একটা বাড়তি ফাইল থেকে যাওয়া বড় ক্ষতি নয়) */
export async function destroyAsset({ publicId, resourceType = "image" }) {
  if (!cloudinaryReady() || !publicId) return false;

  const { cloudName, apiKey } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { invalidate: "true", public_id: publicId, timestamp };

  const form = new URLSearchParams({
    ...params,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature: signParams(params),
  });

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      { method: "POST", body: form },
    );
    const body = await response.json().catch(() => ({}));
    return body.result === "ok";
  } catch (error) {
    console.warn("⚠️ Cloudinary delete failed:", publicId, error.message);
    return false;
  }
}
