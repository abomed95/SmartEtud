import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Loader';
import { LogoMark } from '../../components/brand/Logo';
import { BRAND } from '../../config/brand';

// Comptes de démo affichés uniquement en développement ou si VITE_DEMO=true
const DEMO = import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true';
const DEMO_ACCOUNTS = [
  ['Étudiant', 'etudiant@unefd.dj', 'Etudiant@2025!'],
  ['Enseignant', 'ahmed.ibrahim@unefd.dj', 'Prof@2025!'],
  ['Secrétariat', 'secretariat@unefd.dj', 'Secret@2025!'],
  ['Direction', 'directeur@unefd.dj', 'Directeur@2025!'],
  ['Super Admin', 'admin@aqoon.dj', 'Admin@2025!'],
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success(`Bienvenue, ${user.prenom || user.nom}`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.error || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col">
      {/* Bandeau discret aux couleurs du drapeau */}
      <div className="h-1 flex"><div className="flex-[62] bg-dj-blue" /><div className="flex-[38] bg-dj-green" /></div>

      <div className="flex-1 flex items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[380px]"
        >
          <div className="text-center mb-8">
            <LogoMark size={76} className="mx-auto mb-5 rounded-[22%] shadow-xl shadow-primary-600/20" />
            <h1 className="text-[34px] font-bold text-slate-900 tracking-tight">{BRAND.nom} <span className="text-primary-600">{BRAND.organisation}</span></h1>
            <p className="text-[17px] text-slate-500 mt-1">{BRAND.slogan}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Champs groupés comme dans Réglages iOS */}
            <div className="card overflow-hidden">
              <label className="sr-only" htmlFor="email">Adresse email</label>
              <input
                id="email" type="email" autoComplete="username" placeholder="Adresse email"
                {...register('email', { required: 'Email requis', pattern: { value: /\S+@\S+\.\S+/, message: 'Email invalide' } })}
                className="w-full px-4 h-[52px] bg-transparent text-[17px] text-slate-900 placeholder-slate-400 focus:outline-none border-b border-separator/60"
              />
              <div className="relative">
                <label className="sr-only" htmlFor="password">Mot de passe</label>
                <input
                  id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Mot de passe"
                  {...register('password', { required: 'Mot de passe requis' })}
                  className="w-full px-4 pr-12 h-[52px] bg-transparent text-[17px] text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 icon-btn"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {(errors.email || errors.password) && (
              <p className="text-danger text-[13px] mt-2 px-4">{errors.email?.message || errors.password?.message}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full min-h-[50px] text-[17px] mt-5">
              {loading ? <Spinner size={18} className="text-white" /> : <>Se connecter <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-[13px] text-slate-400 mt-4">
            Mot de passe oublié ? Contactez le secrétariat de votre établissement.
          </p>

          {DEMO && (
            <div className="mt-8">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-4 mb-1.5">Comptes de démonstration</p>
              <div className="card overflow-hidden">
                {DEMO_ACCOUNTS.map(([role, email, pwd]) => (
                  <button key={email} type="button"
                    onClick={() => { setValue('email', email); setValue('password', pwd); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 border-b border-separator/40 last:border-0 text-left hover:bg-slate-400/5">
                    <span className="text-[15px] text-slate-900">{role}</span>
                    <span className="text-[13px] text-slate-400 font-mono truncate ml-3">{email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-[12px] text-slate-400 mt-8">© {BRAND.annee} {BRAND.complet} · {BRAND.pays}</p>
        </motion.div>
      </div>
    </div>
  );
}
