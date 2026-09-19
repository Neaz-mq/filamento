import { useEffect, useState } from "react";

/* ===============================================================
   চলন্ত ঘড়ি

   icon টা আর ছবি নয় — দেয়াল ঘড়ির মতো সত্যিকারের কাঁটা. ঘণ্টা আর
   মিনিটের কাঁটা যন্ত্রের সময় ধরে ঘোরে, সেকেন্ডের কাঁটা হলুদ.

   কাঁটাগুলো ঘোরানো হয় SVG র rotate দিয়ে, ছবি বদলে নয় — তাই
   প্রতি সেকেন্ডে নতুন কিছু আঁকতে হয় না, শুধু কোণটা বদলায়.

   যে ব্যবহারকারী নড়াচড়া কম চান (prefers-reduced-motion), তার
   জন্য সেকেন্ডের কাঁটা থাকে না আর ঘড়ি প্রতি আধ মিনিটে একবার
   নড়ে — লেখা সময়টা তবু ঠিকই থাকে
   =============================================================== */

function ClockFace({ date, withSeconds }) {
  const hours = date.getHours() % 12;
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  /* ১২ ঘণ্টায় ৩৬০° → ঘণ্টায় ৩০°, সাথে মিনিটের জন্য আধ ডিগ্রি করে,
     নাহলে কাঁটাটা ঘণ্টার ঘরে আটকে থেকে লাফিয়ে যেত */
  const hourTurn = hours * 30 + minutes * 0.5;
  const minuteTurn = minutes * 6 + seconds * 0.1;
  const secondTurn = seconds * 6;

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* ঘণ্টা */}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="7.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        transform={`rotate(${hourTurn} 12 12)`}
      />

      {/* মিনিট */}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="5.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        transform={`rotate(${minuteTurn} 12 12)`}
      />

      {/* সেকেন্ড — brand এর হলুদ */}
      {withSeconds && (
        <line
          x1="12"
          y1="13.4"
          x2="12"
          y2="5.2"
          stroke="#f7be00"
          strokeWidth="1"
          strokeLinecap="round"
          transform={`rotate(${secondTurn} 12 12)`}
        />
      )}

      <circle cx="12" cy="12" r="1.05" fill="currentColor" />
    </svg>
  );
}

function AdminClock() {
  // একবারই দেখা — পরে প্রতি render এ আবার জিজ্ঞেস করার দরকার নেই
  const [calm] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const every = calm ? 30000 : 1000;
    const timer = window.setInterval(() => setNow(new Date()), every);
    return () => window.clearInterval(timer);
  }, [calm]);

  /* সময়টা টুকরো করে নেওয়া হচ্ছে — মাঝের ":" টা আলাদা করে ধরতে
     হবে, ওটাই digital ঘড়ির মতো জ্বলে-নেভে.

     স্ট্রিং কেটে ":" খোঁজা হয়নি ইচ্ছে করেই: সব দেশে সময়ের চিহ্ন
     ":" নয় (কোথাও "."), আবার কোথাও AM/PM থাকে না. formatToParts
     যন্ত্রের নিজের নিয়মেই টুকরোগুলো দিয়ে দেয় */
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(now);

  return (
    <span className="adm-chip" title={now.toLocaleString()}>
      <ClockFace date={now} withSeconds={!calm} />

      <span className="adm-clock-time">
        {parts.map((part, index) =>
          part.type === "literal" && part.value.trim() ? (
            <span
              className="adm-clock-colon"
              key={`${part.type}-${index}`}
            >
              {part.value}
            </span>
          ) : (
            <span key={`${part.type}-${index}`}>{part.value}</span>
          ),
        )}
      </span>
    </span>
  );
}

export default AdminClock;