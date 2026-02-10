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

            } catch (e) {
                console.error("Failed to start session", e);
            }
        };
        startSession();
    }, []);

    // TIMER & POLLING
    useEffect(() => {
        if (timeLeft === null) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
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
    }, [timeLeft, sessionId, navigate]);

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
        isSummoning
    };
};
