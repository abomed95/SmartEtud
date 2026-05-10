import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, AlertTriangle, Users, Search, ArrowRight } from 'lucide-react';
import { statsAPI, etudiantAPI } from '../../services/api';
import { Spinner } from '../../components/ui/Loader';
import toast from 'react-hot-toast';

export default function SecretaireDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    statsAPI.getSecretaire()
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim() || search.length < 2) return;
    setSearching(true);
    try {
      const data = await etudiantAPI.getAll({ search });
      setResults(data);
    } catch { toast.error('Erreur'); }
    finally { setSearching(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} className="text-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Accueil Secrétariat</h1>
        <p className="text-slate-500 text-sm mt-1">Gestion rapide des paiements et de l'assiduité</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Paiements aujourd\'hui', value: `${(stats?.paiementsAujourdhui || 0).toLocaleString()} FCFA`, icon: CreditCard, color: 'bg-green-50 text-green-700', sub: `${stats?.nbPaiementsAujourdhui || 0} transaction(s)` },
          { label: 'Absents aujourd\'hui', value: stats?.absentsAujourdhui || 0, icon: Calendar, color: 'bg-red-50 text-red-700', sub: 'Absences du jour' },
          { label: 'Total impayé', value: `${(stats?.impayes || 0).toLocaleString()} FCFA`, icon: AlertTriangle, color: 'bg-yellow-50 text-yellow-700', sub: `${stats?.nbImpayes || 0} dossier(s)` },
          { label: 'Étudiants actifs', value: stats?.totalEtudiants || 0, icon: Users, color: 'bg-blue-50 text-blue-700', sub: 'Dans l\'établissement' }
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`card p-4 ${item.color}`}
          >
            <div className="flex items-start gap-3">
              <item.icon size={20} className="flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium opacity-70 mb-0.5">{item.label}</p>
                <p className="text-lg font-bold truncate">{item.value}</p>
                <p className="text-xs opacity-60">{item.sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <h2 className="section-title mb-4">🔍 Recherche rapide étudiant</h2>
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); if (!e.target.value) setResults([]); }}
              placeholder="Nom, téléphone, matricule..."
              className="input-field pl-11 py-3 text-base"
            />
          </div>
          <button type="submit" disabled={searching} className="btn-primary px-6 py-3">
            {searching ? <Spinner size={18} className="text-white" /> : 'Rechercher'}
          </button>
        </form>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(etu => (
              <div key={etu.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${etu.sexe === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                    {etu.nom.charAt(0)}{etu.prenom.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{etu.nom} {etu.prenom}</p>
                    <p className="text-xs text-slate-400">{etu.matricule} · {etu.filiere?.nom} · {etu.telephone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/paiements?etudiantId=${etu.id}`} className="btn-primary text-xs py-1.5 px-3">
                    <CreditCard size={13} />Paiement
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/paiements" className="card p-6 flex items-center justify-between hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard size={22} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Gestion Paiements</p>
              <p className="text-xs text-slate-400">Enregistrer & consulter</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        </Link>

        <Link to="/absences" className="card p-6 flex items-center justify-between hover:shadow-card-hover transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Calendar size={22} className="text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Assiduité</p>
              <p className="text-xs text-slate-400">Marquer présences</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
