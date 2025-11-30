"use client";

import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { EyeOff, Eye, GoogleLogo } from "@/lib/icons";
import Link from "next/link";

import { googleSignIn, login } from "../auth-actions";

interface SignInFormData {
  email: string;
  password: string;
}

const SignIn = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSignIn = async (data: SignInFormData) => {
    setGeneralError(null);
    setLoading(true);
    
    try {
      const result = await login({ email: data.email, password: data.password });
      
      if (result.error) {
        setGeneralError("Login failed. " + result.error.message);
        setLoading(false);
      } else if (result.success) {
        window.location.href = "/";
      }
    } catch (err) {
      setGeneralError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    setLoading(true);
    try {
      await googleSignIn();
    } catch (err) {
      if (err instanceof Error) {
        setGeneralError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-surface-primary text-foreground-primary min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row h-full min-h-screen">
        {/* Logo Section */}
        <div className="bg-[#001731] flex items-center justify-center p-8 md:w-2/6 w-full min-h-[120px] md:min-h-0">
          <Image src="/Logo.png" width={150} height={150} alt="Logo" className="mx-auto" />
        </div>
        {/* Form Section */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 md:px-16 lg:px-32">
          <div className="bg-[#eff8ff] w-full max-w-md md:max-w-lg p-8 md:p-12 rounded-3xl shadow-2xl">
            <form
              onSubmit={handleSubmit(handleSignIn)}
              className="flex flex-col gap-4"
            >
              <div>
                <input
                  data-testid="email-input"
                  className="p-3 py-4 rounded-lg bg-surface-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary-500 w-full placeholder:text-foreground-tertiary"
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  {...register("email", { required: "Email is required" })}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  data-testid="password-input"
                  className="p-3 py-4 rounded-lg bg-surface-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary-500 w-full pr-12 placeholder:text-foreground-tertiary"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-foreground-tertiary hover:text-foreground-primary"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="text-2xl" />
                  ) : (
                    <Eye className="text-2xl" />
                  )}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                data-testid="login-button"
                type="submit"
                className="px-8 py-3 mt-2 rounded-full bg-primary-600 text-white font-semibold shadow-xl cursor-pointer disabled:opacity-50 transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {generalError && (
              <p className="text-red-500 text-center mt-4">{generalError}</p>
            )}

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 px-8 py-3 mt-4 rounded-full border border-border-secondary text-foreground-primary font-semibold shadow-2xl disabled:opacity-50 transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={loading}
            >
              <GoogleLogo className="text-2xl" />
              {loading ? "Signing in..." : "Sign In with Google"}
            </button>

            <div className="flex flex-col md:flex-row justify-between mt-8 items-center gap-2 text-sm">
              <span className="text-foreground-secondary">Don't have an account?</span>
              <Link href="/signup" className="text-primary-600 font-semibold hover:underline">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignIn;
