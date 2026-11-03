import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  Sparkles,
  BookOpen,
  ArrowRight,
  Send,
  CheckCircle2,
  RefreshCw,
  X,
} from "lucide-react";
import BlogCard from "../components/blog/BlogCard";
import BlogHero from "../components/blog/BlogHero";
import { getBlogs, getFeaturedBlogs, getBlogCategories } from "../services/api";
import type { Blog, BlogCategory } from "../types";

export default function BlogListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCategory = searchParams.get("category") || "all";
  const currentSearch = searchParams.get("q") || "";
  const currentSort = (searchParams.get("sort") as "latest" | "popular" | "oldest") || "latest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [featuredBlog, setFeaturedBlog] = useState<Blog | null>(null);
  const [popularBlogs, setPopularBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Sync search input when URL changes
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Load categories and featured article once
  useEffect(() => {
    let isMounted = true;

    async function loadMeta() {
      try {
        const [catRes, featRes] = await Promise.all([
          getBlogCategories().catch(() => ({ success: false, categories: [] })),
          getFeaturedBlogs().catch(() => ({ success: false, featured: null, popular: [] })),
        ]);

        if (!isMounted) return;

        if (catRes && catRes.success && Array.isArray(catRes.categories)) {
          setCategories(catRes.categories);
        }
        if (featRes && featRes.success) {
          if (featRes.featured) setFeaturedBlog(featRes.featured);
          if (Array.isArray(featRes.popular)) setPopularBlogs(featRes.popular);
        }
      } catch (err) {
        console.warn("[Blog Meta Load Warning]:", err);
      }
    }

    loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch paginated blogs on filter changes
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await getBlogs({
        page: currentPage,
        limit: 9,
        category: currentCategory === "all" ? undefined : currentCategory,
        search: currentSearch || undefined,
        sort: currentSort,
      });

      if (res && res.success) {
        setBlogs(res.blogs || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      } else {
        setBlogs([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("[Fetch Blogs Error]:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentCategory, currentSearch, currentSort]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Update query params helper
  const updateQuery = (updates: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "" || (key === "category" && val === "all") || (key === "page" && val === 1)) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ q: searchInput.trim(), page: 1 });
  };

  const handleCategorySelect = (slug: string) => {
    updateQuery({ category: slug === "all" ? null : slug, page: 1 });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateQuery({ sort: e.target.value, page: 1 });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail("");
    setTimeout(() => setNewsletterSubscribed(false), 5000);
  };

  // Built-in categories list fallback if DB returned empty
  const displayCategories = categories.length > 0 ? categories : [
    { name: "Latest Technology", slug: "latest-technology", count: 0 },
    { name: "Smartphones", slug: "smartphones", count: 0 },
    { name: "Audio & Earbuds", slug: "audio-earbuds", count: 0 },
    { name: "Speakers", slug: "speakers", count: 0 },
    { name: "Power Banks & Charging", slug: "power-banks-charging", count: 0 },
    { name: "Gaming Accessories", slug: "gaming-accessories", count: 0 },
    { name: "Gadgets & Electronics", slug: "gadgets-electronics", count: 0 },
    { name: "Product Reviews", slug: "product-reviews", count: 0 },
    { name: "Buying Guides", slug: "buying-guides", count: 0 },
    { name: "Tips & Tutorials", slug: "tips-tutorials", count: 0 },
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-gray-900 pb-20">
      {/* ── Sub-header / Breadcrumb Bar ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="vx-container py-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="font-semibold text-gray-900">Blog & Gadget Guides</span>
          </div>
          <span className="hidden sm:inline text-gray-400">PLUXPC Electronics & Technology Publication</span>
        </div>
      </div>

      <div className="vx-container pt-8 sm:pt-10">
        {/* ── Page Header ── */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-red-50 text-[#E31E24] border border-red-100 mb-3">
            <BookOpen size={13} />
            Consumer Electronics & Gadget Reviews
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 tracking-tight leading-tight mb-3">
            PLUXPC Gadgets, Audio & Tech Insights
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            In-depth consumer electronics reviews, wireless audio benchmarks, smartphone buying checklists, and expert gadget insights.
          </p>
        </div>

        {/* ── Featured Hero Story (Show only on page 1 with no search filter) ── */}
        {currentPage === 1 && !currentSearch && currentCategory === "all" && featuredBlog && (
          <div className="mb-12">
            <BlogHero blog={featuredBlog} />
          </div>
        )}

        {/* ── Filter & Search Toolbar ── */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search articles, earbuds, speakers, gadgets..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/20 focus:border-[#E31E24] transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    updateQuery({ q: null, page: 1 });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </form>

            {/* Sort & Quick Meta */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium whitespace-nowrap">
                <SlidersHorizontal size={14} className="text-gray-400" />
                <span className="hidden sm:inline">Sort:</span>
              </div>
              <select
                value={currentSort}
                onChange={handleSortChange}
                aria-label="Sort articles by"
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#E31E24]/20 focus:border-[#E31E24] cursor-pointer"
              >
                <option value="latest">Latest First</option>
                <option value="popular">Most Popular</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-gray-100 scrollbar-none">
            <button
              onClick={() => handleCategorySelect("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentCategory === "all"
                  ? "bg-gray-950 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Articles
            </button>

            {displayCategories.map((cat) => {
              const isSelected = currentCategory.toLowerCase() === cat.slug.toLowerCase() || currentCategory.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.slug}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#E31E24] text-white shadow-xs"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                  {cat.count > 0 && (
                    <span className={`ml-1.5 text-[10px] ${isSelected ? "text-red-100" : "text-gray-400"}`}>
                      ({cat.count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Filter Badges ── */}
        {(currentSearch || currentCategory !== "all") && (
          <div className="flex items-center flex-wrap gap-2 mb-6 text-xs">
            <span className="text-gray-500 font-medium">Filtering by:</span>
            {currentCategory !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-[#E31E24] font-medium border border-red-200">
                Category: {currentCategory}
                <button
                  type="button"
                  onClick={() => updateQuery({ category: null, page: 1 })}
                  className="cursor-pointer hover:opacity-75"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {currentSearch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-medium border border-gray-200">
                Search: "{currentSearch}"
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    updateQuery({ q: null, page: 1 });
                  }}
                  className="cursor-pointer hover:opacity-75"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-[#E31E24] hover:underline font-semibold ml-2 cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* ── Main Layout: Articles Grid + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Articles Area (8 cols on lg) */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-gray-950 flex items-center gap-2">
                <span>All Articles</span>
                <span className="text-xs font-normal text-gray-500">
                  ({totalCount} {totalCount === 1 ? "article" : "articles"})
                </span>
              </h2>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs animate-pulse">
                    <div className="w-full aspect-[16/9] bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-5 bg-gray-200 rounded w-4/5" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!isLoading && isError && (
              <div className="bg-white rounded-2xl border border-red-100 p-8 text-center my-6">
                <p className="text-sm font-semibold text-red-600 mb-2">Unable to load articles</p>
                <p className="text-xs text-gray-500 mb-4">Please check your network connection and try again.</p>
                <button
                  onClick={fetchArticles}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} />
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && blogs.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center my-6 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
                  <Search size={22} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No articles found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                  We couldn't find any hardware guides matching your search criteria. Try a different search term or category.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E31E24] text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Articles Grid */}
            {!isLoading && !isError && blogs.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {blogs.map((blog) => (
                    <BlogCard key={blog._id || blog.slug} blog={blog} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      onClick={() => updateQuery({ page: currentPage - 1 })}
                      disabled={currentPage <= 1}
                      className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        const isCurrent = p === currentPage;
                        return (
                          <button
                            key={p}
                            onClick={() => updateQuery({ page: p })}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? "bg-[#E31E24] text-white shadow-xs"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => updateQuery({ page: currentPage + 1 })}
                      disabled={currentPage >= totalPages}
                      className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar Area (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Popular Articles Card */}
            {popularBlogs.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-sm mb-4 pb-3 border-b border-gray-100">
                  <TrendingUp size={16} className="text-[#E31E24]" />
                  <span>Trending Reads</span>
                </div>

                <div className="space-y-4">
                  {popularBlogs.map((pop, idx) => (
                    <Link
                      key={pop._id || pop.slug}
                      to={`/blog/${pop.slug}`}
                      className="group flex items-start gap-3 hover:opacity-90 transition-opacity"
                    >
                      <span className="text-lg font-black text-gray-300 group-hover:text-[#E31E24] transition-colors w-4 flex-shrink-0">
                        0{idx + 1}
                      </span>
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={pop.coverImage || "/images/blogs/gaming-pc-components-2026.jpg"}
                          alt={pop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-[#E31E24] transition-colors line-clamp-2 leading-snug">
                          {pop.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                          <span>{pop.readTime || "5 min read"}</span>
                          {pop.views > 0 && (
                            <>
                              <span>•</span>
                              <span>{pop.views} views</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter Subscription Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl p-6 shadow-md border border-gray-800">
              <div className="w-10 h-10 rounded-xl bg-[#E31E24]/20 border border-[#E31E24]/30 flex items-center justify-center text-[#E31E24] mb-4">
                <Sparkles size={18} />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">
                Gadget Briefing Weekly
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Get weekly consumer tech reviews, earbud benchmarks, and smart gadget discounts delivered directly to your inbox.
              </p>

              {newsletterSubscribed ? (
                <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  <span>You're subscribed! Keep an eye on your inbox.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3.5 py-2.5 bg-white/10 border border-white/15 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#E31E24] hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <span>Subscribe Free</span>
                    <Send size={13} />
                  </button>
                  <p className="text-[10px] text-gray-500 text-center">
                    No spam ever. Unsubscribe anytime with 1-click.
                  </p>
                </form>
              )}
            </div>

            {/* Quick Electronics Callout */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center shadow-xs">
              <p className="text-xs font-bold text-gray-900 mb-1">Looking for Top Gadgets?</p>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Check our curated collection of true wireless earbuds, speakers, and mobile accessories.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E31E24] hover:underline"
              >
                <span>Browse PLUXPC Catalog</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
