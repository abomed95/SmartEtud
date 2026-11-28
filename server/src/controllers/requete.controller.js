// Requêtes administratives en ligne (attestations, relevés, réclamations…)
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { ah, HttpError, etabIdFor, assertSameEtab, currentEtudiant } = require('../utils/scope');

const TYPES = ['ATTESTATION_INSCRIPTION', 'CERTIFICAT_SCOLARITE', 'RELEVE_NOTES', 'RECLAMATION_NOTE', 'AUTRE'];
const STATUTS = ['EN_ATTENTE', 'EN_COURS', 'TRAITEE', 'REJETEE'];
const MAX_EN_ATTENTE = 5;

const numeroRequete = () => `REQ-${new Date().getFullYear()}-${crypto.randomInt(10000, 99999)}`;

const include = {
  etudiant: { select: { id: true, nom: true, prenom: true, matricule: true, filiere: { select: { nom: true } } } },
  traitePar: { select: { nom: true, prenom: true } }
};

const getAll = ah(async (req, res) => {
  const { statut, type } = req.query;
  const where = {};
  if (req.user.role === 'ETUDIANT') {
    where.etudiantId = (await currentEtudiant(req.user)).id;
  } else {
    const etablissementId = etabIdFor(req);
    if (etablissementId) where.etablissementId = etablissementId;
  }
  if (STATUTS.includes(statut)) where.statut = statut;
  if (TYPES.includes(type)) where.type = type;
  const requetes = await prisma.requete.findMany({ where, include, orderBy: { createdAt: 'desc' }, take: 500 });
  res.json(requetes);
});

const create = ah(async (req, res) => {
  const etudiant = await currentEtudiant(req.user);
  const { type, objet, message } = req.body;
  if (!TYPES.includes(type)) throw new HttpError(400, 'Type de requête invalide');
  if (!objet || objet.length > 200) throw new HttpError(400, 'Objet requis (200 caractères max)');
  if (message && message.length > 3000) throw new HttpError(400, 'Message trop long (3000 caractères max)');

  const enAttente = await prisma.requete.count({ where: { etudiantId: etudiant.id, statut: { in: ['EN_ATTENTE', 'EN_COURS'] } } });
  if (enAttente >= MAX_EN_ATTENTE) throw new HttpError(429, `Vous avez déjà ${enAttente} requêtes en cours de traitement`);

  let numero = numeroRequete();
  while (await prisma.requete.findUnique({ where: { numero } })) numero = numeroRequete();

  const requete = await prisma.requete.create({
    data: { numero, type, objet, message, etudiantId: etudiant.id, etablissementId: etudiant.etablissementId },
    include
  });
  res.status(201).json({ message: 'Requête déposée', requete });
});

const traiter = ah(async (req, res) => {
  const existing = await prisma.requete.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, 'Requête introuvable');
  assertSameEtab(req.user, existing.etablissementId);
  const { statut, reponse } = req.body;
  if (!STATUTS.includes(statut)) throw new HttpError(400, 'Statut invalide');
  const final = ['TRAITEE', 'REJETEE'].includes(statut);
  const requete = await prisma.requete.update({
    where: { id: existing.id },
    data: { statut, reponse, traiteParId: req.user.id, traiteLe: final ? new Date() : null },
    include
  });
  res.json({ message: 'Requête mise à jour', requete });
});

module.exports = { getAll, create, traiter, TYPES };
