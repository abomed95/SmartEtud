const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/absence.controller');
const { requireAuth, requireRole, STAFF } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.get('/', ctrl.getAll); // ETUDIANT : uniquement ses propres données
router.get('/stats/:etudiantId', ctrl.getStats);
router.post('/', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR', 'SECRETAIRE'), ctrl.create);
router.post('/bulk', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR', 'SECRETAIRE'), ctrl.createBulk);
router.put('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR', 'SECRETAIRE'), ctrl.update);
router.delete('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR'), ctrl.remove);

module.exports = router;
