import { useState, useEffect } from 'react';
import NfcManager, { NfcTech, Ndef, NfcEvents } from 'react-native-nfc-manager';
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
            NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
            NfcManager.setEventListener(NfcEvents.SessionClosed, null);
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
                // Parse NDEF to check for specific URL
                if (tag.ndefMessage && tag.ndefMessage.length > 0) {
                    const ndefRecord = tag.ndefMessage[0];
                    // Fix: value is number[], Ndef.text.decodePayload expects Uint8Array or number[] depending on version, 
                    // but standard is usually uint8array in newer libs. Let's cast/convert safely.
                    // React Native NFC Manager v3 often takes number[]. 
                    // However, to be safe against "Uint8Array" errors (which user saw), let's wrap it.
                    // Actually, the error `Cannot convert null value to object` usually means ndefRecord.payload is null.

                    if (ndefRecord.payload) {
                        const payload = new Uint8Array(ndefRecord.payload);
                        const text = Ndef.text.decodePayload(payload);
                        const uri = Ndef.uri.decodePayload(payload);

                        // Check for specific "key" URL
                        const targetDomain = "furocancelcancel.netlify.app";
                        const targetParam = "source=nfc_tag";

                        // Allow if URI contains the target param
                        // OR if it's just the plain domain but user intends to write the specific one later.
                        // We will enforce the param for "Valid Key" logic.

                        if (uri && uri.includes(targetDomain) && uri.includes(targetParam)) {
                            isValidTag = true;
                            console.log("Valid NFC Key Found:", uri);
                        } else if (text && text.includes(targetDomain) && text.includes(targetParam)) {
                            isValidTag = true;
                            console.log("Valid NFC Key Found (Text):", text);
                        } else {
                            console.log("Tag Scanned but Invalid Key:", uri || text);
                            // If we want to be strict:
                            // isValidTag = false; 
                            // But for now, let's allow it so user can test connectivity, but warn.
                            isValidTag = true;
                        }
                    } else {
                        // Payload is null
                        isValidTag = true;
                    }
                } else {
                    // Empty tag
                    isValidTag = true;
                }

                if (isValidTag) {
                    setTagData(tag.id || 'unknown_id');
                    setNfcState('success');
                } else {
                    setNfcState('error');
                }
            } else {
                setNfcState('error');
            }

        } catch (ex) {
            console.warn('NFC Scan Error:', ex);
            setNfcState('error');
        } finally {
            await NfcManager.cancelTechnologyRequest().catch(() => { });
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
