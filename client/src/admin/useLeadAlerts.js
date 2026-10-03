import { useEffect, useState } from "react";
import { api } from "../lib/api";

/* ===============================================================
   নতুন quote request — 🔔 আর বাঁ মেনুর Leads এর সংখ্যার জন্য

   প্রতি মিনিটে একবার server কে জিজ্ঞেস করা হয়, কিন্তু শুধু tab টা
   চোখের সামনে থাকলে — পেছনের tab অযথা request পাঠায় না. tab এ
   ফিরলেই সাথে সাথে একবার.

   উত্তর: { canSeeLeads, newCount, items, generatedAt } অথবা null
   (প্রথম উত্তর আসার আগে, বা server এ পৌঁছানো না গেলে)
   =============================================================== */

const EVERY_MS = 60 * 1000;

export function useLeadAlerts() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;

    const load = () => {
      if (document.visibilityState !== "visible") return;
      api
        .adminNotifications()
        .then((result) => {
          if (alive) setData(result);
        })
        .catch(() => {
          // চুপচাপ — পরের মিনিটে আবার চেষ্টা. আগের সংখ্যা থেকে যায়
        });
    };

    load();
    const timer = window.setInterval(load, EVERY_MS);
    document.addEventListener("visibilitychange", load);

    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  return data;
}
