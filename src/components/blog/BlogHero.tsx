import { Link } from "react-router-dom";
import { Clock, Calendar, ArrowRight, Sparkles, Eye, User } from "lucide-react";
import type { Blog } from "../../types";

interface BlogHeroProps {
  blog: Blog;
}

export default function BlogHero({ blog }: BlogHeroProps) {
  const formattedDate = new Date(blog.publishedAt || blog.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fallbackImage = "/images/blogs/best-wireless-earbuds-2026.jpg";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gray-900 text-white shadow-xl border border-gray-800">
      {/* Background Glow Accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#E31E24]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 lg:p-10">
        {/* Left Column: Editorial Details */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[#E31E24] text-white shadow-sm">
              <Sparkles size={13} />
              Featured Story
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-200 border border-white/10">
              {blog.category}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight mb-4">
            <Link
              to={`/blog/${blog.slug}`}
              className="hover:text-red-400 transition-colors"
            >
              {blog.title}
            </Link>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6 line-clamp-3">
            {blog.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-6 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                {blog.authorAvatar ? (
                  <img src={blog.authorAvatar} alt={blog.author} className="w-full h-full object-cover" />
                ) : (
                  <User size={14} />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">{blog.author}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{blog.authorRole || "Hardware Lab"}</p>
              </div>
            </div>

            <span className="text-gray-600">•</span>

            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-gray-400" />
              {formattedDate}
            </span>

            <span className="text-gray-600">•</span>

            <span className="flex items-center gap-1">
              <Clock size={13} className="text-gray-400" />
              {blog.readTime || "6 min read"}
            </span>

            {blog.views > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1">
                  <Eye size={13} className="text-gray-400" />
                  {blog.views} views
                </span>
              </>
            )}
          </div>

          <div>
            <Link
              to={`/blog/${blog.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E31E24] hover:bg-red-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-600/30 hover:shadow-red-600/40 transition-all cursor-pointer group"
            >
              <span>Read Full Article</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column: 16:9 Image Showcase */}
        <div className="lg:col-span-5">
          <Link
            to={`/blog/${blog.slug}`}
            className="group block relative w-full aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          >
            <img
              src={blog.coverImage || fallbackImage}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== fallbackImage) {
                  target.src = fallbackImage;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-[11px] font-semibold text-gray-200">
              Editorial Pick
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
