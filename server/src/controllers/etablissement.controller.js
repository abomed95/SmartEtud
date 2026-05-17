const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

const getAll = async (req, res) => {
  try {
    const etablissements = await prisma.etablissement.findMany({
      include: {
        _count: { select: { users: true, etudiants: true, filieres: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(etablissements);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const etab = await prisma.etablissement.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, nom: true, prenom: true, role: true, email: true, actif: true } },
        _count: { select: { etudiants: true, filieres: true } }
      }
    });
    if (!etab) return res.status(404).json({ error: 'Établissement introuvable' });
    res.json(etab);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const { nom, adresse, telephone, email, dirNom, dirPrenom, dirEmail, dirTelephone, dirPassword } = req.body;
    if (!nom || !dirEmail || !dirPassword || !dirNom) {
      return res.status(400).json({ error: 'Nom établissement, nom/email/mot de passe du directeur sont requis' });
    }

    const existing = await prisma.user.findUnique({ where: { email: dirEmail.toLowerCase() } });
    if (existing) return res.status(400).json({ error: 'Cet email est déjà utilisé' });

    const hashedPassword = await bcrypt.hash(dirPassword, 12);

    const etab = await prisma.$transaction(async (tx) => {
      const newEtab = await tx.etablissement.create({
        data: { nom, adresse, telephone, email }
      });
      await tx.user.create({
        data: {
          nom: dirNom,
          prenom: dirPrenom,
          email: dirEmail.toLowerCase(),
          telephone: dirTelephone,
          password: hashedPassword,
          role: 'DIRECTEUR',
          etablissementId: newEtab.id
        }
      });
      return newEtab;
    });

    res.status(201).json({ message: 'Établissement créé avec succès', etablissement: etab });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, adresse, telephone, email, logo } = req.body;
    const etab = await prisma.etablissement.update({
      where: { id },
      data: { nom, adresse, telephone, email, logo }
    });
    res.json({ message: 'Établissement modifié', etablissement: etab });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const toggleStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const etab = await prisma.etablissement.update({
      where: { id },
      data: { statut }
    });
    res.json({ message: `Établissement ${statut === 'ACTIF' ? 'activé' : 'suspendu'}`, etablissement: etab });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.etablissement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Établissement supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, toggleStatut, remove };
