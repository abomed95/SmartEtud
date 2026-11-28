const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/note.controller');
const { requireAuth, requireRole, STAFF } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.get('/etudiant/:etudiantId', ctrl.getByEtudiant);
router.get('/niveau/:niveauId', requireRole(...STAFF), ctrl.getByNiveau);
router.get('/bulletin/:etudiantId', ctrl.getBulletin);
router.post('/', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR'), ctrl.create);
router.post('/bulk', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR'), ctrl.createBulk);
router.put('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR'), ctrl.update);
router.delete('/:id', requireRole('SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR'), ctrl.remove);

module.exports = router;
