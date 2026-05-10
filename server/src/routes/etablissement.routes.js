const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/etablissement.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireRole('SUPER_ADMIN'), ctrl.create);
router.put('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.update);
router.patch('/:id/statut', requireRole('SUPER_ADMIN'), ctrl.toggleStatut);
router.delete('/:id', requireRole('SUPER_ADMIN'), ctrl.remove);

module.exports = router;
