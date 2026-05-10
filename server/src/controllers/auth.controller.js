const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        etablissement: { select: { id: true, nom: true, logo: true, statut: true } },
        professeur: { include: { matieres: { include: { matiere: true } } } }
      }
    });

    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    if (!user.actif) return res.status(403).json({ error: 'Compte désactivé. Contactez votre administrateur.' });
    if (user.etablissement && user.etablissement.statut === 'SUSPENDU') {
      return res.status(403).json({ error: 'Établissement suspendu. Contactez le support.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const token = generateToken(user.id, user.role);

    const { password: _, resetToken: __, resetExpires: ___, ...userData } = user;
    res.json({ token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        etablissement: { select: { id: true, nom: true, logo: true, statut: true } },
        professeur: { include: { matieres: { include: { matiere: true } } } }
      }
    });
    const { password, resetToken, resetExpires, ...userData } = user;
    res.json({ user: userData });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { login, me, changePassword };
