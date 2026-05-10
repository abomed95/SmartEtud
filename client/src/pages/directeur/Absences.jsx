import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, AlertTriangle } from 'lucide-react';
import { absenceAPI, etudiantAPI, filiereAPI } from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loader';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPE_BADGE = { PRESENCE: 'badge-success', ABSENCE: 'badge-danger', RETARD: 'badge-warning' };
const TYPE_LABEL = { PRESENCE: '✓ Présent', ABSENCE: '✗ Absent', RETARD: '~ Retard' };

export default function Absences() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await absenceAPI.getAll({
        date: filterDate || undefined,
        type: filterType || undefined
      });
      setAbsences(data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, [filterDate, filterType]);

  useEffect(() => { load(); }, [load]);

  const filtered = absences.filter(a => {
    if (!search) return true;
    const name = `${a.etudiant?.nom} ${a.etudiant?.prenom}`.toLowerCase();
    return name.includes(search.toLowerCase()) || a.etudiant?.matricule?.includes(search);
  });

  const stats = {
    total: absences.length,
    absences: absences.filter(a => a.type === 'ABSENCE').length,
    retards: absences.filter(a => a.type === 'RETARD').length,
    presences: absences.filter(a => a.type === 'PRESENCE').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Assiduité</h1>
        <p className="text-slate-500 text-sm mt-1">Suivi des présences et absences</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'bg-blue-50 text-blue-700' },
          { label: 'Absences', value: stats.absences, color: 'bg-red-50 text-red-700' },
          { label: 'Retards', value: stats.retards, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Présences', value: stats.presences, color: 'bg-green-50 text-green-700' }
        ].map(s => (
          <div key={s.label} className={`card p-4 text-center ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un étudiant..." className="input-field pl-9" />
        </div>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="input-field sm:w-44" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field sm:w-40">
          <option value="">Tous les types</option>
          <option value="ABSENCE">Absences</option>
          <option value="RETARD">Retards</option>
          <option value="PRESENCE">Présences</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Calendar} title="Aucune donnée" description="Aucune absence trouvée pour ces critères" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-header">Étudiant</th>
                  <th className="table-header hidden sm:table-cell">Filière</th>
                  <th className="table-header">Type</th>
                  <th className="table-header hidden md:table-cell">Matière</th>
                  <th className="table-header">Date</th>
                  <th className="table-header hidden lg:table-cell">Justifiée</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((abs, i) => (
                  <motion.tr key={abs.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-sm text-slate-900">{abs.etudiant?.nom} {abs.etudiant?.prenom}</p>
                        <p className="text-xs text-slate-400 font-mono">{abs.etudiant?.matricule}</p>
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-slate-500 text-sm">{abs.etudiant?.filiere?.nom}</td>
                    <td className="table-cell"><span className={TYPE_BADGE[abs.type]}>{TYPE_LABEL[abs.type]}</span></td>
                    <td className="table-cell hidden md:table-cell text-slate-500 text-sm">{abs.matiere?.nom || '—'}</td>
                    <td className="table-cell text-slate-600 text-sm">
                      {format(new Date(abs.date), 'dd/MM/yyyy', { locale: fr })}
                    </td>
                    <td className="table-cell hidden lg:table-cell">
                      <span className={abs.justifiee ? 'badge-success' : 'badge-gray'}>{abs.justifiee ? 'Oui' : 'Non'}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
