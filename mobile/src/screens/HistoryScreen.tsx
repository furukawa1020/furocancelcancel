import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, StatusBar } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useNativeAudio } from '../hooks/useNativeAudio';

const API_BASE = 'https://furocancelcancel-production.up.railway.app'; // Production Railway URL
// Force Git Sync

interface SessionLog {
    id: number;
    started_at: string;
    finished_at?: string;
    tau_limit: number;
    proof_state: string;
    feedback?: string;
}

export default function HistoryScreen({ onClose }: { onClose: () => void }) {
    const [history, setHistory] = useState<SessionLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const deviceId = await SecureStore.getItemAsync('device_id');
            const res = await axios.get(`${API_BASE}/history?device_id=${deviceId}`);
            setHistory(res.data.history);
        } catch (e: any) {
            if (e.response && e.response.status === 404) {
                console.warn("History not found (404) - New User or Server Updating");
            } else {
                console.warn("Failed to load history", e);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const formatDuration = (ms: number) => {
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        return `${min}m ${sec}s`;
    };

    const getStatusColor = (session: SessionLog) => {
        if (!session.finished_at) return COLORS.errorRed; // Aborted/Running
        const duration = new Date(session.finished_at).getTime() - new Date(session.started_at).getTime();

        // Fraud Check (< 60s)
        if (duration < 60000) return COLORS.errorRed; // FRAUD

        // Overtime Check (> Limit + 60s buffer?)
        if (duration > session.tau_limit * 1000 + 30000) return COLORS.accentIndigo; // DILIGENT (Long)

        return COLORS.textMain; // PERFECT
    };

    const getVerdict = (session: SessionLog) => {
        if (!session.finished_at) return "ABORTED";
        const duration = new Date(session.finished_at).getTime() - new Date(session.started_at).getTime();
        if (duration < 60000) return "FRAUD";
        if (duration > session.tau_limit * 1000) return "OVERTIME";
        return "PERFECT";
    };

    const renderItem = ({ item }: { item: SessionLog }) => {
        const duration = item.finished_at
            ? new Date(item.finished_at).getTime() - new Date(item.started_at).getTime()
            : 0;

        return (
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.date}>{formatDate(item.started_at)}</Text>
                    <Text style={[styles.verdict, { color: getStatusColor(item) }]}>
                        {getVerdict(item)}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.detail}>Target: {item.tau_limit}s</Text>
                    <Text style={styles.detail}>Actual: {item.finished_at ? formatDuration(duration) : '--'}</Text>
                </View>
                {item.feedback && (
                    <Text style={styles.feedback}>User Feedback: {item.feedback.toUpperCase()}</Text>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.title}>HISTORY & AI LOGS</Text>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                    <Text style={styles.closeText}>CLOSE</Text>
                </Pressable>
            </View>

            {loading ? (
                <Text style={styles.loading}>Loading Agent Memory...</Text>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.empty}>No records yet. Start bathing.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDeep,
        paddingTop: 60,
        paddingHorizontal: SPACING.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        color: COLORS.textMain,
        fontSize: 18,
        letterSpacing: 2,
        fontFamily: FONTS.serif,
    },
    closeBtn: {
        padding: 8,
    },
    closeText: {
        color: COLORS.textDim,
        fontSize: 12,
    },
    listContent: {
        paddingBottom: 40,
    },
    loading: {
        color: COLORS.textDim,
        textAlign: 'center',
        marginTop: 40,
    },
    empty: {
        color: COLORS.textDim,
        textAlign: 'center',
        marginTop: 40,
        fontStyle: 'italic',
    },
    card: {
        backgroundColor: COLORS.bgCard,
        padding: 16,
        marginBottom: 12,
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accentIndigo,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    date: {
        color: COLORS.textDim,
        fontSize: 12,
    },
    verdict: {
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 1,
    },
    detail: {
        color: COLORS.textMain,
        fontSize: 14,
        fontFamily: FONTS.mono,
    },
    feedback: {
        marginTop: 8,
        color: COLORS.textDim,
        fontSize: 10,
        fontStyle: 'italic',
    }
});
