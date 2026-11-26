const prisma = require('../utils/prisma');
const { generateReference } = require('../utils/helpers');
const { ah, HttpError, etabIdFor, assertSameEtab, loadEtudiantForUser } = require('../utils/scope');

const statutDe = (paye, total) => (paye >= total ? 'PAYE' : paye > 0 ? 'PARTIEL' : 'IMPAYE');
const montant = (v, label) => {
  const x = parseFloat(v);
  if (Number.isNaN(x) || x < 0) throw new HttpError(400, `${label} invalide`);
  return x;
};

const getAll = ah(async (req, res) => {
  const { etudiantId, statut, mois, annee, search } = req.query;
  const where = {};
  if (req.user.role === 'ETUDIANT') {
    const etu = await prisma.etudiant.findUnique({ where: { userId: req.user.id } });
    where.etudiantId = etu?.id || '__none__';
  } else {
    const etablissementId = etabIdFor(req);
    if (etablissementId) where.etablissementId = etablissementId;
    if (etudiantId) where.etudiantId = etudiantId;
  }
  if (statut) where.statut = statut;
  if (mois) where.mois = mois;
  if (annee) where.annee = annee;
  if (search) {
    where.etudiant = {
      OR: [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search } },
        { matricule: { contains: search, mode: 'insensitive' } }
      ]
    };
  }
  const paiements = await prisma.paiement.findMany({
    where,
    include: {
      etudiant: {
        select: { id: true, nom: true, prenom: true, matricule: true, telephone: true, filiere: { select: { nom: true } } }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 1000
  });
  res.json(paiements);
});

const loadPaiement = async (user, id, include) => {
  const paiement = await prisma.paiement.findUnique({ where: { id }, include });
  if (!paiement) throw new HttpError(404, 'Paiement introuvable');
  if (user.role === 'ETUDIANT') {
    await loadEtudiantForUser(user, paiement.etudiantId);
  } else {
    assertSameEtab(user, paiement.etablissementId);
  }
  return paiement;
};

const getById = ah(async (req, res) => {
  const paiement = await loadPaiement(req.user, req.params.id, {
    etudiant: { include: { filiere: true, etablissement: { select: { nom: true, logo: true } } } }
  });
  res.json(paiement);
});

const create = ah(async (req, res) => {
  const { etudiantId, montantPaye, typePaiement, description, mois, annee } = req.body;
  if (!etudiantId || !req.body.montant) throw new HttpError(400, 'Étudiant et montant requis');
  const etudiant = await loadEtudiantForUser(req.user, etudiantId);

  const total = montant(req.body.montant, 'Montant');
  // Correction : un montantPaye explicite à 0 était interprété comme « tout payé » (0 || montant)
  const paid = montantPaye === undefined || montantPaye === '' ? total : montant(montantPaye, 'Montant payé');
  if (paid > total) throw new HttpError(400, 'Le montant payé dépasse le montant dû');

  const paiement = await prisma.paiement.create({
    data: {
      etudiantId, etablissementId: etudiant.etablissementId,
      montant: total, montantPaye: paid, statut: statutDe(paid, total),
      typePaiement, reference: generateReference(), description, mois, annee,
      datePaiement: paid > 0 ? new Date() : null
    },
    include: { etudiant: { select: { nom: true, prenom: true, matricule: true } } }
  });
  res.status(201).json({ message: 'Paiement enregistré', paiement });
});

const update = ah(async (req, res) => {
  const existing = await loadPaiement(req.user, req.params.id);
  const { montantPaye, typePaiement, description } = req.body;
  const paid = montantPaye === undefined || montantPaye === '' ? existing.montantPaye : montant(montantPaye, 'Montant payé');
  if (paid > existing.montant) throw new HttpError(400, 'Le montant payé dépasse le montant dû');
  const paiement = await prisma.paiement.update({
    where: { id: existing.id },
    data: {
      montantPaye: paid, statut: statutDe(paid, existing.montant), typePaiement, description,
      datePaiement: paid !== existing.montantPaye ? new Date() : existing.datePaiement
    }
  });
  res.json({ message: 'Paiement modifié', paiement });
});

const remove = ah(async (req, res) => {
  const existing = await loadPaiement(req.user, req.params.id);
  await prisma.paiement.delete({ where: { id: existing.id } });
  res.json({ message: 'Paiement supprimé' });
});

module.exports = { getAll, getById, create, update, remove, loadPaiement };
