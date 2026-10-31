import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ShoppingBag, Heart, ChevronDown, Menu, X, User, LogOut, Package
} from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../hooks/useWishlist";
import { useStorefront } from "../../context/StorefrontContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { handleImageError } from "../../utils";

export default function Navbar() {
  const { categories: shopCategories } = useStorefront();
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const { itemCount } = useCart();
  const { count: wishCount } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const navigate = useNavigate();
  const catRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close category & user dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    const heroEl = document.getElementById("hero");
    if (heroEl) {
      e.preventDefault();
      heroEl.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* ── Main nav row ── */}
      <nav className="vx-container h-[60px] flex items-center justify-between gap-4">
        {/* Left: Logo + Categories */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Logo */}
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center flex-shrink-0 cursor-pointer py-1"
            title="PLUXPC Home"
          >
            <img
              src="/pluxpc-logo.png"
              alt="PLUXPC logo"
              className="h-8 sm:h-9 w-auto max-w-[150px] sm:max-w-[170px] object-contain"
            />
          </Link>

          {/* Categories dropdown */}
          <div className="hidden lg:block relative" ref={catRef}>
            <button
              onClick={() => setCatOpen((o) => !o)}
              className="flex items-center gap-1 px-3 py-2 text-[14px] font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
            >
              Categories <ChevronDown size={14} className={`transition-transform ${catOpen ? "rotate-180" : ""}`} />
            </button>
            {catOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2">
                {shopCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.slug}`}
                    onClick={() => setCatOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-[13px] text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-8 h-8 object-cover rounded"
                      onError={(e) => handleImageError(e, cat.name)}
                    />
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Search Bar + 2 Icons (Wishlist & Cart) */}
        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center w-64 lg:w-72 xl:w-80">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder='Search "Speakers"'
                className="w-full pl-9 pr-4 py-2 text-[13px] bg-gray-100 rounded-full border border-transparent
                           focus:outline-none focus:border-gray-300 focus:bg-white transition-all"
              />
            </div>
          </form>

          {/* 2 Icons */}
          <div className="flex items-center gap-1">
            <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors" aria-label="Wishlist">
              <Heart size={20} />
              {wishCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-volt-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishCount > 9 ? "9+" : wishCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors" aria-label="Cart">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-volt-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {/* Customer Login / Account Button */}
            {isAuthenticated && customer ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors ml-1 cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-volt-red text-white flex items-center justify-center text-[10px] font-extrabold flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate">{customer.name.split(" ")[0]}</span>
                  <ChevronDown size={12} className={`text-gray-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 divide-y divide-gray-100">
                    <div className="px-4 py-2">
                      <p className="text-xs font-bold text-gray-900 truncate">{customer.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{customer.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <Package size={14} className="text-gray-500" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        to="/cart"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ShoppingBag size={14} className="text-gray-500" />
                          My Cart
                        </span>
                        {itemCount > 0 && (
                          <span className="bg-volt-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            {itemCount}
                          </span>
                        )}
                      </Link>
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left font-medium"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors ml-1 cursor-pointer"
              >
                <User size={14} />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          {/* Mobile Customer Auth Header */}
          {isAuthenticated && customer ? (
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-volt-red text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-900 leading-tight truncate">{customer.name}</p>
                  <p className="text-[10px] text-gray-500 leading-tight truncate">{customer.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <span className="text-xs text-gray-600 font-medium">Customer Account</span>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-3.5 py-1.5 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <User size={12} />
                <span>Login / Register</span>
              </Link>
            </div>
          )}

          {isAuthenticated && customer && (
            <div className="px-5 py-2 border-b border-gray-100 flex items-center gap-4 text-xs font-semibold text-gray-700 bg-white">
              <Link
                to="/orders"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 hover:text-gray-900"
              >
                <Package size={14} className="text-gray-500" />
                <span>My Orders</span>
              </Link>
              <Link
                to="/cart"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 hover:text-gray-900"
              >
                <ShoppingBag size={14} className="text-gray-500" />
                <span>My Cart ({itemCount})</span>
              </Link>
            </div>
          )}

          {/* Mobile search */}
          <form onSubmit={handleSearch} className="px-4 py-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-gray-100 rounded-full border border-transparent focus:outline-none focus:border-gray-300"
              />
            </div>
          </form>
          {/* Mobile nav links */}
          <div className="pb-4">
            {shopCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-5 py-3 text-[14px] text-gray-700 hover:bg-gray-50 border-b border-gray-50"
              >
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-8 h-8 object-cover rounded"
                  onError={(e) => handleImageError(e, cat.name)}
                />
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
