const PDFDocument = require('pdfkit');
const prisma = require('../utils/prisma');
const { appName } = require('../config/env');
const { formatMontant } = require('../utils/helpers');
const { ah, HttpError, loadEtudiantForUser } = require('../utils/scope');
const { buildBulletin } = require('./note.controller');
const { loadPaiement } = require('./paiement.controller');

const BLEU = '#0A6ED1';     // bleu « lagon » (drapeau de Djibouti)
const VERT = '#12AD2B';     // vert du drapeau
const GRIS = '#6E6E73';

const safeName = (s) => String(s).replace(/[^A-Za-z0-9_-]/g, '_');

/** En-tête commun : bandeau bleu/vert + nom établissement. */
const entete = (doc, etabNom, titre) => {
  const w = doc.page.width;
  doc.rect(0, 0, w * 0.62, 8).fill(BLEU);
  doc.rect(w * 0.62, 0, w * 0.38, 8).fill(VERT);
  doc.moveDown(1.2);
  doc.fillColor('#1D1D1F').font('Helvetica-Bold').fontSize(16).text(etabNom || appName, { align: 'center' });
  doc.font('Helvetica').fontSize(9).fillColor(GRIS).text(`${appName} · République de Djibouti`, { align: 'center' });
  doc.moveDown(0.8);
  doc.fillColor(BLEU).font('Helvetica-Bold').fontSize(13).text(titre, { align: 'center', characterSpacing: 1 });
  doc.moveDown(1);
  doc.fillColor('#1D1D1F');
};

const piedDePage = (doc, ref) => {
  const y = doc.page.height - 50;
  doc.fontSize(7).fillColor(GRIS)
    .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} — Réf. ${ref}`, 50, y, { align: 'center', width: doc.page.width - 100 });
};

const generateBulletin = ah(async (req, res) => {
  const etudiant = await loadEtudiantForUser(req.user, req.params.etudiantId, { filiere: true, niveau: true, etablissement: true });
  const { periode, annee } = req.query;
  const { detailMatieres, moyenneGenerale, appreciation } = await buildBulletin(etudiant.id, { periode, annee });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=bulletin_${safeName(etudiant.matricule)}.pdf`);
  doc.pipe(res);

  entete(doc, etudiant.etablissement?.nom, 'BULLETIN DE NOTES');
  doc.fontSize(9).fillColor(GRIS).text(`Période : ${periode || 'Toutes'}   ·   Année : ${annee || new Date().getFullYear()}`, { align: 'center' });
  doc.moveDown();

  doc.fillColor('#1D1D1F').font('Helvetica-Bold').fontSize(11).text('Étudiant');
  doc.font('Helvetica').fontSize(10)
    .text(`${etudiant.nom} ${etudiant.prenom}   ·   Matricule ${etudiant.matricule}`)
    .text(`Filière : ${etudiant.filiere?.nom || '—'}   ·   Niveau : ${etudiant.niveau?.nom || '—'}`);
  doc.moveDown();

  const col = [50, 260, 320, 430, 490];
  const head = doc.y;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(GRIS);
  ['MATIÈRE', 'COEFF', 'NOTES', 'MOYENNE', 'POINTS'].forEach((t, i) => doc.text(t, col[i], head));
  doc.moveTo(50, head + 14).lineTo(545, head + 14).strokeColor('#D1D1D6').stroke();

  let y = head + 20;
  doc.font('Helvetica').fontSize(9).fillColor('#1D1D1F');
  detailMatieres.forEach((it) => {
    const coeff = it.matiere.coefficient || 1;
    doc.text(it.matiere.nom.substring(0, 34), col[0], y, { width: 200 });
    doc.text(String(coeff), col[1], y);
    doc.text(it.notes.join(' · ').substring(0, 28), col[2], y, { width: 105 });
    doc.text(it.moyenne.toFixed(2), col[3], y);
    doc.text((it.moyenne * coeff).toFixed(2), col[4], y);
    y += 18;
    if (y > doc.page.height - 120) { doc.addPage(); y = 60; }
  });
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#D1D1D6').stroke();

  doc.y = y + 14;
  doc.font('Helvetica-Bold').fontSize(13).fillColor(moyenneGenerale >= 10 ? VERT : '#D70015')
    .text(`Moyenne générale : ${moyenneGenerale.toFixed(2)} / 20`, 50, doc.y, { align: 'right', width: 495 });
  doc.moveDown(0.5);
  doc.fillColor('#1D1D1F').font('Helvetica').fontSize(10).text(`Appréciation : ${appreciation.texte}`, 50);
  doc.moveDown(2);
  doc.text('Cachet et signature de la Direction', { align: 'right' });
  piedDePage(doc, `BUL-${etudiant.matricule}`);
  doc.end();
});

const generateRecu = ah(async (req, res) => {
  const paiement = await loadPaiement(req.user, req.params.paiementId, {
    etudiant: { include: { filiere: true } },
    etablissement: { select: { nom: true, telephone: true, email: true } }
  });

  const doc = new PDFDocument({ margin: 40, size: 'A5' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=recu_${safeName(paiement.reference)}.pdf`);
  doc.pipe(res);

  entete(doc, paiement.etablissement?.nom, 'REÇU DE PAIEMENT');
  doc.fontSize(9).fillColor(GRIS)
    .text(`Réf. ${paiement.reference}`, { align: 'right' })
    .text(`Date : ${new Date(paiement.datePaiement || paiement.createdAt).toLocaleDateString('fr-FR')}`, { align: 'right' });
  doc.moveDown();
  doc.fillColor('#1D1D1F').font('Helvetica-Bold').fontSize(10).text('Reçu de');
  doc.font('Helvetica').text(`${paiement.etudiant.nom} ${paiement.etudiant.prenom} — ${paiement.etudiant.matricule}`)
    .text(`Filière : ${paiement.etudiant.filiere?.nom || '—'}`);
  doc.moveDown();
  doc.font('Helvetica-Bold').text('Objet');
  doc.font('Helvetica').text(paiement.description || paiement.typePaiement || 'Frais de scolarité')
    .text(`Période : ${paiement.mois || ''} ${paiement.annee || ''}`);
  doc.moveDown();
  doc.font('Helvetica-Bold').fontSize(13).fillColor(BLEU).text(`Montant payé : ${formatMontant(paiement.montantPaye)}`, { align: 'center' });
  doc.font('Helvetica').fontSize(9).fillColor(GRIS).text(`sur ${formatMontant(paiement.montant)} dû`, { align: 'center' });
  const statutText = { PAYE: 'PAYÉ', PARTIEL: 'PARTIEL', IMPAYE: 'IMPAYÉ' };
  doc.moveDown(0.5).fillColor('#1D1D1F').fontSize(10).text(`Statut : ${statutText[paiement.statut]}`, { align: 'center' });
  doc.moveDown(2).text('Signature', { align: 'right' });
  doc.end();
});

/**
 * Attestation d'inscription / certificat de scolarité.
 * Accessible à l'étudiant uniquement si une requête correspondante a été TRAITÉE,
 * au personnel de l'établissement à tout moment.
 */
const generateAttestation = ah(async (req, res) => {
  const etudiant = await loadEtudiantForUser(req.user, req.params.etudiantId, { filiere: true, niveau: true, etablissement: true });
  const type = req.query.type === 'CERTIFICAT_SCOLARITE' ? 'CERTIFICAT_SCOLARITE' : 'ATTESTATION_INSCRIPTION';

  let numero = `ATT-${etudiant.matricule}-${Date.now().toString().slice(-6)}`;
  if (req.user.role === 'ETUDIANT') {
    const requete = await prisma.requete.findFirst({
      where: { etudiantId: etudiant.id, type, statut: 'TRAITEE' }, orderBy: { traiteLe: 'desc' }
    });
    if (!requete) throw new HttpError(403, 'Aucune demande validée pour ce document. Déposez une requête.');
    numero = requete.numero;
  }

  const titre = type === 'CERTIFICAT_SCOLARITE' ? 'CERTIFICAT DE SCOLARITÉ' : "ATTESTATION D'INSCRIPTION";
  const anneeScolaire = (() => {
    const d = new Date(); const y = d.getFullYear();
    return d.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  })();

  const doc = new PDFDocument({ margin: 60, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${type.toLowerCase()}_${safeName(etudiant.matricule)}.pdf`);
  doc.pipe(res);

  entete(doc, etudiant.etablissement?.nom, titre);
  doc.moveDown(2).font('Helvetica').fontSize(11).fillColor('#1D1D1F').text(
    `La Direction de l'établissement « ${etudiant.etablissement?.nom} » atteste que :`, { align: 'left' }
  );
  doc.moveDown();
  doc.font('Helvetica-Bold').fontSize(14).text(`${etudiant.nom.toUpperCase()} ${etudiant.prenom}`, { align: 'center' });
  doc.font('Helvetica').fontSize(10).fillColor(GRIS).text(
    `Matricule ${etudiant.matricule}${etudiant.dateNaissance ? ` · né(e) le ${new Date(etudiant.dateNaissance).toLocaleDateString('fr-FR')}` : ''}`,
    { align: 'center' }
  );
  doc.moveDown().fillColor('#1D1D1F').fontSize(11).text(
    `est régulièrement inscrit(e) pour l'année académique ${anneeScolaire} en filière « ${etudiant.filiere?.nom || '—'} »` +
    `${etudiant.niveau ? `, niveau « ${etudiant.niveau.nom} »` : ''}.`,
    { align: 'justify' }
  );
  doc.moveDown().text('En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.', { align: 'justify' });
  doc.moveDown(3).text(`Fait à Djibouti, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
  doc.moveDown().font('Helvetica-Bold').text('La Direction', { align: 'right' });
  piedDePage(doc, numero);
  doc.end();
});

module.exports = { generateBulletin, generateRecu, generateAttestation };
