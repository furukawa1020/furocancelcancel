const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/SessionController');
const ProofController = require('../controllers/ProofController');

// Sessions
router.post('/sessions', SessionController.create);
router.get('/sessions/:id', SessionController.get);
router.post('/sessions/:id/feedback', SessionController.feedback);

// Proof / NFC
router.get('/p/nfc/done', ProofController.nfcDone);
router.post('/device/event', ProofController.deviceEvent);

module.exports = router;
