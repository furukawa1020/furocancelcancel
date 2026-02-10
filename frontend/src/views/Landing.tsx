import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const Landing = () => {
    const [isSummoning, setIsSummoning] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // --- 1. Identity Initialization ---
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem('device_id', deviceId);
        }

        // --- 2. Create Audio Context (Lazy) ---
        audioRef.current = new Audio('/kewpie_3min_cooking.mp3');
        audioRef.current.loop = true;

        // --- 3. Summon Polling ---
        const poller = setInterval(async () => {
            try {
                const res = await axios.get(`${API_BASE}/summon/status`);
                const summoning = res.data.isSummoning;
                setIsSummoning(summoning);

                if (summoning) {
                    // Try to play (User must have interacted with document previously)
                    audioRef.current?.play().catch(e => console.log("Audio Autoplay Blocked", e));
                } else {
                    audioRef.current?.pause();
                    if (audioRef.current) audioRef.current.currentTime = 0;
                }
            } catch (e) {
                console.error("Poll Error", e);
            }
        }, 3000);

        return () => {
            clearInterval(poller);
            audioRef.current?.pause();
        };
    }, []);

    const handleUnlock = () => {
        // Dummy play to unlock audio context on iOS/Android
        audioRef.current?.play().then(() => {
            audioRef.current?.pause();
        }).catch(e => console.log("Unlock failed", e));
    };

    if (isSummoning) {
        return (
            <div className="h-screen w-screen bg-red-900 flex flex-col items-center justify-center text-white font-bold animate-pulse" onClick={handleUnlock}>
                <h1 className="text-6xl tracking-widest mb-4">SUMMON</h1>
                <p className="text-2xl">BATHROOM IS CALLING</p>
                <p className="mt-8 opacity-50 text-sm">(Go to the bathroom to stop this)</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-[#0B0F19] flex flex-col items-center justify-center text-[#F0F4F8] font-serif" onClick={handleUnlock}>
            <div className="text-center space-y-8 animate-fade-in">
                <p className="text-xl tracking-widest opacity-80">
                    もう始まってます。
                </p>
                <p className="text-xl tracking-widest opacity-80">
                    3分だけ、終わらせましょう。
                </p>
            </div>
            {/* Implicit "Touch to Start" overlay to unlock Audio */}
            <div className="absolute inset-0 z-50 opacity-0 cursor-pointer" />
            <div className="absolute bottom-4 text-xs text-gray-700">
                Tap anywhere to enable Altar Mode
            </div>
        </div>
    );
};

export default Landing;
