import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';

// "Psychological Warfare"
// Fake system alerts to force attention back to the app.

export const usePsychologicalWarfare = (isSummoning: boolean) => {
    useEffect(() => {
        if (isSummoning) {
            const timer = setInterval(() => {
                triggerFakeAlert();
            }, 15000); // Every 15s

            return () => clearInterval(timer);
        }
    }, [isSummoning]);

    const triggerFakeAlert = () => {
        const tactics = [
            { title: "System Error", msg: "Bath module not found. Immediate action required." },
            { title: "Battery Critical", msg: "Hygiene levels at 0%. Please charge yourself." },
            { title: "Storage Full", msg: "Too many excuses detected. Delete some? [No] [No]" },
            { title: "Software Update", msg: "Installing 'Discipline 2.0'... Do not turn off your water." }
        ];

        const tactic = tactics[Math.floor(Math.random() * tactics.length)];

        Alert.alert(
            tactic.title,
            tactic.msg,
            [
                { text: "Fix Now", onPress: () => console.log("User panicked") },
                { text: "Report", onPress: () => console.log("User reported") }
            ],
            { cancelable: false }
        );
    };

    return {}; // No logic needed to return, just side effects
};
