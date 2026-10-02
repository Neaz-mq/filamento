import SharedCategoryArt, {
  CategoryPicture as SharedCategoryPicture,
} from "../../components/products/CategoryArt";

/* ===============================================================
   হাতে আঁকা category র ছবি — আসল কোড এখন
   components/products/CategoryArt.jsx এ, কারণ সাইটের Products পাতাও
   এটা ব্যবহার করে. admin এর পুরনো import গুলো (ProductLibrary,
   CategoryModal) যেন না ভাঙে, তাই এখানে শুধু সেটাকেই ব্যবহার করা
   ছোট দুইটা component
   =============================================================== */

export function CategoryPicture(props) {
  return <SharedCategoryPicture {...props} />;
}

function CategoryArt(props) {
  return <SharedCategoryArt {...props} />;
}

export default CategoryArt;
