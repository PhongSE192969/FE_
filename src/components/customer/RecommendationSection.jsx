import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useRecommendationStore } from "@/stores/useRecommendationStore";
import { formatCurrency } from "@/utils/helpers";

const derivePrice = (product) => {
  const activeVariants = (product?.variants || []).filter(
    (variant) => variant?.status === "ACTIVE"
  );

  if (activeVariants.length === 0) {
    return Number(product?.price || 0);
  }

  const prices = activeVariants
    .map((variant) => Number(variant?.price || 0))
    .filter((price) => !Number.isNaN(price));

  if (prices.length === 0) return Number(product?.price || 0);
  return Math.min(...prices);
};

const RecommendationSkeleton = () => {
  return (
    <div className="flex gap-4 md:gap-6 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`recommendation-skeleton-${index}`}
          className="min-w-[210px] w-[210px] md:min-w-[230px] md:w-[230px] rounded-2xl border border-gray-100 bg-white p-3 animate-pulse"
        >
          <div className="aspect-[4/3] rounded-xl bg-gray-200" />
          <div className="mt-3 h-4 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-2/3 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
};

export default function RecommendationSection({
  franchiseId,
  topK = 20,
  title = "Gợi ý dành cho bạn",
}) {
  const { user, isAuthenticated } = useAuthStore();
  const { fetchRecommendations, clearExpired } = useRecommendationStore();

  const [items, setItems] = useState([]);
  const [isSectionLoading, setIsSectionLoading] = useState(true);
  const [sectionError, setSectionError] = useState("");
  const [source, setSource] = useState("");

  const scrollRef = useRef(null);
  const debounceRef = useRef(null);

  const customerId = useMemo(
    () => user?.id || user?.userId || null,
    [user?.id, user?.userId]
  );

  const loadRecommendations = async ({ force = false } = {}) => {
    setIsSectionLoading(true);
    setSectionError("");

    const result = await fetchRecommendations({
      customerId,
      isAuthenticated,
      franchiseId,
      topK,
      force,
    });

    setItems(Array.isArray(result?.items) ? result.items : []);
    setSource(result?.source || "");
    setSectionError(result?.error || "");
    setIsSectionLoading(false);
  };

  useEffect(() => {
    clearExpired();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      loadRecommendations();
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [customerId, isAuthenticated, franchiseId, topK]);

  const scrollByDirection = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const handleCardClick = (product, index) => {
    if (import.meta.env.DEV) {
      console.info("[recommendation-click]", {
        productId: product?.id,
        index,
        source,
        customerId: customerId || "anonymous",
      });
    }
  };

  return (
    <section className="px-4 lg:px-20 py-14 bg-bg-light">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-gold font-bold text-xs uppercase tracking-widest">
              {isAuthenticated ? "Personalized Picks" : "Popular Right Now"}
            </span>
            <h2 className="text-3xl font-black text-primary mt-1">{title}</h2>
          </div>
        </div>

        {isSectionLoading || items.length === 0 ? (
          <RecommendationSkeleton />
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => scrollByDirection("left")}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/95 border border-gray-200 shadow-md flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="Scroll recommendations left"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => scrollByDirection("right")}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/95 border border-gray-200 shadow-md flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              aria-label="Scroll recommendations right"
            >
              <ChevronRight size={18} />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 px-12 md:px-14 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {items.map((product, index) => {
                const imageUrl = product?.imageUrl || "/logo01.png";
                const price = derivePrice(product);

                return (
                  <Link
                    key={`${product?.id}-${index}`}
                    to={`/products/${product?.id}`}
                    onClick={() => handleCardClick(product, index)}
                    className="min-w-[220px] w-[220px] sm:min-w-[240px] sm:w-[240px] md:min-w-[260px] md:w-[260px] snap-start shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="aspect-[4/3] bg-gray-50">
                      <img
                        src={imageUrl}
                        alt={product?.name || "Recommended product"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/logo01.png";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-primary line-clamp-2 min-h-[3rem]">
                        {product?.name || "Sản phẩm"}
                      </h3>
                      <p className="mt-2 text-sm font-extrabold text-gold">
                        {formatCurrency(price)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
