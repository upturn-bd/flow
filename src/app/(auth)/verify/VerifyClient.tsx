"use client";

import Link from "next/link";
import Image from "next/image";
import { MailCheck } from "@/lib/icons";
import { useSearchParams } from "next/navigation";

const Verify = () => {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    return (
        <section className="bg-gradient-to-br from-[#f8fbff] to-[#e6f3ff] text-black min-h-screen flex flex-col">
            <div className="flex flex-col md:flex-row h-full min-h-screen">
                {/* Left Panel (Logo + Brand) */}
                <div className="bg-[#001731] flex flex-col items-center justify-center text-white p-8 md:w-2/6 w-full min-h-[160px] md:min-h-0 relative">
                    <Image
                        src="/Logo.png"
                        width={150}
                        height={150}
                        alt="Company Logo"
                        className="mx-auto mb-4"
                    />
                    <h2 className="text-lg md:text-xl font-semibold tracking-wide text-center opacity-90">
                        Welcome to Flow Platform
                    </h2>
                    <p className="text-sm text-gray-300 text-center mt-2 max-w-xs">
                        Empowering teams to work smarter, faster, and better — together.
                    </p>

                    {/* Decorative gradient blob */}
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-400/20 blur-3xl rounded-full translate-x-[-50%] translate-y-[50%]" />
                </div>

                {/* Right Panel (Main Content) */}
                <div className="flex flex-1 items-center justify-center px-6 py-12 md:px-16 lg:px-32">
                    <div className="bg-white/70 backdrop-blur-xl border border-gray-100 w-full max-w-md md:max-w-lg p-10 md:p-14 rounded-3xl shadow-xl text-center">
                        <h1 className="text-3xl font-extrabold text-[#001731] mb-3">
                            Verify Your Email
                        </h1>
                        <p className="text-gray-700 mb-8 leading-relaxed text-sm md:text-base">
                            We’ve sent a verification link to your registered email address{" "}
                            <span className="font-semibold underline cursor-pointer text-blue-600">
                                ({email})
                            </span>
                            . Please open your inbox and click the link to verify your account.
                        </p>


                        {/* Lucide Icon with gentle animation */}
                        <div className="flex justify-center mb-8">
                            <MailCheck
                                className="text-[#001731] w-24 h-24 md:w-28 md:h-28 animate-bounce-slow"
                                strokeWidth={1.5}
                            />
                        </div>

                        <p className="text-gray-600 text-sm mb-8">
                            Once verified, return to the login page and continue your journey.
                        </p>

                        <Link href="/login">
                            <button className="px-8 py-3 rounded-full bg-amber-400 text-black font-semibold shadow-lg transition-transform transform hover:scale-105 hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-300">
                                Go to Login
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.5s infinite ease-in-out;
        }
      `}</style>
        </section>
    );
};

export default Verify;
