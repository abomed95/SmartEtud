// Données de démonstration — Aqoon UNEFD.
// ⚠️ Ce script EFFACE toute la base. Il refuse de s'exécuter en production sauf ALLOW_SEED=true.
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
  console.error('❌ Seed bloqué en production (définissez ALLOW_SEED=true si c\'est vraiment voulu).');
  process.exit(1);
}

const prisma = new PrismaClient();

// Générateur pseudo-aléatoire déterministe (mulberry32) : même jeu de données à chaque seed
let s = 20261126;
const rand = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const between = (a, b) => Math.round((a + rand() * (b - a)) * 4) / 4; // notes au quart de point
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

async function main() {
  console.log('🌱 Initialisation de la base Aqoon UNEFD…');
  await prisma.$transaction([
    prisma.videoVue.deleteMany(), prisma.video.deleteMany(), prisma.requete.deleteMany(),
    prisma.professeurMatiere.deleteMany(), prisma.professeur.deleteMany(),
    prisma.note.deleteMany(), prisma.absence.deleteMany(), prisma.paiement.deleteMany(),
    prisma.etudiant.deleteMany(), prisma.matiere.deleteMany(), prisma.niveau.deleteMany(),
    prisma.filiere.deleteMany(), prisma.user.deleteMany(), prisma.etablissement.deleteMany()
  ]);

  const hash = (p) => bcrypt.hash(p, 12);
  const [pAdmin, pDir, pSec, pProf, pEtu] = await Promise.all(
    ['Admin@2025!', 'Directeur@2025!', 'Secret@2025!', 'Prof@2025!', 'Etudiant@2025!'].map(hash)
  );

  await prisma.user.create({ data: { nom: 'Administrateur', prenom: 'Plateforme', email: 'admin@aqoon.dj', password: pAdmin, role: 'SUPER_ADMIN' } });

  const unefd = await prisma.etablissement.create({
    data: { nom: 'UNEFD — Campus de Djibouti', adresse: 'Boulevard de la République, Djibouti-Ville', telephone: '+253 21 35 00 00', email: 'contact@unefd.dj' }
  });
  const arta = await prisma.etablissement.create({
    data: { nom: 'UNEFD — Antenne d\'Arta', adresse: 'Arta, Djibouti', telephone: '+253 21 42 00 00', email: 'arta@unefd.dj' }
  });

  await prisma.user.create({ data: { nom: 'Hassan', prenom: 'Ali', email: 'directeur@unefd.dj', telephone: '+253 77 10 00 01', password: pDir, role: 'DIRECTEUR', etablissementId: unefd.id } });
  await prisma.user.create({ data: { nom: 'Omar', prenom: 'Fatouma', email: 'directeur.arta@unefd.dj', telephone: '+253 77 20 00 01', password: pDir, role: 'DIRECTEUR', etablissementId: arta.id } });
  const secretaire = await prisma.user.create({ data: { nom: 'Mohamed', prenom: 'Khadija', email: 'secretariat@unefd.dj', telephone: '+253 77 10 00 02', password: pSec, role: 'SECRETAIRE', etablissementId: unefd.id } });

  // Filières adaptées au tissu économique djiboutien (port, logistique, numérique, énergie)
  const defs = [
    { nom: 'Informatique & Réseaux', description: 'Développement web, systèmes et réseaux', duree: 24,
      matieres: [['Développement Web', 3], ['Bases de Données', 2], ['Réseaux & Sécurité', 2], ['Mathématiques', 1.5], ['Anglais Technique', 1]] },
    { nom: 'Logistique & Transport Portuaire', description: 'Gestion portuaire, transit et chaîne logistique', duree: 24,
      matieres: [['Opérations Portuaires', 3], ['Transit & Douane', 2], ['Gestion de Stocks', 2], ['Statistiques', 1.5], ['Anglais Maritime', 1]] },
    { nom: 'Énergies Renouvelables', description: 'Solaire, géothermie et électrotechnique', duree: 24,
      matieres: [['Électrotechnique', 3], ['Énergie Solaire', 2], ['Géothermie', 2], ['Physique Appliquée', 1.5]] }
  ];

  const filieres = [];
  for (const d of defs) {
    const filiere = await prisma.filiere.create({ data: { nom: d.nom, description: d.description, duree: d.duree, etablissementId: unefd.id } });
    const niveaux = [];
    for (const [i, nom] of ['Licence 1', 'Licence 2', 'Licence 3'].entries()) {
      niveaux.push(await prisma.niveau.create({ data: { nom, ordre: i + 1, filiereId: filiere.id } }));
    }
    const matieres = [];
    for (const [nom, coefficient] of d.matieres) matieres.push(await prisma.matiere.create({ data: { nom, coefficient, filiereId: filiere.id } }));
    filieres.push({ filiere, niveaux, matieres });
  }
  const [info, logi] = filieres;

  const mkProf = async (nom, prenom, email, specialite, mats) => {
    const user = await prisma.user.create({ data: { nom, prenom, email, password: pProf, role: 'PROFESSEUR', etablissementId: unefd.id } });
    const prof = await prisma.professeur.create({ data: { userId: user.id, specialite } });
    for (const m of mats) await prisma.professeurMatiere.create({ data: { professeurId: prof.id, matiereId: m.id } });
    return user;
  };
  const prof1 = await mkProf('Ibrahim', 'Ahmed', 'ahmed.ibrahim@unefd.dj', 'Développement & Bases de données', [info.matieres[0], info.matieres[1], info.matieres[3]]);
  const prof2 = await mkProf('Abdourahman', 'Zahra', 'zahra.abdourahman@unefd.dj', 'Logistique portuaire', [logi.matieres[0], logi.matieres[1]]);

  // Étudiants : profil = niveau moyen visé (pour obtenir des alertes réalistes)
  const etus = [
    ['Hassan', 'Hodan', 'F', info, 15], ['Ali', 'Mohamed', 'M', info, 12], ['Ougoureh', 'Ibrahim', 'M', info, 8],
    ['Dirieh', 'Mariam', 'F', info, 14], ['Youssouf', 'Abdi', 'M', info, 9.5], ['Omar', 'Safia', 'F', info, 16],
    ['Guedi', 'Hassan', 'M', logi, 11], ['Abdillahi', 'Amina', 'F', logi, 13], ['Robleh', 'Houssein', 'M', logi, 7.5],
    ['Elmi', 'Deka', 'F', logi, 12.5]
  ];
  const created = [];
  for (const [i, [nom, prenom, sexe, f, niveauVise]] of etus.entries()) {
    const etu = await prisma.etudiant.create({
      data: {
        nom, prenom, sexe, telephone: `+253 77 40 ${String(i).padStart(2, '0')} ${String(10 + i)}`,
        matricule: `UNEFD25${String(1001 + i)}`, filiereId: f.filiere.id, niveauId: f.niveaux[0].id,
        etablissementId: unefd.id, dateNaissance: new Date(2003 + (i % 4), i % 12, 5 + i)
      }
    });
    created.push({ etu, f, niveauVise });
  }

  // Compte portail de démonstration (Hodan Hassan) + un étudiant en difficulté (Ibrahim Ougoureh)
  const hodanUser = await prisma.user.create({ data: { nom: 'Hassan', prenom: 'Hodan', email: 'etudiant@unefd.dj', password: pEtu, role: 'ETUDIANT', etablissementId: unefd.id } });
  await prisma.etudiant.update({ where: { id: created[0].etu.id }, data: { userId: hodanUser.id, email: 'etudiant@unefd.dj' } });
  const ibrahimUser = await prisma.user.create({ data: { nom: 'Ougoureh', prenom: 'Ibrahim', email: 'ibrahim.o@unefd.dj', password: pEtu, role: 'ETUDIANT', etablissementId: unefd.id } });
  await prisma.etudiant.update({ where: { id: created[2].etu.id }, data: { userId: ibrahimUser.id, email: 'ibrahim.o@unefd.dj' } });

  // Notes sur 3 mois (semestre 1)
  const notes = [];
  for (const { etu, f, niveauVise } of created) {
    for (const m of f.matieres.slice(0, 4)) {
      for (const [k, type] of ['DEVOIR', 'DEVOIR', 'EXAMEN'].entries()) {
        const valeur = Math.max(0, Math.min(20, between(niveauVise - 3, niveauVise + 3)));
        notes.push({ etudiantId: etu.id, matiereId: m.id, niveauId: f.niveaux[0].id, valeur, type, periode: 'Semestre 1', annee: '2025-2026', createdAt: daysAgo(80 - k * 30 - Math.floor(rand() * 10)) });
      }
    }
  }
  await prisma.note.createMany({ data: notes });

  // Absences : plus nombreuses pour les profils faibles
  const absences = [];
  for (const { etu, f, niveauVise } of created) {
    const n = niveauVise < 10 ? 6 : niveauVise < 13 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      absences.push({
        etudiantId: etu.id, matiereId: f.matieres[i % f.matieres.length].id, niveauId: f.niveaux[0].id,
        type: i % 3 === 2 ? 'RETARD' : 'ABSENCE', date: daysAgo(3 + Math.floor(rand() * 60)),
        justifiee: niveauVise >= 13, saisiParId: prof1.id
      });
    }
  }
  await prisma.absence.createMany({ data: absences });

  // Frais de scolarité en francs Djibouti (FDJ)
  for (const [i, { etu, niveauVise }] of created.entries()) {
    const montant = 90000;
    const montantPaye = niveauVise < 10 ? 30000 : i % 4 === 3 ? 45000 : 90000;
    await prisma.paiement.create({
      data: {
        etudiantId: etu.id, etablissementId: unefd.id, montant, montantPaye,
        statut: montantPaye >= montant ? 'PAYE' : montantPaye > 0 ? 'PARTIEL' : 'IMPAYE',
        typePaiement: i % 2 ? 'D-MONEY' : 'ESPÈCES', reference: `PAY-2025-${1000 + i}`,
        description: 'Frais de scolarité — Semestre 1', mois: 'Octobre', annee: '2025', datePaiement: daysAgo(40 - i)
      }
    });
  }

  // Requêtes
  await prisma.requete.create({ data: { numero: 'REQ-2025-10001', type: 'ATTESTATION_INSCRIPTION', objet: 'Attestation pour dossier de bourse', statut: 'TRAITEE', reponse: 'Votre attestation est disponible au téléchargement.', traiteLe: daysAgo(5), traiteParId: secretaire.id, etudiantId: created[0].etu.id, etablissementId: unefd.id } });
  await prisma.requete.create({ data: { numero: 'REQ-2025-10002', type: 'RECLAMATION_NOTE', objet: 'Réclamation note de Bases de Données', message: 'Je pense qu\'il y a une erreur de report sur le devoir 2.', etudiantId: created[0].etu.id, etablissementId: unefd.id } });
  await prisma.requete.create({ data: { numero: 'REQ-2025-10003', type: 'CERTIFICAT_SCOLARITE', objet: 'Certificat pour la CNSS', etudiantId: created[2].etu.id, etablissementId: unefd.id } });

  // Vidéothèque (liens YouTube publics — à remplacer par vos propres cours)
  await prisma.video.create({ data: { titre: 'Introduction au HTML et CSS', description: 'Les bases de la structure d\'une page web.', source: 'YOUTUBE', url: 'https://www.youtube.com/watch?v=qz0aGYrrlhU', dureeSecondes: 3600, etablissementId: unefd.id, filiereId: info.filiere.id, matiereId: info.matieres[0].id, auteurId: prof1.id } });
  await prisma.video.create({ data: { titre: 'SQL pour débutants', description: 'Requêtes SELECT, jointures et agrégations.', source: 'YOUTUBE', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', dureeSecondes: 15600, etablissementId: unefd.id, filiereId: info.filiere.id, matiereId: info.matieres[1].id, auteurId: prof1.id } });

  console.log('\n🎉 Base initialisée.\n');
  console.table([
    { rôle: 'Super Admin', email: 'admin@aqoon.dj', motDePasse: 'Admin@2025!' },
    { rôle: 'Directeur', email: 'directeur@unefd.dj', motDePasse: 'Directeur@2025!' },
    { rôle: 'Secrétariat', email: 'secretariat@unefd.dj', motDePasse: 'Secret@2025!' },
    { rôle: 'Professeur', email: 'ahmed.ibrahim@unefd.dj', motDePasse: 'Prof@2025!' },
    { rôle: 'Étudiant', email: 'etudiant@unefd.dj', motDePasse: 'Etudiant@2025!' },
    { rôle: 'Étudiant (à risque)', email: 'ibrahim.o@unefd.dj', motDePasse: 'Etudiant@2025!' }
  ]);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
