const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stats.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.get('/superadmin', requireRole('SUPER_ADMIN'), ctrl.getSuperAdminStats);
router.get('/directeur', requireRole('DIRECTEUR'), ctrl.getDirecteurStats);
router.get('/professeur', requireRole('PROFESSEUR'), ctrl.getProfesseurStats);
router.get('/secretaire', requireRole('SECRETAIRE'), ctrl.getSecretaireStats);

module.exports = router;
