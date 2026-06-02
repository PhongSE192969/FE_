import { useEffect } from "react";
import { useLanguageStore } from "../../stores";
import { useAuthStore } from "@/stores/authStore";
import { translations } from "../../locales";

export default function CustomerInfo({ customer, setCustomer }) {
  const { language } = useLanguageStore();
  const { user, isAuthenticated } = useAuthStore();

  const t =
    (translations[language] || translations.vi).customer?.checkoutInfo || {};

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    setCustomer((prev) => ({
      ...prev,
      name: prev.name || user.fullName || user.username || "",
      phone: prev.phone || user.phone || "",
      email: prev.email || user.email || "",
      userId: prev.userId || user.id || "",
    }));
  }, [isAuthenticated, user, setCustomer]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
      <h2 className="font-semibold text-gray-700 mb-5">
        {t.title || "CUSTOMER'S INFORMATION"}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">
            {t.form?.name || "Full Name"}
          </label>

          <input
            required
            name="name"
            value={customer?.name || ""}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            className="border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200 transition"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">
            {t.form?.phone || "Phone Number"}
          </label>

          <input
            required
            name="phone"
            value={customer?.phone || ""}
            onChange={handleChange}
            placeholder="09xxxxxxxx"
            className="border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200 transition"
          />
        </div>

        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-xs text-gray-500">
            {t.form?.email || "Email"}
          </label>

          <input
            type="email"
            name="email"
            value={customer?.email || ""}
            onChange={handleChange}
            placeholder="example@gmail.com"
            className="border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200 transition"
          />
        </div>
      </div>

      <label className="flex items-start gap-3 mt-5 cursor-pointer">
        <input
          type="checkbox"
          name="subscribe"
          checked={Boolean(customer?.subscribe)}
          onChange={(event) =>
            setCustomer((prev) => ({
              ...prev,
              subscribe: event.target.checked,
            }))
          }
          className="mt-1 accent-orange-500"
        />

        <span className="text-sm text-gray-500 leading-relaxed">
          {t.form?.subscribe || "Receive email notifications and offers"}
        </span>
      </label>
    </div>
  );
}