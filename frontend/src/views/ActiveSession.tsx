import { useEffect } from 'react';
import { useIntentlessSession } from '../hooks/useIntentlessSession';
import { useAudioContext } from '../components/useAudioContext';
import { motion, AnimatePresence } from 'framer-motion';

const ActiveSession = () => {
    const { playKewpie, isLocked } = useAudioContext();
    const { timeLeft, totalTime, recipe, recipeTitle, formatTime, isSummoning, isNoisy, audioLevel } = useIntentlessSession();

    // AUDIO: Attempt Autoplay
    useEffect(() => {
        if (!isLocked) playKewpie();
    }, [isLocked]);

    // SUMMON: Trigger Audio if Summoning
    useEffect(() => {
        if (isSummoning && !isLocked) {
            playKewpie();
        }
    }, [isSummoning, isLocked, playKewpie]);

    // Calculate progress for visuals (if needed later, else remove)
    // const progress = timeLeft !== null ? (timeLeft / totalTime) : 1;

    return (
        <div className="h-screen w-screen bg-[#050511] flex flex-col items-center justify-between py-12 text-[#E2E8F0] font-serif overflow-hidden relative selection:bg-indigo-500 selection:text-white">

            {/* AUDIO VISUALIZER (HYDRO-SONIC CHECK) */}
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-50">
                <div className="text-[10px] font-mono tracking-widest">{isNoisy ? "MIC ON" : "SILENCE DETECTED"}</div>
                <div className="flex gap-1 h-4 items-end">
                    {[...Array(5)].map((_, i) => (
                        <div key={i}
                            className={`w-1 bg-white transition-all duration-100 ${isNoisy ? 'bg-[#6366F1]' : 'bg-red-500'}`}
                            style={{ height: `${Math.min(100, Math.max(10, audioLevel * (i + 1) * 0.5))}%` }}
                        />
                    ))}
                </div>
            </div>

            {/* SILENCE LOCK OVERLAY */}
            <AnimatePresence>
                {!isNoisy && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 bg-red-900/20 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                    >
                        <div className="text-center">
                            <div className="text-4xl animate-pulse">🔇</div>
                            <div className="text-xl font-bold tracking-widest mt-2 text-red-400">SHOWER REQUIRED</div>
                            <div className="text-xs font-mono opacity-70 mt-1">Timer Paused</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                    INTENTLESS BATH <span className="text-[#6366F1]">:: 3-MIN COOKING MODE</span>
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
                                <li key={idx} className={`flex gap - 6 transition - opacity duration - 500 ${isCurrent ? 'opacity-100' : 'opacity-40'} `}>
                                    <span className={`font - mono w - 12 text - right ${isCurrent ? 'text-[#6366F1] font-bold' : 'text-gray-500'} `}>
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
