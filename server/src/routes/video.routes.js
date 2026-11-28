const router = require('express').Router();
const ctrl = require('../controllers/video.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const AUTEURS = ['SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR'];

// Lien signé à durée limitée : pas de JWT (une balise <video> n'envoie pas d'en-tête Authorization)
router.get('/fichier/:name', ctrl.fichierLocal);

router.use(requireAuth);
router.get('/', ctrl.getAll);
router.post('/upload-url', requireRole(...AUTEURS), ctrl.uploadUrl);
router.post('/upload', requireRole(...AUTEURS), ctrl.uploadLocal);
router.post('/', requireRole(...AUTEURS), ctrl.create);
router.get('/:id/lecture', ctrl.lecture);
router.post('/:id/progression', ctrl.progression);
router.get('/:id/stats', requireRole(...AUTEURS), ctrl.stats);
router.put('/:id', requireRole(...AUTEURS), ctrl.update);
router.delete('/:id', requireRole(...AUTEURS), ctrl.remove);

module.exports = router;
