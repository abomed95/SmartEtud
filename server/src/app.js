const config = require('./config/env');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const prisma = require('./utils/prisma');

const app = express();

// Cloud Run est derrière un load balancer Google : nécessaire pour l'IP réelle (rate limit)
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'img-src': ["'self'", 'data:', 'blob:', 'https://i.ytimg.com', 'https://storage.googleapis.com'],
      'media-src': ["'self'", 'blob:', 'https://storage.googleapis.com'],
      'frame-src': ['https://www.youtube-nocookie.com', 'https://player.vimeo.com'],
      'connect-src': ["'self'", 'https://storage.googleapis.com'],
      'font-src': ["'self'", 'data:'],
      'style-src': ["'self'", "'unsafe-inline'"],
    }
  }
}));
app.use(compression());
app.use(morgan(config.isProd ? 'combined' : 'dev'));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
// Anti force brute sur la connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/etablissements', require('./routes/etablissement.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/filieres', require('./routes/filiere.routes'));
app.use('/api/matieres', require('./routes/matiere.routes'));
app.use('/api/etudiants', require('./routes/etudiant.routes'));
app.use('/api/notes', require('./routes/note.routes'));
app.use('/api/absences', require('./routes/absence.routes'));
app.use('/api/paiements', require('./routes/paiement.routes'));
app.use('/api/stats', require('./routes/stats.routes'));
app.use('/api/pdf', require('./routes/pdf.routes'));
app.use('/api/requetes', require('./routes/requete.routes'));
app.use('/api/videos', require('./routes/video.routes'));
app.use('/api/portail', require('./routes/portail.routes'));
app.use('/api/alertes', require('./routes/alerte.routes'));
app.use('/api/assistant', require('./routes/assistant.routes'));

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', app: config.appName, timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'DB_UNAVAILABLE' });
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Route introuvable' }));

// En production, le même conteneur sert le frontend React compilé (un seul service Cloud Run)
const clientDist = process.env.CLIENT_DIST || path.resolve(__dirname, '../../client/dist');
if (config.serveClient && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, {
    index: false,
    setHeaders: (res, file) => {
      if (/\/assets\//.test(file)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Gestionnaire d'erreurs central : jamais de stack trace renvoyée au client en production
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message;
  if (err.code === 'P2025') { status = 404; message = 'Ressource introuvable'; }
  else if (err.code === 'P2002') { status = 409; message = 'Cette valeur existe déjà'; }
  else if (err.code === 'P2003') { status = 400; message = 'Référence invalide'; }
  else if (err.type === 'entity.parse.failed') { status = 400; message = 'JSON invalide'; }
  if (status >= 500) {
    console.error(err);
    message = 'Erreur interne du serveur';
  }
  res.status(status).json({ error: message, ...(!config.isProd && status >= 500 && { stack: err.stack }) });
});

if (require.main === module) {
  const server = app.listen(config.port, () => {
    console.log(`🚀 ${config.appName} — port ${config.port} (${config.isProd ? 'production' : 'développement'})`);
  });
  // Cloud Run envoie SIGTERM avant d'arrêter une instance : on termine proprement
  const shutdown = () => {
    server.close(async () => { await prisma.$disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;
