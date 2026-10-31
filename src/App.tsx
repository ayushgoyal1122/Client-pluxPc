import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import WishlistPage from "./pages/WishlistPage";
import NotFoundPage from "./pages/NotFoundPage";
import { StorefrontProvider } from "./context/StorefrontContext";
import { CustomerAuthProvider } from "./context/CustomerAuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

// Placeholder page component for secondary storefront pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="vx-container py-24 text-gray-400 text-center">
    <p className="text-lg font-medium">{title} — coming soon</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CustomerAuthProvider>
        <CartProvider>
          <WishlistProvider>
            <StorefrontProvider>
              <Routes>
                <Route element={<RootLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/:slug" element={<ProductDetailPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="order-success/:orderId" element={<OrderSuccessPage />} />
                  <Route path="orders" element={<MyOrdersPage />} />
                  <Route path="orders/:orderId/track" element={<OrderTrackingPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="categories" element={<Placeholder title="Categories Page" />} />
                  <Route path="deals" element={<Placeholder title="Deals Page" />} />
                  <Route path="gifting" element={<Placeholder title="Gifting Store" />} />
                  <Route path="about" element={<Placeholder title="About PLUXPC" />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="blog/:id" element={<Placeholder title="Blog Post" />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </StorefrontProvider>
          </WishlistProvider>
        </CartProvider>
      </CustomerAuthProvider>
    </BrowserRouter>
  );
}
