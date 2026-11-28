import {
  LayoutDashboard, Building2, Users, GraduationCap, BookOpen, ClipboardList, CreditCard,
  CalendarCheck, FileText, UserCircle, School, Inbox, PlayCircle, ShieldAlert,
} from 'lucide-react';

// « tab: true » = affiché dans la barre d'onglets mobile (5 max, comme iOS)
export const NAV = {
  SUPER_ADMIN: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Accueil', tab: true },
    { path: '/etablissements', icon: Building2, label: 'Établissements', tab: true },
    { path: '/utilisateurs', icon: Users, label: 'Utilisateurs', tab: true },
  ],
  DIRECTEUR: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Accueil', tab: true },
    { path: '/etudiants', icon: GraduationCap, label: 'Étudiants', tab: true },
    { path: '/alertes', icon: ShieldAlert, label: 'Alertes', tab: true },
    { path: '/requetes', icon: Inbox, label: 'Requêtes', tab: true },
    { path: '/videos', icon: PlayCircle, label: 'Vidéothèque' },
    { path: '/professeurs', icon: Users, label: 'Enseignants' },
    { path: '/secretaires', icon: UserCircle, label: 'Secrétariat' },
    { path: '/filieres', icon: School, label: 'Filières' },
    { path: '/matieres', icon: BookOpen, label: 'Matières' },
    { path: '/paiements', icon: CreditCard, label: 'Paiements', tab: true },
    { path: '/absences', icon: CalendarCheck, label: 'Assiduité' },
    { path: '/rapports', icon: FileText, label: 'Bulletins' },
  ],
  PROFESSEUR: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Accueil', tab: true },
    { path: '/notes', icon: ClipboardList, label: 'Notes', tab: true },
    { path: '/absences', icon: CalendarCheck, label: 'Appel', tab: true },
    { path: '/videos', icon: PlayCircle, label: 'Vidéos', tab: true },
    { path: '/alertes', icon: ShieldAlert, label: 'Alertes', tab: true },
  ],
  SECRETAIRE: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Accueil', tab: true },
    { path: '/requetes', icon: Inbox, label: 'Requêtes', tab: true },
    { path: '/paiements', icon: CreditCard, label: 'Paiements', tab: true },
    { path: '/etudiants', icon: GraduationCap, label: 'Étudiants', tab: true },
    { path: '/absences', icon: CalendarCheck, label: 'Assiduité', tab: true },
    { path: '/alertes', icon: ShieldAlert, label: 'Alertes' },
  ],
  ETUDIANT: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Accueil', tab: true },
    { path: '/mes-notes', icon: ClipboardList, label: 'Notes', tab: true },
    { path: '/videos', icon: PlayCircle, label: 'Cours vidéo', tab: true },
    { path: '/requetes', icon: Inbox, label: 'Requêtes', tab: true },
  ],
};
