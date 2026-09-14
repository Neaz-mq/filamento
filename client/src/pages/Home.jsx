import { useLayoutEffect, useRef, useState } from "react";
import Loader from "../components/Loader";

const INTRO_KEY = "filamento_intro_played";

function Home() {
  const alreadyPlayed = sessionStorage.getItem(INTRO_KEY) === "true";

  const [loading, setLoading] = useState(!alreadyPlayed);
  const [contentVisible, setContentVisible] = useState(alreadyPlayed);

  // ref দিয়ে track করছি flag টা এই component instance এ lock হয়েছে কিনা,
  // যাতে StrictMode এর double-effect এও দ্বিতীয়বার re-lock না হয়
  const hasLockedIntro = useRef(false);

  // useLayoutEffect ব্যবহার করছি কারণ এটা render এর পর, কিন্তু browser
  // কিছু paint করার আগেই synchronously চলে — তাই এটাই সবচেয়ে early,
  // "pure" জায়গা এই flag write করার জন্য (render body এর ভেতরে নয়)
  useLayoutEffect(() => {
    if (!alreadyPlayed && !hasLockedIntro.current) {
      hasLockedIntro.current = true;
      sessionStorage.setItem(INTRO_KEY, "true");
    }
  }, [alreadyPlayed]);

  const handleComplete = () => {
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

      <div style={{ opacity: contentVisible ? 1 : 0 }}>
        <h1 className="text-3xl font-bold text-center py-10">
          Home Page (Filamento)
        </h1>
      </div>
    </>
  );
}

export default Home;