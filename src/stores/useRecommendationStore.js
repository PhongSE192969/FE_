import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getRecommendations } from "@/services/aiService";
import { SearchProductsByIds } from "@/services/productService";

const RECOMMENDATION_TTL_MS = 5 * 60 * 1000;
const REQUEST_DEBOUNCE_MS = 400;

const extractResponseData = (res) => {
  if (Array.isArray(res)) return res;
  return res?.data?.data || res?.data || res;
};

const normalizeRecommendationIds = (res) => {
  const data = extractResponseData(res);
  const list = Array.isArray(data) ? data : [];
  return list
    .map((item) => item?.product_id || item?.productId || item?.id)
    .filter(Boolean)
    .map(String);
};

const normalizeRecommendationProducts = (res) => {
  const data = extractResponseData(res);
  const list = Array.isArray(data) ? data : [];

  return list
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      ...item,
      id: item.id || item.product_id || item.productId,
    }))
    .filter((item) => item.id && (item.name || item.variants || item.price != null));
};

const parseImageUrl = (product) => {
  const candidate =
    product?.variants?.[0]?.imageUrl ||
    product?.variants?.[0]?.imageUrls?.[0] ||
    product?.imageUrl ||
    product?.image ||
    "/logo01.png";

  if (typeof candidate !== "string") return "/logo01.png";

  try {
    if (candidate.startsWith("[")) {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0] || "/logo01.png";
      }
    }
  } catch {
    // Keep original candidate when JSON parsing fails.
  }

  return candidate;
};

const normalizeProducts = (products) => {
  return (Array.isArray(products) ? products : []).map((product) => ({
    ...product,
    imageUrl: parseImageUrl(product),
  }));
};

const buildCacheKey = ({ customerId, franchiseId, topK }) => {
  return `${customerId || "guest"}::${franchiseId || "all"}::${topK}`;
};

const fetchRecommendationPayload = async ({ customerId, topK }) => {
  return getRecommendations({
    customer_id: String(customerId),
    top_k: topK,
  });
};

export const useRecommendationStore = create(
  persist(
    (set, get) => ({
      cacheByKey: {},
      inFlight: {},
      lastRequestedAt: {},
      isLoading: false,
      error: null,

      getCachedByKey: (key) => {
        const entry = get().cacheByKey[key];
        if (!entry) return null;
        if (entry.expiresAt <= Date.now()) return null;
        return entry;
      },

      clearExpired: () => {
        const now = Date.now();
        const nextCache = Object.fromEntries(
          Object.entries(get().cacheByKey).filter(([, value]) => value.expiresAt > now)
        );
        set({ cacheByKey: nextCache });
      },

      fetchRecommendations: async ({
        customerId,
        isAuthenticated,
        franchiseId,
        topK = 20,
        force = false,
      }) => {
        const userKey = isAuthenticated && customerId ? String(customerId) : "anonymous-user";
        const cacheKey = buildCacheKey({ customerId: userKey, franchiseId, topK });

        const cached = get().getCachedByKey(cacheKey);
        if (!force && cached) {
          return { ...cached, fromCache: true, cacheKey };
        }

        if (get().inFlight[cacheKey]) {
          return get().inFlight[cacheKey];
        }

        const now = Date.now();
        const lastRequestedAt = get().lastRequestedAt[cacheKey] || 0;
        if (!force && now - lastRequestedAt < REQUEST_DEBOUNCE_MS && cached) {
          return { ...cached, fromCache: true, cacheKey };
        }

        const requestPromise = (async () => {
          set((state) => ({
            isLoading: true,
            error: null,
            lastRequestedAt: {
              ...state.lastRequestedAt,
              [cacheKey]: now,
            },
          }));

          try {
            let recommendationIds = [];
            let recommendationProducts = [];
            let source = isAuthenticated && customerId ? "personalized" : "popular";

            try {
              const response = await fetchRecommendationPayload({
                customerId: userKey,
                topK,
              });
              recommendationProducts = normalizeRecommendationProducts(response);
              recommendationIds = normalizeRecommendationIds(response);
            } catch (primaryError) {
              if (!isAuthenticated) {
                throw primaryError;
              }

              source = "popular";
              const fallbackResponse = await fetchRecommendationPayload({
                customerId: "anonymous-user",
                topK,
              });
              recommendationProducts = normalizeRecommendationProducts(fallbackResponse);
              recommendationIds = normalizeRecommendationIds(fallbackResponse);
            }

            if (recommendationIds.length === 0 && recommendationProducts.length === 0) {
              throw new Error("No recommended products available.");
            }

            let orderedItems = [];
            if (recommendationProducts.length > 0 && recommendationIds.length === 0) {
              orderedItems = normalizeProducts(recommendationProducts);
            } else {
              const productsResponse = await SearchProductsByIds(recommendationIds);
              const hydrated = normalizeProducts(extractResponseData(productsResponse));
              const productMap = new Map(hydrated.map((item) => [String(item.id), item]));
              orderedItems = recommendationIds
                .map((id) => productMap.get(String(id)))
                .filter(Boolean);
            }

            const payload = {
              items: orderedItems,
              source,
              fetchedAt: Date.now(),
              expiresAt: Date.now() + RECOMMENDATION_TTL_MS,
            };

            set((state) => ({
              cacheByKey: {
                ...state.cacheByKey,
                [cacheKey]: payload,
              },
              error: null,
            }));

            return { ...payload, fromCache: false, cacheKey };
          } catch (error) {
            const message = error?.message || "Failed to load recommendations";
            set({ error: message });
            return {
              items: [],
              source: "popular",
              error: message,
              fetchedAt: Date.now(),
              expiresAt: Date.now(),
              fromCache: false,
              cacheKey,
            };
          } finally {
            set((state) => {
              const nextInFlight = { ...state.inFlight };
              delete nextInFlight[cacheKey];
              return {
                inFlight: nextInFlight,
                isLoading: false,
              };
            });
          }
        })();

        set((state) => ({
          inFlight: {
            ...state.inFlight,
            [cacheKey]: requestPromise,
          },
        }));

        return requestPromise;
      },
    }),
    {
      name: "capital-coffee-recommendations",
      partialize: (state) => ({
        cacheByKey: state.cacheByKey,
      }),
    }
  )
);
