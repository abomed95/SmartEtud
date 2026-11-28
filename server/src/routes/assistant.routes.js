const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/assistant.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Limite par utilisateur : maîtrise des coûts API et protection contre l'abus
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => req.user.id,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Trop de questions en peu de temps. Réessayez dans quelques minutes.' }
});

router.post('/chat', requireAuth, limiter, ctrl.chat);

module.exports = router;
