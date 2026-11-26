const prisma = require('../utils/prisma');
const { ah, HttpError, etabIdFor, loadEtudiantForUser } = require('../utils/scope');

const TYPES = ['ABSENCE', 'RETARD', 'PRESENCE'];

const assertEtudiantsEtab = async (user, ids) => {
  if (user.role === 'SUPER_ADMIN') return;
  const count = await prisma.etudiant.count({ where: { id: { in: ids }, etablissementId: user.etablissementId } });
  if (count !== new Set(ids).size) throw new HttpError(400, 'Étudiant(s) hors de votre établissement');
};

const getAll = ah(async (req, res) => {
  const { etudiantId, niveauId, matiereId, date, type } = req.query;
  const where = {};
  if (req.user.role === 'ETUDIANT') {
    const etu = await prisma.etudiant.findUnique({ where: { userId: req.user.id } });
    where.etudiantId = etu?.id || '__none__';
  } else {
    const etablissementId = etabIdFor(req);
    if (etablissementId) where.etudiant = { etablissementId };
    if (etudiantId) where.etudiantId = etudiantId;
  }
  if (niveauId) where.niveauId = niveauId;
  if (matiereId) where.matiereId = matiereId;
  if (type && TYPES.includes(type)) where.type = type;
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.date = { gte: d, lt: next };
  }
  const absences = await prisma.absence.findMany({
    where,
    include: {
      etudiant: { select: { id: true, nom: true, prenom: true, matricule: true, filiere: { select: { nom: true } } } },
      matiere: { select: { id: true, nom: true } },
      saisiPar: { select: { nom: true, prenom: true } }
    },
    orderBy: { date: 'desc' },
    take: 1000
  });
  res.json(absences);
});

const create = ah(async (req, res) => {
  const { etudiantId, matiereId, niveauId, type, date, justifiee, motif } = req.body;
  if (!etudiantId || !TYPES.includes(type)) throw new HttpError(400, 'Étudiant et type valides requis');
  await assertEtudiantsEtab(req.user, [etudiantId]);
  const absence = await prisma.absence.create({
    data: {
      etudiantId, matiereId: matiereId || null, niveauId: niveauId || null, type,
      date: date ? new Date(date) : new Date(),
      justifiee: !!justifiee, motif, saisiParId: req.user.id
    },
    include: { etudiant: { select: { nom: true, prenom: true } } }
  });
  res.status(201).json({ message: 'Absence enregistrée', absence });
});

const createBulk = ah(async (req, res) => {
  const { absences, niveauId, matiereId, date, type } = req.body;
  if (!Array.isArray(absences) || absences.length === 0) throw new HttpError(400, 'Liste requise');
  if (absences.length > 500) throw new HttpError(400, 'Maximum 500 lignes par envoi');
  const ids = absences.map((a) => a.etudiantId);
  await assertEtudiantsEtab(req.user, ids);

  const created = await prisma.absence.createMany({
    data: absences.map((a) => ({
      etudiantId: a.etudiantId,
      type: TYPES.includes(a.type) ? a.type : (TYPES.includes(type) ? type : 'ABSENCE'),
      date: date ? new Date(date) : new Date(),
      justifiee: !!a.justifiee, motif: a.motif,
      niveauId: niveauId || null, matiereId: matiereId || null,
      saisiParId: req.user.id
    }))
  });

  const counts = await prisma.absence.groupBy({
    by: ['etudiantId'],
    where: { etudiantId: { in: ids }, type: 'ABSENCE', justifiee: false },
    _count: { _all: true }
  });
  const alertes = counts.filter((a) => a._count._all >= 3).map((a) => a.etudiantId);
  res.status(201).json({ message: `${created.count} saisies enregistrées`, alertes });
});

const loadAbsence = async (user, id) => {
  const absence = await prisma.absence.findUnique({ where: { id }, include: { etudiant: true } });
  if (!absence) throw new HttpError(404, 'Absence introuvable');
  if (user.role !== 'SUPER_ADMIN' && absence.etudiant.etablissementId !== user.etablissementId) {
    throw new HttpError(404, 'Absence introuvable');
  }
  return absence;
};

const update = ah(async (req, res) => {
  const existing = await loadAbsence(req.user, req.params.id);
  const { type, justifiee, motif } = req.body;
  const absence = await prisma.absence.update({
    where: { id: existing.id },
    data: { type: TYPES.includes(type) ? type : undefined, justifiee: justifiee === undefined ? undefined : !!justifiee, motif }
  });
  res.json({ message: 'Absence modifiée', absence });
});

const remove = ah(async (req, res) => {
  const existing = await loadAbsence(req.user, req.params.id);
  await prisma.absence.delete({ where: { id: existing.id } });
  res.json({ message: 'Absence supprimée' });
});

const getStats = ah(async (req, res) => {
  await loadEtudiantForUser(req.user, req.params.etudiantId);
  const stats = await prisma.absence.groupBy({
    by: ['type'], where: { etudiantId: req.params.etudiantId }, _count: { _all: true }
  });
  res.json(stats);
});

module.exports = { getAll, create, createBulk, update, remove, getStats };
