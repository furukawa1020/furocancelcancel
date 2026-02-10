import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3000';

export interface Step {
    time: number;
    text: string;
}

export const useIntentlessSession = () => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [totalTime, setTotalTime] = useState(180);
    const [recipe, setRecipe] = useState<Step[]>([]);
    const [recipeTitle, setRecipeTitle] = useState("Loading...");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isSummoning, setIsSummoning] = useState(false);
    const [isNoisy, setIsNoisy] = useState(true); // Default to true to avoid instant lock
    const [audioLevel, setAudioLevel] = useState(0);
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

                const tau = res.data.tau_limit || 180;
                setTotalTime(tau);
                setTimeLeft(tau);

                // Fetch details
                const detailRes = await axios.get(`${API_BASE}/sessions/${sid}`);
                if (detailRes.data.recipe) {
                    setRecipeTitle(detailRes.data.recipe.title);
                    setRecipe(JSON.parse(detailRes.data.recipe.steps_json));
                }

                initMic(); // Start Mic

            } catch (e) {
                console.error("Failed to start session", e);
            }
        };
        startSession();
    }, []);

    // MIC SETUP
    const initMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);

            scriptProcessor.onaudioprocess = function () {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                let values = 0;
                const length = array.length;
                for (let i = 0; i < length; i++) {
                    values += array[i];
                }
                const average = values / length;
                setAudioLevel(average);

                // Threshold for "Shower Noise" (Adjust based on testing)
                // Silence is usually < 10. Ambient noise ~20. Shower > 30?
                // Let's set a low threshold for MVP: 5 (Basically just "Not Dead Silence")
                if (average > 10) {
                    setIsNoisy(true);
                } else {
                    setIsNoisy(false);
                }
            };
        } catch (e) {
            console.error("Mic Error", e);
            // If mic fails, default to true (allow usage)
            setIsNoisy(true);
        }
    };

    // TIMER & POLLING
    useEffect(() => {
        if (timeLeft === null) return;

        const timer = setInterval(() => {
            // ONLY COUNTDOWN IF NOISY
            if (isNoisy) {
                setTimeLeft((prev) => {
                    if (prev === null || prev <= 0) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);

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
    }, [timeLeft, sessionId, navigate, isNoisy]);

    // SUMMON POLLER
    useEffect(() => {
        const summonPoller = setInterval(async () => {
            try {
                const res = await axios.get(`${API_BASE}/summon/status`);
                setIsSummoning(res.data.isSummoning);
            } catch (e) { }
        }, 3000);
        return () => clearInterval(summonPoller);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = timeLeft !== null ? (timeLeft / totalTime) : 1;

    return {
        timeLeft,
        totalTime,
        recipe,
        recipeTitle,
        sessionId,
        formatTime,
        progress,
        isSummoning,
        isNoisy,
        audioLevel
    };
};
