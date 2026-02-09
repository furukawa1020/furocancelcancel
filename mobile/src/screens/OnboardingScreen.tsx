import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useNativeAudio } from '../hooks/useNativeAudio';

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
    const { playKewpie, playHotaru } = useNativeAudio();
    const [step, setStep] = useState<'intro' | 'demo_active' | 'demo_done' | 'final'>('intro');
    const [demoTime, setDemoTime] = useState(180);

    // Animation for Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'demo_active') {
            playKewpie();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Super Fast Countdown: 180s in 3 seconds
            // 60s per second = 1s per 16ms
            interval = setInterval(() => {
                setDemoTime(prev => {
                    const next = prev - 4; // Speed divider
                    if (next <= 0) {
                        clearInterval(interval);
                        setStep('demo_done');
                        return 0;
                    }
                    return next;
                });
            }, 16);
        }
        return () => clearInterval(interval);
    }, [step]);

    useEffect(() => {
        if (step === 'demo_done') {
            playHotaru();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setTimeout(() => {
                setStep('final');
            }, 4000);
        }
    }, [step]);


    const formatTime = (s: number) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {step === 'intro' && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.center}>
                    <Text style={styles.label}>DEMO MODE</Text>
                    <Text style={styles.title}>Tap the Towel.</Text>
                    <Pressable onPress={() => setStep('demo_active')} style={styles.btnCircle}>
                        <Text style={styles.btnText}>TAP</Text>
                    </Pressable>
                </Animated.View>
            )}

            {step === 'demo_active' && (
                <Animated.View entering={ZoomIn} style={styles.center}>
                    <Text style={styles.timer}>{formatTime(demoTime)}</Text>
                    <Text style={styles.subtext}>Intentless System Taking Over...</Text>
                </Animated.View>
            )}

            {step === 'demo_done' && (
                <Animated.View entering={FadeIn} style={styles.center}>
                    <Text style={styles.doneTitle}>Rest.</Text>
                </Animated.View>
            )}

            {step === 'final' && (
                <Animated.View entering={FadeIn} style={styles.center}>
                    <Text style={styles.title}>That was 3 minutes.</Text>
                    <Text style={styles.text}>The system handles the time.</Text>
                    <Pressable onPress={() => { Haptics.selectionAsync(); onComplete(); }} style={styles.btnMain}>
                        <Text style={styles.btnMainText}>START REALITY</Text>
                    </Pressable>
                </Animated.View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDeep,
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        alignItems: 'center',
    },
    label: {
        color: COLORS.accentIndigo,
        fontSize: 12,
        letterSpacing: 4,
        marginBottom: 20
    },
    title: {
        color: COLORS.textMain,
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    text: {
        color: COLORS.textDim,
        fontSize: 16,
        marginBottom: 40,
    },
    btnCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: COLORS.textMain,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    btnText: {
        color: COLORS.textMain,
        fontSize: 18,
        letterSpacing: 2
    },
    timer: {
        fontSize: 80,
        color: COLORS.textMain,
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold',
    },
    subtext: {
        color: COLORS.accentIndigo,
        marginTop: 20,
    },
    doneTitle: {
        fontSize: 60,
        color: COLORS.textMain,
    },
    btnMain: {
        paddingVertical: 15,
        paddingHorizontal: 40,
        backgroundColor: COLORS.accentIndigo,
        borderRadius: 30,
    },
    btnMainText: {
        color: COLORS.textMain,
        fontWeight: 'bold',
        fontSize: 16
    }
});
