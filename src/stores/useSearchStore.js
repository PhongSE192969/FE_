import { create } from 'zustand'
import axios from 'axios'
import { getProducts, SearchProductsByIds } from "@/services/productService"

const extractFirstObjectValue = (obj) => {
    if (!obj || typeof obj !== 'object') return null
    const keys = Object.keys(obj).sort()
    return keys.length > 0 ? obj[keys[0]] : null
}

const parseMaybeJsonArray = (value) => {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    if (!trimmed.startsWith('[')) return value

    try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0]
        }
    } catch (e) {
        return value
    }

    return value
}

const normalizeProductImage = (product) => {
    const variant = product?.variants?.[0]
    const variantImageObject = extractFirstObjectValue(variant?.images)

    const candidate =
        variantImageObject ||
        variant?.imageUrl ||
        product?.imageUrl ||
        product?.image ||
        '/logo01.png'

    const normalized = parseMaybeJsonArray(candidate)
    return typeof normalized === 'string' && normalized.trim() ? normalized : '/logo01.png'
}

export const useSearchStore = create((set, get) => ({
    searchQuery: '',
    isSearching: false,
    searchResults: null,
    productsCache: [],
    svcMapCache: null, // map integer ID -> product name

    setSearchQuery: (query) => set({ searchQuery: query }),
    setIsSearching: (status) => set({ isSearching: status }),
    clearSearch: () => set({ searchQuery: '', isSearching: false, searchResults: null }),

    performSearch: async (query, limit = -1) => {
        const trimmed = query?.trim()
        if (!trimmed) {
            set({ searchResults: null, isSearching: false })
            return
        }

        try {
            set({ isSearching: true })

            // 1. Call AI to get UUIDs
            const res = await axios.post('/api/ai/search', { text: trimmed, top_k: limit })
            const aiList = res.data?.data || []
            const aiIds = (Array.isArray(aiList) ? aiList : [])
                .map(item => item?.product_id || item?.productId || item?.id)
                .filter(id => id != null)
                .map(String)

            if (aiIds.length === 0) {
                set({ searchResults: [], isSearching: false })
                return
            }

            // 2. Fetch specific products by UUIDs globally
            let matched = await SearchProductsByIds(aiIds);
            
            // Extract the list
            if (matched?.data) {
                matched = matched.data;
            }

            // Transform backend response to match frontend UI expected fields
            const formattedMatched = (matched || []).map(p => ({
                ...p,
                categoryName: p.category?.name || p.categoryName || '',
                image: normalizeProductImage(p)
            }));

            // 3. Sort products to match AI UUIDs order (for relevance)
            const idToProduct = new Map(formattedMatched.map(p => [p.id, p]));
            const sortedMatches = aiIds.map(id => idToProduct.get(id)).filter(Boolean);

            set({ searchResults: sortedMatches, isSearching: false })
        } catch (error) {
            console.error('Semantic search failed:', error)
            set({ searchResults: null, isSearching: false })
        }
    }
}))
