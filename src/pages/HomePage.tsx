import HeroBanner from "../components/sections/HeroBanner";
import ExclusiveOffers from "../components/sections/ExclusiveOffers";
import TopDeals from "../components/sections/TopDeals";
import ShopByCategories from "../components/sections/ShopByCategories";
import HotPicksForYou from "../components/sections/HotPicksForYou";
import PromoBanners from "../components/sections/PromoBanners";
import AdditionalCollections from "../components/sections/AdditionalCollections";
import BlogSection from "../components/sections/BlogSection";

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <ExclusiveOffers />
      <TopDeals />
      <ShopByCategories />
      <HotPicksForYou />
      <PromoBanners />
      <AdditionalCollections />
      <BlogSection />
    </>
  );
}
