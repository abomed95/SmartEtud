const prisma = require('../utils/prisma');
const { calculerMoyenne, getAppreciation } = require('../utils/helpers');

const getByEtudiant = async (req, res) => {
  try {
    const { etudiantId } = req.params;
    const { matiereId, periode, annee } = req.query;
    const where = { etudiantId };
    if (matiereId) where.matiereId = matiereId;
    if (periode) where.periode = periode;
    if (annee) where.annee = annee;

    const notes = await prisma.note.findMany({
      where,
      include: { matiere: { select: { id: true, nom: true, coefficient: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getByNiveau = async (req, res) => {
  try {
    const { niveauId } = req.params;
    const { matiereId, periode, annee } = req.query;
    const where = { niveauId };
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
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const { etudiantId, matiereId, niveauId, valeur, type, periode, annee, observation } = req.body;
    if (!etudiantId || !matiereId || valeur === undefined) {
      return res.status(400).json({ error: 'Étudiant, matière et note requis' });
    }
    if (valeur < 0 || valeur > 20) {
      return res.status(400).json({ error: 'La note doit être entre 0 et 20' });
    }

    const note = await prisma.note.create({
      data: {
        etudiantId, matiereId, niveauId,
        valeur: parseFloat(valeur),
        type: type || 'DEVOIR',
        periode, annee, observation
      },
      include: { matiere: true }
    });
    res.status(201).json({ message: 'Note enregistrée', note });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
};

const createBulk = async (req, res) => {
  try {
    const { notes, matiereId, niveauId, type, periode, annee } = req.body;
    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ error: 'Liste de notes requise' });
    }

    const created = await prisma.note.createMany({
      data: notes.map(n => ({
        etudiantId: n.etudiantId,
        matiereId,
        niveauId,
        valeur: parseFloat(n.valeur),
        type: type || 'DEVOIR',
        periode, annee
      })),
      skipDuplicates: false
    });

    res.status(201).json({ message: `${created.count} notes enregistrées` });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
};

const update = async (req, res) => {
  try {
    const { valeur, observation } = req.body;
    if (valeur < 0 || valeur > 20) {
      return res.status(400).json({ error: 'La note doit être entre 0 et 20' });
    }
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: { valeur: parseFloat(valeur), observation }
    });
    res.json({ message: 'Note modifiée', note });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.note.delete({ where: { id: req.params.id } });
    res.json({ message: 'Note supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getBulletin = async (req, res) => {
  try {
    const { etudiantId } = req.params;
    const { periode, annee } = req.query;

    const etudiant = await prisma.etudiant.findUnique({
      where: { id: etudiantId },
      include: { filiere: true, niveau: true }
    });
    if (!etudiant) return res.status(404).json({ error: 'Étudiant introuvable' });

    const where = { etudiantId };
    if (periode) where.periode = periode;
    if (annee) where.annee = annee;

    const notes = await prisma.note.findMany({
      where,
      include: { matiere: { select: { id: true, nom: true, coefficient: true } } }
    });

    const matieres = [...new Map(notes.map(n => [n.matiereId, n.matiere])).values()];
    const moyenne = calculerMoyenne(notes, matieres);
    const appreciation = getAppreciation(moyenne);

    const notesByMatiere = {};
    notes.forEach(n => {
      if (!notesByMatiere[n.matiereId]) {
        notesByMatiere[n.matiereId] = { matiere: n.matiere, notes: [] };
      }
      notesByMatiere[n.matiereId].notes.push(n.valeur);
    });

    const detailMatieres = Object.values(notesByMatiere).map(item => ({
      matiere: item.matiere,
      notes: item.notes,
      moyenne: item.notes.reduce((a, b) => a + b, 0) / item.notes.length
    }));

    res.json({ etudiant, detailMatieres, moyenneGenerale: moyenne, appreciation, periode, annee });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getByEtudiant, getByNiveau, create, createBulk, update, remove, getBulletin };
