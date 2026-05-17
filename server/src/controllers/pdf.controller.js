const PDFDocument = require('pdfkit');
const prisma = require('../utils/prisma');
const { getAppreciation, calculerMoyenne } = require('../utils/helpers');

const generateBulletin = async (req, res) => {
  try {
    const { etudiantId } = req.params;
    const { periode, annee } = req.query;

    const etudiant = await prisma.etudiant.findUnique({
      where: { id: etudiantId },
      include: { filiere: true, niveau: true, etablissement: true }
    });
    if (!etudiant) return res.status(404).json({ error: 'Étudiant introuvable' });

    const where = { etudiantId };
    if (periode) where.periode = periode;
    if (annee) where.annee = annee;

    const notes = await prisma.note.findMany({
      where,
      include: { matiere: { select: { id: true, nom: true, coefficient: true } } }
    });

    const matieres = [...new Map(notes.map(n => [n.matiereId, n.matiere])).values()];
    const moyenneGenerale = calculerMoyenne(notes, matieres);
    const appreciation = getAppreciation(moyenneGenerale);

    const notesByMatiere = {};
    notes.forEach(n => {
      if (!notesByMatiere[n.matiereId]) {
        notesByMatiere[n.matiereId] = { matiere: n.matiere, notes: [] };
      }
      notesByMatiere[n.matiereId].notes.push(n.valeur);
    });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bulletin_${etudiant.matricule}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text(etudiant.etablissement?.nom || 'SmartEdu ERP', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('BULLETIN DE NOTES', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Période: ${periode || 'N/A'} | Année: ${annee || new Date().getFullYear()}`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('INFORMATIONS ÉTUDIANT');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Nom: ${etudiant.nom} ${etudiant.prenom}`);
    doc.text(`Matricule: ${etudiant.matricule}`);
    doc.text(`Filière: ${etudiant.filiere?.nom || 'N/A'}`);
    doc.text(`Niveau: ${etudiant.niveau?.nom || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('RÉSULTATS PAR MATIÈRE');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const col = [50, 250, 330, 380, 440];
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('MATIÈRE', col[0], tableTop);
    doc.text('COEFF', col[1], tableTop);
    doc.text('NOTES', col[2], tableTop);
    doc.text('MOYENNE', col[3], tableTop);
    doc.text('POINTS', col[4], tableTop);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    let totalPoints = 0;
    let totalCoeff = 0;

    Object.values(notesByMatiere).forEach(item => {
      const moy = item.notes.reduce((a, b) => a + b, 0) / item.notes.length;
      const coeff = item.matiere.coefficient || 1;
      const points = moy * coeff;
      totalPoints += points;
      totalCoeff += coeff;

      doc.text(item.matiere.nom.substring(0, 25), col[0]);
      doc.text(coeff.toString(), col[1], doc.y - 11);
      doc.text(item.notes.join(', '), col[2], doc.y - 11);
      doc.text(moy.toFixed(2), col[3], doc.y - 11);
      doc.text(points.toFixed(2), col[4], doc.y - 11);
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`MOYENNE GÉNÉRALE: ${moyenneGenerale.toFixed(2)} / 20`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica');
    doc.text(`Appréciation: ${appreciation.texte}`);
    doc.moveDown(2);
    doc.text(`Fait le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.text('Cachet et Signature du Directeur', { align: 'right' });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
};

const generateRecu = async (req, res) => {
  try {
    const { paiementId } = req.params;
    const paiement = await prisma.paiement.findUnique({
      where: { id: paiementId },
      include: {
        etudiant: { include: { filiere: true } },
        etablissement: { select: { nom: true, telephone: true, email: true } }
      }
    });
    if (!paiement) return res.status(404).json({ error: 'Paiement introuvable' });

    const doc = new PDFDocument({ margin: 50, size: 'A5' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recu_${paiement.reference}.pdf`);
    doc.pipe(res);

    doc.fontSize(16).font('Helvetica-Bold').text(paiement.etablissement?.nom || 'SmartEdu', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('REÇU DE PAIEMENT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(9).text(`Réf: ${paiement.reference}`, { align: 'right' });
    doc.text(`Date: ${new Date(paiement.datePaiement || paiement.createdAt).toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(10).font('Helvetica-Bold').text('REÇU DE:');
    doc.font('Helvetica').text(`${paiement.etudiant.nom} ${paiement.etudiant.prenom}`);
    doc.text(`Matricule: ${paiement.etudiant.matricule}`);
    doc.text(`Filière: ${paiement.etudiant.filiere?.nom || 'N/A'}`);
    doc.moveDown();

    doc.font('Helvetica-Bold').text('DÉTAILS:');
    doc.font('Helvetica').text(`Objet: ${paiement.description || paiement.typePaiement || 'Frais de scolarité'}`);
    doc.text(`Période: ${paiement.mois || ''} ${paiement.annee || ''}`);
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(12).text(`MONTANT PAYÉ: ${paiement.montantPaye.toLocaleString()} FCFA`, { align: 'center' });
    doc.moveDown();

    const statutText = { PAYE: '✓ PAYÉ', PARTIEL: '~ PARTIEL', IMPAYE: '✗ IMPAYÉ' };
    doc.font('Helvetica').fontSize(10).text(`Statut: ${statutText[paiement.statut]}`, { align: 'center' });
    doc.moveDown(2);
    doc.text('Signature', { align: 'right' });
    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
};

module.exports = { generateBulletin, generateRecu };
