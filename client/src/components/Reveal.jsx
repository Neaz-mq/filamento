import { useEffect, useRef, useState } from "react";
import "./Reveal.css";

/* ---------------------------------------------------------------
   Reveal — scroll করে section এ পৌঁছালে নিচ থেকে উপরে উঠে আসে

   ব্যবহার:
     <Reveal><Fixtures /></Reveal>
     <Reveal delay={150}><Comparison /></Reveal>     (ms)

   কীভাবে কাজ করে:
     ১. শুরুতে wrapper টা অদৃশ্য আর একটু নিচে (Reveal.css)
     ২. IntersectionObserver দেখে section টা পর্দার নিচের দিক
        দিয়ে ঢুকেছে কিনা
     ৩. ঢুকলে "is-visible" বসে → CSS transition চলে
     ৪. একবার চললে observer বন্ধ — উপরে-নিচে scroll করলে আর
        বারবার চলবে না

   threshold 0 + নিচে 12% এর rootMargin: section এর মাথা পর্দার
   নিচ থেকে 12% ভেতরে এলেই শুরু. threshold এর শতাংশ ধরলে খুব
   লম্বা section (ফোনে) কখনো শুরুই হতো না
   --------------------------------------------------------------- */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // খুব পুরনো ব্রাউজার — animation বাদ, সরাসরি দেখাও
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        /* top < 0 মানে section টা পর্দার উপরে চলে গেছে — যেমন
           #contact এ লাফ দিলে মাঝের section গুলো উপরে থেকে যায়.
           সেগুলো লুকিয়ে রাখার মানে নেই, উপরে ফিরলে ফাঁকা দেখাত */
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export default Reveal;