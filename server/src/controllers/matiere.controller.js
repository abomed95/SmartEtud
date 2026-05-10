const prisma = require('../utils/prisma');

const getAll = async (req, res) => {
  try {
    const { filiereId } = req.query;
    const where = {};
    if (filiereId) where.filiereId = filiereId;
    if (req.user.role !== 'SUPER_ADMIN') {
      where.filiere = { etablissementId: req.user.etablissementId };
    }

    const matieres = await prisma.matiere.findMany({
      where,
      include: {
        filiere: { select: { id: true, nom: true } },
        professeurs: {
          include: { professeur: { include: { user: { select: { id: true, nom: true, prenom: true } } } } }
        }
      },
      orderBy: { nom: 'asc' }
    });
    res.json(matieres);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const { nom, coefficient, heuresTotal, filiereId } = req.body;
    if (!nom || !filiereId) return res.status(400).json({ error: 'Nom et filière requis' });

    const matiere = await prisma.matiere.create({
      data: { nom, coefficient: coefficient ? parseFloat(coefficient) : 1, heuresTotal: heuresTotal ? parseInt(heuresTotal) : null, filiereId }
    });
    res.status(201).json({ message: 'Matière créée', matiere });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

const update = async (req, res) => {
  try {
    const { nom, coefficient, heuresTotal, actif } = req.body;
    const matiere = await prisma.matiere.update({
      where: { id: req.params.id },
      data: { nom, coefficient: coefficient ? parseFloat(coefficient) : undefined, heuresTotal: heuresTotal ? parseInt(heuresTotal) : undefined, actif }
    });
    res.json({ message: 'Matière modifiée', matiere });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.matiere.delete({ where: { id: req.params.id } });
    res.json({ message: 'Matière supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getAll, create, update, remove };
