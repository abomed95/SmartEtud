const router = require('express').Router();
const ctrl = require('../controllers/etudiant.controller');
const { requireAuth, requireRole, STAFF } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.get('/', requireRole(...STAFF), ctrl.getAll);
router.get('/:id', ctrl.getById); // ETUDIANT : son propre dossier uniquement (contrôlé dans le contrôleur)
router.post('/', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE'), ctrl.create);
router.post('/:id/compte', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE'), ctrl.createCompte);
router.put('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.update);
router.delete('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.remove);

module.exports = router;
