import React, { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const Landing = () => {
    useEffect(() => {
        // --- 1. Identity Initialization ---
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem('device_id', deviceId);
            console.log("New Identity Created:", deviceId);
        } else {
            console.log("Identity Found:", deviceId);
        }
    }, []);

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
