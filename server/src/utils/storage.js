// Stockage des vidéos.
//  - Production (GCS_BUCKET défini) : bucket Cloud Storage privé. Le navigateur envoie
//    le fichier directement au bucket via une URL signée V4 (PUT) — la vidéo ne transite
//    pas par Cloud Run (limite de 32 Mo par requête HTTP/1 sur Cloud Run).
//    La lecture se fait aussi par URL signée temporaire.
//  - Développement : disque local + lien signé HMAC à durée limitée.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { gcsBucket, uploadDir, jwtSecret } = require('../config/env');

const VIDEO_TYPES = { 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' };
const LOCAL_DIR = path.join(uploadDir, 'videos');

let bucket = null;
if (gcsBucket) {
  const { Storage } = require('@google-cloud/storage');
  bucket = new Storage().bucket(gcsBucket);
} else {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

const newObjectName = (etablissementId, contentType) =>
  `videos/${etablissementId}/${crypto.randomUUID()}${VIDEO_TYPES[contentType]}`;

/** URL signée pour envoyer directement le fichier au bucket (15 min). */
const signedUploadUrl = async (objectName, contentType) => {
  const [url] = await bucket.file(objectName).getSignedUrl({
    version: 'v4', action: 'write', expires: Date.now() + 15 * 60 * 1000, contentType
  });
  return url;
};

const hmac = (name, exp) => crypto.createHmac('sha256', jwtSecret).update(`${name}:${exp}`).digest('hex');

/** URL de lecture temporaire (2 h). */
const signedReadUrl = async (objectName) => {
  if (bucket) {
    const [url] = await bucket.file(objectName).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 2 * 3600 * 1000 });
    return url;
  }
  const exp = Date.now() + 2 * 3600 * 1000;
  const name = path.basename(objectName);
  return `/api/videos/fichier/${name}?exp=${exp}&sig=${hmac(name, exp)}`;
};

const verifyLocalSignature = (name, exp, sig) => {
  if (!name || !/^[0-9a-f-]+\.(mp4|webm|mov)$/.test(name)) return false;
  if (!exp || Date.now() > Number(exp)) return false;
  const expected = hmac(name, exp);
  return typeof sig === 'string' && sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
};

const objectExists = async (objectName) => {
  if (bucket) { const [exists] = await bucket.file(objectName).exists(); return exists; }
  return fs.existsSync(path.join(LOCAL_DIR, path.basename(objectName)));
};

const deleteObject = async (objectName) => {
  try {
    if (bucket) await bucket.file(objectName).delete({ ignoreNotFound: true });
    else fs.rmSync(path.join(LOCAL_DIR, path.basename(objectName)), { force: true });
  } catch (e) { console.warn('Suppression fichier vidéo échouée:', e.message); }
};

module.exports = {
  VIDEO_TYPES, LOCAL_DIR, usesGcs: !!bucket,
  newObjectName, signedUploadUrl, signedReadUrl, verifyLocalSignature, objectExists, deleteObject
};
