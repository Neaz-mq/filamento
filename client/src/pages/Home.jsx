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

      {/* পর্দা উপরে সরার সাথে সাথে content টা 32px নিচ থেকে উঠে আসে।
          দুইটা layer আলাদা গতিতে চলায় গভীরতা তৈরি হয় — শুধু fade
          করলে সব একই সমতলে আটকে থাকত */}
      <div
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? "translateY(0)" : "translateY(32px)",
          transition:
            "opacity 0.9s ease 0.1s, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.1s",
        }}
      >
        <h1 className="text-3xl font-bold text-center py-10">
          Home Page (Filamento)
        </h1>
      </div>
    </>
  );
}

export default Home;