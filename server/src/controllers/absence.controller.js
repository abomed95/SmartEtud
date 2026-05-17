const prisma = require('../utils/prisma');

const getAll = async (req, res) => {
  try {
    const { etudiantId, niveauId, matiereId, date, type } = req.query;
    const etablissementId = req.user.role === 'SUPER_ADMIN'
      ? req.query.etablissementId
      : req.user.etablissementId;

    const where = {};
    if (etudiantId) where.etudiantId = etudiantId;
    if (niveauId) where.niveauId = niveauId;
    if (matiereId) where.matiereId = matiereId;
    if (type) where.type = type;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }
    if (etablissementId) {
      where.etudiant = { etablissementId };
    }

    const absences = await prisma.absence.findMany({
      where,
      include: {
        etudiant: { select: { id: true, nom: true, prenom: true, matricule: true, filiere: { select: { nom: true } } } },
        matiere: { select: { id: true, nom: true } },
        saisiPar: { select: { nom: true, prenom: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(absences);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const { etudiantId, matiereId, niveauId, type, date, justifiee, motif } = req.body;
    if (!etudiantId || !type) {
      return res.status(400).json({ error: 'Étudiant et type requis' });
    }

    const absence = await prisma.absence.create({
      data: {
        etudiantId, matiereId, niveauId,
        type: type || 'ABSENCE',
        date: date ? new Date(date) : new Date(),
        justifiee: justifiee || false,
        motif,
        saisiParId: req.user.id
      },
      include: { etudiant: { select: { nom: true, prenom: true } } }
    });
    res.status(201).json({ message: 'Absence enregistrée', absence });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
};

const createBulk = async (req, res) => {
  try {
    const { absences, niveauId, matiereId, date, type } = req.body;
    if (!Array.isArray(absences) || absences.length === 0) {
      return res.status(400).json({ error: 'Liste requise' });
    }

    const created = await prisma.absence.createMany({
      data: absences.map(a => ({
        etudiantId: a.etudiantId,
        type: a.type || type || 'ABSENCE',
        date: date ? new Date(date) : new Date(),
        justifiee: a.justifiee || false,
        motif: a.motif,
        niveauId, matiereId,
        saisiParId: req.user.id
      }))
    });

    const nbAbsences = created.count;

    const absencesCounts = await prisma.absence.groupBy({
      by: ['etudiantId'],
      where: { etudiantId: { in: absences.map(a => a.etudiantId) }, type: 'ABSENCE' },
      _count: { _all: true }
    });

    const alerts = absencesCounts
      .filter(a => a._count._all >= 3)
      .map(a => a.etudiantId);

    res.status(201).json({ message: `${nbAbsences} absences enregistrées`, alertes: alerts });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
};

const update = async (req, res) => {
  try {
    const { type, justifiee, motif } = req.body;
    const absence = await prisma.absence.update({
      where: { id: req.params.id },
      data: { type, justifiee, motif }
    });
    res.json({ message: 'Absence modifiée', absence });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.absence.delete({ where: { id: req.params.id } });
    res.json({ message: 'Absence supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getStats = async (req, res) => {
  try {
    const { etudiantId } = req.params;
    const stats = await prisma.absence.groupBy({
      by: ['type'],
      where: { etudiantId },
      _count: { _all: true }
    });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getAll, create, createBulk, update, remove, getStats };
