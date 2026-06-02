import { KeyIcon, ArrowLeft, Coffee } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { firebaseForgotPassword } from "@/services/firebaseAuthService";

const getFirebaseForgotPasswordMessage = (error) => {
  const code = error?.code || "";

  switch (code) {
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    case "auth/user-not-found":
      return "Không tìm thấy tài khoản Firebase với email này.";
    case "auth/missing-email":
      return "Vui lòng nhập email.";
    case "auth/too-many-requests":
      return "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.";
    case "auth/network-request-failed":
      return "Lỗi kết nối Firebase. Kiểm tra mạng rồi thử lại.";
    default:
      return error?.message || "Không thể gửi email đặt lại mật khẩu.";
  }
};

const ForgotPasswordPage = () => {
  const navigation = useNavigate();
  const { language } = useLanguageStore();
  const t =
    (translations[language] || translations.vi).auth?.forgotPassword || {};

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      toast.error(t.toasts?.enterIdentifier || "Please enter your email");
      return;
    }

    if (!cleanEmail.includes("@")) {
      toast.error("Firebase reset password cần email, không dùng username.");
      return;
    }

    try {
      setIsLoading(true);

      await firebaseForgotPassword(cleanEmail);

      setEmail("");

      toast.success(
        "Đã gửi link đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư."
      );

      setTimeout(() => {
        navigation("/login", {
          state: {
            resetEmailSent: true,
            email: cleanEmail,
          },
        });
      }, 1500);
    } catch (error) {
      toast.error(
        getFirebaseForgotPasswordMessage(error) ||
          t.toasts?.error ||
          "An error occurred while sending reset email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-6">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, #1e3a5f 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-gold shadow-lg">
            <Coffee size={24} />
          </div>

          <span className="text-2xl font-black text-primary uppercase tracking-tight">
            Capital Coffee
          </span>
        </div>

        <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-xl shadow-primary/5 border border-gray-100">
          <div className="text-center mb-8">
            <div className="size-16 rounded-2xl bg-gold/10 text-gold flex items-center justify-center mx-auto mb-4 border border-gold/20 shadow-sm">
              <KeyIcon size={32} />
            </div>

            <h2 className="text-3xl font-black text-primary mb-2">
              {t.title || "Forgot Password"}
            </h2>

            <p className="text-sm text-gray-500 leading-relaxed">
              Nhập email tài khoản của bạn. Firebase sẽ gửi link đặt lại mật
              khẩu đến email đó.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                Email
              </label>

              <input
                type="email"
                required
                className="input-field"
                placeholder="your@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70"
            >
              {isLoading
                ? t.actions?.sending || "Sending..."
                : "Gửi link đặt lại mật khẩu"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-gold transition-colors"
            >
              <ArrowLeft size={16} />
              {t.actions?.backToSignIn || "Back to Sign In"}
            </Link>
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-gray-400">
          {t.footer?.needHelp || "Need help?"}{" "}
          <a href="#" className="underline hover:text-primary">
            {t.footer?.contactSupport || "Contact Support"}
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;