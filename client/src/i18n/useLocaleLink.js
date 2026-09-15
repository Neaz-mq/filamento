import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, localePath } from "../i18n";

/* সব internal <Link> এ এটা ব্যবহার করতে হবে।

   না করলে: কেউ /ja/products এ আছে, navbar এর "会社概要" এ ক্লিক
   করল, আর হঠাৎ /company তে গিয়ে ইংরেজি দেখতে পেল — কারণ সাধারণ
   <Link to="/company"> ভাষার prefix টা জানে না */
export function useLocaleLink() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? DEFAULT_LANGUAGE;

  return (path) => localePath(current, path);
}
