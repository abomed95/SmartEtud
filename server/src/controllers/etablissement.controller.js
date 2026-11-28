const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { ah, HttpError, assertSameEtab } = require('../utils/scope');

const getAll = ah(async (req, res) => {
  const where = req.user.role === 'SUPER_ADMIN' ? {} : { id: req.user.etablissementId };
  const etablissements = await prisma.etablissement.findMany({
    where,
    include: { _count: { select: { users: true, etudiants: true, filieres: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(etablissements);
});

const getById = ah(async (req, res) => {
  assertSameEtab(req.user, req.params.id);
  const etab = await prisma.etablissement.findUnique({
    where: { id: req.params.id },
    include: {
      users: { select: { id: true, nom: true, prenom: true, role: true, email: true, actif: true } },
      _count: { select: { etudiants: true, filieres: true } }
    }
  });
  if (!etab) throw new HttpError(404, 'Établissement introuvable');
  res.json(etab);
});

const create = ah(async (req, res) => {
  const { nom, adresse, telephone, email, dirNom, dirPrenom, dirEmail, dirTelephone, dirPassword } = req.body;
  if (!nom || !dirEmail || !dirPassword || !dirNom) {
    throw new HttpError(400, 'Nom établissement, nom/email/mot de passe du directeur sont requis');
  }
  if (dirPassword.length < 8) throw new HttpError(400, 'Mot de passe directeur : 8 caractères minimum');
  const normalized = dirEmail.toLowerCase().trim();
  if (await prisma.user.findUnique({ where: { email: normalized } })) throw new HttpError(400, 'Cet email est déjà utilisé');

  const hashedPassword = await bcrypt.hash(dirPassword, 12);
  const etab = await prisma.$transaction(async (tx) => {
    const newEtab = await tx.etablissement.create({ data: { nom, adresse, telephone, email } });
    await tx.user.create({
      data: {
        nom: dirNom, prenom: dirPrenom, email: normalized, telephone: dirTelephone,
        password: hashedPassword, role: 'DIRECTEUR', etablissementId: newEtab.id
      }
    });
    return newEtab;
  });
  res.status(201).json({ message: 'Établissement créé avec succès', etablissement: etab });
});

const update = ah(async (req, res) => {
  assertSameEtab(req.user, req.params.id);
  const { nom, adresse, telephone, email, logo } = req.body;
  const etab = await prisma.etablissement.update({ where: { id: req.params.id }, data: { nom, adresse, telephone, email, logo } });
  res.json({ message: 'Établissement modifié', etablissement: etab });
});

const toggleStatut = ah(async (req, res) => {
  const { statut } = req.body;
  if (!['ACTIF', 'INACTIF', 'SUSPENDU'].includes(statut)) throw new HttpError(400, 'Statut invalide');
  const etab = await prisma.etablissement.update({ where: { id: req.params.id }, data: { statut } });
  res.json({ message: `Établissement ${statut === 'ACTIF' ? 'activé' : 'suspendu'}`, etablissement: etab });
});

const remove = ah(async (req, res) => {
  await prisma.etablissement.delete({ where: { id: req.params.id } });
  res.json({ message: 'Établissement supprimé' });
});

module.exports = { getAll, getById, create, update, toggleStatut, remove };
