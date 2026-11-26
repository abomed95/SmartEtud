// Score de risque de décrochage — modèle explicable (pas de boîte noire).
//
// score = 100 × (0,45·R_notes + 0,35·R_assiduité + 0,20·R_finances), chaque R ∈ [0,1]
//   R_notes     = clamp((12 − moyenne) / 6)      → 0 si moyenne ≥ 12, 1 si ≤ 6
//   R_assiduité = clamp(absences_non_justifiées / 10) (+ retards comptés pour 1/3)
//   R_finances  = clamp(reste_à_payer / montant_dû)
// Niveaux : < 30 FAIBLE, 30–59 MOYEN, ≥ 60 ÉLEVÉ.
// Les poids sont des valeurs de départ à recalibrer sur l'historique réel (régression
// logistique sur les abandons constatés) dès qu'on dispose d'une année de données.
const prisma = require('./prisma');
const { calculerMoyenne, formatMontant } = require('./helpers');

const clamp = (x) => Math.max(0, Math.min(1, x));

const scoreDepuisIndicateurs = ({ moyenne, nbNotes, absencesNJ, retards, du, paye }) => {
  const rNotes = nbNotes > 0 ? clamp((12 - moyenne) / 6) : 0.3; // pas de note = incertitude modérée
  const rAssid = clamp((absencesNJ + retards / 3) / 10);
  const rFin = du > 0 ? clamp((du - paye) / du) : 0;
  const score = Math.round(100 * (0.45 * rNotes + 0.35 * rAssid + 0.2 * rFin));
  const niveau = score >= 60 ? 'ELEVE' : score >= 30 ? 'MOYEN' : 'FAIBLE';

  const facteurs = [];
  if (nbNotes > 0 && moyenne < 10) facteurs.push(`Moyenne faible (${moyenne.toFixed(2)}/20)`);
  if (absencesNJ >= 3) facteurs.push(`${absencesNJ} absences non justifiées`);
  if (retards >= 5) facteurs.push(`${retards} retards`);
  if (du > 0 && paye < du) facteurs.push(`Reste à payer : ${formatMontant(du - paye)}`);
  if (nbNotes === 0) facteurs.push('Aucune note enregistrée');

  // Moyenne cible : note minimale à viser sur les prochaines évaluations pour
  // remonter à 10 en supposant autant de nouvelles notes que d'existantes.
  const moyenneCible = nbNotes > 0 && moyenne < 10 ? Math.min(20, +(20 - moyenne).toFixed(2)) : null;

  return { score, niveau, facteurs, moyenneCible, detail: { rNotes, rAssid, rFin } };
};

/** Calcule le risque pour une liste d'étudiants (2 requêtes groupées + notes). */
const calculerRisques = async (etudiantIds) => {
  if (!etudiantIds.length) return {};
  const [notes, absences, paiements] = await Promise.all([
    prisma.note.findMany({
      where: { etudiantId: { in: etudiantIds } },
      select: { etudiantId: true, matiereId: true, valeur: true, matiere: { select: { id: true, coefficient: true } } }
    }),
    prisma.absence.groupBy({
      by: ['etudiantId', 'type', 'justifiee'],
      where: { etudiantId: { in: etudiantIds }, type: { in: ['ABSENCE', 'RETARD'] } },
      _count: { _all: true }
    }),
    prisma.paiement.groupBy({
      by: ['etudiantId'],
      where: { etudiantId: { in: etudiantIds } },
      _sum: { montant: true, montantPaye: true }
    })
  ]);

  const res = {};
  for (const id of etudiantIds) {
    const n = notes.filter((x) => x.etudiantId === id);
    const matieres = [...new Map(n.map((x) => [x.matiereId, x.matiere])).values()];
    const moyenne = calculerMoyenne(n, matieres);
    const abs = absences.filter((a) => a.etudiantId === id);
    const absencesNJ = abs.filter((a) => a.type === 'ABSENCE' && !a.justifiee).reduce((s, a) => s + a._count._all, 0);
    const retards = abs.filter((a) => a.type === 'RETARD').reduce((s, a) => s + a._count._all, 0);
    const p = paiements.find((x) => x.etudiantId === id);
    res[id] = {
      moyenne, nbNotes: n.length, absencesNJ, retards,
      ...scoreDepuisIndicateurs({
        moyenne, nbNotes: n.length, absencesNJ, retards,
        du: p?._sum.montant || 0, paye: p?._sum.montantPaye || 0
      })
    };
  }
  return res;
};

module.exports = { calculerRisques, scoreDepuisIndicateurs };
