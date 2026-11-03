import { Link } from "react-router-dom";
import { Clock, Calendar, ArrowUpRight, Eye } from "lucide-react";
import type { Blog } from "../../types";

interface BlogCardProps {
  blog: Blog;
  compact?: boolean;
}

export default function BlogCard({ blog, compact = false }: BlogCardProps) {
  const formattedDate = new Date(blog.publishedAt || blog.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const fallbackImage = "/images/blogs/best-wireless-earbuds-2026.jpg";

  return (
    <article
      className={`group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 ${
        compact ? "h-full" : ""
      }`}
    >
      {/* 16:9 Image Container */}
      <Link
        to={`/blog/${blog.slug}`}
        className="relative block w-full aspect-[16/9] overflow-hidden bg-gray-100 cursor-pointer"
        aria-label={blog.title}
      >
        <img
          src={blog.coverImage || fallbackImage}
          alt={blog.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== fallbackImage) {
              target.src = fallbackImage;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Category Pill Overlay */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white/95 text-gray-900 shadow-sm backdrop-blur-xs border border-white/40">
            {blog.category}
          </span>
        </div>

        {blog.isFeatured && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-[#E31E24] text-white shadow-sm">
              Featured
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 flex flex-col p-5">
        {/* Meta Row: Date & Reading Time */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2.5 font-medium">
          <span className="flex items-center gap-1">
            <Calendar size={13} className="text-gray-400" />
            {formattedDate}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock size={13} className="text-gray-400" />
            {blog.readTime || "5 min read"}
          </span>
          {blog.views > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye size={13} className="text-gray-400" />
                {blog.views}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#E31E24] transition-colors mb-2">
          <Link to={`/blog/${blog.slug}`} className="focus:outline-none">
            {blog.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
          {blog.excerpt}
        </p>

        {/* Footer: Author & Read Link */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 uppercase overflow-hidden flex-shrink-0">
              {blog.authorAvatar ? (
                <img
                  src={blog.authorAvatar}
                  alt={blog.author}
                  className="w-full h-full object-cover"
                />
              ) : (
                blog.author.charAt(0)
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-800 line-clamp-1">{blog.author}</p>
              <p className="text-[10px] text-gray-400">{blog.authorRole || "Hardware Lab"}</p>
            </div>
          </div>

          <Link
            to={`/blog/${blog.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#E31E24] hover:text-red-700 transition-colors"
          >
            <span>Read</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
}
