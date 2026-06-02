export const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
})
export const generateKey = () => Math.random().toString(36).substr(2, 9)

const getNonEmptyValue = (value) => {
    if (value === null || value === undefined) return undefined
    if (typeof value === 'string' && value.trim() === '') return undefined
    return value
}

export const getLocalizedField = (item, field, lang) => {
    const safeItem = item || {}
    const viValue = getNonEmptyValue(safeItem[field])
    const enValue = getNonEmptyValue(safeItem[`${field}En`])
    const jaValue = getNonEmptyValue(safeItem[`${field}Ja`])

    if (lang === 'en') {
        return enValue ?? viValue ?? ''
    }

    if (lang === 'ja' || lang === 'jp') {
        return jaValue ?? enValue ?? viValue ?? ''
    }

    return viValue ?? enValue ?? ''
}

export const getStatusColor = (status) => {
    const colors = {
        // Online order statuses
        created: 'bg-blue-100 text-blue-700',
        assigned: 'bg-purple-100 text-purple-700',
        shipping: 'bg-orange-100 text-orange-700',
        delivered: 'bg-green-100 text-green-700',
        failed: 'bg-red-100 text-red-700',
        // In-store order statuses (backward compatibility)
        pending: 'bg-yellow-100 text-yellow-700',
        confirmed: 'bg-blue-100 text-blue-700',
        preparing: 'bg-orange-100 text-orange-700',
        ready: 'bg-green-100 text-green-700',
        completed: 'bg-gray-100 text-gray-600',
        cancelled: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
}

export const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(val);

export const normalize = (str = "") => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .trim();
};

export const normalizeVietnamese = (str = "") => {
    return normalize(str)
        .replace(/thanh pho|tp\.?/g, "")
        .replace(/tinh/g, "")
        .replace(/quan|q\.?/g, "")
        .replace(/huyen/g, "")
        .replace(/phuong|p\.?/g, "")
        .replace(/xa/g, "")
        .replace(/khu pho/g, "")
        .replace(/thi xa/g, "")
        .replace(/\s+/g, " ")
        .trim();
};
export const normalizeProvince = (str = "") => {
    return normalize(str)
        .replace(/thanh pho|tp\.?|tinh/g, "")
        .replace(/city/g, "") // 🔥 fix Geoapify EN
        .trim();
};
export const normalizeDistrict = (str = "") => {
    return normalize(str)
        .replace(/quan|q\.?|huyen|thi xa|thanh pho/g, "")
        .trim();
};
export const normalizeWard = (str = "") => {
    return normalize(str)
        .replace(/phuong|p\.?|xa|thi tran/g, "")
        .trim();
};
export const truncateWords = (text, maxWords = 10) => {
    if (!text) return '';

    const words = text.split(' ');
    if (words.length <= maxWords) return text;

    return `${words.slice(0, maxWords).join(' ')}...`;
};