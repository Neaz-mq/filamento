import { useState } from "react";
import Loader from "../components/Loader";

const INTRO_KEY = "filamento_intro_played";

function Home() {
  const alreadyPlayed = sessionStorage.getItem(INTRO_KEY) === "true";

  const [loading, setLoading] = useState(!alreadyPlayed);
  const [contentVisible, setContentVisible] = useState(alreadyPlayed);

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

      <div style={{ opacity: contentVisible ? 1 : 0 }}>
        <h1 className="text-3xl font-bold text-center py-10">
          Home Page (Filamento)
        </h1>
      </div>
    </>
  );
}

export default Home;
