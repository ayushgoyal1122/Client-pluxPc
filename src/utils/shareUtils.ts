import type { Product } from "../types";

export interface ShareData {
  url: string;
  title: string;
  text: string;
  description: string;
  whatsappUrl: string;
  facebookUrl: string;
  twitterUrl: string;
}

/**
 * Builds canonical share URLs and pre-formatted text for a product.
 */
export function getProductShareData(product: Product): ShareData {
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "http://localhost:5173";

  const url = `${origin}/products/${product.slug}`;
  const title = product.name;
  const description =
    product.description ||
    product.overview ||
    `Check out ${product.name} on PLUXPC!`;

  const priceText = product.price
    ? ` for ₹${Number(product.price).toLocaleString("en-IN")}`
    : "";
  const text = `Check out ${product.name}${priceText} on PLUXPC!`;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return {
    url,
    title,
    text,
    description,
    whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`,
    facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    twitterUrl: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
  };
}

/**
 * Reliable clipboard copy with standard Clipboard API and legacy fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("[Clipboard API failed, attempting fallback]:", err);
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (fallbackErr) {
    console.error("[Clipboard copy fallback failed]:", fallbackErr);
    return false;
  }
}

/**
 * Checks whether the Web Share API is supported in the current context.
 */
export function isNativeShareSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    (typeof navigator.canShare !== "function" || navigator.canShare({ url: "https://pluxpc.com" }))
  );
}

/**
 * Dispatches native Web Share dialog if supported.
 * Returns true if shared, false if canceled or failed.
 */
export async function shareProductNative(product: Product): Promise<boolean> {
  if (!isNativeShareSupported()) return false;

  const data = getProductShareData(product);
  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    });
    return true;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      // User dismissed the native dialog
      return false;
    }
    console.warn("[Native Web Share error]:", err);
    return false;
  }
}
