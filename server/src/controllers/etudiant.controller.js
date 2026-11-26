const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { generateMatricule, generateTempPassword } = require('../utils/helpers');
const { ah, HttpError, etabIdFor, assertSameEtab, loadEtudiantForUser } = require('../utils/scope');

const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k] === '' ? null : o[k]]));

/** Vérifie que filière (et niveau) appartiennent bien à l'établissement. */
const checkFiliere = async (etablissementId, filiereId, niveauId) => {
  if (!filiereId) return;
  const filiere = await prisma.filiere.findUnique({ where: { id: filiereId }, include: { niveaux: { select: { id: true } } } });
  if (!filiere || filiere.etablissementId !== etablissementId) throw new HttpError(400, 'Filière invalide');
  if (niveauId && !filiere.niveaux.some((n) => n.id === niveauId)) throw new HttpError(400, 'Niveau invalide pour cette filière');
};

const getAll = ah(async (req, res) => {
  const { filiereId, niveauId, statut, search } = req.query;
  const etablissementId = etabIdFor(req);
  const where = {};
  if (etablissementId) where.etablissementId = etablissementId;
  if (filiereId) where.filiereId = filiereId;
  if (niveauId) where.niveauId = niveauId;
  if (statut) where.statut = statut;
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search } },
      { matricule: { contains: search, mode: 'insensitive' } }
    ];
  }
  const etudiants = await prisma.etudiant.findMany({
    where,
    include: {
      filiere: { select: { id: true, nom: true } },
      niveau: { select: { id: true, nom: true } },
      user: { select: { id: true, email: true, actif: true } },
      _count: { select: { absences: true, notes: true } }
    },
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }]
  });
  res.json(etudiants);
});

const getById = ah(async (req, res) => {
  const etudiant = await loadEtudiantForUser(req.user, req.params.id, {
    filiere: true,
    niveau: true,
    notes: { include: { matiere: true }, orderBy: { createdAt: 'desc' } },
    absences: { include: { matiere: true }, orderBy: { date: 'desc' } },
    paiements: { orderBy: { createdAt: 'desc' } }
  });
  res.json(etudiant);
});

const create = ah(async (req, res) => {
  const { nom, prenom, filiereId, niveauId } = req.body;
  if (!nom || !prenom || !filiereId) throw new HttpError(400, 'Nom, prénom et filière sont requis');

  const etablissementId = etabIdFor(req);
  if (!etablissementId) throw new HttpError(400, 'Établissement requis');
  await checkFiliere(etablissementId, filiereId, niveauId || null);

  let matricule = generateMatricule();
  while (await prisma.etudiant.findUnique({ where: { matricule } })) matricule = generateMatricule();

  const data = pick(req.body, ['nom', 'prenom', 'telephone', 'email', 'sexe', 'filiereId', 'niveauId']);
  const etudiant = await prisma.etudiant.create({
    data: {
      ...data,
      sexe: data.sexe || 'M',
      dateNaissance: req.body.dateNaissance ? new Date(req.body.dateNaissance) : null,
      etablissementId,
      matricule
    }
  });
  res.status(201).json({ message: 'Étudiant inscrit avec succès', etudiant });
});

const update = ah(async (req, res) => {
  const existing = await loadEtudiantForUser(req.user, req.params.id);
  const data = pick(req.body, ['nom', 'prenom', 'telephone', 'email', 'sexe', 'filiereId', 'niveauId', 'statut']);
  await checkFiliere(existing.etablissementId, data.filiereId || existing.filiereId, data.niveauId);
  if (req.body.dateNaissance) data.dateNaissance = new Date(req.body.dateNaissance);
  const etudiant = await prisma.etudiant.update({ where: { id: existing.id }, data });
  res.json({ message: 'Étudiant modifié', etudiant });
});

const remove = ah(async (req, res) => {
  const existing = await loadEtudiantForUser(req.user, req.params.id);
  await prisma.$transaction(async (tx) => {
    await tx.etudiant.delete({ where: { id: existing.id } });
    if (existing.userId) await tx.user.delete({ where: { id: existing.userId } });
  });
  res.json({ message: 'Étudiant supprimé' });
});

/**
 * Crée (ou réinitialise) l'accès au portail étudiant.
 * Renvoie un mot de passe temporaire à transmettre à l'étudiant (affiché une seule fois).
 */
const createCompte = ah(async (req, res) => {
  const etudiant = await loadEtudiantForUser(req.user, req.params.id);
  const email = (req.body.email || etudiant.email || '').toLowerCase().trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Adresse email valide requise pour créer l\'accès');

  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 12);

  if (etudiant.userId) {
    await prisma.user.update({ where: { id: etudiant.userId }, data: { password: hashed, actif: true } });
    return res.json({ message: 'Mot de passe du portail réinitialisé', email, tempPassword });
  }

  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) throw new HttpError(400, 'Cet email est déjà utilisé par un autre compte');

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        nom: etudiant.nom, prenom: etudiant.prenom, email, telephone: etudiant.telephone,
        password: hashed, role: 'ETUDIANT', etablissementId: etudiant.etablissementId
      }
    });
    await tx.etudiant.update({ where: { id: etudiant.id }, data: { userId: user.id, email } });
  });
  res.status(201).json({ message: 'Accès portail créé', email, tempPassword });
});

module.exports = { getAll, getById, create, update, remove, createCompte, checkFiliere, assertSameEtab };
