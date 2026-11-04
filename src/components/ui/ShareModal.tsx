import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, Share2 } from "lucide-react";
import type { Product } from "../../types";
import { formatPrice, handleImageError } from "../../utils";
import {
  getProductShareData,
  copyToClipboard,
  isNativeShareSupported,
  shareProductNative,
} from "../../utils/shareUtils";

interface ShareModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ product, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const shareData = getProductShareData(product);
  const nativeAvailable = isNativeShareSupported();

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareData.url);
    if (success) {
      setCopied(true);
      setToastMessage("Product link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setToastMessage("Failed to copy link. Please copy manually.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleNativeShare = async () => {
    const shared = await shareProductNative(product);
    if (shared) {
      onClose();
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-gray-700">
            <Check size={14} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Modal Dialog Box */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#C5C9D0] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-all duration-200 animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-volt-red flex items-center justify-center">
              <Share2 size={16} />
            </div>
            <div>
              <h3 id="share-modal-title" className="text-sm font-bold text-gray-900">
                Share this Product
              </h3>
              <p className="text-[11px] text-gray-500">Spread the word with your friends</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Product Snippet Preview */}
        <div className="p-4 sm:p-5 bg-gray-50/70 border-b border-[#E5E7EB] flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white border border-[#E5E7EB] p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => handleImageError(e, product.categoryLabel || product.name)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 truncate">
              {product.categoryLabel || "PLUXPC"}
            </p>
            <h4 className="text-xs font-bold text-gray-900 truncate leading-snug">
              {product.name}
            </h4>
            <p className="text-xs font-extrabold text-volt-red mt-0.5">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>

        {/* Sharing Channels Grid */}
        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Share via
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {/* WhatsApp */}
            <a
              href={shareData.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-[#25D366] hover:bg-emerald-50/50 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-1.5">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.587 1.961.933 2.796.933 3.183 0 5.769-2.587 5.77-5.767.001-3.182-2.585-5.769-5.77-5.769zm3.376 8.204c-.149.419-.747.788-1.02.837-.266.048-.597.072-1.895-.466-1.579-.654-2.593-2.261-2.672-2.366-.079-.105-.64-.852-.64-1.624 0-.773.407-1.153.551-1.309.144-.156.315-.195.42-.195.105 0 .21 0 .301.006.097.005.226-.037.353.268.132.316.452 1.102.492 1.183.04.082.067.177.013.284-.053.106-.08.172-.159.265-.079.094-.167.21-.238.282-.08.081-.162.169-.07.327.092.158.409.674.877 1.091.603.537 1.111.704 1.269.783.158.079.25.066.342-.04.093-.105.396-.462.502-.62.106-.158.211-.132.355-.079.144.053.914.431 1.071.51.157.079.262.118.301.185.039.066.039.385-.11.804z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-gray-800">WhatsApp</span>
            </a>

            {/* Facebook */}
            <a
              href={shareData.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Facebook"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-[#1877F2] hover:bg-blue-50/50 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-1.5">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-gray-800">Facebook</span>
            </a>

            {/* X / Twitter */}
            <a
              href={shareData.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on X (Twitter)"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-gray-900 hover:bg-gray-100/50 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-1.5">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-gray-800">X (Twitter)</span>
            </a>

            {/* Native Share (Device Sheet) */}
            {nativeAvailable && (
              <button
                type="button"
                onClick={handleNativeShare}
                aria-label="Share via device options"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-volt-red hover:bg-red-50/50 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-1.5">
                  <Share2 size={16} />
                </div>
                <span className="text-[11px] font-semibold text-gray-800">More</span>
              </button>
            )}
          </div>

          {/* Copy Link Input Bar */}
          <div className="pt-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Copy Product Link
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={shareData.url}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:border-gray-900 font-mono truncate"
                />
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex-shrink-0 ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
