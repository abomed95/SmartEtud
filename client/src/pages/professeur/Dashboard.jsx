import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import { statsAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import { Spinner } from '../../components/ui/Loader';

export default function ProfesseurDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.getProfesseur()
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} className="text-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Mon Espace</h1>
        <p className="text-slate-500 text-sm mt-1">Bienvenue dans votre espace professeur</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard title="Notes saisies" value={stats?.totalNotes || 0} icon={ClipboardList} color="blue" delay={0} />
        <StatCard title="Moyenne classe" value={stats?.moyenneClasse?.toFixed(2) || '0.00'} icon={TrendingUp} color="green" delay={0.1} />
        <StatCard title="Absences" value={stats?.absencesCount || 0} icon={Calendar} color="red" delay={0.2} />
      </div>

      {stats?.matieres?.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">Mes matières</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.matieres.map((mat, i) => (
              <motion.div
                key={mat.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
              >
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900">{mat.nom}</p>
                  <p className="text-xs text-slate-400">Coefficient: {mat.coefficient}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link to="/notes" className="card p-6 flex flex-col items-center gap-3 hover:shadow-card-hover transition-shadow group">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <ClipboardList size={22} className="text-blue-600" />
          </div>
          <p className="font-semibold text-slate-900">Saisir des notes</p>
          <p className="text-xs text-slate-400 text-center">Enregistrer les résultats des étudiants</p>
        </Link>
        <Link to="/absences" className="card p-6 flex flex-col items-center gap-3 hover:shadow-card-hover transition-shadow group">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
            <Calendar size={22} className="text-red-600" />
          </div>
          <p className="font-semibold text-slate-900">Absences</p>
          <p className="text-xs text-slate-400 text-center">Gérer la présence en cours</p>
        </Link>
      </div>
    </div>
  );
}
