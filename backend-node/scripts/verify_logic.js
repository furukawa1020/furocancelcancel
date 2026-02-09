const axios = require('axios');

const API_BASE = 'http://localhost:3000';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runTest() {
    console.log("🧪 Starting 'Intentless' Logic Verification...");

    try {
        // 1. Start Session
        console.log("1. Starting Session (Simulating NFC/App)...");
        const startRes = await axios.post(`${API_BASE}/sessions`, { source: 'test_script' });
        const sessionId = startRes.data.id;
        const initialTau = startRes.data.tau_limit;
        const recipeTitle = startRes.data.recipe_title || (startRes.data.recipe ? startRes.data.recipe.title : 'Unknown');

        console.log(`   - Session ID: ${sessionId}`);
        console.log(`   - Initial Tau: ${initialTau}s`);
        console.log(`   - Selected Recipe: ${recipeTitle}`);

        if (!sessionId) throw new Error("Session ID missing");

        // 2. Simulate Duration (Fast Forward)
        // We won't actually wait 3 mins, but we'll mark it done immediately for the test
        // determining that the user "survived" or "failed".

        // 3. Mark Done
        console.log("2. Marking Done (Simulating Towel NFC)...");
        await axios.get(`${API_BASE}/p/nfc/done?sid=${sessionId}`);
        console.log("   - Session marked DONE.");

        // 4. Send Feedback (BAD -> Should decrease Tau)
        console.log("3. Sending 'BAD' Feedback (Too long)...");
        const feedbackRes = await axios.post(`${API_BASE}/sessions/${sessionId}/feedback`, { rating: 'bad' });
        const newTau = feedbackRes.data.new_tau;

        console.log(`   - New Tau: ${newTau}s`);

        if (newTau < initialTau) {
            console.log("✅ PASSED: Tau decreased after BAD feedback.");
        } else {
            console.error("❌ FAILED: Tau did not decrease.");
        }

        // 5. Verify Next Session uses New Tau
        console.log("4. Starting NEXT Session to verify persistence...");
        const nextRes = await axios.post(`${API_BASE}/sessions`, { source: 'test_script_2' });
        const nextTau = nextRes.data.tau_limit;

        console.log(`   - Next Session Tau: ${nextTau}s`);

        if (Math.abs(nextTau - newTau) < 1) { // Floating point tolerance
            console.log("✅ PASSED: Logic persisted.");
        } else {
            console.error("❌ FAILED: Persistence check failed.");
        }

    } catch (e) {
        console.error("Test Failed:", e.message);
        if (e.response) console.error("Response:", e.response.data);
    }
}

runTest();
