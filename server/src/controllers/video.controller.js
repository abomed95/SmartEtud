// Vidéothèque : cours vidéo (YouTube/Vimeo en lien, ou fichier hébergé) + suivi de progression.
const path = require('path');
const multer = require('multer');
const prisma = require('../utils/prisma');
const storage = require('../utils/storage');
const { maxVideoMo } = require('../config/env');
const { ah, HttpError, etabIdFor, assertSameEtab, currentEtudiant } = require('../utils/scope');

/** Extrait la source et l'identifiant d'un lien YouTube / Vimeo. */
const parseLienBrut = (url) => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return { source: 'YOUTUBE', id: u.pathname.slice(1) };
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const id = u.searchParams.get('v') || u.pathname.match(/\/(embed|shorts|live)\/([\w-]{6,})/)?.[2];
      if (id) return { source: 'YOUTUBE', id };
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.match(/(\d{6,})/)?.[1];
      if (id) return { source: 'VIMEO', id };
    }
  } catch { /* lien invalide */ }
  return null;
};
const parseLien = (url) => { const p = parseLienBrut(url); return p && /^[\w-]{6,20}$/.test(p.id) ? p : null; };

const embedUrl = (video) => {
  const p = parseLien(video.url);
  if (!p) return null;
  return p.source === 'YOUTUBE'
    ? `https://www.youtube-nocookie.com/embed/${p.id}?rel=0`
    : `https://player.vimeo.com/video/${p.id}`;
};

const miniature = (video) => {
  if (video.miniature) return video.miniature;
  const p = parseLien(video.url);
  return p?.source === 'YOUTUBE' ? `https://i.ytimg.com/vi/${p.id}/hqdefault.jpg` : null;
};

const include = {
  filiere: { select: { id: true, nom: true } },
  matiere: { select: { id: true, nom: true } },
  auteur: { select: { id: true, nom: true, prenom: true } }
};

const serialize = (v, vue) => ({
  ...v,
  url: v.source === 'FICHIER' ? undefined : v.url, // on n'expose jamais le chemin interne du bucket
  miniature: miniature(v),
  progression: vue?.progression ?? null,
  terminee: vue?.terminee ?? false
});

const loadVideo = async (user, id) => {
  const video = await prisma.video.findUnique({ where: { id }, include });
  if (!video) throw new HttpError(404, 'Vidéo introuvable');
  assertSameEtab(user, video.etablissementId);
  if (user.role === 'ETUDIANT') {
    const etu = await currentEtudiant(user);
    if (!video.publiee || (video.filiereId && video.filiereId !== etu.filiereId)) throw new HttpError(404, 'Vidéo introuvable');
    return { video, etudiant: etu };
  }
  return { video };
};

/** Seul l'auteur, le directeur de l'établissement ou le super admin peut modifier. */
const assertCanEdit = (user, video) => {
  if (['SUPER_ADMIN', 'DIRECTEUR'].includes(user.role)) return;
  if (user.role === 'PROFESSEUR' && video.auteurId === user.id) return;
  throw new HttpError(403, 'Vous ne pouvez modifier que vos propres vidéos');
};

const validateRattachement = async (user, etablissementId, { filiereId, matiereId }) => {
  if (filiereId) {
    const f = await prisma.filiere.findUnique({ where: { id: filiereId } });
    if (!f || f.etablissementId !== etablissementId) throw new HttpError(400, 'Filière invalide');
  }
  if (matiereId) {
    const m = await prisma.matiere.findUnique({ where: { id: matiereId }, include: { filiere: true } });
    if (!m || m.filiere.etablissementId !== etablissementId) throw new HttpError(400, 'Matière invalide');
    if (user.role === 'PROFESSEUR') {
      const ok = await prisma.professeurMatiere.findFirst({ where: { matiereId, professeur: { userId: user.id } } });
      if (!ok) throw new HttpError(403, 'Cette matière ne vous est pas affectée');
    }
    return m.filiereId;
  }
  return filiereId || null;
};

const getAll = ah(async (req, res) => {
  const { filiereId, matiereId, search } = req.query;
  const where = {};
  let etudiant = null;
  if (req.user.role === 'ETUDIANT') {
    etudiant = await currentEtudiant(req.user);
    where.etablissementId = etudiant.etablissementId;
    where.publiee = true;
    where.OR = [{ filiereId: null }, { filiereId: etudiant.filiereId }];
  } else {
    const etablissementId = etabIdFor(req);
    if (etablissementId) where.etablissementId = etablissementId;
    if (filiereId) where.filiereId = filiereId;
  }
  if (matiereId) where.matiereId = matiereId;
  if (search) where.titre = { contains: search, mode: 'insensitive' };

  const videos = await prisma.video.findMany({ where, include, orderBy: { createdAt: 'desc' }, take: 300 });
  let vues = [];
  if (etudiant) {
    vues = await prisma.videoVue.findMany({ where: { etudiantId: etudiant.id, videoId: { in: videos.map((v) => v.id) } } });
  }
  res.json(videos.map((v) => serialize(v, vues.find((x) => x.videoId === v.id))));
});

const create = ah(async (req, res) => {
  const { titre, description, url, objectName, filiereId, matiereId, dureeSecondes, publiee } = req.body;
  if (!titre || titre.length > 200) throw new HttpError(400, 'Titre requis (200 caractères max)');
  const etablissementId = etabIdFor(req);
  if (!etablissementId) throw new HttpError(400, 'Établissement requis');
  const filiereFinale = await validateRattachement(req.user, etablissementId, { filiereId, matiereId });

  let source; let stored;
  if (objectName) {
    // Fichier déjà envoyé : on vérifie qu'il est bien dans le dossier de cet établissement
    if (!objectName.startsWith(`videos/${etablissementId}/`) || !(await storage.objectExists(objectName))) {
      throw new HttpError(400, 'Fichier vidéo introuvable — relancez l\'envoi');
    }
    source = 'FICHIER'; stored = objectName;
  } else {
    const p = parseLien(url || '');
    if (!p) throw new HttpError(400, 'Lien YouTube ou Vimeo invalide');
    source = p.source; stored = url;
  }

  const video = await prisma.video.create({
    data: {
      titre, description, source, url: stored,
      dureeSecondes: dureeSecondes ? parseInt(dureeSecondes, 10) : null,
      publiee: publiee !== false,
      etablissementId, filiereId: filiereFinale, matiereId: matiereId || null, auteurId: req.user.id
    },
    include
  });
  res.status(201).json({ message: 'Vidéo publiée', video: serialize(video) });
});

const update = ah(async (req, res) => {
  const { video } = await loadVideo(req.user, req.params.id);
  assertCanEdit(req.user, video);
  const { titre, description, filiereId, matiereId, publiee } = req.body;
  const filiereFinale = (filiereId !== undefined || matiereId !== undefined)
    ? await validateRattachement(req.user, video.etablissementId, { filiereId, matiereId })
    : undefined;
  const updated = await prisma.video.update({
    where: { id: video.id },
    data: {
      titre, description, publiee,
      filiereId: filiereFinale,
      matiereId: matiereId === undefined ? undefined : (matiereId || null)
    },
    include
  });
  res.json({ message: 'Vidéo modifiée', video: serialize(updated) });
});

const remove = ah(async (req, res) => {
  const { video } = await loadVideo(req.user, req.params.id);
  assertCanEdit(req.user, video);
  await prisma.video.delete({ where: { id: video.id } });
  if (video.source === 'FICHIER') await storage.deleteObject(video.url);
  res.json({ message: 'Vidéo supprimée' });
});

/** Renvoie de quoi lire la vidéo : iframe (YouTube/Vimeo) ou URL signée temporaire. */
const lecture = ah(async (req, res) => {
  const { video } = await loadVideo(req.user, req.params.id);
  if (video.source === 'FICHIER') {
    return res.json({ type: 'fichier', src: await storage.signedReadUrl(video.url) });
  }
  res.json({ type: 'iframe', src: embedUrl(video) });
});

const progression = ah(async (req, res) => {
  const { video, etudiant } = await loadVideo(req.user, req.params.id);
  if (!etudiant) return res.json({ ok: true }); // le personnel ne génère pas de statistiques
  const p = Math.max(0, Math.min(100, parseInt(req.body.progression, 10) || 0));
  const existing = await prisma.videoVue.findUnique({ where: { videoId_etudiantId: { videoId: video.id, etudiantId: etudiant.id } } });
  await prisma.$transaction([
    prisma.videoVue.upsert({
      where: { videoId_etudiantId: { videoId: video.id, etudiantId: etudiant.id } },
      create: { videoId: video.id, etudiantId: etudiant.id, progression: p, terminee: p >= 90 },
      // la progression ne recule jamais (revoir le début ne doit pas effacer l'avancement)
      update: { progression: Math.max(p, existing?.progression || 0), terminee: (existing?.terminee || p >= 90) }
    }),
    ...(existing ? [] : [prisma.video.update({ where: { id: video.id }, data: { vues: { increment: 1 } } })])
  ]);
  res.json({ ok: true });
});

/** Statistiques de visionnage par vidéo (personnel). */
const stats = ah(async (req, res) => {
  const { video } = await loadVideo(req.user, req.params.id);
  const vues = await prisma.videoVue.findMany({
    where: { videoId: video.id },
    include: { etudiant: { select: { nom: true, prenom: true, matricule: true } } },
    orderBy: { progression: 'desc' }
  });
  res.json({ video: serialize(video), vues });
});

// --- Envoi de fichiers -------------------------------------------------------

/** Production : URL signée pour envoi direct navigateur → Cloud Storage. */
const uploadUrl = ah(async (req, res) => {
  const { contentType, taille } = req.body;
  if (!storage.VIDEO_TYPES[contentType]) throw new HttpError(400, 'Format accepté : MP4, WebM ou MOV');
  if (!(taille > 0) || taille > maxVideoMo * 1024 * 1024) throw new HttpError(400, `Taille maximale : ${maxVideoMo} Mo`);
  const etablissementId = etabIdFor(req);
  if (!etablissementId) throw new HttpError(400, 'Établissement requis');
  const objectName = storage.newObjectName(etablissementId, contentType);
  if (!storage.usesGcs) return res.json({ mode: 'local', objectName, uploadUrl: '/api/videos/upload' });
  res.json({ mode: 'gcs', objectName, uploadUrl: await storage.signedUploadUrl(objectName, contentType) });
});

/** Développement : envoi via le serveur (multipart). Désactivé quand GCS est configuré. */
const localUploader = multer({
  storage: multer.diskStorage({
    destination: storage.LOCAL_DIR,
    filename: (req, file, cb) => cb(null, path.basename(req.query.objectName || ''))
  }),
  limits: { fileSize: maxVideoMo * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = storage.VIDEO_TYPES[file.mimetype] &&
      req.query.objectName?.startsWith(`videos/${etabIdFor(req)}/`) &&
      /^[0-9a-f-]+\.(mp4|webm|mov)$/.test(path.basename(req.query.objectName));
    cb(ok ? null : new HttpError(400, 'Fichier ou destination invalide'), !!ok);
  }
}).single('fichier');

const uploadLocal = [
  (req, res, next) => (storage.usesGcs ? next(new HttpError(400, 'Utilisez l\'envoi direct vers Cloud Storage')) : next()),
  (req, res, next) => localUploader(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return next(new HttpError(413, `Taille maximale : ${maxVideoMo} Mo`));
    next(err);
  }),
  (req, res) => res.status(201).json({ objectName: req.query.objectName })
];

/** Développement : diffusion d'un fichier local via lien signé (support des Range requests). */
const fichierLocal = (req, res) => {
  const { name } = req.params;
  if (!storage.verifyLocalSignature(name, req.query.exp, req.query.sig)) return res.status(403).json({ error: 'Lien expiré' });
  res.sendFile(path.join(storage.LOCAL_DIR, name));
};

module.exports = { getAll, create, update, remove, lecture, progression, stats, uploadUrl, uploadLocal, fichierLocal, parseLien };
