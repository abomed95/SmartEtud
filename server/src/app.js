const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: '../.env' });

const authRoutes = require('./routes/auth.routes');
const etablissementRoutes = require('./routes/etablissement.routes');
const userRoutes = require('./routes/user.routes');
const filiereRoutes = require('./routes/filiere.routes');
const matiereRoutes = require('./routes/matiere.routes');
const etudiantRoutes = require('./routes/etudiant.routes');
const noteRoutes = require('./routes/note.routes');
const absenceRoutes = require('./routes/absence.routes');
const paiementRoutes = require('./routes/paiement.routes');
const statsRoutes = require('./routes/stats.routes');
const pdfRoutes = require('./routes/pdf.routes');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('dev'));
app.use(limiter);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/etablissements', etablissementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/filieres', filiereRoutes);
app.use('/api/matieres', matiereRoutes);
app.use('/api/etudiants', etudiantRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/pdf', pdfRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), app: 'SmartEdu ERP' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SmartEdu ERP Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
