import { useState } from "react";
import Loader from "../components/Loader";
import Hero from "../components/Hero";
import Brands from "../components/Brands";
import Fixtures from "../components/Fixtures";
import Comparison from "../components/Comparison";
import Technologies from "../components/Technologies";
import Testimonial from "../components/Testimonial";
import Contact from "../components/Contact";

const INTRO_KEY = "filamento_intro_played";

function Home() {
  const alreadyPlayed = sessionStorage.getItem(INTRO_KEY) === "true";

  const [loading, setLoading] = useState(!alreadyPlayed);
  const [contentVisible, setContentVisible] = useState(alreadyPlayed);

  // flag টা animation শেষ হলে বসছে, mount এ নয় — কেউ ২ সেকেন্ডে
  // refresh দিলে সে intro টা আবার দেখবে
  const handleComplete = () => {
    sessionStorage.setItem(INTRO_KEY, "true");
    setLoading(false);
  };

  return (
    <>
      {loading && (
        <Loader
          onRevealContent={() => setContentVisible(true)}
          onComplete={handleComplete}
        />
      )}

      {/* পর্দা উপরে সরার সাথে সাথে content ৩২px নিচ থেকে উঠে আসে */}
      <div
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? "translateY(0)" : "translateY(32px)",
          transition:
            "opacity 0.9s ease 0.1s, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.1s",
        }}
      >
        {/* পর্দা পুরো উঠে যাওয়ার পরে লাইট জ্বলে — পর্দা সরার মাঝপথে
            জ্বললে ঝিলিকটা চোখেই পড়ত না. intro আগে চলে গেলে loading
            শুরু থেকেই false, তখন পাতা খুলতেই জ্বলে */}
        <Hero lightsOn={!loading} />
        <Brands />
        <Fixtures />
        <Comparison />
        <Technologies />
        <Testimonial />
        <Contact />
      </div>
    </>
  );
}

export default Home;