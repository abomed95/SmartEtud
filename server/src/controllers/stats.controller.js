const prisma = require('../utils/prisma');

const getSuperAdminStats = async (req, res) => {
  try {
    const [totalEtabs, totalUsers, totalEtudiants, etabsActifs, recentEtabs] = await Promise.all([
      prisma.etablissement.count(),
      prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
      prisma.etudiant.count(),
      prisma.etablissement.count({ where: { statut: 'ACTIF' } }),
      prisma.etablissement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { etudiants: true } } }
      })
    ]);

    res.json({
      totalEtabs, totalUsers, totalEtudiants, etabsActifs,
      etabsSuspendus: totalEtabs - etabsActifs,
      recentEtabs
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getDirecteurStats = async (req, res) => {
  try {
    const etablissementId = req.user.etablissementId;

    const [
      totalEtudiants, totalProfs, totalFilieres,
      etudiantsActifs, paiements, absencesCount,
      topEtudiants
    ] = await Promise.all([
      prisma.etudiant.count({ where: { etablissementId } }),
      prisma.user.count({ where: { etablissementId, role: 'PROFESSEUR' } }),
      prisma.filiere.count({ where: { etablissementId } }),
      prisma.etudiant.count({ where: { etablissementId, statut: 'ACTIF' } }),
      prisma.paiement.aggregate({
        where: { etablissementId },
        _sum: { montantPaye: true, montant: true }
      }),
      prisma.absence.count({
        where: { etudiant: { etablissementId }, type: 'ABSENCE' }
      }),
      prisma.note.groupBy({
        by: ['etudiantId'],
        where: { etudiant: { etablissementId } },
        _avg: { valeur: true },
        orderBy: { _avg: { valeur: 'desc' } },
        take: 5
      })
    ]);

    const impayes = await prisma.paiement.aggregate({
      where: { etablissementId, statut: { in: ['IMPAYE', 'PARTIEL'] } },
      _sum: { montant: true, montantPaye: true }
    });

    const topEtudiantsDetails = await prisma.etudiant.findMany({
      where: { id: { in: topEtudiants.map(t => t.etudiantId) } },
      select: { id: true, nom: true, prenom: true, matricule: true, filiere: { select: { nom: true } } }
    });

    const topWithAvg = topEtudiants.map(t => {
      const etudiant = topEtudiantsDetails.find(e => e.id === t.etudiantId);
      return { ...etudiant, moyenne: t._avg.valeur };
    });

    const paiementsMois = await prisma.paiement.groupBy({
      by: ['mois', 'annee'],
      where: { etablissementId },
      _sum: { montantPaye: true },
      orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
      take: 6
    });

    res.json({
      totalEtudiants, totalProfs, totalFilieres, etudiantsActifs,
      revenus: paiements._sum.montantPaye || 0,
      totalDu: paiements._sum.montant || 0,
      impayes: (impayes._sum.montant || 0) - (impayes._sum.montantPaye || 0),
      absencesCount,
      topEtudiants: topWithAvg,
      paiementsMois
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getProfesseurStats = async (req, res) => {
  try {
    const prof = await prisma.professeur.findUnique({
      where: { userId: req.user.id },
      include: { matieres: { include: { matiere: true } } }
    });
    if (!prof) return res.status(404).json({ error: 'Profil professeur introuvable' });

    const matiereIds = prof.matieres.map(pm => pm.matiereId);
    const [totalNotes, moyenneNotes, absencesCount] = await Promise.all([
      prisma.note.count({ where: { matiereId: { in: matiereIds } } }),
      prisma.note.aggregate({ where: { matiereId: { in: matiereIds } }, _avg: { valeur: true } }),
      prisma.absence.count({ where: { matiereId: { in: matiereIds } } })
    ]);

    res.json({
      matieres: prof.matieres.map(pm => pm.matiere),
      totalNotes,
      moyenneClasse: moyenneNotes._avg.valeur || 0,
      absencesCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getSecretaireStats = async (req, res) => {
  try {
    const etablissementId = req.user.etablissementId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [paiementsAujourdhui, absentsAujourdhui, impayes, totalEtudiants] = await Promise.all([
      prisma.paiement.aggregate({
        where: { etablissementId, datePaiement: { gte: today, lt: tomorrow } },
        _sum: { montantPaye: true },
        _count: { _all: true }
      }),
      prisma.absence.count({
        where: { etudiant: { etablissementId }, date: { gte: today, lt: tomorrow }, type: 'ABSENCE' }
      }),
      prisma.paiement.aggregate({
        where: { etablissementId, statut: { in: ['IMPAYE', 'PARTIEL'] } },
        _sum: { montant: true, montantPaye: true },
        _count: { _all: true }
      }),
      prisma.etudiant.count({ where: { etablissementId, statut: 'ACTIF' } })
    ]);

    res.json({
      paiementsAujourdhui: paiementsAujourdhui._sum.montantPaye || 0,
      nbPaiementsAujourdhui: paiementsAujourdhui._count._all,
      absentsAujourdhui,
      impayes: (impayes._sum.montant || 0) - (impayes._sum.montantPaye || 0),
      nbImpayes: impayes._count._all,
      totalEtudiants
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getSuperAdminStats, getDirecteurStats, getProfesseurStats, getSecretaireStats };
