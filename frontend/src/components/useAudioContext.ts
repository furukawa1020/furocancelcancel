import { useRef, useEffect, useState } from 'react';

type AudioState = 'idle' | 'kewpie' | 'hotaru';

export const useAudioContext = () => {
    const [currentState, setCurrentState] = useState<AudioState>('idle');
    const kewpieRef = useRef<HTMLAudioElement | null>(null);
    const hotaruRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        kewpieRef.current = new Audio('/kewpie.mp3');
        kewpieRef.current.loop = true;
        hotaruRef.current = new Audio('/hotaru.mp3');
        hotaruRef.current.loop = false;

        return () => {
            kewpieRef.current?.pause();
            hotaruRef.current?.pause();
        };
    }, []);

    const playKewpie = async () => {
        if (!kewpieRef.current) return;
        try {
            hotaruRef.current?.pause();
            if (hotaruRef.current) hotaruRef.current.currentTime = 0;

            await kewpieRef.current.play();
            setCurrentState('kewpie');
        } catch (e) {
            console.warn("Autoplay blocked for Kewpie", e);
        }
    };

    const playHotaru = async () => {
        if (!hotaruRef.current) return;
        try {
            kewpieRef.current?.pause();
            if (kewpieRef.current) kewpieRef.current.currentTime = 0;

            await hotaruRef.current.play();
            setCurrentState('hotaru');
        } catch (e) {
            console.warn("Autoplay blocked for Hotaru", e);
        }
    };

    const stopAll = () => {
        kewpieRef.current?.pause();
        hotaruRef.current?.pause();
        setCurrentState('idle');
    };

    return { playKewpie, playHotaru, stopAll, currentState };
};
