import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useNativeAudio } from '../hooks/useNativeAudio';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import OnboardingScreen from './OnboardingScreen'; // New Import

const API_BASE = 'http://192.168.68.58:3000'; // Local IP

const { width } = Dimensions.get('window');

// Types
interface Step {
    time: number;
    text: string;
}
type ViewState = 'landing' | 'active' | 'done' | 'onboarding';

export default function HomeScreen() {
    const { playKewpie, playHotaru, audioState } = useNativeAudio();
    const { scanTag, nfcState, resetNfc } = useNfc(); // Added

    const [viewState, setViewState] = useState<ViewState>('landing');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [totalTime, setTotalTime] = useState(180);
    const [recipe, setRecipe] = useState<Step[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [newTau, setNewTau] = useState<number | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);

    // Animation Values
    const breatheOpacity = useSharedValue(0.5);
    const scale = useSharedValue(1); // Added

    useEffect(() => {
        breatheOpacity.value = withRepeat(
            withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );

        // Init Identity
        initIdentity();
    }, []);

    // Monitor NFC State
    useEffect(() => {
        if (nfcState === 'success') {
            // Tag Detected!
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (viewState === 'landing') {
                startSession();
            } else if (viewState === 'active') {
                finishSession();
            }
            resetNfc();
        } else if (nfcState === 'scanning') {
            // Pulse animation faster?
            scale.value = withRepeat(withTiming(1.1, { duration: 500 }), -1, true);
        } else {
            scale.value = withTiming(1);
        }
    }, [nfcState]);

    const initIdentity = async () => {
        let id = await SecureStore.getItemAsync('device_id');
        if (!id) {
            id = uuidv4();
            await SecureStore.setItemAsync('device_id', id);
            // New User -> Could trigger Onboarding here
            // For now, we just store it.
        }
        setDeviceId(id);
        console.log("Identity:", id);
    };

    const breatheStyle = useAnimatedStyle(() => {
        return {
            opacity: breatheOpacity.value,
            transform: [{ scale: scale.value + (breatheOpacity.value - 0.5) * 0.1 }],
        };
    });

    // --- ACTIONS ---

    const handleTap = () => {
        // Trigger NFC Scan
        scanTag();
        // Fallback for Simulator (Long Press could be added, but for now just direct)
        // startSession(); // UNCOMMENT FOR SIMULATOR ONLY if NFC fails
    };

    const startSession = async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            playKewpie();

            const res = await axios.post(`${API_BASE}/sessions`, {
                source: 'mobile_nfc',
                device_id: deviceId
            });

            setSessionId(res.data.id);
            const tau = res.data.tau_limit || 180;
            setTotalTime(tau);
            setTimeLeft(tau);

            // Get Recipe
            if (res.data.recipe_title) {
                const detail = await axios.get(`${API_BASE}/sessions/${res.data.id}`);
                if (detail.data.recipe) {
                    setRecipe(JSON.parse(detail.data.recipe.steps_json));
                }
            } else {
                const detail = await axios.get(`${API_BASE}/sessions/${res.data.id}`);
                if (detail.data.recipe) {
                    setRecipe(JSON.parse(detail.data.recipe.steps_json));
                }
            }

            setViewState('active');
        } catch (e) {
            console.error("Start Failed", e);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const finishSession = async () => {
        if (!sessionId) return;
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            playHotaru();

            // Mark done on backend
            await axios.get(`${API_BASE}/p/nfc/done?sid=${sessionId}`);
            setViewState('done');
        } catch (e) {
            console.error("Finish Failed", e);
        }
    };

    const sendFeedback = async (rating: 'ok' | 'bad') => {
        if (!sessionId) return;
        try {
            Haptics.selectionAsync();
            const res = await axios.post(`${API_BASE}/sessions/${sessionId}/feedback`, { rating });
            setNewTau(res.data.new_tau);
        } catch (e) {
            console.error("Feedback error", e);
        }
    };

    // --- TIMERS ---

    useEffect(() => {
        if (viewState === 'active' && timeLeft !== null) {
            const interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev !== null && prev <= 0) {
                        clearInterval(interval);
                        finishSession();
                        return 0;
                    }
                    return (prev || 0) - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [viewState, timeLeft]);

    // --- RENDERERS ---

    const formatTime = (s: number) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    if (viewState === 'onboarding') {
        return <OnboardingScreen onComplete={() => setViewState('landing')} />;
    }

    if (viewState === 'landing') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <Animated.View style={[styles.centerContent, breatheStyle]}>
                    <Text style={styles.label}>INTENTLESS BATH</Text>
                    <Pressable onPress={handleTap} style={styles.startButton}>
                        <Text style={styles.startText}>{nfcState === 'scanning' ? 'SCANNING...' : 'TAP TOWEL'}</Text>
                    </Pressable>
                </Animated.View>
            </View>
        );
    }

    if (viewState === 'active') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.timerContainer}>
                    <Text style={styles.timer}>{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</Text>
                </View>

                <View style={styles.recipeContainer}>
                    {recipe.map((step, idx) => {
                        const isActive = (timeLeft !== null) && (totalTime - timeLeft >= step.time) && (idx === recipe.length - 1 || totalTime - timeLeft < recipe[idx + 1].time);

                        return (
                            <View key={idx} style={[styles.stepRow, isActive && styles.activeStep]}>
                                <Text style={[styles.stepTime, isActive && styles.activeText]}>{formatTime(step.time)}</Text>
                                <Text style={[styles.stepText, isActive && styles.activeText]}>{step.text}</Text>
                            </View>
                        );
                    })}
                </View>

                <Pressable onPress={handleTap} style={styles.hiddenButton}>
                    <Text style={styles.hiddenText}>{nfcState === 'scanning' ? 'Scanning...' : '(Towel Tap)'}</Text>
                </Pressable>
            </View>
        );
    }

    if (viewState === 'done') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.centerContent}>
                    <Text style={styles.doneTitle}>Rest.</Text>
                    <Text style={styles.subTitle}>Is this okay for tomorrow?</Text>

                    {newTau ? (
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Next Target</Text>
                            <Text style={styles.statValue}>τ = {newTau}s</Text>
                            <Pressable onPress={() => setViewState('landing')} style={{ marginTop: 20 }}>
                                <Text style={styles.restartLink}>Close</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.buttonRow}>
                            <Pressable onPress={() => sendFeedback('ok')} style={[styles.btn, styles.btnOk]}>
                                <Text style={styles.btnText}>OK</Text>
                            </Pressable>
                            <Pressable onPress={() => sendFeedback('bad')} style={[styles.btn, styles.btnBad]}>
                                <Text style={styles.btnText}>BAD</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDeep,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: COLORS.textDim,
        fontSize: 12,
        letterSpacing: 4,
        marginBottom: 40,
    },
    startButton: {
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderWidth: 1,
        borderColor: COLORS.accentIndigo,
        borderRadius: 0,
    },
    startText: {
        color: COLORS.textMain,
        fontSize: 24,
        fontWeight: '200',
        letterSpacing: 2,
    },
    timerContainer: {
        marginTop: 60,
        marginBottom: 40,
    },
    timer: {
        fontSize: 80,
        color: COLORS.textMain,
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold',
        textShadowColor: COLORS.accentGlow,
        textShadowRadius: 20,
    },
    recipeContainer: {
        width: '100%',
        padding: SPACING.md,
        backgroundColor: COLORS.bgCard,
        borderRadius: 8,
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 12,
        opacity: 0.4,
    },
    activeStep: {
        opacity: 1,
    },
    stepTime: {
        color: COLORS.textDim,
        width: 60,
        fontFamily: FONTS.mono,
    },
    stepText: {
        color: COLORS.textMain,
        flex: 1,
    },
    activeText: {
        color: COLORS.accentIndigo,
        fontWeight: 'bold',
    },
    hiddenButton: {
        marginTop: 40,
        opacity: 0.1,
    },
    hiddenText: {
        color: 'white',
    },
    doneTitle: {
        fontSize: 60,
        color: COLORS.textMain,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    subTitle: {
        color: COLORS.textDim,
        marginBottom: 40,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 20,
    },
    btn: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 0,
        borderWidth: 1,
    },
    btnOk: {
        borderColor: COLORS.accentIndigo,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    btnBad: {
        borderColor: COLORS.errorRed,
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
    },
    btnText: {
        color: COLORS.textMain,
        fontSize: 18,
        letterSpacing: 2,
    },
    statBox: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.bgCard,
        width: '100%',
    },
    statLabel: {
        color: COLORS.textDim,
        fontSize: 10,
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    statValue: {
        color: COLORS.textMain,
        fontSize: 32,
        fontWeight: 'bold',
    },
    restartLink: {
        color: COLORS.textDim,
        textDecorationLine: 'underline',
    }
});
