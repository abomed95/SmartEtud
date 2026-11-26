const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { ah, HttpError } = require('../utils/scope');

// Hash factice : on compare toujours un mot de passe, même si l'email n'existe pas,
// pour que le temps de réponse ne révèle pas quels emails sont inscrits.
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO5c3gIJnZ3sTqW6s1qXh5fJm7b2X1i2a';

const userInclude = {
  etablissement: { select: { id: true, nom: true, logo: true, statut: true } },
  professeur: { include: { matieres: { include: { matiere: true } } } },
  etudiant: { select: { id: true, matricule: true, filiereId: true, niveauId: true } }
};

const sanitize = ({ password, resetToken, resetExpires, ...u }) => u;

const login = ah(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    throw new HttpError(400, 'Email et mot de passe requis');
  }
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() }, include: userInclude });
  const valid = await bcrypt.compare(password, user?.password || DUMMY_HASH);
  if (!user || !valid) throw new HttpError(401, 'Email ou mot de passe incorrect');
  if (!user.actif) throw new HttpError(403, 'Compte désactivé. Contactez votre administration.');
  if (user.etablissement?.statut === 'SUSPENDU') throw new HttpError(403, 'Établissement suspendu. Contactez le support.');

  const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn, algorithm: 'HS256' });
  res.json({ token, user: sanitize(user) });
});

const me = ah(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: userInclude });
  res.json({ user: sanitize(user) });
});

const changePassword = ah(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new HttpError(400, 'Tous les champs sont requis');
  if (newPassword.length < 8) throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères');
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!(await bcrypt.compare(currentPassword, user.password))) throw new HttpError(400, 'Mot de passe actuel incorrect');
  await prisma.user.update({ where: { id: req.user.id }, data: { password: await bcrypt.hash(newPassword, 12) } });
  res.json({ message: 'Mot de passe modifié avec succès' });
});

module.exports = { login, me, changePassword };
