import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// "The Undying Notification"
// If the user clears it, it comes back. 
// If the app is backgrounded, it screams.

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true, // Added
        shouldShowList: true,   // Added
    }),
});

export const useUndyingNotification = (isSummoning: boolean) => {
    const notificationListener = useRef<any>();
    const responseListener = useRef<any>();

    useEffect(() => {
        if (isSummoning) {
            triggerUndying();
        } else {
            Notifications.dismissAllNotificationsAsync();
        }
    }, [isSummoning]);

    const triggerUndying = async () => {
        // 1. Immediate Notification
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "THE TYRANT IS WATCHING",
                body: "You are ignoring the bath. I am watching you.",
                sound: 'default', // Custom later?
                priority: Notifications.AndroidNotificationPriority.MAX,
                vibrate: [0, 250, 250, 250],
            },
            trigger: null, // Instant
        });

        // 2. Loop Schedule (Backup)
        // If they don't open the app, keep sending every 5 seconds locally
        // Note: iOS/Android limit this, but we try our best.
        // For true "Undying", we need background fetch (next step).
    };

    return {};
};
