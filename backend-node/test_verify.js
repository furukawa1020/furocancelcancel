const axios = require('axios');

async function test() {
    try {
        console.log("Testing POST /sessions...");
        const res = await axios.post('http://localhost:3000/sessions', {
            source: 'test_script',
            device_id: 'verify_script_user'
        });
        console.log("Status:", res.status);
        console.log("Body:", res.data);

        if (res.data.recipe_title) {
            console.log("SUCCESS: Session created with recipe.");
        } else {
            console.error("FAILURE: Response missing recipe_title.");
        }
    } catch (e) {
        console.error("ERROR:", e.message);
        if (e.response) console.error("Response:", e.response.data);
    }
}

test();
