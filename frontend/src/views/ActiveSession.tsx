import React, { useEffect, useState } from 'react';
import { useAudioContext } from '../components/useAudioContext';
import { motion } from 'framer-motion';

const ActiveSession = () => {
    const { playKewpie } = useAudioContext();
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

    useEffect(() => {
        playKewpie();

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    // In a real app, this would redirect or show "Overtime"
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-screen w-screen bg-[#0B0F19] flex flex-col items-center justify-between py-12 text-[#F0F4F8] font-serif overflow-hidden relative">
            {/* Background Pulse */}
            <motion.div
                className="absolute inset-0 bg-[#4F46E5] opacity-5 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <header className="z-10 text-center">
                <h1 className="text-sm tracking-[0.3em] opacity-60">INTENTLESS BATH SYSTEM</h1>
            </header>

            <main className="z-10 flex flex-col items-center w-full max-w-md px-6">
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
                            <span className="font-mono text-[#4F46E5]">00:00</span>
                            <span>シャワーON</span>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-mono text-[#4F46E5]">00:10</span>
                            <span>首・脇・股・足だけ洗う（最小部位）</span>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-mono text-[#4F46E5]">02:20</span>
                            <span>すすぐ</span>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-mono text-[#4F46E5]">02:40</span>
                            <span>拭く（髪は今日は捨てる）</span>
                        </li>
                    </ul>
                </div>
            </main>

            <footer className="z-10 text-center space-y-2 opacity-80">
                <p className="text-xs">終わったら、タオルで体を拭いてピッ</p>
                <div className="w-8 h-8 rounded-full border border-white/20 mx-auto animate-pulse flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                </div>
            </footer>
        </div>
    );
};

export default ActiveSession;
