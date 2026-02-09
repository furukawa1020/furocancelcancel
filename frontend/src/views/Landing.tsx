import React, { useEffect } from 'react';
import { useAudioContext } from '../components/useAudioContext';

const Landing = () => {
    // In a real flow, this view might just be a "Loading" state or the "Trigger" waiting state.
    // But per requirements, the "Start" is the NFC trigger which opens the URL.
    // So when the user visits the URL, it MIGHT be the "already started" state.

    return (
        <div className="h-screen w-screen bg-[#0B0F19] flex flex-col items-center justify-center text-[#F0F4F8] font-serif">
            <div className="text-center space-y-8 animate-fade-in">
                <p className="text-xl tracking-widest opacity-80">
                    もう始まってます。
                </p>
                <p className="text-xl tracking-widest opacity-80">
                    3分だけ、終わらせましょう。
                </p>
            </div>

            {/* Implicit "Touch to Start" overlay if needed for Audio */}
            <div className="absolute inset-0 z-50 opacity-0 cursor-pointer" />
        </div>
    );
};

export default Landing;
