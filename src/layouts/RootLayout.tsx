import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function RootLayout() {
  const location = useLocation();
  const hideNavbar = /^\/(login|register)\/?$/.test(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!hideNavbar && <Navbar />}
      <main className="flex-1 flex flex-col w-full min-w-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
