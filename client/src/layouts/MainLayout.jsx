import { Outlet } from "react-router-dom";

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar পরে বসবে এখানে */}
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Footer পরে বসবে এখানে */}
    </div>
  );
}

export default MainLayout;
