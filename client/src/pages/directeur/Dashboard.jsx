import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Users, BookOpen, CreditCard, Calendar, AlertTriangle, TrendingUp, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { statsAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import { Spinner } from '../../components/ui/Loader';

export default function DirecteurDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.getDirecteur()
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} className="text-primary-600" />
    </div>
  );

  const chartData = stats?.paiementsMois?.slice().reverse().map(p => ({
    name: `${p.mois || ''} ${p.annee || ''}`.trim() || 'N/A',
    revenus: p._sum?.montantPaye || 0
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Tableau de bord</h1>
        <p className="text-slate-500 text-sm mt-1">Vue d'ensemble de votre établissement</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Étudiants" value={stats?.totalEtudiants || 0} icon={GraduationCap} color="blue" delay={0} />
        <StatCard title="Professeurs" value={stats?.totalProfs || 0} icon={Users} color="indigo" delay={0.1} />
        <StatCard title="Filières" value={stats?.totalFilieres || 0} icon={BookOpen} color="purple" delay={0.2} />
        <StatCard title="Absences" value={stats?.absencesCount || 0} icon={Calendar} color="red" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Revenus collectés</p>
              <p className="text-xl font-bold text-slate-900">{(stats?.revenus || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">FCFA</span></p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Impayés</p>
              <p className="text-xl font-bold text-red-600">{(stats?.impayes || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">FCFA</span></p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Taux de recouvrement</p>
              <p className="text-xl font-bold text-slate-900">
                {stats?.totalDu ? Math.round((stats.revenus / stats.totalDu) * 100) : 0}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="card p-6 lg:col-span-2"
        >
          <h2 className="section-title mb-4">Évolution des paiements</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f1f5f9', fontSize: '12px' }}
                  formatter={v => [`${v.toLocaleString()} FCFA`, 'Revenus']}
                />
                <Bar dataKey="revenus" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-slate-400 text-sm">Pas encore de données</div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-yellow-500" />
            <h2 className="section-title">Top Étudiants</h2>
          </div>
          <div className="space-y-3">
            {stats?.topEtudiants?.length > 0 ? stats.topEtudiants.map((etu, i) => (
              <div key={etu.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{etu.nom} {etu.prenom}</p>
                  <p className="text-xs text-slate-400 truncate">{etu.filiere?.nom}</p>
                </div>
                <span className="text-sm font-bold text-primary-600">{etu.moyenne?.toFixed(2)}</span>
              </div>
            )) : (
              <p className="text-sm text-slate-400 text-center py-4">Pas de données</p>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/etudiants', label: 'Étudiants', icon: GraduationCap, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
          { to: '/professeurs', label: 'Professeurs', icon: Users, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
          { to: '/paiements', label: 'Paiements', icon: CreditCard, color: 'bg-green-50 text-green-700 hover:bg-green-100' },
          { to: '/absences', label: 'Absences', icon: Calendar, color: 'bg-red-50 text-red-700 hover:bg-red-100' }
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${item.color}`}
          >
            <item.icon size={24} />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
