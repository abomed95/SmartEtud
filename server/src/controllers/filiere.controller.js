const prisma = require('../utils/prisma');
const { ah, HttpError, etabIdFor, assertSameEtab } = require('../utils/scope');

const loadFiliere = async (user, id, include) => {
  const filiere = await prisma.filiere.findUnique({ where: { id }, include });
  if (!filiere) throw new HttpError(404, 'Filière introuvable');
  assertSameEtab(user, filiere.etablissementId);
  return filiere;
};

const getAll = ah(async (req, res) => {
  const etablissementId = etabIdFor(req);
  const filieres = await prisma.filiere.findMany({
    where: etablissementId ? { etablissementId } : {},
    include: { _count: { select: { etudiants: true, matieres: true } }, niveaux: { orderBy: { ordre: 'asc' } } },
    orderBy: { nom: 'asc' }
  });
  res.json(filieres);
});

const getById = ah(async (req, res) => {
  const filiere = await loadFiliere(req.user, req.params.id, {
    matieres: { include: { professeurs: { include: { professeur: { include: { user: { select: { nom: true, prenom: true } } } } } } } },
    niveaux: { orderBy: { ordre: 'asc' } },
    _count: { select: { etudiants: true } }
  });
  res.json(filiere);
});

const create = ah(async (req, res) => {
  const { nom, description, duree, niveaux } = req.body;
  if (!nom) throw new HttpError(400, 'Nom de la filière requis');
  const etablissementId = etabIdFor(req);
  if (!etablissementId) throw new HttpError(400, 'Établissement requis');
  const filiere = await prisma.$transaction(async (tx) => {
    const f = await tx.filiere.create({ data: { nom, description, duree: duree ? parseInt(duree, 10) : null, etablissementId } });
    if (Array.isArray(niveaux) && niveaux.length) {
      await tx.niveau.createMany({ data: niveaux.map((n, i) => ({ nom: n.nom || n, ordre: i + 1, filiereId: f.id })) });
    }
    return f;
  });
  res.status(201).json({ message: 'Filière créée avec succès', filiere });
});

const update = ah(async (req, res) => {
  const existing = await loadFiliere(req.user, req.params.id);
  const { nom, description, duree, actif } = req.body;
  const filiere = await prisma.filiere.update({
    where: { id: existing.id },
    data: { nom, description, duree: duree ? parseInt(duree, 10) : undefined, actif }
  });
  res.json({ message: 'Filière modifiée', filiere });
});

const remove = ah(async (req, res) => {
  const existing = await loadFiliere(req.user, req.params.id);
  const count = await prisma.etudiant.count({ where: { filiereId: existing.id } });
  if (count > 0) throw new HttpError(400, `Impossible de supprimer : ${count} étudiant(s) dans cette filière`);
  await prisma.filiere.delete({ where: { id: existing.id } });
  res.json({ message: 'Filière supprimée' });
});

module.exports = { getAll, getById, create, update, remove };
