// Portail étudiant : tout le dossier en une requête (tableau de bord mobile-first).
const prisma = require('../utils/prisma');
const { ah, currentEtudiant } = require('../utils/scope');
const { buildBulletin } = require('./note.controller');
const { calculerRisques } = require('../utils/risque');

/** Dossier complet de l'étudiant connecté — réutilisé par l'assistant IA. */
const dossierEtudiant = async (user) => {
  const etudiant = await currentEtudiant(user, {
    filiere: { select: { id: true, nom: true } },
    niveau: { select: { id: true, nom: true } },
    etablissement: { select: { id: true, nom: true, telephone: true, email: true } }
  });
  const [bulletin, absences, paiements, requetes, risques, videos] = await Promise.all([
    buildBulletin(etudiant.id),
    prisma.absence.findMany({
      where: { etudiantId: etudiant.id, type: { in: ['ABSENCE', 'RETARD'] } },
      include: { matiere: { select: { nom: true } } }, orderBy: { date: 'desc' }, take: 50
    }),
    prisma.paiement.findMany({ where: { etudiantId: etudiant.id }, orderBy: { createdAt: 'desc' } }),
    prisma.requete.groupBy({ by: ['statut'], where: { etudiantId: etudiant.id }, _count: { _all: true } }),
    calculerRisques([etudiant.id]),
    prisma.video.count({
      where: { etablissementId: etudiant.etablissementId, publiee: true, OR: [{ filiereId: null }, { filiereId: etudiant.filiereId }] }
    })
  ]);

  // Évolution : moyenne glissante par mois (pour la courbe du tableau de bord)
  const parMois = {};
  bulletin.notes.forEach((n) => {
    const k = new Date(n.createdAt).toISOString().slice(0, 7);
    (parMois[k] ||= []).push(n.valeur);
  });
  const evolution = Object.entries(parMois).sort(([a], [b]) => a.localeCompare(b))
    .map(([mois, v]) => ({ mois, moyenne: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) }));

  const du = paiements.reduce((s, p) => s + p.montant, 0);
  const paye = paiements.reduce((s, p) => s + p.montantPaye, 0);
  const { userId, ...etu } = etudiant;

  return {
    etudiant: etu,
    bulletin: { detailMatieres: bulletin.detailMatieres, moyenneGenerale: bulletin.moyenneGenerale, appreciation: bulletin.appreciation },
    evolution,
    assiduite: {
      absences: absences.filter((a) => a.type === 'ABSENCE').length,
      nonJustifiees: absences.filter((a) => a.type === 'ABSENCE' && !a.justifiee).length,
      retards: absences.filter((a) => a.type === 'RETARD').length,
      recentes: absences.slice(0, 8)
    },
    finances: { du, paye, reste: du - paye, paiements },
    requetes: Object.fromEntries(requetes.map((r) => [r.statut, r._count._all])),
    risque: risques[etudiant.id],
    videosDisponibles: videos
  };
};

const getDossier = ah(async (req, res) => res.json(await dossierEtudiant(req.user)));

module.exports = { getDossier, dossierEtudiant };
