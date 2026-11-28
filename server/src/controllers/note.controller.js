const prisma = require('../utils/prisma');
const { calculerMoyenne, getAppreciation, detailParMatiere } = require('../utils/helpers');
const { ah, HttpError, assertSameEtab, loadEtudiantForUser } = require('../utils/scope');

/** Un professeur ne peut noter que les matières qui lui sont affectées. */
const assertMatiereAccess = async (user, matiereId) => {
  const matiere = await prisma.matiere.findUnique({ where: { id: matiereId }, include: { filiere: true } });
  if (!matiere) throw new HttpError(400, 'Matière invalide');
  assertSameEtab(user, matiere.filiere.etablissementId);
  if (user.role === 'PROFESSEUR') {
    const ok = await prisma.professeurMatiere.findFirst({ where: { matiereId, professeur: { userId: user.id } } });
    if (!ok) throw new HttpError(403, 'Cette matière ne vous est pas affectée');
  }
  return matiere;
};

const assertEtudiantsInFiliere = async (etudiantIds, filiereId) => {
  const count = await prisma.etudiant.count({ where: { id: { in: etudiantIds }, filiereId } });
  if (count !== new Set(etudiantIds).size) throw new HttpError(400, 'Un ou plusieurs étudiants n\'appartiennent pas à la filière de la matière');
};

const parseNote = (v) => {
  const x = parseFloat(v);
  if (Number.isNaN(x) || x < 0 || x > 20) throw new HttpError(400, 'La note doit être entre 0 et 20');
  return x;
};

const getByEtudiant = ah(async (req, res) => {
  await loadEtudiantForUser(req.user, req.params.etudiantId);
  const { matiereId, periode, annee } = req.query;
  const where = { etudiantId: req.params.etudiantId };
  if (matiereId) where.matiereId = matiereId;
  if (periode) where.periode = periode;
  if (annee) where.annee = annee;
  const notes = await prisma.note.findMany({
    where,
    include: { matiere: { select: { id: true, nom: true, coefficient: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(notes);
});

const getByNiveau = ah(async (req, res) => {
  const niveau = await prisma.niveau.findUnique({ where: { id: req.params.niveauId }, include: { filiere: true } });
  if (!niveau) throw new HttpError(404, 'Niveau introuvable');
  assertSameEtab(req.user, niveau.filiere.etablissementId);
  const { matiereId, periode, annee } = req.query;
  const where = { niveauId: niveau.id };
  if (matiereId) where.matiereId = matiereId;
  if (periode) where.periode = periode;
  if (annee) where.annee = annee;
  const notes = await prisma.note.findMany({
    where,
    include: {
      etudiant: { select: { id: true, nom: true, prenom: true, matricule: true } },
      matiere: { select: { id: true, nom: true, coefficient: true } }
    },
    orderBy: [{ etudiant: { nom: 'asc' } }]
  });
  res.json(notes);
});

const create = ah(async (req, res) => {
  const { etudiantId, matiereId, niveauId, type, periode, annee, observation } = req.body;
  if (!etudiantId || !matiereId || req.body.valeur === undefined) throw new HttpError(400, 'Étudiant, matière et note requis');
  const valeur = parseNote(req.body.valeur);
  const matiere = await assertMatiereAccess(req.user, matiereId);
  await assertEtudiantsInFiliere([etudiantId], matiere.filiereId);
  const note = await prisma.note.create({
    data: { etudiantId, matiereId, niveauId: niveauId || null, valeur, type: type || 'DEVOIR', periode, annee, observation },
    include: { matiere: true }
  });
  res.status(201).json({ message: 'Note enregistrée', note });
});

const createBulk = ah(async (req, res) => {
  const { notes, matiereId, niveauId, type, periode, annee } = req.body;
  if (!Array.isArray(notes) || notes.length === 0) throw new HttpError(400, 'Liste de notes requise');
  if (notes.length > 500) throw new HttpError(400, 'Maximum 500 notes par envoi');
  const matiere = await assertMatiereAccess(req.user, matiereId);
  await assertEtudiantsInFiliere(notes.map((n) => n.etudiantId), matiere.filiereId);
  const created = await prisma.note.createMany({
    data: notes.map((n) => ({
      etudiantId: n.etudiantId, matiereId, niveauId: niveauId || null,
      valeur: parseNote(n.valeur), type: type || 'DEVOIR', periode, annee
    }))
  });
  res.status(201).json({ message: `${created.count} notes enregistrées` });
});

const loadNote = async (user, id) => {
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) throw new HttpError(404, 'Note introuvable');
  await assertMatiereAccess(user, note.matiereId);
  return note;
};

const update = ah(async (req, res) => {
  const existing = await loadNote(req.user, req.params.id);
  const note = await prisma.note.update({
    where: { id: existing.id },
    data: { valeur: parseNote(req.body.valeur), observation: req.body.observation }
  });
  res.json({ message: 'Note modifiée', note });
});

const remove = ah(async (req, res) => {
  const existing = await loadNote(req.user, req.params.id);
  await prisma.note.delete({ where: { id: existing.id } });
  res.json({ message: 'Note supprimée' });
});

const buildBulletin = async (etudiantId, { periode, annee } = {}) => {
  const where = { etudiantId };
  if (periode) where.periode = periode;
  if (annee) where.annee = annee;
  const notes = await prisma.note.findMany({
    where, include: { matiere: { select: { id: true, nom: true, coefficient: true } } }
  });
  const matieres = [...new Map(notes.map((n) => [n.matiereId, n.matiere])).values()];
  const moyenneGenerale = calculerMoyenne(notes, matieres);
  return { notes, detailMatieres: detailParMatiere(notes), moyenneGenerale, appreciation: getAppreciation(moyenneGenerale) };
};

const getBulletin = ah(async (req, res) => {
  const etudiant = await loadEtudiantForUser(req.user, req.params.etudiantId, { filiere: true, niveau: true });
  const { periode, annee } = req.query;
  const { detailMatieres, moyenneGenerale, appreciation } = await buildBulletin(etudiant.id, { periode, annee });
  res.json({ etudiant, detailMatieres, moyenneGenerale, appreciation, periode, annee });
});

module.exports = { getByEtudiant, getByNiveau, create, createBulk, update, remove, getBulletin, buildBulletin };
