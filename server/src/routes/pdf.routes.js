const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pdf.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.get('/bulletin/:etudiantId', ctrl.generateBulletin);
router.get('/recu/:paiementId', ctrl.generateRecu);
router.get('/attestation/:etudiantId', ctrl.generateAttestation);

module.exports = router;
