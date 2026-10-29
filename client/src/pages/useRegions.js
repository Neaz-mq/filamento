import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { FALLBACK_REGIONS, buildRegions } from "./representatives";

/* ===============================================================
   Representative দের তালিকা — server (API) থেকে

   GET /api/representatives → শুধু active লোক, অঞ্চল → territory →
   representative সাজানো. admin এর Representatives পাতায় যা বদলানো
   হয়, সাইটে সেটাই দেখায়.

   ✅ ভরসার বিকল্প — পাতা কখনো ফাঁকা বা ভাঙা থাকে না:
     • server না চললে / error দিলে → representatives.js এর বাঁধা তালিকা
     • server কোনো territory ই না পাঠালে (ফাঁকা) → ওই বাঁধা তালিকা
       (admin এ সবাইকে Hidden করা হলেও territory গুলো আসে, তাই সেটা
       "ফাঁকা" নয় — তখন Filamento র নিজের contact card দেখায়)

   ⚡ cache — সফল হওয়া তালিকা ১ মিনিট মনে রাখে. একই ট্যাবে /shop আর
   /find-a-representative এর মধ্যে ঘুরলে আবার "Loading" দেখায় না, আর
   বারবার request ও যায় না. ১ মিনিট পেরোলে পুরনো তালিকাটাই সাথে সাথে
   দেখিয়ে পেছনে নতুনটা এনে বদলে দেয়. ব্যর্থ হওয়া কখনো cache হয় না
   =============================================================== */

const CACHE_MS = 60_000;

let cache = null; // { regions, at }
let inflight = null; // চলমান request — একসাথে দুইবার ডাকলে একটাই যায়

const isFresh = () => cache !== null && Date.now() - cache.at < CACHE_MS;

// শুধু test এর জন্য
export function resetRegionsCache() {
  cache = null;
  inflight = null;
}

function load() {
  if (inflight) return inflight;

  inflight = api
    .getRepresentatives()
    // server সরাসরি { regions: [...] } পাঠায়; সরাসরি তালিকা এলেও চলে
    .then((data) => buildRegions(data?.regions ?? data))
    .then((regions) => {
      if (!regions.some((region) => region.territories.length)) {
        throw new Error("The server sent no territories");
      }
      cache = { regions, at: Date.now() };
      return regions;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/* { regions, loading }
   loading থাকাকালীন regions = বাঁধা তালিকা (পাতা এটা দেখায় না — শুধু
   "Loading" দেখায়, তাই ভুল তথ্য এক ঝলকও দেখা যায় না) */
export function useRegions() {
  const [state, setState] = useState(() =>
    cache ? { regions: cache.regions, loading: false } : { regions: FALLBACK_REGIONS, loading: true },
  );

  useEffect(() => {
    if (isFresh()) return undefined;

    let cancelled = false;

    load()
      .then((regions) => {
        if (!cancelled) setState({ regions, loading: false });
      })
      .catch((error) => {
        console.warn("[representatives] Using the built-in list —", error.message);
        // আগের তালিকা থাকলে সেটাই থাক; না থাকলে বাঁধা তালিকা
        if (!cancelled) {
          setState((current) =>
            current.loading ? { regions: FALLBACK_REGIONS, loading: false } : current,
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}