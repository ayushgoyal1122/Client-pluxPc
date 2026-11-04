import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, ChevronDown } from "lucide-react";

interface FooterLink {
  name: string;
  href: string;
  isExternal?: boolean;
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

const FOOTER_COLS: FooterColumn[] = [
  {
    heading: "Shop",
    links: [
      { name: "All Products", href: "/products" },
      { name: "True Wireless Earbuds", href: "/products?category=earbuds" },
      { name: "Neckbands", href: "/products?category=neckbands" },
      { name: "Smart Watches", href: "/products?category=smartwatches" },
      { name: "Wireless Headphones", href: "/products?category=headphones" },
      { name: "Wireless Speakers", href: "/products?category=speakers" },
      { name: "Soundbars", href: "/products?category=soundbars" },
      { name: "Power Banks", href: "/products?category=powerbanks" },
      { name: "Projectors", href: "/products?category=projectors" },
    ],
  },
  {
    heading: "Customer Support",
    links: [
      { name: "Track My Order", href: "/orders" },
      { name: "Returns & Refunds", href: "/terms-and-conditions" },
      { name: "Warranty Policy", href: "/terms-and-conditions" },
      { name: "FAQ", href: "/faq" },
      { name: "Contact Us", href: "mailto:support@pluxpc.com", isExternal: true },
    ],
  },
  {
    heading: "Legal",
    links: [
      { name: "Terms & Conditions", href: "/terms-and-conditions" },
      { name: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  // Mobile accordion: "Shop" open by default on mobile
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Shop: true,
    "Customer Support": false,
    Legal: false,
  });

  const toggleSection = (heading: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [heading]: !prev[heading],
    }));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitted(true);
    setEmail("");
    setTimeout(() => setSubmitted(false), 5000);
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
    <footer className="bg-gray-950 text-white border-t border-gray-800">
      {/* ── Newsletter strip ── */}
      <div className="border-b border-gray-800">
        <div className="vx-container py-8 sm:py-10 flex flex-col md:flex-row items-center gap-6 justify-between text-center md:text-left">
          <div className="max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-1 tracking-tight">Stay in the loop</h3>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              Get exclusive deals, launch alerts, and tech news straight to your inbox.
            </p>
          </div>
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
          >
            <div className="flex-1 w-full">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-volt-yellow transition-colors"
              />
              {error && <p className="text-red-400 text-xs mt-1 text-left">{error}</p>}
            </div>
            <button
              type="submit"
              className="btn-volt flex-shrink-0 py-3 px-5 w-full sm:w-auto justify-center"
            >
              Subscribe <ArrowRight size={15} />
            </button>
          </form>
          {submitted && (
            <div className="flex items-center justify-center gap-2 text-green-400 text-xs sm:text-sm font-medium">
              <CheckCircle size={16} /> Thanks! You&apos;re subscribed.
            </div>
          )}
        </div>
      </div>

      {/* ── Main footer grid ── */}
      <div className="vx-container py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand column */}
          <div className="space-y-4 pb-4 md:pb-0 border-b border-gray-800/70 md:border-b-0">
            <Link
              to="/"
              onClick={handleLogoClick}
              className="inline-flex items-center cursor-pointer transition-opacity hover:opacity-90"
              title="PLUXPC Home"
            >
              <div className="bg-white px-2.5 py-1.5 rounded-lg shadow-sm">
                <img
                  src="/pluxpc-logo.png"
                  alt="PLUXPC logo"
                  className="h-6 w-auto object-contain"
                />
              </div>
            </Link>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Premium electronics engineered for those who demand the best.
            </p>
            <div className="text-xs text-gray-500 pt-1">
              <span className="text-gray-400 font-medium">Customer Support:</span>{" "}
              <a
                href="mailto:support@pluxpc.com"
                className="text-gray-400 hover:text-white transition-colors underline decoration-gray-700 underline-offset-2"
              >
                support@pluxpc.com
              </a>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => {
            const isOpen = !!openSections[col.heading];
            return (
              <div
                key={col.heading}
                className="border-b border-gray-800/70 md:border-b-0 pb-3 md:pb-0 last:border-b-0"
              >
                {/* Mobile accordion toggle button */}
                <button
                  type="button"
                  onClick={() => toggleSection(col.heading)}
                  className="w-full flex md:hidden items-center justify-between py-2 text-left focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                    {col.heading}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>

                {/* Desktop static heading */}
                <h4 className="hidden md:block text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                  {col.heading}
                </h4>

                {/* Collapsible list on mobile, always visible on tablet/desktop */}
                <ul
                  className={`space-y-2 pt-1 pb-2 md:pt-0 md:pb-0 transition-all duration-200 ${
                    isOpen ? "block" : "hidden md:block"
                  }`}
                >
                  {col.links.map((link) => (
                    <li key={link.name}>
                      {link.isExternal ? (
                        <a
                          href={link.href}
                          className="text-[13px] sm:text-sm text-gray-400 hover:text-white transition-colors block py-1 touch-manipulation"
                        >
                          {link.name}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-[13px] sm:text-sm text-gray-400 hover:text-white transition-colors block py-1 touch-manipulation"
                        >
                          {link.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-gray-800/80 bg-black/30">
        <div className="vx-container py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left text-[12px] text-gray-500">
          <p>© 2026 PLUXPC Electronics Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-5">
            <Link
              to="/terms-and-conditions"
              className="hover:text-white transition-colors py-1 touch-manipulation"
            >
              Terms & Conditions
            </Link>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <Link
              to="/privacy-policy"
              className="hover:text-white transition-colors py-1 touch-manipulation"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
