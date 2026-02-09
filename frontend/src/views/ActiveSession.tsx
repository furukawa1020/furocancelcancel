import React, { useEffect, useState } from 'react';
import { useAudioContext } from '../components/useAudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3000';

const ActiveSession = () => {
    const { playKewpie, isLocked } = useAudioContext();
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
    const [sessionId, setSessionId] = useState<string | null>(null);
    const navigate = useNavigate();

    // 1. Start Session on Mount
    useEffect(() => {
        const startSession = async () => {
            try {
                // Determine if we are simulated NFC trigger
                const isNfc = window.location.pathname.includes('/nfc');
                // Real implementation would pass some token / ID
                // Check if we already have an ID from params (not implemented here, assuming new session)
                const res = await axios.post(`${API_BASE}/sessions`, { source: isNfc ? 'nfc' : 'web' });
                setSessionId(res.data.id);
                console.log("Session started:", res.data.id);
            } catch (e) {
                console.error("Failed to start session", e);
            }
        };
        startSession();
    }, []);

    // 2. Play Audio (attempt)
    useEffect(() => {
        playKewpie();
    }, []);

    // 3. Timer & Polling Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    // navigate('/session/timeout/done'); // Optional: Auto-redirect on timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Polling for "Done" status (Simulting NFC Towel Tap elsewhere)
        const poller = setInterval(async () => {
            if (sessionId) {
                try {
                    const res = await axios.get(`${API_BASE}/sessions/${sessionId}`);
                    if (res.data.proof_state === 'done') {
                        navigate('/p/nfc/done'); // Redirect to done view
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }
        }, 2000);

        return () => {
            clearInterval(timer);
            clearInterval(poller);
        };
    }, [sessionId, navigate]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-screen w-screen bg-[#0B0F19] flex flex-col items-center justify-between py-12 text-[#F0F4F8] font-serif overflow-hidden relative">

            {/* Audio Unlock Overlay */}
            <AnimatePresence>
                {isLocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-[#0B0F19]/90 backdrop-blur-sm flex items-center justify-center cursor-pointer"
                        onClick={() => playKewpie()} // Trigger unlock on click
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-2xl tracking-[0.5em] font-light border border-white/20 px-8 py-4"
                        >
                            TAP TO SYNC
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Pulse */}
            <motion.div
                className="absolute inset-0 bg-[#4F46E5] opacity-5 rounded-full blur-3xl pointer-events-none"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <header className="z-10 text-center">
                <h1 className="text-sm tracking-[0.3em] opacity-60">INTENTLESS BATH SYSTEM</h1>
            </header>

            <main className="z-10 flex flex-col items-center w-full max-w-md px-6 pointer-events-none">
                <div className="text-[6rem] font-mono font-bold leading-none tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                    {formatTime(timeLeft)}
                </div>

                <div className="mt-12 w-full bg-[#1A1F2E] border border-[#2D3748] p-6 rounded-none shadow-2xl">
                    <div className="flex items-center gap-3 mb-6 border-b border-[#2D3748] pb-4">
                        <span className="text-2xl">🛁</span>
                        <h2 className="text-lg font-bold">今日の3分風呂</h2>
                    </div>

                    <ul className="space-y-4 text-sm font-light">
                        <li className="flex gap-4">
                            <span className="font-mono text-[#4F46E5] w-12 text-right">00:00</span>
                            <span className="flex-1">シャワーON</span>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-mono text-[#4F46E5] w-12 text-right">00:10</span>
                            <span className="flex-1">首・脇・股・足だけ洗う（最小部位）</span>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-mono text-[#4F46E5] w-12 text-right">02:20</span>
                            <span className="flex-1">すすぐ</span>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-mono text-[#4F46E5] w-12 text-right">02:40</span>
                            <span className="flex-1">拭く（髪は今日は捨てる）</span>
                        </li>
                    </ul>
                </div>
            </main>

            <footer className="z-10 text-center space-y-2 opacity-80 pointer-events-none">
                <p className="text-xs">終わったら、タオルで体を拭いてピッ</p>
                <div className="w-8 h-8 rounded-full border border-white/20 mx-auto animate-pulse flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                </div>
            </footer>
        </div>
    );
};

export default ActiveSession;
