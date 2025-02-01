'use client';

import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { AiOutlineEyeInvisible, AiFillEye } from "react-icons/ai";

interface SignInFormData {
    email: string;
    password: string;
}

const SignIn = () => {
    const router = useRouter();
    const { register, handleSubmit, setError, formState: { errors } } = useForm<SignInFormData>();
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSignIn = async (data: SignInFormData) => {
        setGeneralError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                throw error;
            }

            console.log('Login Successful');
            router.push('/');
        } catch (err) {
            if (err instanceof Error) {
                console.error('Login Error:', err.message);
                setGeneralError(err.message);
            }
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/`,
                },
            });

            if (error) {
                throw error;
            }

            console.log('Google Sign-In Successful');
        } catch (err) {
            if (err instanceof Error) {
                console.error("Google Sign-In Error:", err.message);
                setGeneralError("Google sign-in failed. Please try again.");
            }
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
                        <form onSubmit={handleSubmit(handleSignIn)} className='grid grid-cols-1 gap-4'>
                            <input
                                className='p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none'
                                type="email"
                                placeholder="Email"
                                {...register("email", { required: "Email is required" })}
                            />
                            {errors.email && <p className="text-red-500">{errors.email.message}</p>}
                            <div className="relative">
                                <input
                                    className='p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none w-full pr-10'
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    {...register("password", { required: "Password is required" })}
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

                            <input
                                type="submit"
                                value="Login"
                                className='px-10 py-4 my-5 rounded-full bg-amber-400 text-black shadow-xl cursor-pointer'
                            />
                        </form>
                        {generalError && <p className="text-red-500 text-center">{generalError}</p>}
                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full px-10 py-4 rounded-full border border-yellow-950 text-black shadow-2xl"
                        >
                            Sign In with Google
                        </button>
                        <div className="flex justify-between mt-5 items-center">
                            <button className="text-[#002568]">
                                Don’t have an account?
                            </button>
                            <a href="/signup" className="text-[#FFAB2C]">Sign Up</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SignIn;
