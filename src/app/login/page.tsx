import Image from 'next/image';
import React from 'react';

const LogIn = () => {
    return (
        <section className='bg-white text-black'>
            <div className='h-screen grid grid-cols-6 gap-10'>
                <div className='bg-[#001731] w-full flex items-start justify-start p-8 col-span-2'>
                    <Image
                        src="/Logo.png"
                        width={150}
                        height={150}
                        alt="Picture of the author"
                    />
                </div>
                <div className='col-span-4 flex items-center justify-center md:mx-40 '>
                    <div className='bg-[#eff8ff] p-28 rounded-3xl  shadow-2xl  w-full'>
                        <form action="" className='grid grid-cols-1 gap-4  '>
                            <input className='p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none' type="name" placeholder="Company Name" />
                            <input className='p-3 py-5 rounded-lg bg-[#e3f4fe] focus:outline-none border border-[#BFE4FF]' type="password" placeholder="Company Code" />

                            <input type="submit" value="Login" className='px-10 py-4 my-5 rounded-full bg-amber-400 text-black shadow-xl' />
                        </form>
                        <p className='pt-5 text-2xl text-center text-[#002568]'>If you don’t have the code, notify your HR / Admin team. </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LogIn;