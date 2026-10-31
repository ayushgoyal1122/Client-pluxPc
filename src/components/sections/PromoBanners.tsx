import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { IMG } from "../../data/products";
import { handleImageError } from "../../utils";

const CAMPAIGNS = [
  {
    id: "cp1",
    tag: "AUDIO COLLECTION",
    headline: "Your Sound.\nYour World.",
    sub: "Premium ANC headphones engineered for every journey.",
    cta: "Shop Headphones",
    link: "/products?category=headphones",
    image: IMG.promo1,
    bg: "#111827",
    accent: "#E8FF00",
  },
  {
    id: "cp2",
    tag: "POWER SERIES",
    headline: "Power Your\nEveryday.",
    sub: "Fast-charging power banks and wireless pads that keep up.",
    cta: "Shop Power",
    link: "/products?category=powerbanks",
    image: IMG.promo2,
    bg: "#1e1b4b",
    accent: "#a78bfa",
  },
];

export default function PromoBanners() {
  return (
    <section className="py-10 border-t border-gray-100">
      <div className="vx-container grid md:grid-cols-2 gap-5">
        {CAMPAIGNS.map((c) => (
          <div
            key={c.id}
            className="relative overflow-hidden rounded-2xl flex items-center min-h-[220px]"
            style={{ background: c.bg }}
          >
            {/* Background image */}
            <img
              src={c.image}
              alt={c.headline}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-40"
              loading="lazy"
              onError={(e) => handleImageError(e, c.tag || "PLUXPC Promo")}
            />
            {/* Content */}
            <div className="relative z-10 p-8 flex flex-col gap-3">
              <span
                className="text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded w-fit"
                style={{ background: c.accent + "22", color: c.accent, border: `1px solid ${c.accent}44` }}
              >
                {c.tag}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-[-0.01em] whitespace-pre-line">
                {c.headline}
              </h3>
              <p className="text-white/60 text-[13px] max-w-[260px]">{c.sub}</p>
              <Link
                to={c.link}
                className="mt-2 w-fit flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-full transition-all duration-150 hover:gap-3"
                style={{ background: c.accent, color: "#111" }}
              >
                {c.cta} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Full-width banner */}
      <div className="vx-container mt-5">
        <div
          className="relative overflow-hidden rounded-2xl min-h-[180px] flex items-center"
          style={{ background: "linear-gradient(135deg, #E31E24 0%, #7f0000 100%)" }}
        >
          <img
            src={IMG.hero1}
            alt="Built for your next move"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
            onError={(e) => handleImageError(e, "PLUXPC BUILT")}
          />
          <div className="relative z-10 p-8 md:p-12 max-w-xl">
            <p className="text-white/70 text-xs font-semibold tracking-widest uppercase mb-2">PLUXPC BUILT SERIES</p>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-[-0.01em] mb-4">
              Built for Your<br />Next Move.
            </h3>
            <Link to="/products" className="btn-volt-outline text-sm">
              Explore All Products <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

