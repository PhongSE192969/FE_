import { ConfirmForrgotPassword } from "@/services";
import { ShieldCheck, ArrowLeft, Coffee, Lock } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";

const ConfirmForgotPasswordPage = () => {
  const navigation = useNavigate();
  const location = useLocation();
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).auth?.confirmPassword || {};
  
  const identifier = location.state?.identifier;
  const [isLoading, setIsLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t.toasts?.matchError || "Mật khẩu xác nhận không khớp!");
      return;
    }

    if (passwordForm.code === "") {
      toast.error(t.toasts?.enterOtp || "Please input your email otp");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        identifier,
        code: passwordForm.code,
        newPassword: passwordForm.newPassword
      }
      const response = await ConfirmForrgotPassword(payload);
      console.log(response)
      if (response.statusCode === 200) {
        setPasswordForm({
          code: "",
          newPassword: "",
          confirmPassword: "",
        })

        toast.success(response.message || t.toasts?.resetSuccess || "Password reset successfully.");
        navigation("/login")
      } else {
        toast.error(response.message || t.toasts?.resetFailed || "Reset password failed");
      }
    } catch (error) {
      toast.error(error.message || t.toasts?.error || "An error occurred while reset password")
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-6">
      {/* Pattern nền mờ nhẹ cho đồng bộ với trang Login */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, #1e3a5f 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Branding */}
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
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-black text-primary mb-2">{t.title || "Secure Reset"}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t.subtitle || "Please enter the code we sent to your email and choose a strong new password."}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleResetPassword}>
            {/* Verification Code Field */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                {t.form?.code || "Verification Code"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="input-field tracking-[0.2em] font-mono text-center"
                  placeholder="000000"
                  maxLength={6}
                  value={passwordForm.code}
                  onChange={(e) => setPasswordForm({ ...passwordForm, code: e.target.value })}
                />
              </div>
            </div>

            {/* New Password Field */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                {t.form?.newPassword || "New Password"}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                {t.form?.confirmPassword || "Confirm New Password"}
              </label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mt-2"
            >
               {isLoading ? t.actions?.resetting || "Resetting..." : t.actions?.resetPassword || "Reset Password"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-gold transition-colors"
            >
              <ArrowLeft size={16} />
              {t.actions?.resendCode || "Resend code"}
            </Link>
          </div>
        </div>

         <p className="text-center mt-8 text-xs text-gray-400">
          {t.actions?.backToSignIn || "Back to"} <Link to="/login" className="underline hover:text-primary font-bold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default ConfirmForgotPasswordPage;