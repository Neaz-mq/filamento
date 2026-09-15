import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LocaleLayout from "./routes/LocaleLayout";
import Home from "./pages/Home";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./i18n";

/* নতুন পাতা শুধু এখানে যোগ করবেন — তিনটা ভাষার জন্য তিনবার লেখার
   দরকার নেই, নিচের map নিজেই তিনটা বানিয়ে নেয় */
const PAGES = [
  { index: true, element: <Home /> },
  // { path: "products", element: <Products /> },
  // { path: "products/:slug", element: <ProductDetail /> },
];

/* ইংরেজি prefix ছাড়া ("/products"), বাকি দুইটা prefix সহ
   ("/ja/products", "/zh-Hant/products")।

   ইংরেজিকে prefix ছাড়া রাখছি কারণ ওটাই প্রধান বাজার — US-made
   industrial LED. এতে মূল URL গুলো পরিষ্কার থাকে আর root এ কোনো
   redirect লাগে না */
const router = createBrowserRouter(
  LANGUAGES.map((language) => ({
    path: language.code === DEFAULT_LANGUAGE ? "/" : `/${language.code}`,
    element: <LocaleLayout lang={language.code} />,
    children: PAGES,
  })),
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
