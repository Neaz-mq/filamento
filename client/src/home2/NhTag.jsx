/* ===============================================================
   section এর শুরুর ছোট চিহ্ন — Figma "Frame 2147227679"

   বাঁয়ে 40px গোল বৃত্তে নম্বর, পাশে গোল কোণার pill এ নাম.
   tone:
     "yellow" — হলুদ বৃত্ত, হলুদ রেখা, কালো লেখা (বেশিরভাগ section)
     "black"  — কালো বৃত্তে সাদা নম্বর, কালো রেখা (Why Choose Us —
                হলুদ পটভূমিতে হলুদ চিহ্ন দেখা যেত না)
     "night"  — হলুদ বৃত্ত আর রেখা, সাদা লেখা (Contact এর কালো ছবিতে)
   =============================================================== */
function NhTag({ number, label, tone = "yellow", className = "", ...rest }) {
  return (
    <p className={`nh-tag nh-tag--${tone} ${className}`} {...rest}>
      <span className="nh-tag-num" aria-hidden="true">
        {number}
      </span>
      <span className="nh-tag-label">{label}</span>
    </p>
  );
}

export default NhTag;
