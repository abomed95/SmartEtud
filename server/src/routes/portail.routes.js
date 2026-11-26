const router = require('express').Router();
const ctrl = require('../controllers/portail.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.use(requireAuth, requireRole('ETUDIANT'));
router.get('/dossier', ctrl.getDossier);

module.exports = router;
