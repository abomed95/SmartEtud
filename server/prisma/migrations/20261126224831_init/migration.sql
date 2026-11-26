-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'DIRECTEUR', 'PROFESSEUR', 'SECRETAIRE', 'ETUDIANT');

-- CreateEnum
CREATE TYPE "TypeRequete" AS ENUM ('ATTESTATION_INSCRIPTION', 'CERTIFICAT_SCOLARITE', 'RELEVE_NOTES', 'RECLAMATION_NOTE', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutRequete" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TRAITEE', 'REJETEE');

-- CreateEnum
CREATE TYPE "SourceVideo" AS ENUM ('YOUTUBE', 'VIMEO', 'FICHIER');

-- CreateEnum
CREATE TYPE "Statut" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('PAYE', 'PARTIEL', 'IMPAYE');

-- CreateEnum
CREATE TYPE "TypeAbsence" AS ENUM ('ABSENCE', 'RETARD', 'PRESENCE');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('M', 'F');

-- CreateTable
CREATE TABLE "etablissements" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "statut" "Statut" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etablissements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "photo" TEXT,
    "resetToken" TEXT,
    "resetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etablissementId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filieres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "duree" INTEGER,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etablissementId" TEXT NOT NULL,

    CONSTRAINT "filieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niveaux" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filiereId" TEXT NOT NULL,

    CONSTRAINT "niveaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matieres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "heuresTotal" INTEGER,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "filiereId" TEXT NOT NULL,

    CONSTRAINT "matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professeurs" (
    "id" TEXT NOT NULL,
    "specialite" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "professeurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professeur_matieres" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "professeurId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,

    CONSTRAINT "professeur_matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etudiants" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "sexe" "Sexe" NOT NULL DEFAULT 'M',
    "dateNaissance" TIMESTAMP(3),
    "photo" TEXT,
    "statut" "Statut" NOT NULL DEFAULT 'ACTIF',
    "matricule" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etablissementId" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "niveauId" TEXT,
    "userId" TEXT,

    CONSTRAINT "etudiants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "valeur" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DEVOIR',
    "periode" TEXT,
    "annee" TEXT,
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "niveauId" TEXT,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "type" "TypeAbsence" NOT NULL DEFAULT 'ABSENCE',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "justifiee" BOOLEAN NOT NULL DEFAULT false,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etudiantId" TEXT NOT NULL,
    "matiereId" TEXT,
    "niveauId" TEXT,
    "saisiParId" TEXT,

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "montantPaye" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'IMPAYE',
    "typePaiement" TEXT,
    "reference" TEXT,
    "description" TEXT,
    "datePaiement" TIMESTAMP(3),
    "mois" TEXT,
    "annee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "etablissementId" TEXT NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requetes" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "type" "TypeRequete" NOT NULL,
    "objet" TEXT NOT NULL,
    "message" TEXT,
    "statut" "StatutRequete" NOT NULL DEFAULT 'EN_ATTENTE',
    "reponse" TEXT,
    "traiteLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "etablissementId" TEXT NOT NULL,
    "traiteParId" TEXT,

    CONSTRAINT "requetes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "source" "SourceVideo" NOT NULL,
    "url" TEXT NOT NULL,
    "miniature" TEXT,
    "dureeSecondes" INTEGER,
    "publiee" BOOLEAN NOT NULL DEFAULT true,
    "vues" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etablissementId" TEXT NOT NULL,
    "filiereId" TEXT,
    "matiereId" TEXT,
    "auteurId" TEXT,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_vues" (
    "id" TEXT NOT NULL,
    "progression" INTEGER NOT NULL DEFAULT 0,
    "terminee" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "videoId" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,

    CONSTRAINT "video_vues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_etablissementId_role_idx" ON "users"("etablissementId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "professeurs_userId_key" ON "professeurs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "professeur_matieres_professeurId_matiereId_key" ON "professeur_matieres"("professeurId", "matiereId");

-- CreateIndex
CREATE UNIQUE INDEX "etudiants_matricule_key" ON "etudiants"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "etudiants_userId_key" ON "etudiants"("userId");

-- CreateIndex
CREATE INDEX "etudiants_etablissementId_filiereId_idx" ON "etudiants"("etablissementId", "filiereId");

-- CreateIndex
CREATE INDEX "notes_etudiantId_idx" ON "notes"("etudiantId");

-- CreateIndex
CREATE INDEX "absences_etudiantId_date_idx" ON "absences"("etudiantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_reference_key" ON "paiements"("reference");

-- CreateIndex
CREATE INDEX "paiements_etablissementId_statut_idx" ON "paiements"("etablissementId", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "requetes_numero_key" ON "requetes"("numero");

-- CreateIndex
CREATE INDEX "requetes_etablissementId_statut_idx" ON "requetes"("etablissementId", "statut");

-- CreateIndex
CREATE INDEX "videos_etablissementId_filiereId_idx" ON "videos"("etablissementId", "filiereId");

-- CreateIndex
CREATE UNIQUE INDEX "video_vues_videoId_etudiantId_key" ON "video_vues"("videoId", "etudiantId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filieres" ADD CONSTRAINT "filieres_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "niveaux" ADD CONSTRAINT "niveaux_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matieres" ADD CONSTRAINT "matieres_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professeurs" ADD CONSTRAINT "professeurs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professeur_matieres" ADD CONSTRAINT "professeur_matieres_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "professeurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professeur_matieres" ADD CONSTRAINT "professeur_matieres_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etudiants" ADD CONSTRAINT "etudiants_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etudiants" ADD CONSTRAINT "etudiants_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etudiants" ADD CONSTRAINT "etudiants_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etudiants" ADD CONSTRAINT "etudiants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_saisiParId_fkey" FOREIGN KEY ("saisiParId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requetes" ADD CONSTRAINT "requetes_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requetes" ADD CONSTRAINT "requetes_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requetes" ADD CONSTRAINT "requetes_traiteParId_fkey" FOREIGN KEY ("traiteParId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_vues" ADD CONSTRAINT "video_vues_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_vues" ADD CONSTRAINT "video_vues_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
