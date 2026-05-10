const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paiement.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE'), ctrl.create);
router.put('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'SECRETAIRE'), ctrl.update);
router.delete('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.remove);

module.exports = router;
