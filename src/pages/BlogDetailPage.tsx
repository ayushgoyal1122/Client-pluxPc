import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Bookmark,
  ChevronRight,
  User,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { getBlogBySlug } from "../services/api";
import type { Blog } from "../types";
import BlogCard from "../components/blog/BlogCard";

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;

    setIsLoading(true);
    setNotFound(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    getBlogBySlug(slug)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.success && res.blog) {
          setBlog(res.blog);
          setRelatedBlogs(res.relatedBlogs || []);
          document.title = res.blog.metaTitle || `${res.blog.title} | PLUXPC Lab`;
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => {
        console.error("[Blog Detail Error]:", err);
        if (isMounted) setNotFound(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Extract headings from content for Table of Contents
  const tocHeadings = useMemo(() => {
    if (!blog?.content) return [];
    const lines = blog.content.split("\n");
    const headings: { id: string; text: string; level: number }[] = [];

    lines.forEach((line) => {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);

      if (h2Match) {
        const text = h2Match[1].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        headings.push({ id, text, level: 2 });
      } else if (h3Match) {
        const text = h3Match[1].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        headings.push({ id, text, level: 3 });
      }
    });

    return headings;
  }, [blog?.content]);

  // Track active section on scroll
  useEffect(() => {
    if (tocHeadings.length === 0) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = tocHeadings.length - 1; i >= 0; i--) {
        const el = document.getElementById(tocHeadings[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(tocHeadings[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tocHeadings]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = blog ? blog.title : "PLUXPC Hardware Guide";

  // Simple Markdown renderer into semantic React nodes
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    const elements: ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-4 space-y-2 pl-6 list-disc list-outside text-gray-700 marker:text-[#E31E24]">
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

      // H2 Heading
      if (trimmed.startsWith("## ")) {
        flushList();
        const text = trimmed.replace(/^##\s+/, "");
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        elements.push(
          <h2
            key={index}
            id={id}
            className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-10 mb-4 pt-4 border-t border-gray-100 scroll-mt-24 first:border-0 first:pt-0"
          >
            {text}
          </h2>
        );
        return;
      }

      // H3 Heading
      if (trimmed.startsWith("### ")) {
        flushList();
        const text = trimmed.replace(/^###\s+/, "");
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        elements.push(
          <h3
            key={index}
            id={id}
            className="text-xl font-bold text-gray-900 mt-6 mb-3 scroll-mt-24"
          >
            {text}
          </h3>
        );
        return;
      }

      // Blockquote / Callout
      if (trimmed.startsWith("> ")) {
        flushList();
        const text = trimmed.replace(/^>\s+/, "");
        elements.push(
          <blockquote
            key={index}
            className="my-5 p-4 rounded-xl bg-red-50/60 border-l-4 border-[#E31E24] text-gray-800 italic text-sm sm:text-base leading-relaxed"
          >
            {renderInlineStyles(text)}
          </blockquote>
        );
        return;
      }

      // Bullet lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        inList = true;
        listItems.push(trimmed.substring(2));
        return;
      }

      // Numbered lists (e.g. "1. ")
      if (/^\d+\.\s+/.test(trimmed)) {
        flushList();
        elements.push(
          <p key={index} className="my-2 text-gray-700 leading-relaxed font-medium">
            {renderInlineStyles(trimmed)}
          </p>
        );
        return;
      }

      // Empty line
      if (!trimmed) {
        flushList();
        return;
      }

      // Normal paragraph
      flushList();
      elements.push(
        <p key={index} className="my-4 text-base text-gray-700 leading-relaxed">
          {renderInlineStyles(trimmed)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  // Helper for inline bold, code, links
  const renderInlineStyles = (text: string) => {
    // Replace **bold** with strong
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-gray-950">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-gray-100 text-red-600 font-mono text-xs"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-[#FAFAFA] min-h-screen py-16">
        <div className="vx-container max-w-4xl space-y-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="h-10 bg-gray-200 rounded w-3/4" />
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="w-full aspect-[16/9] bg-gray-200 rounded-2xl" />
          <div className="space-y-4 pt-6">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="bg-[#FAFAFA] min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 text-[#E31E24] flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Article Not Found</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
            The hardware guide or article you are looking for may have been updated, relocated, or removed.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E31E24] hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to All Articles</span>
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(blog.publishedAt || blog.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-gray-900 pb-24">
      {/* ── Breadcrumb Navigation ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="vx-container py-3 flex items-center gap-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
          <Link to="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
          <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
          <Link
            to={`/blog?category=${encodeURIComponent(blog.categorySlug || blog.category)}`}
            className="hover:text-gray-900 transition-colors"
          >
            {blog.category}
          </Link>
          <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
          <span className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{blog.title}</span>
        </div>
      </div>

      <div className="vx-container pt-8 sm:pt-10">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#E31E24] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to All Articles</span>
          </Link>
        </div>

        {/* ── Article Header ── */}
        <header className="max-w-4xl mx-auto mb-8 sm:mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-red-50 text-[#E31E24] border border-red-200">
              {blog.category}
            </span>
            {blog.isFeatured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-gray-950 text-white">
                <Sparkles size={11} className="text-yellow-400" />
                Featured Editorial
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 tracking-tight leading-tight mb-5">
            {blog.title}
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6 font-normal">
            {blog.excerpt}
          </p>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-800 overflow-hidden flex-shrink-0">
                {blog.authorAvatar ? (
                  <img src={blog.authorAvatar} alt={blog.author} className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">{blog.author}</p>
                <p className="text-xs text-gray-500 leading-tight">{blog.authorRole || "Hardware Lab Contributor"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                {formattedDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-gray-400" />
                {blog.readTime || "5 min read"}
              </span>
              {blog.views > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={14} className="text-gray-400" />
                    {blog.views} views
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Cover Image (16:9) ── */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="relative w-full aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-gray-200 bg-gray-100">
            <img
              src={blog.coverImage || "/images/blogs/best-wireless-earbuds-2026.jpg"}
              alt={blog.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== "/images/blogs/best-wireless-earbuds-2026.jpg") {
                  target.src = "/images/blogs/best-wireless-earbuds-2026.jpg";
                }
              }}
            />
          </div>
        </div>

        {/* ── Editorial Body Layout (Grid with Sticky Sidebar) ── */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Article Content (8 cols on lg) */}
          <main className="lg:col-span-8 bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-10 shadow-xs">
            {/* Formatted Markdown Content */}
            <div className="prose prose-gray max-w-none">
              {renderFormattedContent(blog.content)}
            </div>

            {/* Tags Row */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 mr-2">Topics:</span>
                {blog.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?q=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Author Profile Footer Box */}
            <div className="mt-10 p-6 rounded-2xl bg-gray-50 border border-gray-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-white border border-gray-300 flex items-center justify-center text-lg font-bold text-gray-800 overflow-hidden flex-shrink-0 shadow-xs">
                {blog.authorAvatar ? (
                  <img src={blog.authorAvatar} alt={blog.author} className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-gray-500" />
                )}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-[#E31E24] mb-0.5">Written by</p>
                <h4 className="text-base font-extrabold text-gray-900">{blog.author}</h4>
                <p className="text-xs text-gray-500 font-medium mb-2">{blog.authorRole || "PLUXPC Hardware Lab Staff"}</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Specializing in consumer electronics, wireless audio testing, and everyday gadget benchmarks at the PLUXPC Testing Lab.
                </p>
              </div>
            </div>
          </main>

          {/* Sticky Sidebar (4 cols on lg) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Share Bar */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Share2 size={14} className="text-[#E31E24]" />
                  <span>Share This Guide</span>
                </h3>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={handleCopyLink}
                    title="Copy Link"
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-700 cursor-pointer"
                  >
                    {copied ? <Check size={18} className="text-emerald-600 mb-1" /> : <Copy size={18} className="text-gray-600 mb-1" />}
                    <span className="text-[10px]">{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Share to Twitter"
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-xs font-semibold text-gray-700 cursor-pointer"
                  >
                    <svg className="w-4 h-4 mb-1 text-gray-800 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="text-[10px]">X</span>
                  </a>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Share to LinkedIn"
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-gray-200 hover:bg-sky-50 hover:border-sky-200 transition-colors text-xs font-semibold text-gray-700 cursor-pointer"
                  >
                    <svg className="w-4 h-4 mb-1 text-sky-600 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    <span className="text-[10px]">LinkedIn</span>
                  </a>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle} - ${currentUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Share via WhatsApp"
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors text-xs font-semibold text-gray-700 cursor-pointer"
                  >
                    <MessageCircle size={18} className="text-emerald-500 mb-1" />
                    <span className="text-[10px]">WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Table of Contents */}
              {tocHeadings.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Bookmark size={14} className="text-[#E31E24]" />
                    <span>Table of Contents</span>
                  </h3>
                  <nav className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                    {tocHeadings.map((heading) => {
                      const isActive = activeSection === heading.id;
                      return (
                        <a
                          key={heading.id}
                          href={`#${heading.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const target = document.getElementById(heading.id);
                            if (target) {
                              target.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className={`block text-xs py-1 transition-colors leading-snug ${
                            heading.level === 3 ? "pl-3 text-gray-500" : "font-medium"
                          } ${
                            isActive
                              ? "text-[#E31E24] font-bold border-l-2 border-[#E31E24] pl-2"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {heading.text}
                        </a>
                      );
                    })}
                  </nav>
                </div>
              )}

              {/* Storefront Promotion Box */}
              <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl p-5 shadow-md border border-gray-800 text-center">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E31E24] text-white mb-2">
                  PLUXPC Audio & Gadgets
                </span>
                <h4 className="text-sm font-extrabold text-white mb-1">
                  Ready to upgrade your everyday tech?
                </h4>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Explore our curated collection of true wireless earbuds, portable Bluetooth speakers, and fast-charging gear.
                </p>
                <Link
                  to="/products"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-950 text-xs font-bold transition-colors shadow-sm"
                >
                  <span>Explore Gadgets & Audio</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Related Articles Section ── */}
        {relatedBlogs.length > 0 && (
          <div className="max-w-5xl mx-auto mt-16 pt-12 border-t border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-950">Related Articles & Reviews</h3>
                <p className="text-xs sm:text-sm text-gray-500">More articles in {blog.category} and technology guides</p>
              </div>
              <Link
                to="/blog"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#E31E24] hover:underline"
              >
                <span>View all articles</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((rel) => (
                <BlogCard key={rel._id || rel.slug} blog={rel} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
