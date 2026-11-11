import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { buildFixturesView, cloudinaryUrl, isCloudinary, useHomeContent } from "../lib/homeContent";

/* ===============================================================
   /home এর product card — মূল Home এর Fixtures এর একই তিনটা

   মূল পাতার মতোই admin এর "Featured Products" থেকে আসে
   (buildFixturesView), তাই admin এ product বদলালে এখানেও বদলায়.
   প্রতিটা card এর `to` হলো product এর পাতা (/products/:slug).
   server না পেলে আগের তিনটা (la1, ls1, rh1) — আগের মতোই

   cloud (ছবির মাপ) এ e_trim লাগে শুধু ফাঁকা margin ওয়ালা ছবিতে
   =============================================================== */
export function imageAt(image, width) {
  if (!image?.url) return "";
  return isCloudinary(image.url)
    ? cloudinaryUrl(image.url, `${image.trim ? "e_trim/" : ""}c_limit,w_${width},f_auto,q_auto`)
    : image.url;
}

export function imageSetAt(image, widths) {
  if (!image?.url || !isCloudinary(image.url)) return undefined;
  return widths.map((w) => `${imageAt(image, w)} ${w}w`).join(", ");
}

export default function useFeaturedCards() {
  const { t, i18n } = useTranslation();
  const { content } = useHomeContent();

  return useMemo(
    () =>
      buildFixturesView(content?.featured, {
        t,
        en: i18n.getFixedT("en"),
        has: (key) => i18n.exists(key, { lng: "en" }),
      }).cards,
    [content, t, i18n],
  );
}
