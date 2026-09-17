import { useEffect } from "react";
import { ScrollRestoration, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MainLayout from "../layouts/MainLayout";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  localePath,
  stripLocale,
} from "../i18n";

/* এই ধরনের tag গুলো head এ আগে থেকে থাকে না, তাই খুঁজে না পেলে
   বানিয়ে নিচ্ছি। পরে ভাষা বদলালে একই node গুলোই আপডেট হয় */
function upsertLink(key, attrs) {
  const selector = `link[data-i18n="${key}"]`;
  let node = document.head.querySelector(selector);

  if (!node) {
    node = document.createElement("link");
    node.dataset.i18n = key;
    document.head.appendChild(node);
  }

  for (const [name, value] of Object.entries(attrs)) {
    node.setAttribute(name, value);
  }
}

function LocaleLayout({ lang }) {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();

  // URL ই ভাষার একমাত্র উৎস, তাই route বদলালে i18n মিলিয়ে নিচ্ছি
  useEffect(() => {
    if (i18n.resolvedLanguage !== lang) i18n.changeLanguage(lang);
  }, [i18n, lang]);

  /* <html lang> তিনটা কারণে জরুরি: screen reader সঠিক উচ্চারণে পড়ে,
     browser এর translate prompt এটা দেখে ঠিক করে অনুবাদের প্রস্তাব
     দেবে কিনা, আর index.css এর CJK font stack এটার উপরেই নির্ভর করে */
  useEffect(() => {
    const entry = LANGUAGES.find((l) => l.code === lang);
    document.documentElement.lang = entry?.htmlLang ?? DEFAULT_LANGUAGE;
  }, [lang]);

  /* hreflang — Google কে বলে দেয় একই পাতার অন্য ভাষার সংস্করণ কোথায়।
     এটা না থাকলে তিনটা সংস্করণকে duplicate content ধরে একটাকেই
     index করত।

     x-default হলো "ভাষা না মিললে এইটা দেখাও" — আমাদের ক্ষেত্রে ইংরেজি */
  useEffect(() => {
    const basePath = stripLocale(pathname);
    const origin = window.location.origin;

    for (const language of LANGUAGES) {
      upsertLink(`alternate-${language.code}`, {
        rel: "alternate",
        hreflang: language.htmlLang,
        href: origin + localePath(language.code, basePath),
      });
    }

    upsertLink("alternate-default", {
      rel: "alternate",
      hreflang: "x-default",
      href: origin + localePath(DEFAULT_LANGUAGE, basePath),
    });

    upsertLink("canonical", {
      rel: "canonical",
      href: origin + localePath(lang, basePath),
    });
  }, [lang, pathname]);

  /* ScrollRestoration (React Router এর নিজের):
     - নতুন পাতায় গেলে উপর থেকে শুরু — আগে আগের পাতার মাঝখান
       থেকেই নতুন পাতা খুলত
     - back/forward চাপলে আগের জায়গায় ফেরে
     - ঠিকানায় #contact এর মতো hash থাকলে সেই section এ যায় */
  return (
    <>
      <ScrollRestoration />
      <MainLayout />
    </>
  );
}

export default LocaleLayout;