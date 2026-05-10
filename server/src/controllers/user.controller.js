const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

const getAll = async (req, res) => {
  try {
    const { role, etablissementId } = req.query;
    const where = {};
    if (role) where.role = role;
    if (req.user.role === 'SUPER_ADMIN') {
      if (etablissementId) where.etablissementId = etablissementId;
    } else {
      where.etablissementId = req.user.etablissementId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, nom: true, prenom: true, email: true,
        telephone: true, role: true, actif: true, photo: true, createdAt: true,
        etablissement: { select: { id: true, nom: true } },
        professeur: { select: { id: true, specialite: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        etablissement: true,
        professeur: { include: { matieres: { include: { matiere: true } } } }
      }
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const { password, resetToken, resetExpires, ...userData } = user;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, password, role, etablissementId, specialite, matiereIds } = req.body;

    if (!nom || !email || !password || !role) {
      return res.status(400).json({ error: 'Nom, email, mot de passe et rôle sont requis' });
    }

    const targetEtabId = req.user.role === 'SUPER_ADMIN' ? etablissementId : req.user.etablissementId;

    if (['DIRECTEUR', 'PROFESSEUR', 'SECRETAIRE'].includes(role) && !targetEtabId) {
      return res.status(400).json({ error: 'Établissement requis pour ce rôle' });
    }

    if (req.user.role === 'DIRECTEUR' && !['PROFESSEUR', 'SECRETAIRE'].includes(role)) {
      return res.status(403).json({ error: 'Un directeur ne peut créer que des professeurs et secrétaires' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ error: 'Cet email est déjà utilisé' });

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          nom, prenom, email: email.toLowerCase(), telephone,
          password: hashed, role,
          etablissementId: targetEtabId
        }
      });

      if (role === 'PROFESSEUR') {
        const prof = await tx.professeur.create({
          data: { userId: newUser.id, specialite }
        });
        if (matiereIds && matiereIds.length > 0) {
          await tx.professeurMatiere.createMany({
            data: matiereIds.map(mId => ({ professeurId: prof.id, matiereId: mId }))
          });
        }
      }
      return newUser;
    });

    const { password: _, ...userData } = user;
    res.status(201).json({ message: 'Utilisateur créé avec succès', user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

const update = async (req, res) => {
  try {
    const { nom, prenom, telephone, photo, actif, specialite, matiereIds } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { nom, prenom, telephone, photo, actif },
      include: { professeur: true }
    });

    if (user.role === 'PROFESSEUR' && user.professeur) {
      await prisma.professeur.update({
        where: { id: user.professeur.id },
        data: { specialite }
      });
      if (matiereIds) {
        await prisma.professeurMatiere.deleteMany({ where: { professeurId: user.professeur.id } });
        if (matiereIds.length > 0) {
          await prisma.professeurMatiere.createMany({
            data: matiereIds.map(mId => ({ professeurId: user.professeur.id, matiereId: mId }))
          });
        }
      }
    }

    res.json({ message: 'Utilisateur modifié avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mot de passe invalide (min 6 caractères)' });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.params.id }, data: { password: hashed } });
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, resetPassword, remove };
