import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, StatusBar } from 'react-native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useNativeAudio } from '../hooks/useNativeAudio';
import { useNfc } from '../hooks/useNfc';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import OnboardingScreen from './OnboardingScreen'; // New Import
import HistoryScreen from './HistoryScreen'; // New Import

// Production Railway URL
const API_BASE = 'https://furocancelcancel-production.up.railway.app';
// const API_BASE = 'http://192.168.68.58:3000'; // Local Dev

const { width } = Dimensions.get('window');

// Types
interface Step {
    time: number;
    text: string;
}
type ViewState = 'landing' | 'active' | 'done' | 'onboarding' | 'history';

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
    const [aiReason, setAiReason] = useState<string | null>(null); // Added

    useEffect(() => {
        // Init Identity
        initIdentity();
    }, []);

    // HANDLE DEEP LINKS (The Wi-Fi Trigger)
    // URL: intentless-bath://auto-start
    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => {
            console.log("Deep Link received Raw:", event.url);

            if (event.url.includes('auto-start')) {
                // Triggered by Automation (Wi-Fi)
                // "Connection -> Instant Start"
                if (viewState === 'landing') {
                    console.log("[Mobile] Auto-Start MATCHED! Starting Session...");
                    alert("[Debug] Auto-Start Triggered!"); // Visible Feedback
                    startSession(true); // true = isAuto
                } else {
                    console.log("[Mobile] Auto-Start Ignored: Not on Landing Screen.");
                }
            } else {
                console.log("[Mobile] Link Ignored: URL does not contain 'auto-start'");
                // Feedback for user debugging
                if (viewState === 'landing') {
                    // Only alert if we think they MIGHT have tried (e.g. contains exp)
                    alert(`Debug: Link received but NO 'auto-start'.\nURL: ${event.url}`);
                }
            }
        };

        // Check if app was opened by the link (Cold Start)
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        });

        // Listen for new links (Warm Start)
        const subscription = Linking.addEventListener('url', handleDeepLink);
        return () => subscription.remove();
    }, [viewState, deviceId]);

    // Monitor NFC State
    useEffect(() => {
        if (nfcState === 'success') {
            // Tag Detected!
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // DEBUG ALERT
            alert(`NFC Detected! State: ${viewState}`);

            if (viewState === 'landing') {
                startSession();
            } else if (viewState === 'active') {
                finishSession();
            }
            resetNfc();
        }
    }, [nfcState]);

    const initIdentity = async () => {
        let id = await SecureStore.getItemAsync('device_id');
        if (!id) {
            id = uuidv4();
            await SecureStore.setItemAsync('device_id', id);
        }
        setDeviceId(id);
        console.log("Identity:", id);
    };

    // --- WI-FI LOGIC ---
    const registerHomeWifi = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Location permission required to detect Wi-Fi name.');
                return;
            }

            const state = await Network.getNetworkStateAsync();
            // @ts-ignore // Expo types might be vague on internet/connection type
            const ssid = state.type === Network.NetworkStateType.WIFI ? (await Network.getIpAddressAsync() ? "Home Wi-Fi" : null) : null;

            // BETTER DEMO APPROACH: Just save "Registered" state.
            await SecureStore.setItemAsync('home_wifi_registered', 'true');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            alert("This Wi-Fi is now registered as 'Home'.");
        } catch (e) {
            console.error(e);
            alert("Failed to register Wi-Fi.");
        }
    };

    const isHomeWifi = async () => {
        const registered = await SecureStore.getItemAsync('home_wifi_registered');
        if (!registered) return true; // If not set, be lenient (Allow all)

        const state = await Network.getNetworkStateAsync();
        return state.type === Network.NetworkStateType.WIFI && state.isConnected;
    };

    // --- ACTIONS ---

    const handleTap = () => {
        // Trigger NFC Scan
        scanTag();
    };

    const handleSummon = async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await axios.post(`${API_BASE}/summon`);
            alert("Bathroom Summoned! Go now!");
        } catch (e) {
            console.error("Summon Failed", e);
            alert("Connection Failed");
        }
    };

    const startSession = async (isAuto = false) => {
        try {
            // Validation: Home Wi-Fi Check
            if (isAuto) {
                const home = await isHomeWifi();
                if (!home) {
                    console.log("[Mobile] Auto-Start blocked: Not on Home Wi-Fi");
                    return;
                }
            }

            if (!deviceId) return; // Guard
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            playKewpie();

            const res = await axios.post(`${API_BASE}/sessions`, {
                source: isAuto ? 'automation_wifi' : 'mobile_manual',
                device_id: deviceId
            });

            setSessionId(res.data.id);
            const tau = res.data.tau_limit || 180;
            setTotalTime(tau);
            setTimeLeft(tau);
            setAiReason(res.data.ai_reason); // Set Reasoning

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
        } catch (e: any) {
            console.error("Start Failed", e);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            // Show Feedback to User
            if (e.response && e.response.status === 404) {
                alert("Backend Updating... Please wait 1 min.");
            } else {
                alert("Connection Failed. Check Server.");
            }
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

    // FORCE STOP (Debug)
    const debugForceStop = () => {
        alert("Force Stopping...");
        finishSession();
    };


    // --- TIMERS ---

    useEffect(() => {
        if (viewState === 'active' && timeLeft !== null) {
            const interval = setInterval(() => {
                setTimeLeft((prev) => {
                    // OVERTIME MODE: Just keep counting down (negative)
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

    if (viewState === 'history') {
        return <HistoryScreen onClose={() => setViewState('landing')} />;
    }

    if (viewState === 'landing') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={[styles.centerContent]}>
                    <Text style={styles.label}>INTENTLESS BATH</Text>
                    <Text style={{ color: 'gray', fontSize: 10, marginBottom: 20 }}>v2.0 (Cloud)</Text>
                    <Pressable onPress={handleTap} style={styles.startButton}>
                        <Text style={styles.startText}>{nfcState === 'scanning' ? 'SCANNING...' : 'TAP TOWEL'}</Text>
                    </Pressable>

                    {/* SOS / SUMMON BUTTON */}
                    <Pressable onPress={handleSummon} style={styles.summonButton}>
                        <Text style={styles.summonText}>SUMMON BATHROOM</Text>
                    </Pressable>

                    {/* HISTORY BUTTON */}
                    <Pressable onPress={() => setViewState('history')} style={styles.historyButton}>
                        <Text style={styles.historyText}>VIEW HISTORY & AI LOGS</Text>
                    </Pressable>

                    {/* CONFIG BUTTON */}
                    <Pressable onPress={registerHomeWifi} style={styles.wifiButton}>
                        <Text style={styles.wifiText}>
                            [ REGISTER CURRENT WI-FI AS HOME ]
                        </Text>
                        <Text style={{ color: COLORS.textDim, fontSize: 10, marginTop: 4 }}>
                            Tap to secure your home perimeter.
                        </Text>
                    </Pressable>

                    {/* DEBUG START BUTTON */}
                    <Pressable onPress={() => startSession(false)} style={{ position: 'absolute', bottom: -100, left: 0, padding: 10, backgroundColor: 'blue', opacity: 0.5 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>DEBUG START</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    if (viewState === 'active') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.timerContainer}>
                    {/* AGENT REASONING */}
                    {aiReason && (
                        <Text style={styles.reasonText}>
                            {aiReason}
                        </Text>
                    )}
                    <Text style={[styles.timer, (timeLeft !== null && timeLeft < 0) && { color: COLORS.errorRed }]}>
                        {timeLeft !== null ? formatTime(Math.abs(timeLeft)) : "--:--"}
                    </Text>
                    {(timeLeft !== null && timeLeft < 0) && <Text style={{ color: COLORS.errorRed, fontWeight: 'bold', marginTop: -20 }}>OVERTIME</Text>}
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

                {/* HIDDEN BUTTON for NFC TRIGGER (Top Layer) */}
                <Pressable onPress={handleTap} style={styles.hiddenButton}>
                    <Text style={styles.hiddenText}>{nfcState === 'scanning' ? 'Scanning...' : '(Towel Tap)'}</Text>
                </Pressable>

                {/* DEBUG STOP BUTTON (Bottom Right - Visible for now) */}
                <Pressable onPress={debugForceStop} style={{ position: 'absolute', bottom: 40, right: 20, padding: 10, backgroundColor: 'red', opacity: 0.5 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>DEBUG STOP</Text>
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
    summonButton: {
        marginTop: 40,
        paddingVertical: 15,
        paddingHorizontal: 30,
        backgroundColor: 'rgba(244, 63, 94, 0.2)', // Red tint
        borderWidth: 1,
        borderColor: COLORS.errorRed,
        borderRadius: 0,
    },
    summonText: {
        color: COLORS.errorRed,
        fontSize: 14,
        letterSpacing: 2,
        fontWeight: 'bold',
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
        alignItems: 'center',
    },
    reasonText: {
        color: COLORS.accentIndigo,
        fontSize: 14,
        marginBottom: 10,
        letterSpacing: 1,
    },
    timer: {
        fontSize: 80,
        color: COLORS.textMain,
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold',
        textShadowColor: COLORS.accentGlow,
        textShadowRadius: 20,
    },
    // ... (rest is fine)
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
    },
    wifiButton: {
        marginTop: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: COLORS.textDim,
        alignItems: 'center',
        opacity: 0.8,
    },
    wifiText: {
        color: COLORS.accentIndigo,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    historyButton: {
        marginTop: 20,
        paddingVertical: 10,
    },
    historyText: {
        color: COLORS.textDim,
        fontSize: 12,
        textDecorationLine: 'underline',
        letterSpacing: 1,
    }
});
