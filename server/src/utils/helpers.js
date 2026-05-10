const generateMatricule = (prefix = 'ETU') => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${year}${random}`;
};

const generateReference = (prefix = 'PAY') => {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${ts}-${rand}`;
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

const calculerMoyenne = (notes, matieres) => {
  if (!notes || notes.length === 0) return 0;

  let totalPoints = 0;
  let totalCoeff = 0;

  const notesByMatiere = {};
  notes.forEach(n => {
    if (!notesByMatiere[n.matiereId]) notesByMatiere[n.matiereId] = [];
    notesByMatiere[n.matiereId].push(n.valeur);
  });

  Object.entries(notesByMatiere).forEach(([matiereId, vals]) => {
    const matiere = matieres?.find(m => m.id === matiereId);
    const coeff = matiere?.coefficient || 1;
    const moy = vals.reduce((a, b) => a + b, 0) / vals.length;
    totalPoints += moy * coeff;
    totalCoeff += coeff;
  });

  return totalCoeff > 0 ? Math.round((totalPoints / totalCoeff) * 100) / 100 : 0;
};

module.exports = { generateMatricule, generateReference, getAppreciation, calculerMoyenne };
