import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { blogPosts } from "../../data/products";
import { handleImageError } from "../../utils";

const TABS = ["Popular", "Latest"] as const;
type Tab = typeof TABS[number];

export default function BlogSection() {
  const [activeTab, setActiveTab] = useState<Tab>("Popular");
  const tab = activeTab.toLowerCase() as "popular" | "latest";
  const posts = blogPosts.filter((b) => b.tab === tab);

  return (
    <section className="py-10 border-t border-gray-100">
      <div className="vx-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="vx-section-title">
            From the <span>Blog</span>
          </h2>
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`vx-tab ${activeTab === t ? "vx-tab-active" : "vx-tab-inactive"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {posts.map((post) => (
            <article key={post.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => handleImageError(e, post.category || "PLUXPC Blog")}
                />
                <span className="absolute top-3 left-3 bg-volt-red text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {post.category}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {post.date}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {post.readTime}</span>
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900 leading-snug mb-1.5 line-clamp-2 group-hover:text-volt-red transition-colors">
                  {post.title}
                </h3>
                <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
                <Link
                  to={`/blog/${post.id}`}
                  className="flex items-center gap-1 text-[12px] font-semibold text-volt-red hover:gap-2 transition-all"
                >
                  Read More <ArrowRight size={12} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

