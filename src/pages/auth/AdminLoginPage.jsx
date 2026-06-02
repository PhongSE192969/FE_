// src/pages/auth/AdminLoginPage.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Coffee,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useAuthStore, useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import toast from "react-hot-toast";
import { firebaseLogin } from "@/services/firebaseAuthService";
import { SyncFirebaseUser } from "@/services/authService";

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

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuthStore();
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).auth?.adminLogin || {};

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const justVerified = location.state?.verified;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username || !form.password) {
      toast.error(t.toasts?.fillAll || "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const firebaseResult = await firebaseLogin(
        form.username.trim(),
        form.password
      );

      const idToken = firebaseResult?.idToken;

      if (!idToken) {
        toast.error("Cannot get Firebase token");
        return;
      }

      const backendUser = await SyncFirebaseUser(idToken);

      if (!backendUser) {
        toast.error(t.toasts?.invalid || "Invalid credentials");
        return;
      }

      const roleName = backendUser?.role?.name || backendUser?.role;
      const normalizedRole = String(roleName || "").toUpperCase();

      if (!normalizedRole) {
        toast.error("Account has no role. Please check backend role assignment.");
        return;
      }

      if (normalizedRole === "CUSTOMER") {
        toast.error("Customer account cannot access staff portal.");
        return;
      }

      if (!["MANAGER", "ADMIN", "STORE_MANAGER", "STAFF"].includes(normalizedRole)) {
        toast.error("This role is not allowed to access staff portal.");
        return;
      }

      if (backendUser?.status && backendUser.status !== "ACTIVE") {
        toast.error("Your account is not active.");
        return;
      }

      login({
        user: backendUser,
        accessToken: idToken,
      });

      toast.success(
        (t.toasts?.welcome || "Welcome back, {name}! ☕").replace(
          "{name}",
          backendUser.fullName || backendUser.username || "User"
        )
      );

      navigate(getDashboardPathByRole(normalizedRole), { replace: true });
    } catch (err) {
      console.error("Admin Firebase login error:", err);

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
            t.toasts?.failed ||
            "Login failed"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-4">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center mb-8">
          <div className="size-36 rounded-2xl bg-gold/20 text-gold flex items-center justify-center mx-auto my-6 border border-gold/30 shadow-2xl">
            <Coffee size={78} />
          </div>

          <h1 className="text-white font-black text-5xl">Capital Coffee</h1>

          <p className="text-white/50 text-sm mt-3">
            {t.header?.subtitle || "Staff Portal"}
          </p>

          <p className="text-center text-white/30 text-xs mt-6">
            <a href="/" className="hover:text-white/60 transition-colors">
              {t.actions?.backToSite || "← Back to Customer Site"}
            </a>
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-10 shadow-2xl">
          {justVerified && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
              <CheckCircle size={20} className="text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-400">
                  {t.banner?.verifiedSuccess || "Email verified successfully!"}
                </p>
                <p className="text-xs text-green-400/80">
                  {t.banner?.canSignIn ||
                    "You can now sign in to your account."}
                </p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3 items-center justify-center text-center">
              {t.header?.loginSystem || "Login with account system"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wide mb-2 block">
                {t.form?.username || "Email"}
              </label>

              <input
                type="email"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-gold/50 transition-colors"
                placeholder={t.placeholders?.username || "Input your email"}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wide mb-2 block">
                {t.form?.password || "Password"}
              </label>

              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-gold/50 transition-colors"
                  placeholder={t.placeholders?.password || "••••••••"}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gold text-primary font-black rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20 mt-6 disabled:opacity-70"
            >
              {loading ? (
                <div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.actions?.signIn || "Sign In"}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}