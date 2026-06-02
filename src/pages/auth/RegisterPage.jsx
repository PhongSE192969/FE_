import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Coffee, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import toast from "react-hot-toast";
import InputField from "@/components/form/InputField";
import { useLanguageStore } from "@/stores";
import { translations } from "@/locales";
import { firebaseRegister, firebaseLogout } from "@/services/firebaseAuthService";
import { axiosClient } from "@/config/axiosClient";

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/chaamz03/image/upload/v1756819623/default-avatar-icon-of-social-media-user-vector_t2fvta.jpg";

const getFirebaseErrorMessage = (error) => {
  const code = error?.code || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Email này đã được đăng ký trên Firebase.";
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    case "auth/weak-password":
      return "Mật khẩu Firebase yêu cầu tối thiểu 6 ký tự.";
    case "auth/operation-not-allowed":
      return "Firebase chưa bật Email/Password sign-in.";
    case "auth/network-request-failed":
      return "Lỗi kết nối Firebase. Kiểm tra mạng rồi thử lại.";
    default:
      return error?.message || "Tạo tài khoản Firebase thất bại.";
  }
};

/**
 * Backend hiện tại:
 * POST /api/auth/sync-user
 *
 * Vì axiosClient baseURL = "/api"
 * nên FE gọi: /auth/sync-user
 *
 * Backend hiện tại chỉ đọc Authorization header,
 * chưa đọc body username / phone / gender.
 */
const syncFirebaseUserToBackend = async ({ idToken }) => {
  const res = await axiosClient.post("/auth/sync-user", null, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  return res?.data?.data || res?.data || res;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).auth?.register || {};

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    gender: "",
    avatarUrl: "",
  });

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key) => (event) => {
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [key]: undefined,
    }));
  };

  const validateForm = () => {
    if (
      !form.username ||
      !form.email ||
      !form.password ||
      !form.fullName ||
      !form.phone
    ) {
      toast.error(t.toasts?.fillAll || "Please fill all required fields");
      return false;
    }

    if (form.password !== form.confirm) {
      toast.error(t.toasts?.matchError || "Passwords do not match");
      return false;
    }

    if (!agree) {
      toast.error(t.toasts?.agreeTerms || "Please agree to the terms");
      return false;
    }

    if (/\s/.test(form.password)) {
      toast.error(t.toasts?.pwdSpaces || "Password cannot contain spaces");
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      toast.error(
        t.toasts?.usernameFormat ||
          "Username only allows letters, numbers, underscores"
      );
      return false;
    }

    if (form.password.length < 8 || form.password.length > 64) {
      toast.error(
        t.toasts?.pwdLength || "Password must be between 8 and 64 characters"
      );
      return false;
    }

    if (form.username.length < 3 || form.username.length > 64) {
      toast.error(
        t.toasts?.usernameLength ||
          "Username must be between 3 and 64 characters"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const fullName = form.fullName.trim();
      const email = form.email.trim();

      const { idToken } = await firebaseRegister({
        email,
        password: form.password,
        fullName,
      });

      await syncFirebaseUserToBackend({
        idToken,
      });

      /**
       * Sau khi gửi email verify, logout để user đăng nhập lại sau khi bấm link verify.
       * Nếu firebaseRegister của bạn chưa gọi sendEmailVerification thì vẫn không lỗi.
       */
      await firebaseLogout();

      toast.success(
        t.toasts?.success ||
          "Tạo tài khoản thành công. Vui lòng kiểm tra email để xác minh tài khoản."
      );

      navigate("/verify-email", {
        replace: true,
        state: {
          email,
          username: form.username.trim(),
          mode: "firebase-link",
        },
      });
    } catch (error) {
      console.error("Register error:", error);

      const status = error?.response?.status;
      const backendData = error?.response?.data?.data;
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;

      if (backendData && typeof backendData === "object") {
        setFieldErrors(backendData);
        toast.error(t.toasts?.fixErrors || "Please fix the errors below");
      } else if (status === 403) {
        toast.error(
          "Sync user bị chặn. Kiểm tra request có gọi đúng /api/auth/sync-user chưa."
        );
      } else if (error?.code?.startsWith?.("auth/")) {
        toast.error(getFirebaseErrorMessage(error));
      } else {
        toast.error(backendMessage || t.toasts?.failed || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const strength =
    form.password.length > 8
      ? form.password.match(/[A-Z]/) && form.password.match(/[0-9]/)
        ? "strong"
        : "medium"
      : form.password.length > 0
        ? "weak"
        : "";

  const strengthColors = {
    weak: "bg-red-400",
    medium: "bg-yellow-400",
    strong: "bg-green-400",
  };

  return (
    <div className="min-h-screen bg-bg-light flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#1a3a2a] to-[#0d2d1e] text-white flex-col items-center justify-center p-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 text-center">
          <div className="size-24 rounded-2xl bg-green-400/20 text-green-400 flex items-center justify-center mx-auto mb-8 border border-green-400/30">
            <Coffee size={44} />
          </div>

          <h1 className="text-5xl font-black mb-4 leading-tight">
            {t.welcome?.title
              ? t.welcome.title.split("\n").map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < t.welcome.title.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))
              : "Join the Family"}
          </h1>

          <p className="text-white/60 text-lg max-w-xs leading-relaxed">
            {t.welcome?.subtitle ||
              "Create your free account and start earning rewards today."}
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              {
                value: "50",
                label: t.welcome?.stats?.points || "Welcome Points",
              },
              {
                value: "Free",
                label: t.welcome?.stats?.membership || "Membership",
              },
              {
                value: "5%",
                label: t.welcome?.stats?.birthday || "Birthday Bonus",
              },
              {
                value: "24/7",
                label: t.welcome?.stats?.support || "Support",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 border border-white/10 rounded-xl p-4 text-center"
              >
                <div className="text-2xl font-black text-green-400">
                  {stat.value}
                </div>

                <div className="text-white/60 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-gold">
              <Coffee size={20} />
            </div>

            <span className="text-xl font-black text-primary">
              Capital Coffee
            </span>
          </div>

          <h2 className="text-3xl font-black text-primary mb-2">
            {t.form?.title || "Create Account"}
          </h2>

          <p className="text-gray-500 mb-8">
            {t.form?.haveAccount || "Already have an account?"}{" "}
            <Link
              to="/login"
              className="text-primary font-bold hover:text-gold transition-colors"
            >
              {t.form?.signIn || "Sign in"}
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label={t.form?.username || "Username"}
              required
              error={fieldErrors.username}
            >
              <input
                value={form.username}
                onChange={set("username")}
                placeholder="chaamz03"
                className={`input-field ${
                  fieldErrors.username ? "border-red-400" : ""
                }`}
              />
            </InputField>

            <InputField
              label={t.form?.fullName || "Full Name"}
              required
              error={fieldErrors.fullName}
            >
              <input
                value={form.fullName}
                onChange={set("fullName")}
                placeholder="Nguyen Van A"
                className={`input-field ${
                  fieldErrors.fullName ? "border-red-400" : ""
                }`}
              />
            </InputField>

            <InputField
              label={t.form?.email || "Email Address"}
              required
              error={fieldErrors.email}
            >
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="your@email.com"
                className={`input-field ${
                  fieldErrors.email ? "border-red-400" : ""
                }`}
              />
            </InputField>

            <InputField
              label={t.form?.phone || "Phone Number"}
              required
              error={fieldErrors.phone}
            >
              <input
                value={form.phone}
                onChange={set("phone")}
                placeholder="0901 234 567"
                className={`input-field ${
                  fieldErrors.phone ? "border-red-400" : ""
                }`}
              />
            </InputField>

            <InputField label={t.form?.gender || "Gender"}>
              <select
                value={form.gender}
                onChange={set("gender")}
                className="input-field"
              >
                <option value="">
                  {t.form?.genderOptions?.none || "Prefer not to say"}
                </option>
                <option value="male">
                  {t.form?.genderOptions?.male || "Male"}
                </option>
                <option value="female">
                  {t.form?.genderOptions?.female || "Female"}
                </option>
              </select>
            </InputField>

            <InputField
              label={t.form?.password || "Password"}
              required
              error={fieldErrors.password}
            >
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min 8 characters"
                  className={`input-field pr-12 ${
                    fieldErrors.password ? "border-red-400" : ""
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {strength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        strengthColors[strength]
                      } ${
                        strength === "weak"
                          ? "w-1/3"
                          : strength === "medium"
                            ? "w-2/3"
                            : "w-full"
                      }`}
                    />
                  </div>

                  <span
                    className={`text-xs font-bold capitalize ${
                      strength === "strong"
                        ? "text-green-600"
                        : strength === "medium"
                          ? "text-yellow-600"
                          : "text-red-500"
                    }`}
                  >
                    {t.form?.strength?.[strength] || strength}
                  </span>
                </div>
              )}
            </InputField>

            <InputField
              label={t.form?.confirmPassword || "Confirm Password"}
              required
            >
              <input
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                placeholder="Repeat password"
                className={`input-field ${
                  form.confirm && form.confirm !== form.password
                    ? "border-red-400"
                    : ""
                }`}
              />

              {form.confirm && form.confirm !== form.password && (
                <p className="mt-1 text-xs text-red-500">
                  {t.toasts?.matchError || "Passwords do not match"}
                </p>
              )}
            </InputField>

            <label className="flex items-start gap-3 cursor-pointer mt-2">
              <div
                onClick={() => setAgree(!agree)}
                className={`size-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  agree ? "bg-primary border-primary" : "border-gray-300"
                }`}
              >
                {agree && <Check size={12} className="text-white" />}
              </div>

              <span className="text-sm text-gray-500">
                {t.form?.terms?.agree || "I agree to the"}{" "}
                <a href="#" className="text-primary font-bold">
                  {t.form?.terms?.tos || "Terms of Service"}
                </a>{" "}
                {t.form?.terms?.and || "and"}{" "}
                <a href="#" className="text-primary font-bold">
                  {t.form?.terms?.privacy || "Privacy Policy"}
                </a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70 mt-2"
            >
              {loading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.actions?.createAccount || "Create Account"}</span>
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