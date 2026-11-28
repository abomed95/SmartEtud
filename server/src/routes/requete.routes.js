const router = require('express').Router();
const ctrl = require('../controllers/requete.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.get('/', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE', 'ETUDIANT'), ctrl.getAll);
router.post('/', requireRole('ETUDIANT'), ctrl.create);
router.patch('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE'), ctrl.traiter);

module.exports = router;
