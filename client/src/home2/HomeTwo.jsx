import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Loader from "../components/Loader";

/* Manrope — Figma র font. npm থেকে নিজের সাইটেই রাখা (Google Fonts
   এ আলাদা request নেই), আর শুধু এই পাতার chunk এ নামে — মূল
   landing page এর ওজন একটুও বাড়ে না */
import "@fontsource-variable/manrope";
import "./HomeTwo.css";

import NhHeader from "./NhHeader";
import NhHero from "./NhHero";
import NhAbout from "./NhAbout";
import NhFixtures from "./NhFixtures";
import NhTechnology from "./NhTechnology";
import NhChoose from "./NhChoose";
import NhContact from "./NhContact";
import NhTestimonials from "./NhTestimonials";
import NhLayoutCta from "./NhLayoutCta";
import NhFooter from "./NhFooter";
import { useReveal } from "./motion";

/* ===============================================================
   নতুন Home — /home  (/ja/home, /zh-Hant/home)

   Figma র দ্বিতীয় landing page. মূল পাতা ("/") অক্ষত থাকে — boss
   দুইটা পাশাপাশি দেখে বেছে নেবেন. এই পাতার header আর footer নিজের,
   মূল সাইটের Navbar/Footer এখানে আসে না (App.jsx দেখুন).

   section এর ক্রম Figma র মতো:
     Hero → About → Fixtures → Technology → Why Choose Us →
     Contact → Testimonials → Lighting Layout → Footer

   সব লেখা locales/*.json এর "home2" অংশে (তিন ভাষায়) — যেগুলো মূল
   পাতার সাথে হুবহু এক সেগুলো মূল পাতার key থেকেই আসে

   ✅ boss এই পাতা বেছে নিলে: App.jsx এ index route টা HomeTwo তে
   দিয়ে দিলেই "/" এ এটা চলে আসবে
   =============================================================== */

/* ---------------------------------------------------------------
   শুরুর intro — মূল পাতার সেই একই Loader (logo জ্বলে, হলুদ আলো
   ছড়িয়ে পর্দা ভরে, তারপর পর্দা উপরে উঠে যায়).

   একই browser tab এ একবারই চলে (sessionStorage). key মূল পাতার থেকে
   আলাদা — boss আগে মূল পাতা দেখলেও এখানে প্রথমবার এলে intro দেখবেন.

   intro চলার সময় hero র animation (লেখা ওঠা, ছবির zoom) থেমে থাকে
   (data-intro, HomeTwo.css দেখুন) — পর্দা ওঠার সাথে সাথে শুরু হয়,
   নাহলে পর্দার পেছনেই শেষ হয়ে যেত আর দর্শক দেখতেই পেতেন না
   --------------------------------------------------------------- */
const INTRO_KEY = "filamento_home2_intro_played";

// কিছু browser এ sessionStorage throw করে — তখন intro প্রতিবার চলবে
const readIntroPlayed = () => {
  try {
    return sessionStorage.getItem(INTRO_KEY) === "true";
  } catch {
    return false;
  }
};

const writeIntroPlayed = () => {
  try {
    sessionStorage.setItem(INTRO_KEY, "true");
  } catch {
    // রাখা গেল না — পরের বার intro আবার চলবে
  }
};

function HomeTwo() {
  const { t } = useTranslation();
  const rootRef = useRef(null);

  const [alreadyPlayed] = useState(readIntroPlayed);
  // loading — Loader পাতায় আছে;  waiting — পর্দা এখনো ওঠেনি
  const [loading, setLoading] = useState(!alreadyPlayed);
  const [waiting, setWaiting] = useState(!alreadyPlayed);

  /* flag টা animation পুরো শেষ হলে বসে, শুরুতে নয় — মাঝপথে কেউ
     refresh দিলে intro আবার দেখবে */
  const handleIntroComplete = () => {
    writeIntroPlayed();
    setLoading(false);
  };

  // header কালো হবে কখন — পাতার একদম উপরের অদৃশ্য দাগটা সরলে
  const sentinelRef = useRef(null);

  useReveal(rootRef);

  // ট্যাবের শিরোনাম — পাতা ছাড়লে আগেরটা ফেরত
  useEffect(() => {
    const previous = document.title;
    document.title = `${t("home2.meta.title")} | Filamento`;
    return () => {
      document.title = previous;
    };
  }, [t]);

  return (
    <div className="nh-page" ref={rootRef} data-intro={waiting ? "" : undefined}>
      {loading && (
        <Loader
          onRevealContent={() => setWaiting(false)}
          onComplete={handleIntroComplete}
        />
      )}

      <div className="nh-sentinel" ref={sentinelRef} aria-hidden="true" />
      <NhHeader sentinelRef={sentinelRef} />

      <main>
        <NhHero />
        <NhAbout />
        <NhFixtures />
        <NhTechnology />
        <NhChoose />
        <NhContact />
        <NhTestimonials />
        <NhLayoutCta />
      </main>

      <NhFooter />
    </div>
  );
}

export default HomeTwo;
