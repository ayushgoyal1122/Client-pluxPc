import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Share2, Music, Video } from "lucide-react";

const FOOTER_COLS = [
  {
    heading: "Shop",
    links: ["True Wireless Earbuds", "Neckbands", "Smart Watches", "Wireless Headphones", "Wireless Speakers", "Soundbars", "Power Banks", "Projectors"],
  },
  {
    heading: "Help",
    links: ["Help Center", "Track My Order", "Returns & Refunds", "Warranty Policy", "Contact Us", "FAQ"],
  },
  {
    heading: "Company",
    links: [
      { name: "About PLUXPC", href: "/about" },
      { name: "Careers", href: "#" },
      { name: "Press & Media", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Admin Portal", href: "/admin/login" },
    ],
  },
  {
    heading: "Policy",
    links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Shipping Policy", "Cancellation Policy"],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

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
        <div className="vx-container py-10 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1 tracking-tight">Stay in the loop</h3>
            <p className="text-gray-400 text-sm">Get exclusive deals, launch alerts, and tech news straight to your inbox.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm
                           placeholder-gray-500 focus:outline-none focus:border-volt-yellow transition-colors"
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            </div>
            <button type="submit" className="btn-volt flex-shrink-0 py-3">
              Subscribe <ArrowRight size={15} />
            </button>
          </form>
          {submitted && (
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <CheckCircle size={16} /> Thanks! You&apos;re subscribed.
            </div>
          )}
        </div>
      </div>

      {/* ── Main footer grid ── */}
      <div className="vx-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              onClick={handleLogoClick}
              className="inline-flex items-center mb-4 cursor-pointer"
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
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Premium electronics engineered for those who demand the best.
              Sound. Power. Style.
            </p>
            <div className="flex gap-3">
              {[Share2, Music, Video].map((Icon, i) => (
                <button key={i} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l: any) => {
                  const label = typeof l === "string" ? l : l.name;
                  const href = typeof l === "string" ? "#" : l.href;
                  return (
                    <li key={label}>
                      {href.startsWith("/") ? (
                        <Link to={href} className="text-[13px] text-gray-400 hover:text-white transition-colors">
                          {label}
                        </Link>
                      ) : (
                        <a href={href} className="text-[13px] text-gray-400 hover:text-white transition-colors">
                          {label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-gray-800">
        <div className="vx-container py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] text-gray-500">
          <p>© 2026 PLUXPC Electronics Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            {["Privacy Policy", "Terms of Service", "Cookie Settings"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
