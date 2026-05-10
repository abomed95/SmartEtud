const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.$transaction([
    prisma.professeurMatiere.deleteMany(),
    prisma.professeur.deleteMany(),
    prisma.note.deleteMany(),
    prisma.absence.deleteMany(),
    prisma.paiement.deleteMany(),
    prisma.etudiant.deleteMany(),
    prisma.matiere.deleteMany(),
    prisma.niveau.deleteMany(),
    prisma.filiere.deleteMany(),
    prisma.user.deleteMany(),
    prisma.etablissement.deleteMany()
  ]);

  const adminPassword = await bcrypt.hash('Admin@2024', 12);
  const superAdmin = await prisma.user.create({
    data: {
      nom: 'Super',
      prenom: 'Admin',
      email: 'admin@smartedu.com',
      password: adminPassword,
      role: 'SUPER_ADMIN'
    }
  });
  console.log('✅ Super Admin créé:', superAdmin.email);

  const etab1 = await prisma.etablissement.create({
    data: {
      nom: 'Centre de Formation Professionnelle Djibouti',
      adresse: 'Avenue Hassan Gouled, Djibouti-Ville',
      telephone: '+253 21 35 00 00',
      email: 'contact@cfp-djibouti.dj',
      statut: 'ACTIF'
    }
  });

  const etab2 = await prisma.etablissement.create({
    data: {
      nom: 'École Technique Arta',
      adresse: 'Arta, Djibouti',
      telephone: '+253 21 42 00 00',
      email: 'contact@etarta.dj',
      statut: 'ACTIF'
    }
  });
  console.log('✅ Établissements créés');

  const dirPassword = await bcrypt.hash('Directeur@2024', 12);
  await prisma.user.create({
    data: {
      nom: 'Hassan',
      prenom: 'Ali',
      email: 'directeur@cfp-djibouti.dj',
      telephone: '+253 77 10 00 01',
      password: dirPassword,
      role: 'DIRECTEUR',
      etablissementId: etab1.id
    }
  });

  await prisma.user.create({
    data: {
      nom: 'Fatouma',
      prenom: 'Omar',
      email: 'directeur@etarta.dj',
      telephone: '+253 77 20 00 01',
      password: dirPassword,
      role: 'DIRECTEUR',
      etablissementId: etab2.id
    }
  });
  console.log('✅ Directeurs créés');

  const secPassword = await bcrypt.hash('Secret@2024', 12);
  await prisma.user.create({
    data: {
      nom: 'Khadija',
      prenom: 'Mohamed',
      email: 'secretaire@cfp-djibouti.dj',
      telephone: '+253 77 10 00 02',
      password: secPassword,
      role: 'SECRETAIRE',
      etablissementId: etab1.id
    }
  });

  const filieres = [
    { nom: 'Informatique & Réseaux', description: 'Formation en développement web et administration réseau', duree: 24 },
    { nom: 'Couture & Mode', description: 'Formation en stylisme et confection', duree: 18 },
    { nom: 'Cuisine & Restauration', description: 'Formation en art culinaire', duree: 12 },
    { nom: 'Coiffure & Esthétique', description: 'Formation en coiffure et soins de beauté', duree: 12 }
  ];

  const createdFilieres = [];
  for (const f of filieres) {
    const filiere = await prisma.filiere.create({
      data: { ...f, etablissementId: etab1.id }
    });
    const niv1 = await prisma.niveau.create({ data: { nom: 'Niveau 1 - Débutant', ordre: 1, filiereId: filiere.id } });
    const niv2 = await prisma.niveau.create({ data: { nom: 'Niveau 2 - Intermédiaire', ordre: 2, filiereId: filiere.id } });
    const niv3 = await prisma.niveau.create({ data: { nom: 'Niveau 3 - Avancé', ordre: 3, filiereId: filiere.id } });
    createdFilieres.push({ filiere, niveaux: [niv1, niv2, niv3] });
  }
  console.log('✅ Filières et niveaux créés');

  const infoFiliere = createdFilieres[0];
  const matieres = [
    { nom: 'Développement Web', coefficient: 3, filiereId: infoFiliere.filiere.id },
    { nom: 'Base de Données', coefficient: 2, filiereId: infoFiliere.filiere.id },
    { nom: 'Réseaux & Sécurité', coefficient: 2, filiereId: infoFiliere.filiere.id },
    { nom: 'Mathématiques', coefficient: 1.5, filiereId: infoFiliere.filiere.id },
    { nom: 'Anglais Technique', coefficient: 1, filiereId: infoFiliere.filiere.id }
  ];

  const createdMatieres = [];
  for (const m of matieres) {
    const mat = await prisma.matiere.create({ data: m });
    createdMatieres.push(mat);
  }

  const coutureFiliere = createdFilieres[1];
  const matieresCouture = [
    { nom: 'Pratique Couture', coefficient: 3, filiereId: coutureFiliere.filiere.id },
    { nom: 'Dessin de Mode', coefficient: 2, filiereId: coutureFiliere.filiere.id },
    { nom: 'Stylisme', coefficient: 2, filiereId: coutureFiliere.filiere.id },
    { nom: 'Français Professionnel', coefficient: 1, filiereId: coutureFiliere.filiere.id }
  ];
  for (const m of matieresCouture) {
    await prisma.matiere.create({ data: m });
  }
  console.log('✅ Matières créées');

  const profPassword = await bcrypt.hash('Prof@2024', 12);
  const prof1User = await prisma.user.create({
    data: {
      nom: 'Ahmed',
      prenom: 'Ibrahim',
      email: 'ahmed.ibrahim@cfp-djibouti.dj',
      telephone: '+253 77 30 00 01',
      password: profPassword,
      role: 'PROFESSEUR',
      etablissementId: etab1.id
    }
  });

  const prof1 = await prisma.professeur.create({
    data: { userId: prof1User.id, specialite: 'Développement Web & Base de données' }
  });

  await prisma.professeurMatiere.create({ data: { professeurId: prof1.id, matiereId: createdMatieres[0].id } });
  await prisma.professeurMatiere.create({ data: { professeurId: prof1.id, matiereId: createdMatieres[1].id } });

  const prof2User = await prisma.user.create({
    data: {
      nom: 'Zahra',
      prenom: 'Abdourahman',
      email: 'zahra.a@cfp-djibouti.dj',
      telephone: '+253 77 30 00 02',
      password: profPassword,
      role: 'PROFESSEUR',
      etablissementId: etab1.id
    }
  });

  const prof2 = await prisma.professeur.create({
    data: { userId: prof2User.id, specialite: 'Réseaux & Sécurité' }
  });
  await prisma.professeurMatiere.create({ data: { professeurId: prof2.id, matiereId: createdMatieres[2].id } });
  console.log('✅ Professeurs créés');

  const etudiants = [
    { nom: 'Mohamed', prenom: 'Ali', telephone: '+253 77 40 00 01', sexe: 'M', matricule: 'ETU2401001' },
    { nom: 'Hodan', prenom: 'Hassan', telephone: '+253 77 40 00 02', sexe: 'F', matricule: 'ETU2401002' },
    { nom: 'Ibrahim', prenom: 'Ougourleh', telephone: '+253 77 40 00 03', sexe: 'M', matricule: 'ETU2401003' },
    { nom: 'Mariam', prenom: 'Dirieh', telephone: '+253 77 40 00 04', sexe: 'F', matricule: 'ETU2401004' },
    { nom: 'Abdi', prenom: 'Youssouf', telephone: '+253 77 40 00 05', sexe: 'M', matricule: 'ETU2401005' },
    { nom: 'Safia', prenom: 'Omar', telephone: '+253 77 40 00 06', sexe: 'F', matricule: 'ETU2401006' },
    { nom: 'Hassan', prenom: 'Guedi', telephone: '+253 77 40 00 07', sexe: 'M', matricule: 'ETU2401007' },
    { nom: 'Amina', prenom: 'Abdillahi', telephone: '+253 77 40 00 08', sexe: 'F', matricule: 'ETU2401008' }
  ];

  const createdEtudiants = [];
  for (const e of etudiants) {
    const etu = await prisma.etudiant.create({
      data: {
        ...e,
        filiereId: infoFiliere.filiere.id,
        niveauId: infoFiliere.niveaux[0].id,
        etablissementId: etab1.id,
        statut: 'ACTIF'
      }
    });
    createdEtudiants.push(etu);
  }
  console.log('✅ Étudiants créés');

  const periodes = ['Trimestre 1', 'Trimestre 2'];
  const annee = '2024-2025';
  for (const etu of createdEtudiants) {
    for (const periode of periodes) {
      for (const mat of createdMatieres.slice(0, 4)) {
        const nbNotes = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < nbNotes; i++) {
          const valeur = Math.round((Math.random() * 12 + 8) * 100) / 100;
          await prisma.note.create({
            data: {
              etudiantId: etu.id,
              matiereId: mat.id,
              niveauId: infoFiliere.niveaux[0].id,
              valeur,
              type: i === 0 ? 'DEVOIR' : 'EXAMEN',
              periode,
              annee
            }
          });
        }
      }
    }
  }
  console.log('✅ Notes créées');

  for (const etu of createdEtudiants.slice(0, 5)) {
    await prisma.absence.create({
      data: {
        etudiantId: etu.id,
        matiereId: createdMatieres[0].id,
        niveauId: infoFiliere.niveaux[0].id,
        type: Math.random() > 0.5 ? 'ABSENCE' : 'RETARD',
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        justifiee: Math.random() > 0.7
      }
    });
  }
  console.log('✅ Absences créées');

  const montants = [15000, 20000, 25000, 30000];
  for (const etu of createdEtudiants) {
    const montant = montants[Math.floor(Math.random() * montants.length)];
    const paid = Math.random() > 0.3;
    const partial = !paid && Math.random() > 0.5;
    const montantPaye = paid ? montant : (partial ? montant * 0.5 : 0);
    const statut = paid ? 'PAYE' : (partial ? 'PARTIEL' : 'IMPAYE');

    await prisma.paiement.create({
      data: {
        etudiantId: etu.id,
        etablissementId: etab1.id,
        montant,
        montantPaye,
        statut,
        typePaiement: 'VIREMENT',
        reference: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        description: 'Frais de scolarité',
        mois: 'Octobre',
        annee: '2024',
        datePaiement: paid || partial ? new Date() : null
      }
    });
  }
  console.log('✅ Paiements créés');

  console.log('\n🎉 Base de données initialisée avec succès!\n');
  console.log('📋 COMPTES DE TEST:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 Super Admin:   admin@smartedu.com       / Admin@2024');
  console.log('🏫 Directeur 1:   directeur@cfp-djibouti.dj / Directeur@2024');
  console.log('🏫 Directeur 2:   directeur@etarta.dj      / Directeur@2024');
  console.log('👩‍💼 Secrétaire:    secretaire@cfp-djibouti.dj / Secret@2024');
  console.log('👨‍🏫 Professeur 1:  ahmed.ibrahim@cfp-djibouti.dj / Prof@2024');
  console.log('👩‍🏫 Professeur 2:  zahra.a@cfp-djibouti.dj   / Prof@2024');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
