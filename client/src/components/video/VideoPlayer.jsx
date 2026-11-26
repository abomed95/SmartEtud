import { useEffect, useRef, useState } from 'react';
import { videoAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/Loader';

/**
 * Lecteur : iframe YouTube/Vimeo, ou <video> HTML5 pour les fichiers hébergés.
 * Pour les fichiers, la progression est envoyée toutes les 15 s (étudiants uniquement).
 * Limite connue : la progression des vidéos YouTube/Vimeo n'est pas mesurée
 * (il faudrait intégrer leurs API JavaScript) — elle est marquée à l'ouverture.
 */
export default function VideoPlayer({ video }) {
  const { user } = useAuth();
  const [src, setSrc] = useState(null);
  const [erreur, setErreur] = useState(null);
  const lastSent = useRef(0);

  useEffect(() => {
    let actif = true;
    videoAPI.lecture(video.id)
      .then((r) => { if (actif) setSrc(r); })
      .catch((e) => actif && setErreur(e.error || 'Lecture impossible'));
    if (user?.role === 'ETUDIANT' && video.source !== 'FICHIER') videoAPI.progression(video.id, 10).catch(() => {});
    return () => { actif = false; };
  }, [video.id, video.source, user?.role]);

  const onTime = (e) => {
    if (user?.role !== 'ETUDIANT') return;
    const el = e.currentTarget;
    const now = Date.now();
    if (now - lastSent.current < 15000 && !el.ended) return;
    lastSent.current = now;
    videoAPI.progression(video.id, Math.round((el.currentTime / (el.duration || 1)) * 100)).catch(() => {});
  };

  if (erreur) return <div className="aspect-video rounded-2xl bg-black flex items-center justify-center text-white/70 text-sm">{erreur}</div>;
  if (!src) return <div className="aspect-video rounded-2xl bg-black flex items-center justify-center"><Spinner className="text-white/60" /></div>;

  return (
    <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-card">
      {src.type === 'iframe' ? (
        <iframe src={src.src} title={video.titre} className="w-full h-full" loading="lazy"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
      ) : (
        // preload="metadata" : économise la bande passante (forfaits mobiles à Djibouti)
        <video src={src.src} controls playsInline preload="metadata" className="w-full h-full" onTimeUpdate={onTime} onEnded={onTime} />
      )}
    </div>
  );
}
