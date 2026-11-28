// Chargement et validation de la configuration au démarrage.
// En production, l'application refuse de démarrer si un secret critique manque :
// mieux vaut un crash au déploiement qu'un serveur qui signe des JWT avec un secret faible.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const isProd = process.env.NODE_ENV === 'production';

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Variables d'environnement manquantes : ${missing.join(', ')}`);
  process.exit(1);
}
if (isProd && process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET doit contenir au moins 32 caractères en production');
  process.exit(1);
}

module.exports = {
  isProd,
  port: parseInt(process.env.PORT, 10) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  appName: process.env.APP_NAME || 'Aqoon UNEFD',
  devise: process.env.DEVISE || 'FDJ',
  // Stockage des vidéos : bucket GCS en production, disque local en développement
  gcsBucket: process.env.GCS_BUCKET || '',
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  maxVideoMo: parseInt(process.env.MAX_VIDEO_MO, 10) || 500,
  // Assistant IA (Claude). Sans clé, l'assistant répond en mode « règles » hors-ligne.
  anthropicApiKey: ['', 'none'].includes(process.env.ANTHROPIC_API_KEY || '') ? '' : process.env.ANTHROPIC_API_KEY,
  assistantModel: process.env.ASSISTANT_MODEL || 'claude-opus-5-5',
  serveClient: process.env.SERVE_CLIENT === 'true' || isProd,
};
