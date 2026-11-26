import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PageLoader from './components/ui/Loader';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';

// Découpage du code par page : premier chargement plus léger sur les connexions mobiles
const Profil = lazy(() => import('./pages/Profil'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/Dashboard'));
const Etablissements = lazy(() => import('./pages/superadmin/Etablissements'));
const Utilisateurs = lazy(() => import('./pages/superadmin/Utilisateurs'));
const DirecteurDashboard = lazy(() => import('./pages/directeur/Dashboard'));
const Etudiants = lazy(() => import('./pages/directeur/Etudiants'));
const Professeurs = lazy(() => import('./pages/directeur/Professeurs'));
const Secretaires = lazy(() => import('./pages/directeur/Secretaires'));
const Filieres = lazy(() => import('./pages/directeur/Filieres'));
const Matieres = lazy(() => import('./pages/directeur/Matieres'));
const Paiements = lazy(() => import('./pages/directeur/Paiements'));
const DirecteurAbsences = lazy(() => import('./pages/directeur/Absences'));
const ProfesseurDashboard = lazy(() => import('./pages/professeur/Dashboard'));
const Notes = lazy(() => import('./pages/professeur/Notes'));
const ProfesseurAbsences = lazy(() => import('./pages/professeur/Absences'));
const SecretaireDashboard = lazy(() => import('./pages/secretaire/Dashboard'));
const EtudiantDashboard = lazy(() => import('./pages/etudiant/Dashboard'));
const MesNotes = lazy(() => import('./pages/etudiant/MesNotes'));
const Requetes = lazy(() => import('./pages/commun/Requetes'));
const Videos = lazy(() => import('./pages/commun/Videos'));
const Alertes = lazy(() => import('./pages/commun/Alertes'));
const Rapports = lazy(() => import('./pages/commun/Rapports'));

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const DashboardRouter = () => {
  const { user } = useAuth();
  switch (user?.role) {
    case 'SUPER_ADMIN': return <SuperAdminDashboard />;
    case 'DIRECTEUR': return <DirecteurDashboard />;
    case 'PROFESSEUR': return <ProfesseurDashboard />;
    case 'SECRETAIRE': return <SecretaireDashboard />;
    case 'ETUDIANT': return <EtudiantDashboard />;
    default: return <Navigate to="/login" replace />;
  }
};

const AbsencesRouter = () => {
  const { user } = useAuth();
  return user?.role === 'PROFESSEUR' ? <ProfesseurAbsences /> : <DirecteurAbsences />;
};

const NotFound = () => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 p-6">
    <div className="text-center">
      <p className="text-[80px] font-bold text-slate-200 leading-none">404</p>
      <p className="text-[17px] text-slate-500 mt-2 mb-6">Cette page n'existe pas.</p>
      <Link to="/dashboard" className="btn-primary">Retour à l'accueil</Link>
    </div>
  </div>
);

const R = (roles, el) => <PrivateRoute allowedRoles={roles}>{el}</PrivateRoute>;
const STAFF = ['DIRECTEUR', 'SECRETAIRE', 'PROFESSEUR', 'SUPER_ADMIN'];

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="dashboard" element={<DashboardRouter />} />
          <Route path="profil" element={<Profil />} />

          <Route path="etablissements" element={R(['SUPER_ADMIN'], <Etablissements />)} />
          <Route path="utilisateurs" element={R(['SUPER_ADMIN'], <Utilisateurs />)} />

          <Route path="etudiants" element={R(['DIRECTEUR', 'SECRETAIRE'], <Etudiants />)} />
          <Route path="professeurs" element={R(['DIRECTEUR'], <Professeurs />)} />
          <Route path="secretaires" element={R(['DIRECTEUR'], <Secretaires />)} />
          <Route path="filieres" element={R(['DIRECTEUR'], <Filieres />)} />
          <Route path="matieres" element={R(['DIRECTEUR'], <Matieres />)} />
          <Route path="paiements" element={R(['DIRECTEUR', 'SECRETAIRE'], <Paiements />)} />
          <Route path="absences" element={R(['DIRECTEUR', 'SECRETAIRE', 'PROFESSEUR'], <AbsencesRouter />)} />
          <Route path="notes" element={R(['PROFESSEUR', 'DIRECTEUR'], <Notes />)} />
          <Route path="rapports" element={R(['DIRECTEUR', 'SECRETAIRE'], <Rapports />)} />
          <Route path="alertes" element={R(STAFF, <Alertes />)} />

          <Route path="requetes" element={R(['DIRECTEUR', 'SECRETAIRE', 'ETUDIANT'], <Requetes />)} />
          <Route path="videos" element={R([...STAFF, 'ETUDIANT'], <Videos />)} />
          <Route path="mes-notes" element={R(['ETUDIANT'], <MesNotes />)} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
