// Alerte précoce : classement des étudiants par risque de décrochage.
const prisma = require('../utils/prisma');
const { ah, etabIdFor } = require('../utils/scope');
const { calculerRisques } = require('../utils/risque');

const listeAlertes = async (user, { etablissementId, filiereId, niveau } = {}) => {
  const where = { statut: 'ACTIF' };
  if (etablissementId) where.etablissementId = etablissementId;
  if (filiereId) where.filiereId = filiereId;
  if (user.role === 'PROFESSEUR') {
    // un professeur ne voit que les filières où il enseigne
    const pm = await prisma.professeurMatiere.findMany({
      where: { professeur: { userId: user.id } }, select: { matiere: { select: { filiereId: true } } }
    });
    where.filiereId = { in: [...new Set(pm.map((x) => x.matiere.filiereId))] };
  }
  const etudiants = await prisma.etudiant.findMany({
    where,
    select: { id: true, nom: true, prenom: true, matricule: true, telephone: true, filiere: { select: { nom: true } }, niveau: { select: { nom: true } } }
  });
  const risques = await calculerRisques(etudiants.map((e) => e.id));
  return etudiants
    // « niveau » = niveau de risque ; la classe est renvoyée dans « niveauClasse »
    .map(({ niveau: classe, ...e }) => ({ ...e, niveauClasse: classe?.nom || null, ...risques[e.id] }))
    .filter((e) => !niveau || e.niveau === niveau)
    .sort((a, b) => b.score - a.score);
};

const getAll = ah(async (req, res) => {
  const liste = await listeAlertes(req.user, {
    etablissementId: etabIdFor(req), filiereId: req.query.filiereId, niveau: req.query.niveau
  });
  const resume = { ELEVE: 0, MOYEN: 0, FAIBLE: 0 };
  liste.forEach((e) => { resume[e.niveau] += 1; });
  res.json({ resume, etudiants: liste });
});

module.exports = { getAll, listeAlertes };
