import { useState, useEffect, useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Calendar,
  Clock,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  ChevronRight,
  Mail,
  HelpCircle,
  AlertCircle,
  Home,
  ArrowRight,
} from "lucide-react";
import { getPublicLegalPage } from "../services/api";
import type { LegalPage } from "../types";

interface LegalContentPageProps {
  slug: "terms-and-conditions" | "privacy-policy";
}

export default function LegalContentPage({ slug }: LegalContentPageProps) {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDraftOrNotFound, setIsDraftOrNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const fallbackTitle =
    slug === "terms-and-conditions"
      ? "Terms & Conditions"
      : "Privacy Policy";

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsDraftOrNotFound(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    getPublicLegalPage(slug)
      .then((res: any) => {
        if (!isMounted) return;
        const pageData = res?.page || res?.data;
        if (res && res.success && pageData) {
          setPage(pageData);
          document.title = `${pageData.title || fallbackTitle} | PLUXPC Electronics`;
        } else {
          setIsDraftOrNotFound(true);
        }
      })
      .catch((err) => {
        console.warn(`[LegalContent] Page not published or error for ${slug}:`, err);
        if (isMounted) setIsDraftOrNotFound(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, fallbackTitle]);

  // Read time calculation (approx 200 words per minute)
  const readTimeMinutes = useMemo(() => {
    if (!page?.content) return 4;
    const words = page.content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [page?.content]);

  // Format updated date
  const formattedDate = useMemo(() => {
    if (!page?.updatedAt) {
      return new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return new Date(page.updatedAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [page?.updatedAt]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper for inline markdown: bold, italic, bold+italic, code, underline, strikethrough, links
  const renderInlineStyles = (text: string): ReactNode => {
    const tokens = text.split(
      /(\[.+?\]\(.+?\)|\*\*\*.+?\*\*\*|___.+?___|\*\*.+?\*\*|__.+?__|~~.+?~~|<u>.+?<\/u>|`[^`]+?`|\*[^*]+?\*|_[^_]+?_)/g
    );

    return tokens.map((token, i) => {
      if (!token) return null;

      // Link: [label](url)
      const linkMatch = token.match(/^\[(.+?)\]\((.+?)\)$/);
      if (linkMatch) {
        const [, label, url] = linkMatch;
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E31E24] hover:underline font-semibold"
          >
            {renderInlineStyles(label)}
          </a>
        );
      }

      // Bold + Italic: ***text*** or ___text___
      if (
        (token.startsWith("***") && token.endsWith("***") && token.length > 6) ||
        (token.startsWith("___") && token.endsWith("___") && token.length > 6)
      ) {
        return (
          <strong key={i} className="font-bold text-gray-950">
            <em className="italic">{token.slice(3, -3)}</em>
          </strong>
        );
      }

      // Bold: **text** or __text__
      if (
        (token.startsWith("**") && token.endsWith("**") && token.length > 4) ||
        (token.startsWith("__") && token.endsWith("__") && token.length > 4)
      ) {
        return (
          <strong key={i} className="font-bold text-gray-950">
            {token.slice(2, -2)}
          </strong>
        );
      }

      // Strikethrough: ~~text~~
      if (token.startsWith("~~") && token.endsWith("~~") && token.length > 4) {
        return (
          <del key={i} className="line-through text-gray-500">
            {token.slice(2, -2)}
          </del>
        );
      }

      // Underline: <u>text</u>
      if (token.startsWith("<u>") && token.endsWith("</u>") && token.length > 7) {
        return (
          <span key={i} className="underline decoration-gray-400 underline-offset-2">
            {token.slice(3, -4)}
          </span>
        );
      }

      // Code: `text`
      if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-gray-100 text-[#E31E24] font-mono text-xs font-medium"
          >
            {token.slice(1, -1)}
          </code>
        );
      }

      // Italic: *text* or _text_
      if (
        (token.startsWith("*") && token.endsWith("*") && token.length > 2) ||
        (token.startsWith("_") && token.endsWith("_") && token.length > 2)
      ) {
        return (
          <em key={i} className="italic text-gray-800">
            {token.slice(1, -1)}
          </em>
        );
      }

      return token;
    });
  };

  // Semantic document renderer
  const renderDocumentContent = (content: string) => {
    const lines = content.split("\n");
    const elements: ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            className="my-4 space-y-2.5 pl-6 list-disc list-outside text-gray-700 marker:text-[#E31E24]"
          >
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineStyles(item)}
              </li>
            ))}
          </ul>
        );
        inList = false;
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Horizontal Divider
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        flushList();
        elements.push(
          <hr key={index} className="my-8 border-gray-200" />
        );
        return;
      }

      // H1 Heading
      if (trimmed.startsWith("# ")) {
        flushList();
        const text = trimmed.replace(/^#\s+/, "");
        elements.push(
          <h2
            key={index}
            className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-10 mb-4 pb-3 border-b border-gray-200"
          >
            {renderInlineStyles(text)}
          </h2>
        );
        return;
      }

      // H2 Heading
      if (trimmed.startsWith("## ")) {
        flushList();
        const text = trimmed.replace(/^##\s+/, "");
        elements.push(
          <h3
            key={index}
            className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-3 scroll-mt-24"
          >
            {renderInlineStyles(text)}
          </h3>
        );
        return;
      }

      // H3 Heading
      if (trimmed.startsWith("### ")) {
        flushList();
        const text = trimmed.replace(/^###\s+/, "");
        elements.push(
          <h4
            key={index}
            className="text-lg font-bold text-gray-800 mt-6 mb-2"
          >
            {renderInlineStyles(text)}
          </h4>
        );
        return;
      }

      // Blockquote
      if (trimmed.startsWith("> ")) {
        flushList();
        const text = trimmed.replace(/^>\s+/, "");
        elements.push(
          <blockquote
            key={index}
            className="my-5 p-4 rounded-xl bg-red-50/70 border-l-4 border-[#E31E24] text-gray-800 italic text-sm sm:text-base leading-relaxed"
          >
            {renderInlineStyles(text)}
          </blockquote>
        );
        return;
      }

      // Unordered list
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        inList = true;
        listItems.push(trimmed.substring(2));
        return;
      }

      // Numbered list item
      if (/^\d+\.\s+/.test(trimmed)) {
        flushList();
        elements.push(
          <div
            key={index}
            className="my-2.5 flex items-start gap-2.5 text-gray-700 leading-relaxed font-normal"
          >
            <span className="font-semibold text-gray-900 flex-shrink-0">
              {trimmed.match(/^\d+\./)?.[0]}
            </span>
            <span>{renderInlineStyles(trimmed.replace(/^\d+\.\s+/, ""))}</span>
          </div>
        );
        return;
      }

      // Blank line
      if (!trimmed) {
        flushList();
        return;
      }

      // Standard Paragraph
      flushList();
      elements.push(
        <p key={index} className="my-3.5 text-base text-gray-700 leading-relaxed">
          {renderInlineStyles(trimmed)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  if (isLoading) {
    return (
      <div className="bg-[#F8F9FA] min-h-screen py-12">
        <div className="vx-container max-w-4xl space-y-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-10 bg-gray-200 rounded w-2/3" />
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="bg-white rounded-2xl p-8 border border-gray-200 space-y-4 shadow-sm">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-4/6" />
            <div className="h-20 bg-gray-50 rounded-xl mt-6" />
          </div>
        </div>
      </div>
    );
  }

  // Draft mode or not found state
  if (isDraftOrNotFound || !page) {
    return (
      <div className="bg-[#F8F9FA] min-h-[75vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-3">
            Policy Under Review
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
            The {fallbackTitle} documentation is currently undergoing periodic regulatory and
            compliance updates by the PLUXPC legal team. Please check back shortly.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs text-gray-500 mb-8 flex items-center gap-3 justify-center">
            <HelpCircle size={16} className="text-gray-400 flex-shrink-0" />
            <span>
              For immediate inquiries, contact{" "}
              <a href="mailto:support@pluxpc.com" className="text-[#E31E24] font-medium hover:underline">
                support@pluxpc.com
              </a>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-black transition-all shadow-sm"
            >
              <Home size={16} />
              Return to Storefront
            </Link>
            <Link
              to="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all"
            >
              Explore Products
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-8 sm:py-12">
      <div className="vx-container max-w-4xl">
        {/* ── Breadcrumb Navigation ── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-6"
        >
          <Link to="/" className="hover:text-gray-900 transition-colors flex items-center gap-1">
            <Home size={14} />
            Home
          </Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-gray-500">Legal</span>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="font-semibold text-gray-900">{page.title}</span>
        </nav>

        {/* ── Page Header / Hero ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#E31E24] text-xs font-bold border border-red-100">
              <ShieldCheck size={14} />
              Official Compliance Notice
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Print this document"
              >
                <Printer size={13} />
                Print
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy document URL"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-950 tracking-tight mb-4">
            {page.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-gray-500 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" />
              <span>Last updated: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" />
              <span>~{readTimeMinutes} min read</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText size={14} className="text-gray-400" />
              <span>{page.characterCount || page.content.length} characters</span>
            </div>
          </div>
        </div>

        {/* ── Document Body Card ── */}
        <article className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 mb-8 shadow-sm">
          <div className="legal-prose text-gray-800 text-sm sm:text-base leading-relaxed">
            {renderDocumentContent(page.content)}
          </div>
        </article>

        {/* ── Contact & Support Card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <HelpCircle size={18} className="text-[#E31E24]" />
              Questions About Our Policies?
            </div>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xl">
              Our compliance officer and customer care team are available to assist you with any
              clarifications regarding your consumer rights, data privacy, or terms of service.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="mailto:support@pluxpc.com"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E31E24] hover:bg-[#C9191E] text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm"
            >
              <Mail size={15} />
              support@pluxpc.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
