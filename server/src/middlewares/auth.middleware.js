const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { jwtSecret } = require('../config/env');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification manquant' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { etablissement: { select: { id: true, nom: true, statut: true } }, professeur: true }
    });

    if (!user || !user.actif) {
      return res.status(401).json({ error: 'Utilisateur inactif ou inexistant' });
    }
    if (user.etablissement && user.etablissement.statut === 'SUSPENDU') {
      return res.status(403).json({ error: 'Établissement suspendu' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé pour votre rôle' });
  }
  next();
};

const STAFF = ['SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR', 'SECRETAIRE'];

module.exports = { requireAuth, requireRole, STAFF };
