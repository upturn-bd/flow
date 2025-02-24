"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AiOutlineEyeInvisible, AiFillEye } from "react-icons/ai";
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
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectUrl(window.location.origin + "/");
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSignIn = async (data: SignInFormData) => {
    setGeneralError(null);
    setLoading(true);
    const { error } = await login({ email: data.email, password: data.password });
    if(error) {
      setGeneralError("Login failed. " + error.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!redirectUrl) return;

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
    <section className="bg-white text-black">
      <div className="h-screen grid grid-cols-6 gap-10">
        <div className="bg-[#001731] w-full flex items-start justify-start p-8 col-span-2">
          <Image src="/Logo.png" width={150} height={150} alt="Logo" />
        </div>
        <div className="col-span-4 flex items-center justify-center md:mx-40">
          <div className="bg-[#eff8ff] p-36 rounded-3xl shadow-2xl w-full">
            <form
              onSubmit={handleSubmit(handleSignIn)}
              className="grid grid-cols-1 gap-4"
            >
              <input
                className="p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none"
                type="email"
                placeholder="Email"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && (
                <p className="text-red-500">{errors.email.message}</p>
              )}

              <div className="relative">
                <input
                  className="p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none w-full pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                <button
                  type="button"
                  className="absolute top-5 right-3"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible className="text-2xl" />
                  ) : (
                    <AiFillEye className="text-2xl" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500">{errors.password.message}</p>
              )}

              <button
                type="submit"
                className="px-10 py-4 my-5 rounded-full bg-amber-400 text-black shadow-xl cursor-pointer disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {generalError && (
              <p className="text-red-500 text-center">{generalError}</p>
            )}

            <button
              onClick={handleGoogleSignIn}
              className="w-full px-10 py-4 rounded-full border border-yellow-950 text-black shadow-2xl disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In with Google"}
            </button>

            <div className="flex justify-between mt-5 items-center">
              <span className="text-[#002568]">Don’t have an account?</span>
              <Link href="/signup" className="text-[#FFAB2C]">
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
