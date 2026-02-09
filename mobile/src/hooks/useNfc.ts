import { useState, useEffect } from 'react';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { Platform } from 'react-native';

export type NfcState = 'idle' | 'scanning' | 'success' | 'error' | 'unsupported';

export function useNfc() {
    const [nfcState, setNfcState] = useState<NfcState>('idle');
    const [tagData, setTagData] = useState<string | null>(null);

    useEffect(() => {
        async function checkNfc() {
            const supported = await NfcManager.isSupported();
            if (!supported) {
                setNfcState('unsupported');
                return;
            }
            await NfcManager.start();
        }
        checkNfc();

        return () => {
            NfcManager.setEventListener(NfcTech.NDef, null);
            NfcManager.setEventListener(NfcTech.NfcA, null);
        };
    }, []);

    const scanTag = async () => {
        try {
            setNfcState('scanning');
            setTagData(null);

            // Register for the technology
            await NfcManager.requestTechnology(NfcTech.Ndef);

            const tag = await NfcManager.getTag();

            if (tag) {
                // In a real app, we might parse the NDEF message here.
                // For now, any tag presence is "The Towel".
                setTagData(tag.id || 'unknown_id');
                setNfcState('success');
            } else {
                setNfcState('error');
            }

        } catch (ex) {
            console.warn('NFC Scan Error:', ex);
            setNfcState('error');
        } finally {
            // Create a small delay before defining "finished" to let animations play
            // setTimeout(async () => {
            await NfcManager.cancelTechnologyRequest();
            //    if (nfcState !== 'error') setNfcState('idle'); 
            // }, 1000);
        }
    };

    const cancelScan = async () => {
        await NfcManager.cancelTechnologyRequest();
        setNfcState('idle');
    };

    const resetNfc = () => {
        setNfcState('idle');
        setTagData(null);
    };

    return {
        nfcState,
        tagData,
        scanTag,
        cancelScan,
        resetNfc
    };
}
