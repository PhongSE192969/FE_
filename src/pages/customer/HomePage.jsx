import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  Star,
  Coffee,
  Zap,
  Award,
  Users,
} from "lucide-react";
import { useLanguageStore, useFranchiseStore } from "@/stores";
import { translations } from "@/locales";
import { getProductsByFranchise } from "@/services/productService";
import { getFranchises } from "@/services/franchiseService";
import ProductCard from "../../components/customer/ProductCard";
import RecommendationSection from "@/components/customer/RecommendationSection";

export default function HomePage() {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).customer?.home || {};
  const { selectedFranchiseId, selectedFranchiseName, setFranchise } =
    useFranchiseStore();

  const [products, setProducts] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFranchises();
  }, []);

  useEffect(() => {
    if (selectedFranchiseId) {
      loadProducts(selectedFranchiseId);
    }
  }, [selectedFranchiseId]);

  const loadFranchises = async () => {
    try {
      const res = await getFranchises();
      const list = Array.isArray(res) ? res : res?.data || [];
      setFranchises(list);
      if (list.length > 0 && !selectedFranchiseId) {
        setFranchise(list[0].id, list[0].name);
      }
    } catch (error) {
      console.error("Failed to load franchises:", error);
    }
  };

  const loadProducts = async (locationId) => {
    try {
      setLoading(true);
      const res = await getProductsByFranchise(locationId);
      const list = Array.isArray(res)
        ? res
        : res?.content || res?.data?.content || [];

      // Lọc bỏ sản phẩm: INACTIVE, hoặc variants rỗng, hoặc tất cả variants đều INACTIVE
      const filteredList = list.filter(
        (p) =>
          p.status === "ACTIVE" &&
          p.variants &&
          p.variants.length > 0 &&
          p.variants.some((v) => v.status === "ACTIVE")
      );

      setProducts(
        filteredList.map((p) => ({
          ...p,
          variants: p.variants.filter((v) => v.status === "ACTIVE"),
          price: Number(p.price || 0),
        }))
      );
    } catch (error) {
      console.error("Load products error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  const featured = products.slice(0, 4);
  const bestsellers = [...products]
    .sort((a, b) => b.price - a.price)
    .slice(0, 3);
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }
  return (
    <div className="flex flex-col min-h-screen bg-bg-light">
      {/* Hero */}
      <section className="relative min-h-[520px] lg:min-h-[600px] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(
                            90deg, 
                            rgba(15,23,42,0.92) 0%, 
                            rgba(15,23,42,0.5) 60%, 
                            rgba(15,23,42,0.1) 100%), 
                            url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')
                        `,
          }}
        />
        <div className="relative z-10 px-4 lg:px-20 py-16 max-w-7xl mx-auto w-full">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 bg-gold/20 text-gold border border-gold/30 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm">
              <Zap size={12} /> {t.hero?.newArrival || "New Arrival"}
            </span>
            <h1
              className="text-white text-5xl lg:text-7xl font-black leading-[0.9] tracking-tight mb-6"
              dangerouslySetInnerHTML={{
                __html: t.hero?.title || "Golden Roast<br/>Collection",
              }}
            />
            <p className="text-white/80 text-lg font-medium leading-relaxed mb-8 max-w-sm">
              {t.hero?.subtitle ||
                "Experience the rich, velvety taste of our new seasonal blends. Crafted for the moments that matter."}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="flex items-center gap-2 h-12 px-8 bg-gold text-primary font-black rounded-xl hover:bg-yellow-400 transition-all shadow-2xl shadow-gold/30 text-sm"
              >
                {t.hero?.orderNow || "Order Now"} <ArrowRight size={16} />
              </Link>
              <Link
                to="/products"
                className="flex items-center gap-2 h-12 px-8 bg-white/10 text-white border border-white/20 backdrop-blur-md font-bold rounded-xl hover:bg-white/20 transition-all text-sm"
              >
                {t.hero?.viewMenu || "View Menu"}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 lg:px-20 py-4 grid grid-cols-3 gap-4">
            {[
              {
                icon: MapPin,
                value: "24",
                label: t.stats?.locations || "Locations",
              },
              {
                icon: Coffee,
                value: "50+",
                label: t.stats?.menuItems || "Menu Items",
              },
              { icon: Star, value: "4.8★", label: t.stats?.rating || "Rating" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <stat.icon size={20} className="text-gold hidden sm:block" />
                <div>
                  <div className="text-white font-black text-lg leading-tight">
                    {stat.value}
                  </div>
                  <div className="text-white/60 text-xs">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Order Type */}
      <section className="bg-white border-b border-gray-100 px-4 lg:px-20 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            {[
              t.orderType?.pickup || "Pickup",
              t.orderType?.delivery || "Delivery",
            ].map((type, i) => (
              <button
                key={type}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${i === 0
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
              >
                {i === 0 ? (
                  <div className="size-14 flex items-center justify-center rounded-full">
                    <img
                      src="/logo01.png"
                      alt="Capital Fashion"
                      className="size-full object-contain"
                    />
                  </div>
                ) : (
                  <MapPin size={16} />
                )}
                {type}
              </button>
            ))}
          </div>
          <div className="flex-1 md:max-w-md flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 h-11">
            <MapPin size={16} className="text-gray-400" />
            <select
              value={selectedFranchiseId || ""}
              onChange={(e) => {
                const fr = franchises.find((f) => f.id === e.target.value);
                if (fr) setFranchise(fr.id, fr.name);
              }}
              className="w-full bg-transparent border-none text-sm text-gray-600 font-medium focus:outline-none cursor-pointer"
            >
              {!selectedFranchiseId && (
                <option value="">Select Franchise...</option>
              )}
              {franchises.map((fr) => (
                <option key={fr.id} value={fr.id}>
                  {fr.name || fr.locationName || "Branch"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="px-4 lg:px-20 py-14 bg-bg-light">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-gold font-bold text-xs uppercase tracking-widest">
                {t.featured?.subtitle || "New Arrivals"}
              </span>
              <h2 className="text-3xl font-black text-primary mt-1">
                {t.featured?.title || "Featured Items"}
              </h2>
            </div>
            <Link
              to="/products"
              className="text-sm font-bold text-primary hover:text-gold transition-colors flex items-center gap-1"
            >
              {t.featured?.viewAll || "View All"} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Banner */}
      <section className="bg-primary text-white px-4 lg:px-20 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-gold font-bold text-xs uppercase tracking-widest">
              {t.whyUs?.subtitle || "Why Capital Coffee"}
            </span>
            <h2 className="text-3xl font-black mt-2">
              {t.whyUs?.title || "The Capital Difference"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Coffee,
                title: t.whyUs?.flavors?.title || "Authentic Flavors",
                desc:
                  t.whyUs?.flavors?.desc ||
                  "Sourced from the finest Vietnamese highlands and roasted in-house for peak freshness.",
              },
              {
                icon: Zap,
                title: t.whyUs?.quick?.title || "Quick & Fresh",
                desc:
                  t.whyUs?.quick?.desc ||
                  "Order ahead and pick up in minutes. Your coffee is always made fresh to order.",
              },
              {
                icon: Award,
                title: t.whyUs?.rewards?.title || "Rewards Program",
                desc:
                  t.whyUs?.rewards?.desc ||
                  "Earn points on every purchase and unlock exclusive member perks and free drinks.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="size-14 rounded-xl bg-gold/20 text-gold flex items-center justify-center border border-gold/30">
                  <item.icon size={24} />
                </div>
                <h3 className="font-black text-lg">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="px-4 lg:px-20 py-14 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-gold font-bold text-xs uppercase tracking-widest">
                {t.bestsellers?.subtitle || "Customer Favorites"}
              </span>
              <h2 className="text-3xl font-black text-primary mt-1">
                {t.bestsellers?.title || "Best Sellers"}
              </h2>
            </div>
            <Link
              to="/products"
              className="text-sm font-bold text-primary hover:text-gold transition-colors flex items-center gap-1"
            >
              {t.bestsellers?.fullMenu || "Full Menu"} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bestsellers.map((product, i) => (
              <div key={product.id} className="relative">
                {i === 0 && (
                  <div className="absolute -top-3 left-4 z-10 bg-gold text-primary text-xs font-black px-3 py-1 rounded-full shadow">
                    {t.bestsellers?.topSeller || "#1 Best Seller"}
                  </div>
                )}
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <RecommendationSection franchiseId={selectedFranchiseId} topK={20} />

      {/* CTA */}
      <section className="bg-bg-light px-4 lg:px-20 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="size-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30">
            <div className="size-14 flex items-center justify-center rounded-full">
              <img
                src="/logo01.png"
                alt="Capital Fashion"
                className="size-full object-contain"
              />
            </div>
          </div>
          <h2 className="text-4xl font-black text-primary mb-4">
            {t.members?.title || "Become a Member"}
          </h2>
          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            {t.members?.desc ||
              "Join thousands of coffee lovers. Earn rewards, get early access to new items, and enjoy exclusive member benefits."}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="flex items-center gap-2 h-12 px-8 bg-gold text-primary font-black rounded-xl hover:bg-yellow-400 transition-all shadow-xl shadow-gold/20 text-sm"
            >
              {t.members?.joinFree || "Join Free"} <Users size={16} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 h-12 px-8 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm"
            >
              {t.members?.signIn || "Sign In"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
