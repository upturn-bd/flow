import Image from 'next/image';
import React from 'react';

const page = () => {
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
                            <input className='p-3 py-5 rounded-lg bg-[#e3f4fe] border border-[#BFE4FF] focus:outline-none' type="Email" placeholder="Email" />
                        
                            <input type="submit" value="Send code to registered mail" className='px-10 py-4 my-5 rounded-full bg-amber-400 text-black shadow-xl' />
                        </form>
                        <button className=' w-full px-10 py-4 rounded-full border border-yellow-950 text-black shadow-2xl' >Sign in with Google</button>
                        <div className='flex justify-between mt-5 items-center'>
                            <button className='text-[#002568]'>Don’t have an account? </button>
                            <button className='text-[#FFAB2C]'>Sign Up </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default page;