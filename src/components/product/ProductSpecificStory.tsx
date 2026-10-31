import {
  Sparkles,
  Box,
  ShieldCheck,
  Cpu,
  Zap,
  Activity,
  Check,
  Radio,
  Sliders,
  Tv,
  Scissors,
  BatteryCharging,
  Smartphone,
} from "lucide-react";
import type { Product } from "../../types";

interface ProductSpecificStoryProps {
  product: Product;
}

// Icon helper for highlights
function renderHighlightIcon(iconName?: string) {
  switch ((iconName || "").toLowerCase()) {
    case "cpu":
    case "processor":
      return <Cpu className="w-5 h-5 text-volt-red" />;
    case "battery":
    case "power":
      return <BatteryCharging className="w-5 h-5 text-volt-red" />;
    case "display":
    case "screen":
    case "projector":
      return <Tv className="w-5 h-5 text-volt-red" />;
    case "trimmer":
    case "blade":
      return <Scissors className="w-5 h-5 text-volt-red" />;
    case "audio":
    case "sound":
    case "anc":
      return <Radio className="w-5 h-5 text-volt-red" />;
    case "control":
    case "dial":
      return <Sliders className="w-5 h-5 text-volt-red" />;
    case "smart":
    case "sensor":
      return <Activity className="w-5 h-5 text-volt-red" />;
    case "zap":
      return <Zap className="w-5 h-5 text-volt-red" />;
    default:
      return <Sparkles className="w-5 h-5 text-volt-red" />;
  }
}

export default function ProductSpecificStory({ product }: ProductSpecificStoryProps) {
  if (!product) return null;

  const hasOverview = Boolean(product.overview || product.description);
  const hasKeyFeatures = Boolean(product.keyFeatures && product.keyFeatures.length > 0);
  const hasHighlights = Boolean(product.highlights && product.highlights.length > 0);
  const hasUseCases = Boolean(product.useCases && product.useCases.length > 0);
  const hasInTheBox = Boolean(product.inTheBox && product.inTheBox.length > 0);
  const hasCompatibility = Boolean(product.compatibility && product.compatibility.length > 0);
  const specsEntries = product.specs ? Object.entries(product.specs).filter(([_, v]) => Boolean(v && v.trim())) : [];
  const hasSpecs = specsEntries.length > 0;

  // If literally no specific data exists, return null
  if (!hasOverview && !hasKeyFeatures && !hasHighlights && !hasUseCases && !hasSpecs && !hasInTheBox) {
    return null;
  }

  return (
    <section
      aria-label={`${product.name} Specifications and Story`}
      className="border-t border-gray-100 pt-12 sm:pt-16 mb-16 space-y-12 sm:space-y-16"
    >
      {/* ── Section Header ── */}
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-volt-red text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles size={13} />
          <span>Product Deep Dive</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
          Everything You Need to Know About {product.name}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">
          Genuine specifications, features, and engineering engineered exclusively for this model.
        </p>
      </div>

      {/* ── Visual Highlights Grid (Icon Cards) ── */}
      {hasHighlights && product.highlights && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">
            Visual Highlights
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {product.highlights.map((h, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100/90 hover:border-gray-200 transition-colors shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200/70 flex items-center justify-center mb-3 shadow-2xs">
                    {renderHighlightIcon(h.icon)}
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{h.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{h.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Overview & Key Features (2 Columns on large screens) ── */}
      {(hasOverview || hasKeyFeatures) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Overview Story */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
              Product Overview
            </h3>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-50/50 border border-gray-100 shadow-2xs">
              <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-normal">
                {product.overview || product.description}
              </p>
              {product.featureTag && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Signature Trait:</span>
                  <span className="text-xs font-bold text-volt-red bg-red-50 px-2.5 py-1 rounded-md">
                    {product.featureTag}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Key Features List */}
          {hasKeyFeatures && product.keyFeatures && (
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
                Key Features
              </h3>
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-3">
                {product.keyFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={13} strokeWidth={3} />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-800 leading-snug">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Technical Specifications Table ── */}
      {hasSpecs && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
              Technical Specifications
            </h3>
            <span className="text-[11px] font-medium text-gray-400">
              Model: {product.name}
            </span>
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-gray-100">
            {/* Standard identity specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 sm:p-4 text-xs bg-gray-50/50">
              <span className="font-semibold text-gray-500">Brand</span>
              <span className="sm:col-span-2 font-bold text-gray-950">PLUXPC Official</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 sm:p-4 text-xs">
              <span className="font-semibold text-gray-500">Category</span>
              <span className="sm:col-span-2 font-medium text-gray-900">{product.categoryLabel}</span>
            </div>

            {/* Product-specific dynamic specs */}
            {specsEntries.map(([key, value]) => (
              <div key={key} className="grid grid-cols-1 sm:grid-cols-3 p-3.5 sm:p-4 text-xs hover:bg-gray-50/40 transition-colors">
                <span className="font-semibold text-gray-500">{key}</span>
                <span className="sm:col-span-2 font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Benefits & Use Cases (if provided) ── */}
      {hasUseCases && product.useCases && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
            Engineered For Your Routine
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {product.useCases.map((uc, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-sm transition-all"
              >
                {uc.badge && (
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider text-volt-red bg-red-50 px-2 py-0.5 rounded mb-2">
                    {uc.badge}
                  </span>
                )}
                <h4 className="text-sm font-bold text-gray-900 mb-1.5">{uc.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Grid: What's in the Box + Compatibility + Warranty ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* In the Box */}
        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200/80 flex items-center justify-center text-gray-700">
                <Box size={16} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                In The Box
              </h4>
            </div>
            {hasInTheBox && product.inTheBox ? (
              <ul className="space-y-2">
                {product.inTheBox.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-volt-red flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-600">
                1x {product.name}, 1x User Manual & Documentation, 1x Warranty Registration Card.
              </p>
            )}
          </div>
        </div>

        {/* Compatibility */}
        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200/80 flex items-center justify-center text-gray-700">
                <Smartphone size={16} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Compatibility
              </h4>
            </div>
            {hasCompatibility && product.compatibility ? (
              <div className="flex flex-wrap gap-1.5">
                {product.compatibility.map((c, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium bg-white text-gray-800 px-2.5 py-1 rounded-md border border-gray-200/70"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600">
                Universally compatible with modern Android, iOS, Windows, and macOS devices.
              </p>
            )}
          </div>
        </div>

        {/* Warranty & Support */}
        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200/80 flex items-center justify-center text-gray-700">
                <ShieldCheck size={16} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Warranty & Support
              </h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
              {product.warrantyDetails ||
                "1-Year Official Brand Warranty covering manufacturing defects with door-step pickup and replacement assistance."}
            </p>
            <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block">
              100% Genuine PLUXPC Product
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
