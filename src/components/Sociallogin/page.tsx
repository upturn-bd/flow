import { supabase } from '@/lib/supabase';
import React, { useState } from 'react';

const Page = () => {
    const [generalError, setGeneralError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        setGeneralError(null);  // Clear any previous errors before attempting the sign-in
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
        <div className="flex flex-col items-center space-y-4">
            <button
                onClick={handleGoogleSignIn}
                className="w-full px-10 py-4 rounded-full border border-yellow-950 text-black shadow-2xl"
            >
                Sign In with Google
            </button>

            {generalError && <p className="text-red-500 text-center">{generalError}</p>}
        </div>
    );
};

export default Page;
