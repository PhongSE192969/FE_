import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Coffee, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuthStore, useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { Login } from "@/services/authService";
import { firebaseLogin } from "@/services/firebaseAuthService";
import toast from "react-hot-toast";

const getDashboardPathByRole = (roleName) => {
  const role = String(roleName || "").toUpperCase();

  switch (role) {
    case "MANAGER":
      return "/manager";
    case "ADMIN":
      return "/admin";
    case "STORE_MANAGER":
      return "/store-manager";
    case "STAFF":
      return "/staff";
    case "CUSTOMER":
      return "/";
    default:
      return "/";
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuthStore();
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).auth?.login || {};

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const justVerified = location.state?.verified;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error(t.toasts?.fillAll || "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const firebaseResult = await firebaseLogin(
        form.email.trim(),
        form.password
      );

      const firebaseUser = firebaseResult?.firebaseUser;
      const idToken = firebaseResult?.idToken;

      if (!firebaseUser || !idToken) {
        toast.error(t.toasts?.invalid || "Invalid credentials");
        return;
      }

      const backendResult = await Login({ idToken });

      const backendUser =
        backendResult?.data ||
        backendResult?.user ||
        backendResult;

      if (!backendUser) {
        toast.error("Cannot load user information");
        return;
      }

      login({
        user: backendUser,
        accessToken: idToken,
      });

      const roleName = backendUser?.role?.name || backendUser?.role;
      const normalizedRole = String(roleName || "").toUpperCase();

      if (normalizedRole === "CUSTOMER") {
        import("@/stores/cartStore").then((m) => {
          m.useCartStore.getState().fetchCart?.(backendUser.id);
        });
      }

      toast.success(
        (t.toasts?.welcome || "Welcome back, {name}! ☕").replace(
          "{name}",
          backendUser?.fullName || backendUser?.email || "User"
        )
      );

      navigate(getDashboardPathByRole(normalizedRole), { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      const firebaseCode = err?.code;

      if (firebaseCode === "auth/user-not-found") {
        toast.error("Account does not exist in Firebase.");
      } else if (firebaseCode === "auth/wrong-password") {
        toast.error("Wrong password.");
      } else if (firebaseCode === "auth/invalid-email") {
        toast.error("Invalid email format.");
      } else if (firebaseCode === "auth/invalid-credential") {
        toast.error("Invalid email or password.");
      } else if (firebaseCode === "auth/too-many-requests") {
        toast.error("Too many login attempts. Please try again later.");
      } else {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            t.toasts?.invalid ||
            "Login failed"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-[#1e3a5f] text-white flex-col items-center justify-center p-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 text-center">
          <div className="size-24 rounded-2xl bg-gold/20 text-gold flex items-center justify-center mx-auto mb-8 border border-gold/30 shadow-2xl shadow-gold/10">
            <Coffee size={44} />
          </div>

          <h1 className="text-5xl font-black mb-4 leading-tight">
            {t.welcome?.title
              ? t.welcome.title.split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < t.welcome.title.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))
              : "Welcome Back"}
          </h1>

          <p className="text-white/60 text-lg max-w-xs leading-relaxed">
            {t.welcome?.subtitle ||
              "Sign in to access your orders, rewards, and personalized experience."}
          </p>

          <div className="mt-10 flex flex-col gap-3 text-left">
            {[
              t.welcome?.features?.track || "Track your orders in real-time",
              t.welcome?.features?.earn || "Earn & redeem rewards points",
              t.welcome?.features?.save || "Save your favorite customizations",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/80">
                <div className="size-5 rounded-full bg-gold/30 flex items-center justify-center shrink-0">
                  <div className="size-2 rounded-full bg-gold" />
                </div>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-gold">
              <Coffee size={20} />
            </div>
            <span className="text-xl font-black text-primary">
              Capital Coffee
            </span>
          </div>

          {justVerified && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle size={20} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-700">
                  {t.banner?.verifiedSuccess ||
                    "Email verified successfully!"}
                </p>
                <p className="text-xs text-green-600">
                  {t.banner?.canSignIn ||
                    "You can now sign in to your account."}
                </p>
              </div>
            </div>
          )}

          <h2 className="text-3xl font-black text-primary mb-2">
            {t.form?.title || "Sign In"}
          </h2>

          <p className="text-gray-500 mb-8">
            {t.form?.noAccount || "Don't have an account?"}{" "}
            <Link
              to="/register"
              className="text-primary font-bold hover:text-gold transition-colors"
            >
              {t.form?.joinFree || "Join free"}
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                {t.form?.username || "Email"}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder={t.placeholders?.username || "input your email"}
                className="input-field"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {t.form?.password || "Password"}
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-primary hover:text-gold transition-colors"
                >
                  {t.form?.forgotPassword || "Forgot password?"}
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder={t.placeholders?.password || "••••••••"}
                  className="input-field pr-12"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70"
            >
              {loading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{t.actions?.signIn || "Sign In"}</span>
              )}
            </button>
          </form>

          <div className="w-full flex items-center justify-center">
            <div className="h-[1px] w-[50%] bg-slate-300 my-3 rounded-lg" />
          </div>

          <div className="text-center w-full items-center justify-center mt-2">
            <Link
              to="/forgot-password"
              className="text-xs text-primary font-bold underline hover:text-gold transition-colors"
            >
              {t.form?.forgotPassword || "Forgot Password?"}
            </Link>
          </div>

          <div className="mt-8 border-t border-gray-100 text-center pt-4">
            <p className="text-xs text-gray-400">
              {t.footer?.isStaff || "Are you staff?"}{" "}
              <Link
                to="/admin/login"
                className="text-primary font-bold hover:text-gold transition-colors"
              >
                {t.footer?.staffPortal || "Staff Portal →"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}