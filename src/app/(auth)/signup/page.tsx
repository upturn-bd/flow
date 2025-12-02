"use client";

import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { EyeOff, Eye } from "@/lib/icons";
import Link from "next/link";

import { signup } from "../auth-actions";

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

const Signup = () => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleSignup = async (values: FormData) => {
    if (!isChecked) {
      alert("You must agree to the terms and conditions.");
      return;
    }
    await signup({
      email: values.email,
      password: values.password,
    });
  };

  return (
    <section className="bg-surface-primary text-foreground-primary min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row h-full min-h-screen">
        {/* Logo Section */}
        <div className="bg-[#001731] flex items-center justify-center p-8 md:w-2/6 w-full min-h-[120px] md:min-h-0">
          <Image src="/Logo.png" width={150} height={150} alt="Company Logo" className="mx-auto" />
        </div>
        {/* Form Section */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 md:px-16 lg:px-32">
          <div className="bg-[#eff8ff] w-full max-w-md md:max-w-lg p-8 md:p-12 rounded-3xl shadow-2xl">
            <form
              onSubmit={handleSubmit(handleSignup)}
              className="flex flex-col gap-4"
            >
              <div>
                <input
                  className="p-3 py-4 rounded-lg bg-surface-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary-500 w-full placeholder:text-foreground-tertiary"
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  {...register("email", { required: "Email is required" })}
                  disabled={false}
                />
                {errors.email && (
                  <p className="text-error text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <input
                  className="p-3 py-4 rounded-lg bg-surface-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary-500 w-full placeholder:text-foreground-tertiary"
                  type="text"
                  placeholder="First Name"
                  autoComplete="given-name"
                  {...register("firstName", {
                    required: "First Name is required",
                  })}
                  disabled={false}
                />
                {errors.firstName && (
                  <p className="text-error text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <input
                  className="p-3 py-4 rounded-lg bg-surface-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary-500 w-full placeholder:text-foreground-tertiary"
                  type="text"
                  placeholder="Last Name"
                  autoComplete="family-name"
                  {...register("lastName", { required: "Last Name is required" })}
                  disabled={false}
                />
                {errors.lastName && (
                  <p className="text-error text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  className="p-3 py-4 rounded-lg bg-surface-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary-500 w-full pr-12 placeholder:text-foreground-tertiary"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="new-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                    maxLength: {
                      value: 20,
                      message: "Password must be less than 20 characters",
                    },
                    pattern: {
                      value: /(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z])/, // at least one upper, lower, number, special
                      message:
                        "Password must include uppercase, lowercase, number, and special character",
                    },
                  })}
                  disabled={false}
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
                  <p className="text-error text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="p-3 py-4 rounded-lg bg-surface-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary-500 w-full pr-12 placeholder:text-foreground-tertiary"
                  autoComplete="new-password"
                  {...register("confirmPassword", {
                    required: "Confirm Password is required",
                    validate: (value) =>
                      value === getValues("password") ||
                      "Passwords do not match",
                  })}
                  disabled={false}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-foreground-tertiary hover:text-foreground-primary"
                  onClick={toggleConfirmPasswordVisibility}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="text-2xl" />
                  ) : (
                    <Eye className="text-2xl" />
                  )}
                </button>
                {errors.confirmPassword && (
                  <p className="text-error text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  className="accent-primary-600 w-4 h-4"
                  id="terms"
                  onChange={(e) => setIsChecked(e.target.checked)}
                />
                <label htmlFor="terms" className="text-sm select-none cursor-pointer">
                  I agree to the <span className="underline">Terms & Conditions</span>
                </label>
              </div>

              <button
                type="submit"
                className={`px-8 py-3 mt-4 rounded-full bg-primary-600 text-white font-semibold shadow-xl cursor-pointer transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  !isChecked ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!isChecked}
              >
                Create Account
              </button>
            </form>
            <div className="flex flex-col md:flex-row justify-between mt-8 items-center gap-2 text-sm">
              <span className="text-foreground-secondary">Already have an account?</span>
              <Link href="/login" className="text-primary-600 font-semibold hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
