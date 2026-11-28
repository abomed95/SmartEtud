const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { ah, HttpError, assertSameEtab } = require('../utils/scope');

const MIN_PWD = 8;
const STAFF_ROLES = ['DIRECTEUR', 'PROFESSEUR', 'SECRETAIRE'];

/**
 * Un directeur ne gère que les professeurs/secrétaires de SON établissement.
 * (Avant correctif : un directeur pouvait réinitialiser le mot de passe du super admin.)
 */
const loadManageable = async (actor, id) => {
  const target = await prisma.user.findUnique({ where: { id }, include: { professeur: true } });
  if (!target) throw new HttpError(404, 'Utilisateur introuvable');
  if (actor.role === 'SUPER_ADMIN') return target;
  assertSameEtab(actor, target.etablissementId);
  if (!['PROFESSEUR', 'SECRETAIRE'].includes(target.role)) throw new HttpError(403, 'Action non autorisée sur ce compte');
  return target;
};

const assertMatieresEtab = async (etablissementId, matiereIds) => {
  if (!matiereIds?.length) return;
  const count = await prisma.matiere.count({ where: { id: { in: matiereIds }, filiere: { etablissementId } } });
  if (count !== new Set(matiereIds).size) throw new HttpError(400, 'Matière(s) invalide(s)');
};

const getAll = ah(async (req, res) => {
  const { role, etablissementId } = req.query;
  const where = {};
  if (role) where.role = role;
  if (req.user.role === 'SUPER_ADMIN') {
    if (etablissementId) where.etablissementId = etablissementId;
  } else {
    where.etablissementId = req.user.etablissementId;
    where.role = role && ['PROFESSEUR', 'SECRETAIRE'].includes(role) ? role : { in: ['PROFESSEUR', 'SECRETAIRE'] };
  }
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, nom: true, prenom: true, email: true, telephone: true, role: true, actif: true, photo: true, createdAt: true,
      etablissement: { select: { id: true, nom: true } },
      professeur: { select: { id: true, specialite: true, matieres: { select: { matiere: { select: { id: true, nom: true } } } } } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(users);
});

const getById = ah(async (req, res) => {
  if (req.params.id !== req.user.id) await loadManageable(req.user, req.params.id);
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { etablissement: true, professeur: { include: { matieres: { include: { matiere: true } } } } }
  });
  const { password, resetToken, resetExpires, ...userData } = user;
  res.json(userData);
});

const create = ah(async (req, res) => {
  const { nom, prenom, email, telephone, password, role, etablissementId, specialite, matiereIds } = req.body;
  if (!nom || !email || !password || !role) throw new HttpError(400, 'Nom, email, mot de passe et rôle sont requis');
  if (password.length < MIN_PWD) throw new HttpError(400, `Mot de passe : ${MIN_PWD} caractères minimum`);
  if (![...STAFF_ROLES, 'SUPER_ADMIN'].includes(role)) throw new HttpError(400, 'Rôle invalide');

  const targetEtabId = req.user.role === 'SUPER_ADMIN' ? etablissementId : req.user.etablissementId;
  if (STAFF_ROLES.includes(role) && !targetEtabId) throw new HttpError(400, 'Établissement requis pour ce rôle');
  if (req.user.role === 'DIRECTEUR' && !['PROFESSEUR', 'SECRETAIRE'].includes(role)) {
    throw new HttpError(403, 'Un directeur ne peut créer que des professeurs et secrétaires');
  }
  await assertMatieresEtab(targetEtabId, matiereIds);

  const normalized = email.toLowerCase().trim();
  if (await prisma.user.findUnique({ where: { email: normalized } })) throw new HttpError(400, 'Cet email est déjà utilisé');

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { nom, prenom, email: normalized, telephone, password: hashed, role, etablissementId: role === 'SUPER_ADMIN' ? null : targetEtabId }
    });
    if (role === 'PROFESSEUR') {
      const prof = await tx.professeur.create({ data: { userId: newUser.id, specialite } });
      if (matiereIds?.length) {
        await tx.professeurMatiere.createMany({ data: matiereIds.map((mId) => ({ professeurId: prof.id, matiereId: mId })) });
      }
    }
    return newUser;
  });
  const { password: _, ...userData } = user;
  res.status(201).json({ message: 'Utilisateur créé avec succès', user: userData });
});

const update = ah(async (req, res) => {
  const target = await loadManageable(req.user, req.params.id);
  const { nom, prenom, telephone, photo, actif, specialite, matiereIds } = req.body;
  if (target.id === req.user.id && actif === false) throw new HttpError(400, 'Vous ne pouvez pas désactiver votre propre compte');
  await assertMatieresEtab(target.etablissementId, matiereIds);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: target.id }, data: { nom, prenom, telephone, photo, actif } });
    if (target.role === 'PROFESSEUR' && target.professeur) {
      await tx.professeur.update({ where: { id: target.professeur.id }, data: { specialite } });
      if (Array.isArray(matiereIds)) {
        await tx.professeurMatiere.deleteMany({ where: { professeurId: target.professeur.id } });
        if (matiereIds.length) {
          await tx.professeurMatiere.createMany({ data: matiereIds.map((mId) => ({ professeurId: target.professeur.id, matiereId: mId })) });
        }
      }
    }
  });
  res.json({ message: 'Utilisateur modifié avec succès' });
});

const resetPassword = ah(async (req, res) => {
  const target = await loadManageable(req.user, req.params.id);
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < MIN_PWD) throw new HttpError(400, `Mot de passe invalide (min ${MIN_PWD} caractères)`);
  await prisma.user.update({ where: { id: target.id }, data: { password: await bcrypt.hash(newPassword, 12) } });
  res.json({ message: 'Mot de passe réinitialisé avec succès' });
});

const remove = ah(async (req, res) => {
  if (req.params.id === req.user.id) throw new HttpError(400, 'Vous ne pouvez pas supprimer votre propre compte');
  const target = await loadManageable(req.user, req.params.id);
  await prisma.user.delete({ where: { id: target.id } });
  res.json({ message: 'Utilisateur supprimé' });
});

module.exports = { getAll, getById, create, update, resetPassword, remove };
