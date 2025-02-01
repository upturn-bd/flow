'use client';
import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const LogIn = () => {
    const router = useRouter();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            console.log('Login Successful');
            router.push('/');
        } catch (err) {
            if (err instanceof Error) {
                console.error('Login Error:', err.message);
                setError(err.message);
            }
        }
    };

    return (
        <section className='bg-white text-black'>
            <div className='h-screen grid grid-cols-6 gap-10'>
                <div className='bg-[#001731] w-full flex items-start justify-start p-8 col-span-2'>
                    <Image src="/Logo.png" width={150} height={150} alt="Company Logo" />
                </div>
                <div className='col-span-4 flex items-center justify-center md:mx-40'>
                    <div className='bg-[#eff8ff] p-28 rounded-3xl shadow-2xl w-full'>
                        <form onSubmit={handleLogin} className='grid grid-cols-1 gap-4'>
                            <input
                                className='p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none'
                                type="text"
                                placeholder="Company Name"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input
                                className='p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none'
                                type="password"
                                placeholder="Company Code"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <input
                                type="submit"
                                value="Login"
                                className='px-10 py-4 my-5 rounded-full bg-amber-400 text-black shadow-xl cursor-pointer'
                            />
                        </form>
                        {error && <p className="text-red-500 text-center">{error}</p>}
                        <p className='pt-5 text-2xl text-center text-[#002568]'>
                            If you don’t have the code, notify your HR / Admin team.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LogIn;
