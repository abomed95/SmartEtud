// Crée le premier compte SUPER_ADMIN (base vide). Mot de passe aléatoire affiché UNE fois :
// à changer immédiatement après la première connexion (menu « Réglages »).
// Usage : ADMIN_EMAIL=admin@exemple.dj node prisma/create-admin.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();

(async () => {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('ADMIN_EMAIL invalide');
  if (await prisma.user.findUnique({ where: { email } })) {
    console.log(`Le compte ${email} existe déjà : rien à faire.`);
    return;
  }
  const password = `${crypto.randomBytes(9).toString('base64url')}!7a`;
  await prisma.user.create({
    data: { nom: 'Administrateur', prenom: 'Plateforme', email, role: 'SUPER_ADMIN', password: await bcrypt.hash(password, 12) }
  });
  console.log(`✅ Super Admin créé : ${email}`);
  console.log(`🔑 Mot de passe temporaire : ${password}`);
  console.log('   → changez-le dès la première connexion (Réglages).');
})()
  .catch((e) => { console.error('❌', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
