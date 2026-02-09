const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function runTest() {
    console.log("🧪 Starting 'User Model' Verification...");

    try {
        // User A: The Veteran
        const deviceA = 'device_aaa_111';
        console.log(`\n--- User A (${deviceA}) ---`);

        // A1. Start Session
        let resA = await axios.post(`${API_BASE}/sessions`, { source: 'script', device_id: deviceA });
        let sessionA = resA.data;
        console.log(`   - Session ID: ${sessionA.id}, Tau: ${sessionA.tau_limit}`);

        // A2. Feedback BAD
        await axios.get(`${API_BASE}/p/nfc/done?sid=${sessionA.id}`);
        let feedA = await axios.post(`${API_BASE}/sessions/${sessionA.id}/feedback`, { rating: 'bad' });
        console.log(`   - Feedback 'bad'. New Tau: ${feedA.data.new_tau}`);

        // User B: The Rookie
        const deviceB = 'device_bbb_222';
        console.log(`\n--- User B (${deviceB}) ---`);

        // B1. Start Session
        // Should start fresh at 180s (User A's drop shouldn't affect B)
        let resB = await axios.post(`${API_BASE}/sessions`, { source: 'script', device_id: deviceB });
        let sessionB = resB.data;
        console.log(`   - Session ID: ${sessionB.id}, Tau: ${sessionB.tau_limit}`);

        if (Math.abs(sessionB.tau_limit - 180) < 1) {
            console.log("✅ PASSED: User B started at default 180s (Isolated from A).");
        } else {
            console.error(`❌ FAILED: User B affected by A? Tau is ${sessionB.tau_limit}`);
        }

        // B2. Feedback OK
        await axios.get(`${API_BASE}/p/nfc/done?sid=${sessionB.id}`);
        let feedB = await axios.post(`${API_BASE}/sessions/${sessionB.id}/feedback`, { rating: 'ok' });
        console.log(`   - Feedback 'ok'. New Tau: ${feedB.data.new_tau}`);

        // Verify A again
        console.log(`\n--- User A Return ---`);
        let resA2 = await axios.post(`${API_BASE}/sessions`, { source: 'script', device_id: deviceA });
        console.log(`   - Session Tau: ${resA2.data.tau_limit}`);

        if (resA2.data.tau_limit < 180) {
            console.log("✅ PASSED: User A remembers their shorter time.");
        } else {
            console.error("❌ FAILED: User A forgot?");
        }

    } catch (e) {
        console.error("Test Failed:", e.message);
        if (e.response) console.error("Response:", e.response.data);
    }
}

runTest();
