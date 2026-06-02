import { formatCurrency } from "../../utils/helpers";
import { useLanguageStore } from "../../stores";
import { translations } from "../../locales";

const getItemQuantity = (item = {}) => {
  return Number(item.quantity || item.qty || 1);
};

const getItemPrice = (item = {}) => {
  return Number(item.price || item.sellingPrice || item.salePrice || 0);
};

const getItemImage = (item = {}) => {
  return item.image || item.imageUrl || item.productImageUrl || "/logo01.png";
};

const getItemName = (item = {}) => {
  return item.name || item.productName || item.productNameSnapshot || "Sản phẩm";
};

const getItemKey = (item = {}, index) => {
  return (
    item.key ||
    item.variantId ||
    item.productVariantId ||
    item.selectedVariantId ||
    item.id ||
    `order-summary-item-${index}`
  );
};

export default function OrderSummary({ items = [] }) {
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).customer?.checkoutInfo
      ?.orderSummary || {};

  const subtotal = items.reduce((sum, item) => {
    return sum + getItemPrice(item) * getItemQuantity(item);
  }, 0);

  const total = subtotal;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
      {/* HEADER */}
      <h2 className="font-semibold text-gray-700 mb-4">
        {t.title || "Items"}
      </h2>

      {/* LIST ITEMS */}
      {items.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-6">
          Không có sản phẩm trong đơn hàng.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const quantity = getItemQuantity(item);
            const price = getItemPrice(item);
            const image = getItemImage(item);
            const name = getItemName(item);

            return (
              <div
                key={getItemKey(item, index)}
                className="flex items-center gap-4 border-b last:border-none pb-4 last:pb-0"
              >
                {/* IMAGE */}
                <img
                  src={image}
                  alt={name}
                  className="w-16 h-16 object-cover rounded-lg border bg-gray-50"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/logo01.png";
                  }}
                />

                {/* INFO */}
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-gray-800 line-clamp-2">
                    {name}
                  </p>

                  <p className="text-xs text-gray-400">
                    {item.options?.color && `Màu: ${item.options.color}`}
                    {item.options?.size && ` · Size: ${item.options.size}`}
                    {!item.options?.color &&
                      item.color &&
                      `Màu: ${item.color}`}
                    {!item.options?.size && item.size && ` · Size: ${item.size}`}
                  </p>

                  <p className="text-orange-500 font-semibold">
                    {formatCurrency(price)}
                  </p>
                </div>

                {/* QTY */}
                <div className="text-sm text-gray-500 font-medium">
                  x{quantity}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TOTAL */}
      <div className="flex justify-between items-center mt-5 pt-4 border-t">
        <span className="text-gray-600 font-medium">
          {t.total || "Total"}
        </span>

        <span className="text-orange-500 text-lg font-bold">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}