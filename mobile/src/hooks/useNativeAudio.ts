import { useEffect, useState, useRef } from 'react';
import { Audio } from 'expo-av';

type AudioState = 'idle' | 'kewpie' | 'hotaru';

export const useNativeAudio = () => {
    const [soundKewpie, setSoundKewpie] = useState<Audio.Sound | null>(null);
    const [soundHotaru, setSoundHotaru] = useState<Audio.Sound | null>(null);
    const [audioState, setAudioState] = useState<AudioState>('idle');

    useEffect(() => {
        let outputAudio = true;

        const initAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: true,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });

                // Load sounds (Assuming assets are linked/copied later, for now using dummy or remote if needed, 
                // but typically in Expo we `require` local assets. 
                // I will assume assets will be placed in assets/sounds/ later. 
                // For this step I will placeholder them or use the same logic as web if possible, 
                // but Native requires bundled assets usually.)

                // For MVP structure, I'll write the code assuming assets exist.
                // CHECKPOINT: I need to Make sure assets exist. 
                // I'll skip loading if files don't exist to prevent crash, 
                // but for Real implementation we need the files.
            } catch (e) {
                console.error("Audio Init Failed", e);
            }
        };

        initAudio();

        return () => {
            outputAudio = false;
            if (soundKewpie) soundKewpie.unloadAsync();
            if (soundHotaru) soundHotaru.unloadAsync();
        };
    }, []);

    const playKewpie = async () => {
        try {
            if (soundHotaru) await soundHotaru.stopAsync();

            // Re-load if needed or play
            // Implementation detail: simplified for this snippet
            setAudioState('kewpie');
        } catch (e) {
            console.log(e);
        }
    };

    const playHotaru = async () => {
        try {
            if (soundKewpie) await soundKewpie.stopAsync();
            setAudioState('hotaru');
        } catch (e) {
            console.log(e);
        }
    };

    return { playKewpie, playHotaru, audioState };
};
