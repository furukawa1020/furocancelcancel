import { useState, useEffect, useRef } from 'react';
import { Animated, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

// Hook to manage Visual Domination (Glitch/Shake)
export const useGlitch = () => {
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const [isGlitching, setIsGlitching] = useState(false);

    const triggerGlitch = (intensity: number) => {
        if (intensity < 0.3) return; // Ignore low anger

        setIsGlitching(true);

        // Vibration pattern based on intensity
        if (intensity > 0.8) {
            Vibration.vibrate([0, 50, 100, 50]); // Heavy
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Screen Shake Animation
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10 * intensity, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10 * intensity, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10 * intensity, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start(() => {
            if (Math.random() > 0.7) triggerGlitch(intensity * 0.9); // Chain reaction
            else setIsGlitching(false);
        });
    };

    return {
        shakeAnim,
        isGlitching,
        triggerGlitch
    };
};
