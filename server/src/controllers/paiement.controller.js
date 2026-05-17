const prisma = require('../utils/prisma');
const { generateReference } = require('../utils/helpers');

const getAll = async (req, res) => {
  try {
    const { etudiantId, statut, mois, annee, search } = req.query;
    const etablissementId = req.user.role === 'SUPER_ADMIN'
      ? req.query.etablissementId
      : req.user.etablissementId;

    const where = {};
    if (etablissementId) where.etablissementId = etablissementId;
    if (etudiantId) where.etudiantId = etudiantId;
    if (statut) where.statut = statut;
    if (mois) where.mois = mois;
    if (annee) where.annee = annee;
    if (search) {
      where.etudiant = {
        OR: [
          { nom: { contains: search, mode: 'insensitive' } },
          { prenom: { contains: search, mode: 'insensitive' } },
          { telephone: { contains: search } },
          { matricule: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const paiements = await prisma.paiement.findMany({
      where,
      include: {
        etudiant: {
          select: { id: true, nom: true, prenom: true, matricule: true, telephone: true,
            filiere: { select: { nom: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(paiements);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const paiement = await prisma.paiement.findUnique({
      where: { id: req.params.id },
      include: {
        etudiant: { include: { filiere: true, etablissement: { select: { nom: true, logo: true } } } }
      }
    });
    if (!paiement) return res.status(404).json({ error: 'Paiement introuvable' });
    res.json(paiement);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const { etudiantId, montant, montantPaye, typePaiement, description, mois, annee } = req.body;
    if (!etudiantId || !montant) {
      return res.status(400).json({ error: 'Étudiant et montant requis' });
    }

    const etablissementId = req.user.role === 'SUPER_ADMIN'
      ? req.body.etablissementId
      : req.user.etablissementId;

    const reference = generateReference();
    const paid = parseFloat(montantPaye || montant);
    const total = parseFloat(montant);
    let statut = 'IMPAYE';
    if (paid >= total) statut = 'PAYE';
    else if (paid > 0) statut = 'PARTIEL';

    const paiement = await prisma.paiement.create({
      data: {
        etudiantId, etablissementId,
        montant: total,
        montantPaye: paid,
        statut,
        typePaiement,
        reference,
        description,
        mois,
        annee,
        datePaiement: paid > 0 ? new Date() : null
      },
      include: { etudiant: { select: { nom: true, prenom: true, matricule: true } } }
    });
    res.status(201).json({ message: 'Paiement enregistré', paiement });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
};

const update = async (req, res) => {
  try {
    const { montantPaye, typePaiement, description } = req.body;
    const existing = await prisma.paiement.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Paiement introuvable' });

    const paid = parseFloat(montantPaye || existing.montantPaye);
    const total = existing.montant;
    let statut = 'IMPAYE';
    if (paid >= total) statut = 'PAYE';
    else if (paid > 0) statut = 'PARTIEL';

    const paiement = await prisma.paiement.update({
      where: { id: req.params.id },
      data: {
        montantPaye: paid,
        statut,
        typePaiement,
        description,
        datePaiement: paid > 0 ? new Date() : null
      }
    });
    res.json({ message: 'Paiement modifié', paiement });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.paiement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Paiement supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, remove };
