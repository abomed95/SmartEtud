const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/user.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.get('/', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.create);
router.put('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.update);
router.patch('/:id/reset-password', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.resetPassword);
router.delete('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR'), ctrl.remove);

module.exports = router;
