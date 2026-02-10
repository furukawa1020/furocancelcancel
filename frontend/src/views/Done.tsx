import { useEffect, useState } from 'react';
import { useAudioContext } from '../components/useAudioContext';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:3000';

const Done = () => {
    const { playHotaru } = useAudioContext();
    const { id } = useParams<{ id: string }>();
    const [submitted, setSubmitted] = useState(false);
    const [newTau, setNewTau] = useState<number | null>(null);

    useEffect(() => {
        playHotaru();
    }, []);

    const sendFeedback = async (rating: 'ok' | 'bad') => {
        if (!id) return;
        try {
            const res = await axios.post(`${API_BASE}/sessions/${id}/feedback`, { rating });
            setNewTau(res.data.new_tau);
            setSubmitted(true);
        } catch (e) {
            console.error("Feedback failed", e);
        }
    };

    if (submitted) {
        return (
            <div className="h-screen w-screen bg-[#050511] flex flex-col items-center justify-center text-[#E2E8F0] font-serif overflow-hidden relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="z-10 text-center space-y-8 glass-panel p-12 w-full max-w-lg border-t border-[#6366F1]/50"
                >
                    <h1 className="text-4xl font-light tracking-widest text-[#6366F1]">
                        OPTIMIZED.
                    </h1>

                    <div className="space-y-2 opacity-80 font-mono text-sm">
                        <p>Feedback Received.</p>
                        <p>Bandit Engine Updated.</p>
                        {newTau && (
                            <div className="mt-4 p-4 border border-white/10 bg-black/20">
                                <p className="text-xs uppercase tracking-widest mb-1 text-gray-500">Next Session Target</p>
                                <p className="text-2xl font-bold text-white">τ = {newTau}s</p>
                            </div>
                        )}
                    </div>

                    <p className="text-xs pt-8 opacity-50">
                        Stay Intentless.
                    </p>
                </motion.div>

                {/* Background Particles/Noise */}
                <div className="absolute inset-0 pointer-events-none bg-[url('/noise.png')] opacity-[0.03]" />
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-[#050511] flex flex-col items-center justify-center text-[#E2E8F0] font-serif relative overflow-hidden">

            <motion.div
                className="absolute inset-0 bg-gradient-to-t from-[#0F1221] to-transparent opacity-80"
            />

            <div className="z-10 text-center space-y-16 animate-fade-in px-6">
                <h1 className="text-[5rem] font-bold tracking-widest drop-shadow-2xl text-white mix-blend-overlay opacity-90">
                    休め。
                </h1>

                <div className="space-y-8">
                    <p className="text-sm tracking-[0.2em] opacity-60 font-mono uppercase">
                        System Halt. Rest Mode Active.
                    </p>

                    <div className="flex gap-8 justify-center">
                        <button
                            onClick={() => sendFeedback('ok')}
                            className="group relative px-10 py-4 overflow-hidden border border-[#6366F1] text-[#6366F1] transition-all hover:text-white"
                        >
                            <span className="absolute inset-0 w-full h-full bg-[#6366F1] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                            <span className="relative z-10 text-lg tracking-widest">問題なし</span>
                        </button>

                        <button
                            onClick={() => sendFeedback('bad')}
                            className="group relative px-10 py-4 overflow-hidden border border-[#F43F5E] text-[#F43F5E] transition-all hover:text-white"
                        >
                            <span className="absolute inset-0 w-full h-full bg-[#F43F5E] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                            <span className="relative z-10 text-lg tracking-widest">ダメ</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Done;
