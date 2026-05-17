import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Lock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Spinner } from '../components/ui/Loader';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Administrateur', DIRECTEUR: 'Directeur', PROFESSEUR: 'Professeur', SECRETAIRE: 'Secrétaire'
};

export default function Profil() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const watchNew = watch('newPassword');

  const onChangePassword = async (data) => {
    setSaving(true);
    try {
      await authAPI.changePassword(data);
      toast.success('Mot de passe modifié avec succès !');
      reset();
    } catch (err) { toast.error(err.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="page-title">Mon Profil</h1>
        <p className="text-slate-500 text-sm mt-1">Gérez vos informations personnelles</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-2xl">
            {user?.nom?.charAt(0)}{user?.prenom?.charAt(0) || ''}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.nom} {user?.prenom}</h2>
            <p className="text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Shield size={14} className="text-primary-600" />
              <span className="text-sm font-medium text-primary-600">{ROLE_LABELS[user?.role]}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Téléphone</p>
            <p className="text-sm font-medium text-slate-900">{user?.telephone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Établissement</p>
            <p className="text-sm font-medium text-slate-900">{user?.etablissement?.nom || 'Global'}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-slate-600" />
          <h2 className="section-title">Changer le mot de passe</h2>
        </div>
        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel *</label>
            <input {...register('currentPassword', { required: 'Requis' })} type="password" className="input-field" placeholder="••••••••" />
            {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe *</label>
            <input {...register('newPassword', { required: 'Requis', minLength: { value: 6, message: 'Min 6 caractères' } })} type="password" className="input-field" placeholder="••••••••" />
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer *</label>
            <input {...register('confirm', {
              required: 'Requis',
              validate: v => v === watchNew || 'Les mots de passe ne correspondent pas'
            })} type="password" className="input-field" placeholder="••••••••" />
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner size={16} className="text-white" /> : <Lock size={16} />}
            {saving ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
