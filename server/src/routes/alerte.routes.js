const router = require('express').Router();
const ctrl = require('../controllers/alerte.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.use(requireAuth, requireRole('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE', 'PROFESSEUR'));
router.get('/', ctrl.getAll);

module.exports = router;
