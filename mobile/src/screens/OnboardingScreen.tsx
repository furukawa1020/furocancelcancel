import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0);

    const nextStep = () => {
        Haptics.selectionAsync();
        if (step < 2) {
            setStep(step + 1);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete();
        }
    };

    const renderContent = () => {
        switch (step) {
            case 0:
                return (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.content}>
                        <Text style={styles.title}>Welcome.</Text>
                        <Text style={styles.text}>
                            This is not a timer.{'\n'}
                            It is a mechanism to end your day.
                        </Text>
                    </Animated.View>
                );
            case 1:
                return (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.content}>
                        <Text style={styles.title}>The Switch.</Text>
                        <Text style={styles.text}>
                            Your towel is the trigger.{'\n\n'}
                            Tap it to start.{'\n'}
                            Tap it to finish.
                        </Text>
                        <View style={styles.demoBox}>
                            <Text style={styles.demoText}>[ NFC TAG ]</Text>
                        </View>
                    </Animated.View>
                );
            case 2:
                return (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.content}>
                        <Text style={styles.title}>Let go.</Text>
                        <Text style={styles.text}>
                            The system decides the time.{'\n'}
                            You just follow.{'\n\n'}
                            Ready to rest?
                        </Text>
                    </Animated.View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            {renderContent()}

            <Pressable onPress={nextStep} style={styles.button}>
                <Text style={styles.btnText}>{step === 2 ? "BEGIN RITUAL" : "NEXT"}</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDeep,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 60,
    },
    title: {
        fontSize: 32,
        color: COLORS.textMain,
        fontWeight: 'bold',
        marginBottom: 20,
        fontFamily: FONTS.serif,
    },
    text: {
        color: COLORS.textDim,
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
    },
    demoBox: {
        marginTop: 30,
        borderWidth: 1,
        borderColor: COLORS.accentIndigo,
        padding: 20,
        borderRadius: 8,
        opacity: 0.5
    },
    demoText: {
        color: COLORS.accentIndigo,
        fontSize: 12,
        letterSpacing: 2
    },
    button: {
        position: 'absolute',
        bottom: 60,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.textMain,
        paddingBottom: 5,
    },
    btnText: {
        color: COLORS.textMain,
        fontSize: 16,
        letterSpacing: 2,
    },
});
