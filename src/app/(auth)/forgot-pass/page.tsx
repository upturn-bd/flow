'use client';

import Image from 'next/image';
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface FormData {
    email: string;
}

const Page: React.FC = () => {
    const { register, handleSubmit, setError, formState: { errors } } = useForm<FormData>();
    const router = useRouter();

    const onSubmit = async (data: FormData) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/change-pass`,
            });

            if (error) {
                throw error;
            }

            console.log('Password reset email sent successfully');
            router.push('/');
        } catch (err) {
            if (err instanceof Error) {
                console.error('Error:', err.message);
                setError("email", { type: "manual", message: err.message });
            }
        }
    };

    return (
        <section className='bg-white text-black'>
            <div className='h-screen grid grid-cols-6 gap-10'>
                <div className='bg-[#001731] w-full flex items-start justify-start p-8 col-span-2'>
                    <Image
                        src="/Logo.png"
                        width={150}
                        height={150}
                        alt="Company Logo"
                    />
                </div>
                <div className='col-span-4 flex items-center justify-center md:mx-40'>
                    <div className='bg-[#eff8ff] p-28 rounded-3xl shadow-2xl w-full'>
                        <form onSubmit={handleSubmit(onSubmit)} className='grid grid-cols-1 gap-4'>
                            <input
                                className='p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none'
                                type="email"
                                placeholder="Email"
                                {...register("email", { required: "Email is required" })}
                            />
                            {errors.email && <p className="text-red-500">{errors.email.message}</p>}

                            <button type="submit" className='px-10 py-4 my-5 rounded-full bg-amber-400 text-black shadow-xl'>
                                Send code to registered mail
                            </button>
                        </form>
                        <div className='flex justify-between mt-5 items-center'>
                            <button className='text-[#002568]' onClick={() => router.push('/signup')}>Don’t have an account?</button>
                            <button className='text-[#FFAB2C]' onClick={() => router.push('/signup')}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Page;
