const crypto = require('crypto');

// Identifiants générés avec un RNG cryptographique (Math.random est prévisible).
const randDigits = (n) => {
  const max = 10 ** n;
  return crypto.randomInt(max / 10, max).toString();
};

const generateMatricule = (prefix = 'UNEFD') => {
  const year = new Date().getFullYear().toString().slice(-2);
  return `${prefix}${year}${randDigits(5)}`;
};

const generateReference = (prefix = 'PAY') => {
  const ts = Date.now().toString().slice(-8);
  return `${prefix}-${ts}-${randDigits(3)}`;
};

/** Mot de passe temporaire lisible (sans caractères ambigus). */
const generateTempPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += alphabet[crypto.randomInt(alphabet.length)];
  return `${out}!`;
};

const getAppreciation = (moyenne) => {
  if (moyenne >= 18) return { texte: 'Félicitations ! Travail exceptionnel, continuez sur cette belle lancée.', niveau: 'EXCELLENT' };
  if (moyenne >= 16) return { texte: 'Très bon travail ! Vos efforts portent leurs fruits.', niveau: 'TRES_BIEN' };
  if (moyenne >= 14) return { texte: 'Bon travail avec quelques efforts supplémentaires possibles.', niveau: 'BIEN' };
  if (moyenne >= 12) return { texte: 'Travail satisfaisant. Continuez à vous investir.', niveau: 'ASSEZ_BIEN' };
  if (moyenne >= 10) return { texte: 'Résultats passables. Des efforts supplémentaires sont nécessaires.', niveau: 'PASSABLE' };
  if (moyenne >= 8) return { texte: 'Résultats insuffisants. Un travail sérieux et régulier s\'impose.', niveau: 'INSUFFISANT' };
  return { texte: 'Résultats très insuffisants. Une remise en question sérieuse est nécessaire.', niveau: 'TRES_INSUFFISANT' };
};

/** Moyenne pondérée par coefficient : moyenne des notes par matière, puis Σ(moy·coeff)/Σcoeff. */
const calculerMoyenne = (notes, matieres) => {
  if (!notes || notes.length === 0) return 0;
  const byMat = {};
  notes.forEach((n) => { (byMat[n.matiereId] ||= []).push(n.valeur); });

  let totalPoints = 0;
  let totalCoeff = 0;
  Object.entries(byMat).forEach(([matiereId, vals]) => {
    const coeff = matieres?.find((m) => m?.id === matiereId)?.coefficient || 1;
    totalPoints += (vals.reduce((a, b) => a + b, 0) / vals.length) * coeff;
    totalCoeff += coeff;
  });
  return totalCoeff > 0 ? Math.round((totalPoints / totalCoeff) * 100) / 100 : 0;
};

/** Détail par matière (utilisé par bulletin JSON, PDF, portail, assistant). */
const detailParMatiere = (notes) => {
  const byMat = {};
  notes.forEach((n) => {
    (byMat[n.matiereId] ||= { matiere: n.matiere, notes: [] }).notes.push(n.valeur);
  });
  return Object.values(byMat).map((it) => ({
    matiere: it.matiere,
    notes: it.notes,
    moyenne: Math.round((it.notes.reduce((a, b) => a + b, 0) / it.notes.length) * 100) / 100
  }));
};

const formatMontant = (v, devise = process.env.DEVISE || 'FDJ') =>
  `${new Intl.NumberFormat('fr-FR').format(Math.round(v || 0)).replace(/ | /g, ' ')} ${devise}`;

module.exports = {
  generateMatricule, generateReference, generateTempPassword,
  getAppreciation, calculerMoyenne, detailParMatiere, formatMontant
};
