import { BRAND } from '../config/brand';

export const getAppreciation = (moyenne) => {
  if (moyenne >= 18) return { texte: 'Félicitations ! Travail exceptionnel, continuez sur cette belle lancée.', niveau: 'EXCELLENT' };
  if (moyenne >= 16) return { texte: 'Très bon travail ! Vos efforts portent leurs fruits.', niveau: 'TRES_BIEN' };
  if (moyenne >= 14) return { texte: 'Bon travail avec quelques efforts supplémentaires possibles.', niveau: 'BIEN' };
  if (moyenne >= 12) return { texte: 'Travail satisfaisant. Continuez à vous investir.', niveau: 'ASSEZ_BIEN' };
  if (moyenne >= 10) return { texte: 'Résultats passables. Des efforts supplémentaires sont nécessaires.', niveau: 'PASSABLE' };
  if (moyenne >= 8) return { texte: 'Résultats insuffisants. Un travail sérieux et régulier s\'impose.', niveau: 'INSUFFISANT' };
  return { texte: 'Résultats très insuffisants. Une remise en question sérieuse est nécessaire.', niveau: 'TRES_INSUFFISANT' };
};

/** Montant en francs Djibouti (FDJ / DJF). */
export const formatCurrency = (amount) => `${new Intl.NumberFormat('fr-FR').format(Math.round(amount || 0))} ${BRAND.devise}`;

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDuree = (s) => {
  if (!s) return null;
  const h = Math.floor(s / 3600); const m = Math.round((s % 3600) / 60);
  return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
};

/** Télécharge un blob (PDF) renvoyé par l'API. */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin', DIRECTEUR: 'Direction', PROFESSEUR: 'Enseignant', SECRETAIRE: 'Secrétariat', ETUDIANT: 'Étudiant',
};

export const REQUETE_TYPES = {
  ATTESTATION_INSCRIPTION: 'Attestation d\'inscription',
  CERTIFICAT_SCOLARITE: 'Certificat de scolarité',
  RELEVE_NOTES: 'Relevé de notes',
  RECLAMATION_NOTE: 'Réclamation de note',
  AUTRE: 'Autre demande',
};

export const REQUETE_STATUTS = {
  EN_ATTENTE: { label: 'En attente', badge: 'badge-warning' },
  EN_COURS: { label: 'En cours', badge: 'badge-info' },
  TRAITEE: { label: 'Traitée', badge: 'badge-success' },
  REJETEE: { label: 'Rejetée', badge: 'badge-danger' },
};

export const RISQUE = {
  ELEVE: { label: 'Élevé', badge: 'badge-danger', color: '#FF3B30' },
  MOYEN: { label: 'Moyen', badge: 'badge-warning', color: '#FF9500' },
  FAIBLE: { label: 'Faible', badge: 'badge-success', color: '#34C759' },
};
