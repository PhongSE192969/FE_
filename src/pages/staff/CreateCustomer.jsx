import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserPlus, ArrowLeft, Phone, User, Mail, AtSign, RefreshCw, Users } from "lucide-react";
import { useLanguageStore, useAuthStore } from "@/stores";
import { translations } from "@/locales";
import toast from "react-hot-toast";
import { CreateOne } from "@/services";

export default function CreateCustomer() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore(); // Lấy thông tin Staff đang đăng nhập để lấy franchiseId
  const t = (translations[language] || translations.vi).staff?.createCustomer || {};

  const navigate = useNavigate();
  const location = useLocation();

  // Get phone from navigation state (from CreateOrder)
  const initialPhone = location.state?.phone || "";

  const [formData, setFormData] = useState({
    fullName: "",
    phone: initialPhone,
    email: "",
    username: "",
    gender: true, // true: Nam, false: Nữ
  });
  const [loading, setLoading] = useState(false);
  const [isUsernameEdited, setIsUsernameEdited] = useState(false);

  // Hàm random username từ name, phone, email
  const generateUsername = (name, phone, email) => {
    const cleanName = (name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase()
      .slice(0, 6);
    const emailPrefix = email ? email.split("@")[0].slice(0, 4) : "";
    const phonePart = phone && phone.length >= 4 ? phone.slice(-4) : "";
    const randomStr = Math.random().toString(36).substring(2, 5);

    return `${cleanName}${emailPrefix}${phonePart}${randomStr}`.toLowerCase() || `user${Math.floor(Math.random() * 10000)}`;
  };

  // Tự động random username khi nhập thông tin (nếu user chưa tự sửa tay)
  useEffect(() => {
    if (!isUsernameEdited) {
      setFormData((prev) => ({
        ...prev,
        username: generateUsername(prev.fullName, prev.phone, prev.email),
      }));
    }
  }, [formData.fullName, formData.phone, formData.email, isUsernameEdited]);

  const handleRandomUsername = () => {
    setFormData((prev) => ({
      ...prev,
      username: generateUsername(prev.fullName, prev.phone, prev.email),
    }));
    setIsUsernameEdited(false); // Reset cờ để tiếp tục auto nếu cần
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "username") {
      setIsUsernameEdited(true);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.phone || !formData.username) {
      toast.error(t.alerts?.fillAll || "Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    if (formData.phone.length < 10) {
      toast.error(t.alerts?.phoneLength || "Số điện thoại phải có ít nhất 10 số");
      return;
    }

    setLoading(true);
    try {
      const franchiseId = user?.franchiseId || user?.franchise?.id;
      if (!franchiseId) {
        throw new Error("Staff does not belong to any franchise!");
      }

      // Xây dựng payload để gọi xuống CreateOne (userService)
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        username: formData.username,
        gender: formData.gender,
        roleName: "CUSTOMER", // Cứng role là khách hàng
        franchiseId: franchiseId,
      };

      const result = await CreateOne(payload);

      if (result && (result.statusCode === 200 || result.statusCode === 201)) {
        toast.success(t.alerts?.success || "Tạo khách hàng thành công! 🎉");

        // Navigate back to CreateOrder with customer info
        navigate("/staff/new-order", {
          state: {
            newCustomer: result.data || payload, // Truyền lại info
            phone: formData.phone,
          },
        });
      } else {
        throw new Error("Có lỗi xảy ra khi tạo khách hàng.");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      const errorMessage =
        error.message ||
        t.alerts?.error ||
        "Lỗi khi tạo khách hàng. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate("/staff/new-order");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">{t.back || "Quay lại Đơn hàng"}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-primary">
                {t.title || "Đăng Ký Khách Hàng Mới"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t.subtitle || "Tạo hồ sơ khách hàng mới để tham gia chương trình khách hàng thân thiết"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                {t.form?.name || "Họ và Tên"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder={t.form?.namePlaceholder || "Nhập họ và tên khách hàng"}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Phone size={16} className="inline mr-1" />
                {t.form?.phone || "Số Điện Thoại"} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t.form?.phonePlaceholder || "Nhập số điện thoại"}
                required
                minLength={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            {/* Email & Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-1" />
                  {t.form?.email || "Email"} <span className="text-gray-400 font-normal">(Tùy chọn)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t.form?.emailPlaceholder || "khachhang@example.com"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>

              {/* Username (Auto-generated) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <AtSign size={16} className="inline mr-1" />
                  {t.form?.username || "Username"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Tạo tự động..."
                    required
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-gray-50/50"
                  />
                  <button
                    type="button"
                    onClick={handleRandomUsername}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-colors"
                    title="Random Username"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Gender Toggle */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Users size={16} className="inline mr-1" />
                {t.form?.gender || "Giới tính"}
              </label>
              <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-xl w-fit border border-gray-200">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: true })}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    formData.gender === true
                      ? "bg-white text-primary shadow-sm border border-gray-200"
                      : "text-gray-500 hover:bg-gray-200/50"
                  }`}
                >
                  Nam
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: false })}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    formData.gender === false
                      ? "bg-white text-pink-600 shadow-sm border border-gray-200"
                      : "text-gray-500 hover:bg-gray-200/50"
                  }`}
                >
                  Nữ
                </button>
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-800">
                {t.form?.note ||
                  "💡 Lưu ý: Khách hàng mới sẽ tự động được thêm vào chương trình thành viên với hạng Đồng (Bronze)."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                {t.actions?.cancel || "Hủy bỏ"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 bg-[#d9a13b] hover:bg-[#c48f32] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#d9a13b]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Tạo Khách Hàng
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}