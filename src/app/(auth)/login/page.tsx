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
    const { error } = await login({ email: data.email, password: data.password });
    if (error) {
      setGeneralError("Login failed. " + error.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    setLoading(true);
    try {
      await googleSignIn();
    } catch (err) {
      if (err instanceof Error) {
        console.error("Google Sign-In Error:", err.message);
        setGeneralError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white text-black min-h-screen flex flex-col">
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
                  className="p-3 py-4 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none focus:ring-2 focus:ring-amber-400 w-full placeholder:text-gray-500"
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
                  className="p-3 py-4 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none focus:ring-2 focus:ring-amber-400 w-full pr-12 placeholder:text-gray-500"
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
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-600 hover:text-black"
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
                type="submit"
                className="px-8 py-3 mt-2 rounded-full bg-amber-400 text-black font-semibold shadow-xl cursor-pointer disabled:opacity-50 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
              className="w-full flex items-center justify-center gap-2 px-8 py-3 mt-4 rounded-full border border-yellow-950 text-black font-semibold shadow-2xl disabled:opacity-50 transition hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={loading}
            >
              <GoogleLogo className="text-2xl" />
              {loading ? "Signing in..." : "Sign In with Google"}
            </button>

            <div className="flex flex-col md:flex-row justify-between mt-8 items-center gap-2 text-sm">
              <span className="text-[#002568]">Don't have an account?</span>
              <Link href="/signup" className="text-[#FFAB2C] font-semibold hover:underline">
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
