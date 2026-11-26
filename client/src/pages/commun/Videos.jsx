import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, PlayCircle, Search, Trash2, Link2, Upload, CheckCircle2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { videoAPI, filiereAPI, matiereAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Segmented from '../../components/ui/Segmented';
import EmptyState from '../../components/ui/EmptyState';
import VideoPlayer from '../../components/video/VideoPlayer';
import { Spinner } from '../../components/ui/Loader';
import { formatDuree, formatDate } from '../../utils/helpers';

const MAX_MO = 500;

/** Vidéothèque : cours en vidéo par filière / matière, avec suivi de progression. */
export default function Videos() {
  const { user } = useAuth();
  const isEtudiant = user.role === 'ETUDIANT';
  const peutPublier = ['DIRECTEUR', 'PROFESSEUR', 'SUPER_ADMIN'].includes(user.role);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lecture, setLecture] = useState(null);
  const [ajout, setAjout] = useState(false);
  const [suppression, setSuppression] = useState(null);
  const [mode, setMode] = useState('lien');
  const [fichier, setFichier] = useState(null);
  const [progress, setProgress] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const filiereChoisie = watch('filiereId');

  const load = useCallback(async () => {
    try { setVideos(await videoAPI.getAll({ search: search || undefined })); }
    catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    if (!peutPublier) return;
    Promise.all([filiereAPI.getAll(), matiereAPI.getAll()]).then(([f, m]) => {
      setFilieres(f);
      // un enseignant ne publie que pour ses matières
      const mesIds = user.professeur?.matieres?.map((x) => x.matiereId);
      setMatieres(user.role === 'PROFESSEUR' ? m.filter((x) => mesIds?.includes(x.id)) : m);
    }).catch(() => {});
  }, [peutPublier, user]);

  const matieresFiltrees = useMemo(
    () => (filiereChoisie ? matieres.filter((m) => m.filiereId === filiereChoisie) : matieres),
    [matieres, filiereChoisie]
  );

  const publier = async (data) => {
    try {
      let payload = { titre: data.titre, description: data.description, filiereId: data.filiereId || null, matiereId: data.matiereId || null };
      if (mode === 'fichier') {
        if (!fichier) return toast.error('Choisissez un fichier vidéo');
        if (fichier.size > MAX_MO * 1024 * 1024) return toast.error(`Taille maximale : ${MAX_MO} Mo`);
        setProgress(0);
        const objectName = await videoAPI.envoyerFichier(fichier, setProgress);
        payload = { ...payload, objectName };
      } else {
        payload = { ...payload, url: data.url };
      }
      await videoAPI.create(payload);
      toast.success('Vidéo publiée');
      setAjout(false); reset(); setFichier(null); load();
    } catch (e) {
      toast.error(e.error || 'Échec de la publication');
    } finally { setProgress(null); }
  };

  const supprimer = async () => {
    try { await videoAPI.remove(suppression.id); toast.success('Vidéo supprimée'); setSuppression(null); load(); }
    catch (e) { toast.error(e.error || 'Erreur'); }
  };

  const peutSupprimer = (v) => ['DIRECTEUR', 'SUPER_ADMIN'].includes(user.role) || v.auteur?.id === user.id;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Vidéothèque"
        title={isEtudiant ? 'Cours vidéo' : 'Vidéothèque'}
        subtitle={isEtudiant ? 'Revoyez vos cours à votre rythme, même hors du campus.' : 'Publiez vos cours en vidéo pour vos étudiants.'}
        actions={peutPublier && <button onClick={() => setAjout(true)} className="btn-primary"><Plus size={18} /> Ajouter une vidéo</button>}
      />

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un cours" className="input-field pl-10" />
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size={26} className="text-slate-400" /></div> : videos.length === 0 ? (
        <div className="card"><EmptyState icon={PlayCircle} title="Aucune vidéo" description={peutPublier ? 'Publiez un lien YouTube/Vimeo ou envoyez un fichier.' : 'Vos enseignants n\'ont pas encore publié de cours.'} /></div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {videos.map((v) => (
            <div key={v.id} className="group card overflow-hidden flex flex-col">
              <button onClick={() => setLecture(v)} className="relative aspect-video bg-gradient-to-br from-primary-600 to-[#5856D6] overflow-hidden" aria-label={`Lire ${v.titre}`}>
                {v.miniature && <img src={v.miniature} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <PlayCircle size={30} />
                  </span>
                </span>
                {formatDuree(v.dureeSecondes) && <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-medium tabular">{formatDuree(v.dureeSecondes)}</span>}
                {isEtudiant && v.progression !== null && (
                  <span className="absolute bottom-0 inset-x-0 h-1 bg-white/30"><span className="block h-full bg-danger" style={{ width: `${v.progression}%` }} /></span>
                )}
              </button>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2">{v.titre}</p>
                  {v.terminee && <CheckCircle2 size={18} className="text-success flex-shrink-0" aria-label="Terminée" />}
                </div>
                <p className="text-[13px] text-slate-500 mt-1">{v.matiere?.nom || v.filiere?.nom || 'Tous les étudiants'}</p>
                <div className="flex items-center gap-3 mt-auto pt-3 text-[12px] text-slate-400">
                  <span>{v.auteur ? `${v.auteur.prenom || ''} ${v.auteur.nom}` : ''}</span>
                  <span className="ml-auto flex items-center gap-1"><Eye size={13} />{v.vues}</span>
                  {!isEtudiant && peutSupprimer(v) && (
                    <button onClick={() => setSuppression(v)} className="icon-btn !w-7 !h-7 hover:!text-danger" aria-label="Supprimer"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!lecture} onClose={() => { setLecture(null); load(); }} title={lecture?.titre || ''} size="xl">
        {lecture && (
          <div className="space-y-3">
            <VideoPlayer video={lecture} />
            <p className="text-[13px] text-slate-400">{lecture.matiere?.nom || lecture.filiere?.nom || 'Tous'} · publiée le {formatDate(lecture.createdAt)}</p>
            {lecture.description && <p className="text-[15px] text-slate-700 whitespace-pre-wrap">{lecture.description}</p>}
          </div>
        )}
      </Modal>

      <Modal isOpen={ajout} onClose={() => progress === null && setAjout(false)} title="Ajouter une vidéo">
        <form onSubmit={handleSubmit(publier)} className="space-y-4">
          <Segmented value={mode} onChange={setMode} className="w-full grid grid-cols-2"
            options={[{ value: 'lien', label: 'Lien YouTube / Vimeo' }, { value: 'fichier', label: 'Fichier' }]} />
          <div>
            <label className="block text-[13px] font-medium mb-1.5">Titre</label>
            <input {...register('titre', { required: 'Titre requis', maxLength: 200 })} className="input-field" placeholder="Ex. : Chapitre 3 — Les jointures SQL" />
            {errors.titre && <p className="text-danger text-[12px] mt-1">{errors.titre.message}</p>}
          </div>
          {mode === 'lien' ? (
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Lien</label>
              <div className="relative">
                <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('url', { required: mode === 'lien' && 'Lien requis' })} className="input-field pl-10" placeholder="https://youtu.be/…" inputMode="url" />
              </div>
              <p className="text-[12px] text-slate-400 mt-1">Conseil : une vidéo YouTube « non répertoriée » évite les coûts d'hébergement et de bande passante.</p>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-separator cursor-pointer hover:bg-slate-400/5">
              <Upload size={24} className="text-primary-600" />
              <span className="text-[14px] text-slate-700 text-center">{fichier ? `${fichier.name} — ${(fichier.size / 1048576).toFixed(1)} Mo` : `MP4, WebM ou MOV — ${MAX_MO} Mo max`}</span>
              <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(e) => setFichier(e.target.files?.[0] || null)} />
            </label>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Filière</label>
              <select {...register('filiereId')} className="input-field">
                <option value="">Toutes</option>
                {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5">Matière</label>
              <select {...register('matiereId')} className="input-field">
                <option value="">—</option>
                {matieresFiltrees.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} className="input-field" />
          </div>
          {progress !== null && (
            <div>
              <div className="h-2 rounded-full bg-slate-400/15 overflow-hidden"><div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} /></div>
              <p className="text-[12px] text-slate-500 mt-1 text-center">Envoi… {progress} %</p>
            </div>
          )}
          <button disabled={progress !== null} className="btn-primary w-full min-h-[48px]">{progress !== null ? <Spinner className="text-white" /> : 'Publier'}</button>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!suppression} onClose={() => setSuppression(null)} onConfirm={supprimer}
        title="Supprimer la vidéo ?" message={`« ${suppression?.titre} » ne sera plus accessible aux étudiants.`} />
    </div>
  );
}
