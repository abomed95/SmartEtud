// Contrôle d'accès « par établissement » et « par étudiant ».
// Chaque ressource accédée par ID doit être vérifiée : sinon un utilisateur d'un
// établissement A peut lire/modifier les données de B en devinant un UUID (IDOR).
const prisma = require('./prisma');

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const isSuper = (user) => user.role === 'SUPER_ADMIN';

/** Établissement effectif pour une requête de liste/création. */
const etabIdFor = (req, fallback) =>
  isSuper(req.user) ? (fallback ?? req.query.etablissementId ?? req.body?.etablissementId) : req.user.etablissementId;

/** Vérifie que l'objet appartient à l'établissement de l'utilisateur. */
const assertSameEtab = (user, etablissementId) => {
  if (isSuper(user)) return;
  if (!etablissementId || etablissementId !== user.etablissementId) {
    throw new HttpError(404, 'Ressource introuvable');
  }
};

/**
 * Charge un étudiant et vérifie le droit d'accès :
 *  - ETUDIANT : uniquement son propre dossier
 *  - personnel : même établissement
 */
const loadEtudiantForUser = async (user, etudiantId, include) => {
  const etudiant = await prisma.etudiant.findUnique({ where: { id: etudiantId }, include });
  if (!etudiant) throw new HttpError(404, 'Étudiant introuvable');
  if (user.role === 'ETUDIANT') {
    if (etudiant.userId !== user.id) throw new HttpError(404, 'Étudiant introuvable');
    return etudiant;
  }
  assertSameEtab(user, etudiant.etablissementId);
  return etudiant;
};

/** Étudiant lié au compte connecté (rôle ETUDIANT). */
const currentEtudiant = async (user, include) => {
  const etudiant = await prisma.etudiant.findUnique({ where: { userId: user.id }, include });
  if (!etudiant) throw new HttpError(404, 'Aucun dossier étudiant lié à ce compte');
  return etudiant;
};

/** Enveloppe async : transmet les erreurs au middleware d'erreur central. */
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, isSuper, etabIdFor, assertSameEtab, loadEtudiantForUser, currentEtudiant, ah };
