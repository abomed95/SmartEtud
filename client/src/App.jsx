import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PageLoader from './components/ui/Loader';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Profil from './pages/Profil';

import SuperAdminDashboard from './pages/superadmin/Dashboard';
import Etablissements from './pages/superadmin/Etablissements';
import Utilisateurs from './pages/superadmin/Utilisateurs';

import DirecteurDashboard from './pages/directeur/Dashboard';
import Etudiants from './pages/directeur/Etudiants';
import Professeurs from './pages/directeur/Professeurs';
import Secretaires from './pages/directeur/Secretaires';
import Filieres from './pages/directeur/Filieres';
import Matieres from './pages/directeur/Matieres';
import Paiements from './pages/directeur/Paiements';
import DirecteurAbsences from './pages/directeur/Absences';

import ProfesseurDashboard from './pages/professeur/Dashboard';
import Notes from './pages/professeur/Notes';
import ProfesseurAbsences from './pages/professeur/Absences';

import SecretaireDashboard from './pages/secretaire/Dashboard';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'SUPER_ADMIN': return <SuperAdminDashboard />;
    case 'DIRECTEUR': return <DirecteurDashboard />;
    case 'PROFESSEUR': return <ProfesseurDashboard />;
    case 'SECRETAIRE': return <SecretaireDashboard />;
    default: return <Navigate to="/login" replace />;
  }
};

const AbsencesRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'PROFESSEUR') return <ProfesseurAbsences />;
  return <DirecteurAbsences />;
};

const Rapports = () => (
  <div className="space-y-6">
    <h1 className="page-title">Rapports &amp; Bulletins</h1>
    <p className="text-slate-500">Générez des rapports PDF pour vos étudiants.</p>
    <div className="card p-8 text-center">
      <p className="text-slate-400">Accédez aux bulletins depuis la fiche individuelle de chaque étudiant via l'API PDF.</p>
    </div>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-slate-200 mb-4">404</h1>
      <p className="text-slate-500 mb-6">Page introuvable</p>
      <a href="/dashboard" className="btn-primary inline-flex">Retour au tableau de bord</a>
    </div>
  </div>
);

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <PageLoader />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard" element={<DashboardRouter />} />
        <Route path="profil" element={<Profil />} />

        <Route path="etablissements" element={
          <PrivateRoute allowedRoles={['SUPER_ADMIN']}><Etablissements /></PrivateRoute>
        } />
        <Route path="utilisateurs" element={
          <PrivateRoute allowedRoles={['SUPER_ADMIN']}><Utilisateurs /></PrivateRoute>
        } />

        <Route path="etudiants" element={
          <PrivateRoute allowedRoles={['DIRECTEUR', 'SECRETAIRE']}><Etudiants /></PrivateRoute>
        } />
        <Route path="professeurs" element={
          <PrivateRoute allowedRoles={['DIRECTEUR']}><Professeurs /></PrivateRoute>
        } />
        <Route path="secretaires" element={
          <PrivateRoute allowedRoles={['DIRECTEUR']}><Secretaires /></PrivateRoute>
        } />
        <Route path="filieres" element={
          <PrivateRoute allowedRoles={['DIRECTEUR']}><Filieres /></PrivateRoute>
        } />
        <Route path="matieres" element={
          <PrivateRoute allowedRoles={['DIRECTEUR']}><Matieres /></PrivateRoute>
        } />
        <Route path="paiements" element={
          <PrivateRoute allowedRoles={['DIRECTEUR', 'SECRETAIRE']}><Paiements /></PrivateRoute>
        } />
        <Route path="absences" element={
          <PrivateRoute allowedRoles={['DIRECTEUR', 'SECRETAIRE', 'PROFESSEUR']}><AbsencesRouter /></PrivateRoute>
        } />
        <Route path="notes" element={
          <PrivateRoute allowedRoles={['PROFESSEUR', 'DIRECTEUR']}><Notes /></PrivateRoute>
        } />
        <Route path="rapports" element={
          <PrivateRoute allowedRoles={['DIRECTEUR']}><Rapports /></PrivateRoute>
        } />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
