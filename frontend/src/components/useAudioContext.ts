import { useRef, useEffect, useState } from 'react';

type AudioState = 'idle' | 'kewpie' | 'hotaru';

export const useAudioContext = () => {
    const [currentState, setCurrentState] = useState<AudioState>('idle');
    const [isLocked, setIsLocked] = useState(true);
    const kewpieRef = useRef<HTMLAudioElement | null>(null);
    const hotaruRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        kewpieRef.current = new Audio('/kewpie.mp3');
        kewpieRef.current.loop = true;
        hotaruRef.current = new Audio('/hotaru.mp3');
        hotaruRef.current.loop = false;

        // specialized unlock listener
        const unlock = () => {
            // We attempt to play and immediately pause to unlock the AudioContext
            kewpieRef.current?.play().then(() => {
                kewpieRef.current?.pause();
                kewpieRef.current!.currentTime = 0;
                setIsLocked(false);
                // Remove listeners once unlocked
                document.removeEventListener('click', unlock);
                document.removeEventListener('touchstart', unlock);
            }).catch((e) => {
                console.warn("Unlock attempt failed", e);
            });
        };

        document.addEventListener('click', unlock);
        document.addEventListener('touchstart', unlock);

        return () => {
            kewpieRef.current?.pause();
            hotaruRef.current?.pause();
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
        };
    }, []);

    const playKewpie = async () => {
        if (!kewpieRef.current) return;
        try {
            hotaruRef.current?.pause();
            if (hotaruRef.current) hotaruRef.current.currentTime = 0;

            await kewpieRef.current.play();
            setCurrentState('kewpie');
            setIsLocked(false); // If successful, we are unlocked
        } catch (e) {
            console.warn("Autoplay blocked for Kewpie", e);
            setIsLocked(true); // Still locked
        }
    };

    const playHotaru = async () => {
        if (!hotaruRef.current) return;
        try {
            kewpieRef.current?.pause();
            if (kewpieRef.current) kewpieRef.current.currentTime = 0;

            await hotaruRef.current.play();
            setCurrentState('hotaru');
            setIsLocked(false);
        } catch (e) {
            console.warn("Autoplay blocked for Hotaru", e);
            setIsLocked(true);
        }
    };

    const stopAll = () => {
        kewpieRef.current?.pause();
        hotaruRef.current?.pause();
        setCurrentState('idle');
    };

    return { playKewpie, playHotaru, stopAll, currentState, isLocked };
};
