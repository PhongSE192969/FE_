import { aiApi, apiCall, ENDPOINTS } from "@/config/api";
import { HTTP_METHODS } from "@/constraints";

const extractResponseData = (res) => {
  if (Array.isArray(res)) return res;
  return res?.data?.data || res?.data || res;
};

const getProductById = async (productId) => {
  const endpoint = ENDPOINTS.PROTECTED.PRODUCTS.detail(productId);
  const res = await apiCall(HTTP_METHODS.GET, endpoint);
  return extractResponseData(res);
};

export const semanticSearch = async (payload) => {
  try {
    return await aiApi.semanticSearch(payload);
  } catch (error) {
    console.error("AI semantic search error:", error);
    throw error;
  }
};

export const semanticSearchProducts = async (text, topK = 20) => {
  const query = text?.trim();
  if (!query) return [];

  try {
    const aiResponse = await semanticSearch({ text: query, top_k: topK });
    const aiList = extractResponseData(aiResponse);
    const ids = (Array.isArray(aiList) ? aiList : [])
      .map((item) => item?.product_id || item?.productId || item?.id)
      .filter(Boolean);

    if (ids.length === 0) return [];

    const products = await Promise.all(
      ids.map(async (id) => {
        try {
          const product = await getProductById(id);
          return product ? { ...product, __aiId: String(id) } : null;
        } catch {
          return null;
        }
      })
    );

    const productMap = new Map(
      products.filter(Boolean).map((item) => [item.__aiId, item])
    );

    return ids
      .map((id) => productMap.get(String(id)))
      .filter(Boolean)
      .map(({ __aiId, ...product }) => product);
  } catch (error) {
    console.error("AI semantic search products error:", error);
    throw error;
  }
};

export const updateVectorStore = async () => {
  try {
    return await aiApi.updateVectorStore();
  } catch (error) {
    console.error("AI update vector store error:", error);
    throw error;
  }
};

export const translateTexts = async (payload) => {
  try {
    return await aiApi.translateTexts(payload);
  } catch (error) {
    console.error("AI translate texts error:", error);
    throw error;
  }
};

export const getRecommendations = async (payload) => {
  try {
    return await aiApi.getRecommendations(payload);
  } catch (error) {
    console.error("AI recommendation error:", error);
    throw error;
  }
};

export const trainRecommendModelAsync = async () => {
  try {
    return await aiApi.trainRecommendModelAsync();
  } catch (error) {
    console.error("AI train model async error:", error);
    throw error;
  }
};

export const trainRecommendModelSync = async () => {
  try {
    return await aiApi.trainRecommendModelSync();
  } catch (error) {
    console.error("AI train model sync error:", error);
    throw error;
  }
};

export const getRecommendModelStatus = async () => {
  try {
    return await aiApi.getRecommendModelStatus();
  } catch (error) {
    console.error("AI get model status error:", error);
    throw error;
  }
};

export const getSimilarProducts = async (payload) => {
  try {
    return await aiApi.getSimilarProducts(payload);
  } catch (error) {
    console.error("AI get similar products error:", error);
    throw error;
  }
};

export const getConfig = async () => {
  try {
    return await aiApi.getConfig();
  } catch (error) {
    console.error("AI get config error:", error);
    throw error;
  }
};

export const updateConfig = async (payload) => {
  try {
    return await aiApi.updateConfig(payload);
  } catch (error) {
    console.error("AI update config error:", error);
    throw error;
  }
};

export const aiService = {
  semanticSearch,
  semanticSearchProducts,
  updateVectorStore,
  translateTexts,
  getRecommendations,
  trainRecommendModelAsync,
  trainRecommendModelSync,
  getRecommendModelStatus,
  getSimilarProducts,
  getConfig,
  updateConfig,
};
