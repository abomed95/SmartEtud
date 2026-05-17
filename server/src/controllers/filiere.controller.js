const prisma = require('../utils/prisma');

const getAll = async (req, res) => {
  try {
    const etablissementId = req.user.role === 'SUPER_ADMIN'
      ? req.query.etablissementId
      : req.user.etablissementId;

    const where = etablissementId ? { etablissementId } : {};

    const filieres = await prisma.filiere.findMany({
      where,
      include: {
        _count: { select: { etudiants: true, matieres: true } },
        niveaux: { orderBy: { ordre: 'asc' } }
      },
      orderBy: { nom: 'asc' }
    });
    res.json(filieres);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const filiere = await prisma.filiere.findUnique({
      where: { id: req.params.id },
      include: {
        matieres: { include: { professeurs: { include: { professeur: { include: { user: { select: { nom: true, prenom: true } } } } } } } },
        niveaux: { orderBy: { ordre: 'asc' } },
        _count: { select: { etudiants: true } }
      }
    });
    if (!filiere) return res.status(404).json({ error: 'Filière introuvable' });
    res.json(filiere);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const { nom, description, duree, niveaux } = req.body;
    if (!nom) return res.status(400).json({ error: 'Nom de la filière requis' });

    const etablissementId = req.user.role === 'SUPER_ADMIN'
      ? req.body.etablissementId
      : req.user.etablissementId;

    const filiere = await prisma.$transaction(async (tx) => {
      const newFiliere = await tx.filiere.create({
        data: { nom, description, duree: duree ? parseInt(duree) : null, etablissementId }
      });
      if (niveaux && niveaux.length > 0) {
        await tx.niveau.createMany({
          data: niveaux.map((n, i) => ({ nom: n.nom || n, ordre: i + 1, filiereId: newFiliere.id }))
        });
      }
      return newFiliere;
    });

    res.status(201).json({ message: 'Filière créée avec succès', filiere });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

const update = async (req, res) => {
  try {
    const { nom, description, duree, actif } = req.body;
    const filiere = await prisma.filiere.update({
      where: { id: req.params.id },
      data: { nom, description, duree: duree ? parseInt(duree) : undefined, actif }
    });
    res.json({ message: 'Filière modifiée', filiere });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    const count = await prisma.etudiant.count({ where: { filiereId: req.params.id } });
    if (count > 0) {
      return res.status(400).json({ error: `Impossible de supprimer: ${count} étudiant(s) dans cette filière` });
    }
    await prisma.filiere.delete({ where: { id: req.params.id } });
    res.json({ message: 'Filière supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, remove };
