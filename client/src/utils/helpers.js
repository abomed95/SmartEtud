export const getAppreciation = (moyenne) => {
  if (moyenne >= 18) return { texte: 'Félicitations ! Travail exceptionnel, continuez sur cette belle lancée.', niveau: 'EXCELLENT' };
  if (moyenne >= 16) return { texte: 'Très bon travail ! Vos efforts portent leurs fruits.', niveau: 'TRES_BIEN' };
  if (moyenne >= 14) return { texte: 'Bon travail avec quelques efforts supplémentaires possibles.', niveau: 'BIEN' };
  if (moyenne >= 12) return { texte: 'Travail satisfaisant. Continuez à vous investir.', niveau: 'ASSEZ_BIEN' };
  if (moyenne >= 10) return { texte: 'Résultats passables. Des efforts supplémentaires sont nécessaires.', niveau: 'PASSABLE' };
  if (moyenne >= 8) return { texte: 'Résultats insuffisants. Un travail sérieux et régulier s\'impose.', niveau: 'INSUFFISANT' };
  return { texte: 'Résultats très insuffisants. Une remise en question sérieuse est nécessaire.', niveau: 'TRES_INSUFFISANT' };
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
