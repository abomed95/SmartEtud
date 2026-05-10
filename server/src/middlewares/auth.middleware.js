const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification manquant' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { etablissement: true, professeur: true }
    });

    if (!user || !user.actif) {
      return res.status(401).json({ error: 'Utilisateur inactif ou inexistant' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré, veuillez vous reconnecter' });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Accès refusé. Rôles autorisés: ${roles.join(', ')}`
      });
    }
    next();
  };
};

const requireSameEtablissement = (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') return next();

  const etablissementId = req.params.etablissementId || req.body.etablissementId || req.query.etablissementId;
  if (etablissementId && etablissementId !== req.user.etablissementId) {
    return res.status(403).json({ error: 'Accès limité à votre établissement' });
  }
  next();
};

module.exports = { requireAuth, requireRole, requireSameEtablissement };
