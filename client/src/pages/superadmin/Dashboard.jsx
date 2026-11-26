import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, GraduationCap, Activity, TrendingUp, Plus, Eye } from 'lucide-react';
import { statsAPI, etablissementAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import { Spinner } from '../../components/ui/Loader';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.getSuperAdmin()
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="text-slate-500 text-sm mt-1">Vue globale de la plateforme Aqoon UNEFD</p>
        </div>
        <Link to="/etablissements" className="btn-primary">
          <Plus size={18} />
          Nouvel établissement
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Établissements" value={stats?.totalEtabs || 0} icon={Building2} color="blue" delay={0} />
        <StatCard title="Établissements Actifs" value={stats?.etabsActifs || 0} icon={Activity} color="green" delay={0.1} />
        <StatCard title="Total Étudiants" value={stats?.totalEtudiants || 0} icon={GraduationCap} color="purple" delay={0.2} />
        <StatCard title="Utilisateurs" value={stats?.totalUsers || 0} icon={Users} color="indigo" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Établissements récents</h2>
            <Link to="/etablissements" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Voir tout <Eye size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentEtabs?.length > 0 ? stats.recentEtabs.map((etab, i) => (
              <motion.div
                key={etab.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{etab.nom}</p>
                  <p className="text-xs text-slate-400">{etab._count.etudiants} étudiant(s)</p>
                </div>
                <span className={`badge-${etab.statut === 'ACTIF' ? 'success' : 'danger'}`}>
                  {etab.statut}
                </span>
              </motion.div>
            )) : (
              <p className="text-sm text-slate-400 text-center py-8">Aucun établissement</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h2 className="section-title mb-4">Résumé de la plateforme</h2>
          <div className="space-y-4">
            {[
              { label: 'Établissements actifs', value: stats?.etabsActifs, total: stats?.totalEtabs, color: 'bg-green-500' },
              { label: 'Établissements suspendus', value: stats?.etabsSuspendus, total: stats?.totalEtabs, color: 'bg-red-500' }
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-slate-900">{item.value || 0}/{item.total || 0}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: item.total ? `${((item.value || 0) / item.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
            <Link to="/etablissements" className="btn-primary text-center">
              <Building2 size={16} />
              Établissements
            </Link>
            <Link to="/utilisateurs" className="btn-secondary text-center">
              <Users size={16} />
              Utilisateurs
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
