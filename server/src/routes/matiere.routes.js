const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/matiere.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.get('/', ctrl.getAll);
router.post('/', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.create);
router.put('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.update);
router.delete('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.remove);

module.exports = router;
