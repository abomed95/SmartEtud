# 🎓 SmartEdu ERP

Plateforme moderne de gestion scolaire et centre de formation professionnelle.

**Stack:** React.js + Node.js/Express + PostgreSQL + Prisma ORM + TailwindCSS

---

## 🚀 Installation rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Installer les dépendances

```bash
npm run install:all
```

### 2. Configuration

```bash
cp .env.example .env
# Éditer .env avec votre DATABASE_URL PostgreSQL
```

### 3. Base de données

```bash
npm run db:migrate   # Créer les tables
npm run db:seed      # Données de test
```

### 4. Lancer

```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

---

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Super Admin | admin@smartedu.com | Admin@2024 |
| Directeur | directeur@cfp-djibouti.dj | Directeur@2024 |
| Secrétaire | secretaire@cfp-djibouti.dj | Secret@2024 |
| Professeur | ahmed.ibrahim@cfp-djibouti.dj | Prof@2024 |

---

## 👥 Rôles

- **Super Admin** — Gestion globale des établissements
- **Directeur** — Gestion de son établissement
- **Professeur** — Notes et absences
- **Secrétaire** — Paiements et assiduité

---

## 📁 Structure

```
SmartEtud/
├── client/          # React.js + Vite + TailwindCSS
├── server/          # Node.js + Express + Prisma
└── prisma/          # Schema + Seed
```

---

© 2024 SmartEdu ERP

