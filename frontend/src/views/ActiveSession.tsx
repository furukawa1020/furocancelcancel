import React, { useEffect, useState, useRef } from 'react';
import { useAudioContext } from '../components/useAudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3000';

interface Step {
    time: number;
    text: string;
}

interface Recipe {
    title: string;
    steps_json: string; // JSON string from DB
}

const ActiveSession = () => {
    const { playKewpie, isLocked } = useAudioContext();
    const [timeLeft, setTimeLeft] = useState<number | null>(null); // Null until loaded
    const [totalTime, setTotalTime] = useState(180); // Default, updates from backend
    const [recipe, setRecipe] = useState<Step[]>([]);
    const [recipeTitle, setRecipeTitle] = useState("Loading...");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const navigate = useNavigate();

    // START: Session Initialization
    useEffect(() => {
        const startSession = async () => {
            try {
                const isNfc = window.location.pathname.includes('/nfc');
                const deviceId = localStorage.getItem('device_id');
                const res = await axios.post(`${API_BASE}/sessions`, {
                    source: isNfc ? 'nfc' : 'web',
                    device_id: deviceId
                });

                const sid = res.data.id;
                setSessionId(sid);

                // Set Initial Tau from backend (Bandit Logic)
                const tau = res.data.tau_limit || 180;
                setTotalTime(tau);
                setTimeLeft(tau); // Initialize countdown

                // Fetch full details to get Recipe
                const detailRes = await axios.get(`${API_BASE}/sessions/${sid}`);
                if (detailRes.data.recipe) {
                    setRecipeTitle(detailRes.data.recipe.title);
                    setRecipe(JSON.parse(detailRes.data.recipe.steps_json));
                }

            } catch (e) {
                console.error("Failed to start session", e);
            }
        };
        startSession();
    }, []);

    // AUDIO: Attempt Autoplay
    useEffect(() => {
        if (!isLocked) playKewpie();
    }, [isLocked]);

    // TIMER: Local Countdown
    useEffect(() => {
        if (timeLeft === null) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    // navigate('/session/timeout'); // Optional auto-redirect
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // POLLING: Check for done status (NFC Tap)
        const poller = setInterval(async () => {
            if (sessionId) {
                try {
                    const res = await axios.get(`${API_BASE}/sessions/${sessionId}`);
                    if (res.data.proof_state === 'done') {
                        navigate(`/session/${sessionId}/done`);
                    }
                } catch (e) { console.error(e); }
            }
        }, 2000);

        return () => {
            clearInterval(timer);
            clearInterval(poller);
        };
    }, [timeLeft, sessionId, navigate]);

    // UTILS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate progress for visuals
    const progress = timeLeft !== null ? (timeLeft / totalTime) : 1;

    return (
        <div className="h-screen w-screen bg-[#050511] flex flex-col items-center justify-between py-12 text-[#E2E8F0] font-serif overflow-hidden relative selection:bg-indigo-500 selection:text-white">

            {/* Audio Unlock Overlay - Subtle & Intentless */}
            <AnimatePresence>
                {isLocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-[#050511]/80 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => playKewpie()}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="text-center"
                        >
                            <p className="text-sm tracking-[0.5em] font-light mb-4 uppercase opacity-60">
                                System Ready
                            </p>
                            <div className="text-3xl tracking-[0.2em] font-thin border-b border-white/20 pb-2">
                                TAP TO SYNC
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#6366F1] rounded-full blur-[120px] opacity-10"
                    animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#F43F5E] rounded-full blur-[100px] opacity-5"
                    animate={{ scale: [1.2, 1, 1.2], x: [0, -30, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Header */}
            <header className="z-10 text-center animate-fade-in relative w-full">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <h1 className="text-xs tracking-[0.4em] opacity-40 font-mono mt-4">
                    INTENTLESS BATH SYSTEM <span className="text-[#6366F1]">:: vFinal</span>
                </h1>
            </header>

            {/* Main Content */}
            <main className="z-10 flex flex-col items-center w-full max-w-md px-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>

                {/* Timer */}
                <div className="relative mb-12">
                    <div className="text-[7rem] font-bold leading-none tracking-tighter timer-font text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                        {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                    </div>
                    {/* Subtle Progress Ring or Bar could go here */}
                </div>

                {/* Recipe Card */}
                <div className="w-full glass-panel p-8 rounded-none relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-[4px] h-full bg-[#6366F1] opacity-50"></div>

                    <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
                        <span className="text-2xl animate-pulse">🛁</span>
                        <div>
                            <h2 className="text-lg font-bold tracking-wide">{recipeTitle}</h2>
                            <p className="text-xs text-gray-400 font-mono">BANDIT ENGINE: ACTIVE (τ={totalTime}s)</p>
                        </div>
                    </div>

                    <ul className="space-y-6 text-sm font-light relative z-10">
                        {recipe.map((step, idx) => {
                            // Highlight current step based on time?
                            const isCurrent = timeLeft !== null && (totalTime - timeLeft >= step.time) && (idx === recipe.length - 1 || totalTime - timeLeft < recipe[idx + 1].time);

                            return (
                                <li key={idx} className={`flex gap-6 transition-opacity duration-500 ${isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                                    <span className={`font-mono w-12 text-right ${isCurrent ? 'text-[#6366F1] font-bold' : 'text-gray-500'}`}>
                                        {formatTime(step.time)}
                                    </span>
                                    <span className="flex-1 tracking-wide">
                                        {step.text}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </main>

            {/* Footer */}
            <footer className="z-10 text-center space-y-4 opacity-70 animate-fade-in pointer-events-none" style={{ animationDelay: '0.5s' }}>
                <p className="text-xs tracking-wider">終わったら、タオルで体を拭いてピッ</p>
                <div className="flex justify-center gap-2">
                    <span className="block w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="block w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="block w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
            </footer>
        </div>
    );
};

export default ActiveSession;
