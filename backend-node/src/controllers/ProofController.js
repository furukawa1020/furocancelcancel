const { Session } = require('../models');

class ProofController {
    static async nfcDone(req, res) {
        try {
            const sid = req.query.sid;
            let session;
            if (sid) {
                session = await Session.findByPk(sid);
            } else {
                session = await Session.findOne({
                    order: [['createdAt', 'DESC']],
                    where: { proof_state: 'started' }
                });
            }

            if (session) {
                session.proof_state = 'done';
                session.finished_at = new Date();
                await session.save();
                res.send("<h1>Target Acquired. Rest.</h1>");
            } else {
                res.status(404).send("No active session found.");
            }
        } catch (e) {
            console.error(e);
            res.status(500).send("Error processing NFC");
        }
    }

    static async deviceEvent(req, res) {
        console.log("Device Event:", req.body);
        res.json({ status: "received" });
    }
}

module.exports = ProofController;
