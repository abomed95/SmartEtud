const prisma = require('../utils/prisma');
const { ah, HttpError, assertSameEtab } = require('../utils/scope');

const getAll = ah(async (req, res) => {
  const { filiereId } = req.query;
  const where = {};
  if (filiereId) where.filiereId = filiereId;
  if (req.user.role !== 'SUPER_ADMIN') where.filiere = { etablissementId: req.user.etablissementId };
  const matieres = await prisma.matiere.findMany({
    where,
    include: {
      filiere: { select: { id: true, nom: true } },
      professeurs: { include: { professeur: { include: { user: { select: { id: true, nom: true, prenom: true } } } } } }
    },
    orderBy: { nom: 'asc' }
  });
  res.json(matieres);
});

const loadMatiere = async (user, id) => {
  const m = await prisma.matiere.findUnique({ where: { id }, include: { filiere: true } });
  if (!m) throw new HttpError(404, 'Matière introuvable');
  assertSameEtab(user, m.filiere.etablissementId);
  return m;
};

const create = ah(async (req, res) => {
  const { nom, coefficient, heuresTotal, filiereId } = req.body;
  if (!nom || !filiereId) throw new HttpError(400, 'Nom et filière requis');
  const filiere = await prisma.filiere.findUnique({ where: { id: filiereId } });
  if (!filiere) throw new HttpError(400, 'Filière invalide');
  assertSameEtab(req.user, filiere.etablissementId);
  const coeff = coefficient ? parseFloat(coefficient) : 1;
  if (!(coeff > 0 && coeff <= 20)) throw new HttpError(400, 'Coefficient invalide');
  const matiere = await prisma.matiere.create({
    data: { nom, coefficient: coeff, heuresTotal: heuresTotal ? parseInt(heuresTotal, 10) : null, filiereId }
  });
  res.status(201).json({ message: 'Matière créée', matiere });
});

const update = ah(async (req, res) => {
  const existing = await loadMatiere(req.user, req.params.id);
  const { nom, coefficient, heuresTotal, actif } = req.body;
  const matiere = await prisma.matiere.update({
    where: { id: existing.id },
    data: {
      nom,
      coefficient: coefficient ? parseFloat(coefficient) : undefined,
      heuresTotal: heuresTotal ? parseInt(heuresTotal, 10) : undefined,
      actif
    }
  });
  res.json({ message: 'Matière modifiée', matiere });
});

const remove = ah(async (req, res) => {
  const existing = await loadMatiere(req.user, req.params.id);
  const notes = await prisma.note.count({ where: { matiereId: existing.id } });
  if (notes > 0) throw new HttpError(400, `Impossible de supprimer : ${notes} note(s) liée(s). Désactivez plutôt la matière.`);
  await prisma.matiere.delete({ where: { id: existing.id } });
  res.json({ message: 'Matière supprimée' });
});

module.exports = { getAll, create, update, remove };
