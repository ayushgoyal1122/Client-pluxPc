import { Link } from "react-router-dom";
import { CircleArrowRight } from "lucide-react";
import { useStorefront } from "../../context/StorefrontContext";
import ProductCarousel from "../ui/ProductCarousel";

interface CollectionProps {
  title: string;
  highlighted: string;
  sectionKey: string;
  link: string;
  bg?: string;
}

function Collection({ title, highlighted, sectionKey, link, bg = "" }: CollectionProps) {
  const { getSection } = useStorefront();
  const products = getSection(sectionKey);
  if (products.length === 0) return null;

  return (
    <section className={`py-8 border-t border-gray-100 ${bg}`}>
      <div className="vx-container">
        <div className="flex items-center justify-between mb-5">
          <h2 className="vx-section-title">
            {title} <span>{highlighted}</span>
          </h2>
          <Link to={link} className="vx-view-all">
            View All <CircleArrowRight size={16} />
          </Link>
        </div>
        <ProductCarousel products={products} cardWidth="w-[195px] sm:w-[210px]" />
      </div>
    </section>
  );
}

export default function AdditionalCollections() {
  return (
    <>
      <Collection title="Our" highlighted="Bestsellers" sectionKey="bestsellers" link="/products?section=bestsellers" />
      <Collection title="Premium" highlighted="Audio" sectionKey="premium" link="/products?section=premium" />
      <Collection title="Everyday" highlighted="Tech" sectionKey="everyday" link="/products?section=everyday" />
    </>
  );
}

