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

                // Load sounds
                const { sound: k } = await Audio.Sound.createAsync(
                    require('../../assets/kewpie.mp3'),
                    { shouldPlay: false, isLooping: true }
                );
                const { sound: h } = await Audio.Sound.createAsync(
                    require('../../assets/hotaru.mp3'),
                    { shouldPlay: false }
                );
                setSoundKewpie(k);
                setSoundHotaru(h);
            } catch (e) {
                console.error("Audio Init Failed", e);
            }
        };

        initAudio();

        return () => {
            outputAudio = false;
            // Clean up
            if (soundKewpie) soundKewpie.unloadAsync();
            if (soundHotaru) soundHotaru.unloadAsync();
        };
    }, []);

    const playKewpie = async () => {
        try {
            if (soundHotaru) await soundHotaru.stopAsync();
            if (soundKewpie) {
                await soundKewpie.replayAsync();
            }
            setAudioState('kewpie');
        } catch (e) {
            console.log(e);
        }
    };

    const playHotaru = async () => {
        try {
            if (soundKewpie) await soundKewpie.stopAsync();
            if (soundHotaru) {
                await soundHotaru.replayAsync();
            }
            setAudioState('hotaru');
        } catch (e) {
            console.log(e);
        }
    };

    return { playKewpie, playHotaru, audioState };
};
