const express = require('express');
const router = express.Router();
const { login, me, changePassword } = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.get('/me', requireAuth, me);
router.put('/change-password', requireAuth, changePassword);

module.exports = router;
