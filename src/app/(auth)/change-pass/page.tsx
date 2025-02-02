'use client';

import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { AiOutlineEyeInvisible, AiFillEye } from "react-icons/ai";

interface FormData {
    code:number;
    password: string;
    confirmPassword: string;
}

const page = () => {
    const router = useRouter();
    const { register, handleSubmit, setError, getValues, formState: { errors } } = useForm<FormData>();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword((prev) => !prev);
    };

    const handleSignup = async (data: FormData) => {
        
    };

    return (
        <section className='bg-white text-black'>
            <div className='h-screen grid grid-cols-6 gap-10'>
                <div className='bg-[#001731] w-full flex items-start justify-start p-8 col-span-2'>
                    <Image src="/Logo.png" width={150} height={150} alt="Company Logo" />
                </div>
                <div className='col-span-4 flex items-center justify-center md:mx-40'>
                    <div className='bg-[#eff8ff] p-28 rounded-3xl shadow-2xl w-full'>
                        <form onSubmit={handleSubmit(handleSignup)} className='grid grid-cols-1 gap-4'>

                            <input
                                className='p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none'
                                type="number"
                                placeholder="Enter Code"
                                {...register("code", { required: "Last Name is required" })}
                            />
                            {errors.lastName && <p className="text-red-500">{errors.lastName.message}</p>}

                            <div className="relative">
                                <input
                                    className='p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none w-full pr-10'
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: { value: 6, message: "Password must be at least 6 characters" },
                                        maxLength: { value: 20, message: "Password must be less than 20 characters" },
                                        pattern: {
                                            value: /(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z])/,
                                            message: "Password must include uppercase, lowercase, number, and special character"
                                        }
                                    })}
                                />
                                <button
                                    type="button"
                                    className="absolute top-5 right-3"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? <AiOutlineEyeInvisible className="text-2xl" /> : <AiFillEye className="text-2xl" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500">{errors.password.message}</p>}

                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    className='p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none w-full pr-10'
                                    {...register("confirmPassword", {
                                        required: "Confirm Password is required",
                                        validate: value => value === getValues("password") || "Passwords do not match"
                                    })}
                                />
                                <button
                                    type="button"
                                    className="absolute top-5 right-3"
                                    onClick={toggleConfirmPasswordVisibility}
                                >
                                    {showConfirmPassword ? <AiOutlineEyeInvisible className="text-2xl" /> : <AiFillEye className="text-2xl" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-red-500">{errors.confirmPassword.message}</p>}
                            <input
                                type="submit"
                                value="Create Account"
                                className="px-10 py-4 my-5 rounded-full bg-amber-400 text-black shadow-xl cursor-pointer"/>
                        </form>
                        <div className="flex justify-between mt-5 items-center">
                            <button className="text-[#002568]">
                                Don’t have an account?
                            </button>
                            <a href="/signin" className="text-[#FFAB2C]">Sign In</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default page;
