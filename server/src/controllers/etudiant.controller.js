const prisma = require('../utils/prisma');
const { generateMatricule } = require('../utils/helpers');

const getAll = async (req, res) => {
  try {
    const { filiereId, niveauId, statut, search } = req.query;
    const etablissementId = req.user.role === 'SUPER_ADMIN'
      ? req.query.etablissementId
      : req.user.etablissementId;

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
        _count: { select: { absences: true, notes: true } }
      },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }]
    });
    res.json(etudiants);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const etudiant = await prisma.etudiant.findUnique({
      where: { id: req.params.id },
      include: {
        filiere: true,
        niveau: true,
        notes: { include: { matiere: true }, orderBy: { createdAt: 'desc' } },
        absences: { include: { matiere: true }, orderBy: { date: 'desc' } },
        paiements: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!etudiant) return res.status(404).json({ error: 'Étudiant introuvable' });
    res.json(etudiant);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, sexe, dateNaissance, filiereId, niveauId, photo } = req.body;
    if (!nom || !prenom || !filiereId) {
      return res.status(400).json({ error: 'Nom, prénom et filière sont requis' });
    }

    const etablissementId = req.user.role === 'SUPER_ADMIN'
      ? req.body.etablissementId
      : req.user.etablissementId;

    let matricule = generateMatricule();
    let exists = await prisma.etudiant.findUnique({ where: { matricule } });
    while (exists) {
      matricule = generateMatricule();
      exists = await prisma.etudiant.findUnique({ where: { matricule } });
    }

    const etudiant = await prisma.etudiant.create({
      data: {
        nom, prenom, telephone, email, photo,
        sexe: sexe || 'M',
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        filiereId, niveauId,
        etablissementId,
        matricule
      }
    });
    res.status(201).json({ message: 'Étudiant inscrit avec succès', etudiant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
};

const update = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, sexe, dateNaissance, filiereId, niveauId, statut, photo } = req.body;
    const etudiant = await prisma.etudiant.update({
      where: { id: req.params.id },
      data: {
        nom, prenom, telephone, email, photo,
        sexe,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : undefined,
        filiereId, niveauId, statut
      }
    });
    res.json({ message: 'Étudiant modifié', etudiant });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    if (['SECRETAIRE'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de supprimer un étudiant' });
    }
    await prisma.etudiant.delete({ where: { id: req.params.id } });
    res.json({ message: 'Étudiant supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, remove };
