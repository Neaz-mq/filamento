import { api } from "../../lib/api";
import { UPLOADS } from "./catalog";

/* ===============================================================
   ফাইল তোলা — browser থেকে সরাসরি Cloudinary তে

   ধাপ:
     ১. আমাদের server এর কাছে অনুমতিপত্র চাওয়া (/api/uploads/sign)
     ২. ফাইল + অনুমতিপত্র Cloudinary তে পাঠানো
     ৩. Cloudinary ফেরত দেয় ঠিকানা (secure_url), public_id, মাপ …

   fetch এর বদলে XMLHttpRequest — কারণ fetch এ upload এর অগ্রগতি
   (কত % গেল) জানা যায় না, 100MB এর video তে progress bar ছাড়া
   admin বুঝতেই পারত না কিছু হচ্ছে কি না
   =============================================================== */

const extensionOf = (name = "") => name.split(".").pop()?.toLowerCase() ?? "";

/* তোলার আগেই পরীক্ষা — ভুল ধরন বা খুব বড় হলে Cloudinary পর্যন্ত
   যাওয়ার দরকার নেই. সমস্যা থাকলে বার্তা, না থাকলে "" */
/* একই নিয়মের অন্য নাম — project এর ছবি আলাদা ফোল্ডারে যায়,
   কিন্তু ধরন আর মাপের নিয়ম product এর ছবির মতোই */
const SAME_RULE = { "project-image": "image" };

export function checkFile(file, kind) {
  const rule = UPLOADS[SAME_RULE[kind] ?? kind];
  if (!file || !rule) return "Choose a file.";

  if (!rule.extensions.includes(extensionOf(file.name))) {
    return `“${file.name}” is not a supported file. Allowed: ${rule.extensions
      .join(", ")
      .toUpperCase()}.`;
  }

  if (file.size > rule.maxBytes) {
    const limit = Math.round(rule.maxBytes / (1024 * 1024));
    return `“${file.name}” is larger than ${limit} MB.`;
  }

  return "";
}

/* onProgress(0..100) — upload চলার সময় বারবার ডাকা হয়.
   signal দিয়ে মাঝপথে বাতিল করা যায় (Cancel চাপলে) */
export async function uploadFile(file, kind, { onProgress, signal } = {}) {
  const problem = checkFile(file, kind);
  if (problem) throw new Error(problem);

  const sign = await api.signUpload(kind);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("signature", sign.signature);
  for (const [key, value] of Object.entries(sign.params)) {
    form.append(key, String(value));
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${sign.cloudName}/${sign.resourceType}/upload`;

  const result = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // উত্তর JSON না — নিচে সাধারণ বার্তা
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else {
        reject(
          new Error(body?.error?.message || `Upload failed (${xhr.status}).`),
        );
      }
    };

    xhr.onerror = () =>
      reject(new Error("Upload failed. Check your internet connection."));
    xhr.onabort = () => reject(Object.assign(new Error("Upload cancelled."), { cancelled: true }));

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(form);
  });

  onProgress?.(100);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes ?? file.size,
    format: (result.format || extensionOf(file.name)).toLowerCase(),
    width: result.width ?? null,
    height: result.height ?? null,
    duration: result.duration ?? null,
    resourceType: result.resource_type,
    originalName: file.name,
  };
}

/* Cloudinary video থেকে ছোট ছবি — ১ সেকেন্ডের ফ্রেম, 16:9.
   অন্য সাইটের video হলে ফাঁকা (তখন ধূসর ঘর আর ▶ দেখায়) */
export function videoThumbnail(url) {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) {
    return "";
  }
  return url
    .replace("/video/upload/", "/video/upload/so_1,w_400,h_224,c_fill,q_auto/")
    .replace(/\.[a-z0-9]+(\?.*)?$/i, ".jpg");
}

/* বাইরের video link এর দৈর্ঘ্য — browser নিজে শুধু শুরুর অংশ নামিয়ে
   মেপে দেয়. না পারলে null (link ভুল বা সাইট আটকে দিয়েছে) */
export function readVideoDuration(url) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const done = (value) => {
      video.removeAttribute("src");
      video.load();
      resolve(value);
    };
    const timer = window.setTimeout(() => done(null), 8000);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      window.clearTimeout(timer);
      done(Number.isFinite(video.duration) ? video.duration : null);
    };
    video.onerror = () => {
      window.clearTimeout(timer);
      done(null);
    };
    video.src = url;
  });
}

/* Cloudinary ছবি ছোট করে — তালিকার ৪৮px ঘরে ২০০০px ছবি নামানোর
   মানে নেই. অন্য সাইটের ছবি যেমন আছে তেমনই */
export function thumb(url, width = 160) {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }
  return url.replace("/image/upload/", `/image/upload/c_limit,w_${width},f_auto,q_auto/`);
}

// ঠিকানা ঠিক আছে কি না — শুধু https
export function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
