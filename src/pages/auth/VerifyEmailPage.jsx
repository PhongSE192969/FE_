import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Coffee,
  Mail,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  LogIn,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { resendFirebaseEmailVerification } from "@/services/firebaseAuthService";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).auth?.verifyEmail || {};

  const { email, mode } = location.state || {};

  const [resendLoading, setResendLoading] = useState(false);

  const handleGoLogin = () => {
    navigate("/login", {
      replace: true,
      state: {
        email,
        needVerifiedSync: true,
      },
    });
  };

  const handleResend = async () => {
    setResendLoading(true);

    try {
      await resendFirebaseEmailVerification();

      toast.success(
        t.toasts?.newCodeSent ||
          "Đã gửi lại email xác minh. Vui lòng kiểm tra hộp thư."
      );
    } catch (error) {
      console.error("Resend Firebase verification error:", error);

      toast.error(
        "Không thể gửi lại email xác minh vì phiên đăng ký đã kết thúc. Vui lòng đăng nhập lại, sau đó yêu cầu gửi lại email xác minh."
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-gold mx-auto mb-4">
            <Coffee size={32} />
          </div>

          <h1 className="text-2xl font-black text-primary">Capital Coffee</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="size-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mx-auto mb-4">
              <Mail size={32} />
            </div>

            <h2 className="text-2xl font-black text-primary mb-2">
              Xác minh email của bạn
            </h2>

            <p className="text-gray-500 text-sm leading-relaxed">
              Chúng tôi đã gửi một <b>link xác minh</b> đến{" "}
              <span className="font-bold text-primary">
                {email || "email của bạn"}
              </span>
              .
              <br />
              Hãy mở email và bấm vào link xác minh để kích hoạt tài khoản.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-blue-600 shrink-0 mt-0.5" />

              <div>
                <h3 className="font-black text-blue-900 text-sm">
                  Sau khi bấm link xác minh
                </h3>

                <p className="text-blue-700/80 text-xs mt-1 leading-relaxed">
                  Quay lại trang này và bấm nút bên dưới để đăng nhập. Khi đăng
                  nhập lại, hệ thống sẽ đồng bộ trạng thái xác minh email từ
                  Firebase về backend.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleGoLogin}
            className="w-full h-12 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <LogIn size={18} />
            <span>Tôi đã xác minh, đăng nhập ngay</span>
            <ArrowRight size={16} />
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-3">
              Chưa nhận được email xác minh?
            </p>

            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="flex items-center gap-2 text-sm font-bold text-primary hover:text-gold transition-colors mx-auto disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={resendLoading ? "animate-spin" : ""}
              />
              Gửi lại email xác minh
            </button>

            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
              Nếu không gửi lại được, hãy đăng nhập lại bằng email vừa đăng ký
              để hệ thống lấy lại phiên Firebase.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link
              to="/register"
              className="text-xs text-gray-400 hover:text-primary transition-colors"
            >
              ← Quay lại đăng ký
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}