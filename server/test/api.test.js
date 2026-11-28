// Tests d'intégration de l'API (base de démonstration requise : npm run db:seed).
// Lancement : npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
process.env.ANTHROPIC_API_KEY = ''; // l'assistant est testé en mode hors-ligne (aucun appel payant)
const app = require('../src/app');
const prisma = require('../src/utils/prisma');

let server; let base;
const tokens = {};

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined
  });
  const type = res.headers.get('content-type') || '';
  return { status: res.status, type, data: type.includes('json') ? await res.json() : await res.arrayBuffer() };
};

const login = async (email, password) => {
  const r = await call('POST', '/api/auth/login', { body: { email, password } });
  assert.equal(r.status, 200, `connexion ${email}`);
  return r.data.token;
};

before(async () => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  tokens.admin = await login('admin@aqoon.dj', 'Admin@2025!');
  tokens.dir = await login('directeur@unefd.dj', 'Directeur@2025!');
  tokens.dirArta = await login('directeur.arta@unefd.dj', 'Directeur@2025!');
  tokens.sec = await login('secretariat@unefd.dj', 'Secret@2025!');
  tokens.prof = await login('ahmed.ibrahim@unefd.dj', 'Prof@2025!');
  tokens.etu = await login('etudiant@unefd.dj', 'Etudiant@2025!');
  tokens.etu2 = await login('ibrahim.o@unefd.dj', 'Etudiant@2025!');
});
after(async () => { server.close(); await prisma.$disconnect(); });

test('connexion refusée avec un mauvais mot de passe', async () => {
  const r = await call('POST', '/api/auth/login', { body: { email: 'directeur@unefd.dj', password: 'faux' } });
  assert.equal(r.status, 401);
});

test('IDOR : un directeur ne lit pas un étudiant d\'un autre établissement', async () => {
  const etu = await prisma.etudiant.findFirst({ where: { matricule: 'UNEFD251001' } });
  assert.equal((await call('GET', `/api/etudiants/${etu.id}`, { token: tokens.dirArta })).status, 404);
  assert.equal((await call('GET', `/api/notes/bulletin/${etu.id}`, { token: tokens.dirArta })).status, 404);
  assert.equal((await call('GET', `/api/pdf/bulletin/${etu.id}`, { token: tokens.dirArta })).status, 404);
  assert.equal((await call('GET', `/api/etudiants/${etu.id}`, { token: tokens.dir })).status, 200);
});

test('un directeur ne peut pas réinitialiser le mot de passe du super admin', async () => {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@aqoon.dj' } });
  const r = await call('PATCH', `/api/users/${admin.id}/reset-password`, { token: tokens.dir, body: { newPassword: 'Pirate1234!' } });
  assert.ok([403, 404].includes(r.status), `statut ${r.status}`);
});

test('un étudiant ne voit que son propre dossier', async () => {
  const autre = await prisma.etudiant.findFirst({ where: { matricule: 'UNEFD251002' } });
  assert.equal((await call('GET', `/api/etudiants/${autre.id}`, { token: tokens.etu })).status, 404);
  assert.equal((await call('GET', '/api/etudiants', { token: tokens.etu })).status, 403);
  const abs = await call('GET', '/api/absences', { token: tokens.etu });
  const moi = await prisma.etudiant.findUnique({ where: { matricule: 'UNEFD251001' } });
  assert.ok(abs.data.every((a) => a.etudiantId === moi.id));
});

test('un professeur ne note que ses matières', async () => {
  const mat = await prisma.matiere.findFirst({ where: { nom: 'Réseaux & Sécurité' } });
  const etu = await prisma.etudiant.findFirst({ where: { matricule: 'UNEFD251001' } });
  const r = await call('POST', '/api/notes', { token: tokens.prof, body: { etudiantId: etu.id, matiereId: mat.id, valeur: 12 } });
  assert.equal(r.status, 403);
});

test('paiement : montantPaye = 0 n\'est plus interprété comme payé', async () => {
  const etu = await prisma.etudiant.findFirst({ where: { matricule: 'UNEFD251002' } });
  const r = await call('POST', '/api/paiements', { token: tokens.sec, body: { etudiantId: etu.id, montant: 5000, montantPaye: 0 } });
  assert.equal(r.status, 201);
  assert.equal(r.data.paiement.statut, 'IMPAYE');
  await prisma.paiement.delete({ where: { id: r.data.paiement.id } });
});

test('portail étudiant : dossier complet + score de risque', async () => {
  const r = await call('GET', '/api/portail/dossier', { token: tokens.etu2 });
  assert.equal(r.status, 200);
  assert.ok(r.data.bulletin.moyenneGenerale < 10);
  assert.equal(r.data.risque.niveau, 'ELEVE');
  assert.equal((await call('GET', '/api/portail/dossier', { token: tokens.dir })).status, 403);
});

test('requête → traitement → attestation PDF', async () => {
  const c = await call('POST', '/api/requetes', { token: tokens.etu2, body: { type: 'ATTESTATION_INSCRIPTION', objet: 'Test automatique' } });
  assert.equal(c.status, 201);
  const moi = await prisma.etudiant.findFirst({ where: { matricule: 'UNEFD251003' } });
  assert.equal((await call('GET', `/api/pdf/attestation/${moi.id}`, { token: tokens.etu2 })).status, 403);
  assert.equal((await call('PATCH', `/api/requetes/${c.data.requete.id}`, { token: tokens.dirArta, body: { statut: 'TRAITEE' } })).status, 404);
  assert.equal((await call('PATCH', `/api/requetes/${c.data.requete.id}`, { token: tokens.sec, body: { statut: 'TRAITEE', reponse: 'OK' } })).status, 200);
  const pdf = await call('GET', `/api/pdf/attestation/${moi.id}`, { token: tokens.etu2 });
  assert.equal(pdf.status, 200);
  assert.match(pdf.type, /pdf/);
  await prisma.requete.delete({ where: { id: c.data.requete.id } });
});

test('vidéothèque : publication par lien, lecture, progression', async () => {
  const bad = await call('POST', '/api/videos', { token: tokens.prof, body: { titre: 'X', url: 'https://evil.example/v' } });
  assert.equal(bad.status, 400);
  const c = await call('POST', '/api/videos', { token: tokens.prof, body: { titre: 'Test', url: 'https://youtu.be/dQw4w9WgXcQ' } });
  assert.equal(c.status, 201);
  assert.equal((await call('POST', '/api/videos', { token: tokens.etu, body: { titre: 'X', url: 'https://youtu.be/dQw4w9WgXcQ' } })).status, 403);
  const l = await call('GET', `/api/videos/${c.data.video.id}/lecture`, { token: tokens.etu });
  assert.match(l.data.src, /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  assert.equal((await call('POST', `/api/videos/${c.data.video.id}/progression`, { token: tokens.etu, body: { progression: 50 } })).status, 200);
  assert.equal((await call('GET', `/api/videos/${c.data.video.id}/lecture`, { token: tokens.dirArta })).status, 404);
  const del = await call('DELETE', `/api/videos/${c.data.video.id}`, { token: tokens.prof });
  assert.equal(del.status, 200);
});

test('alertes précoces : classement par score décroissant', async () => {
  const r = await call('GET', '/api/alertes', { token: tokens.dir });
  assert.equal(r.status, 200);
  const scores = r.data.etudiants.map((e) => e.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  assert.ok(r.data.resume.ELEVE >= 1);
  assert.equal((await call('GET', '/api/alertes', { token: tokens.etu })).status, 403);
});

test('assistant (hors-ligne) : répond à partir du dossier', async () => {
  const r = await call('POST', '/api/assistant/chat', { token: tokens.etu2, body: { messages: [{ role: 'user', content: 'Quelles matières dois-je travailler en priorité ?' }] } });
  assert.equal(r.status, 200);
  assert.equal(r.data.mode, 'hors-ligne');
  assert.match(r.data.reponse, /prioriser/);
});
