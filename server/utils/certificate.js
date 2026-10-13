/* ============================================================
   CERTIFICATE GENERATOR — PDF (server-side)
   Big Little Things Foundation brand palette:
     Red:      #D0021B
     Black:    #0D0D0D
     Charcoal: #1A1A1A
     Gray:     #555555
   Logo: /public/assets/img/blt-logo.jpeg
   ============================================================ */
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BRAND = {
  red:      '#D0021B',
  redDark:  '#A50015',
  black:    '#0D0D0D',
  charcoal: '#1A1A1A',
  gray:     '#555555',
  light:    '#E8E8E8',
  white:    '#FFFFFF'
};

const LOGO_PATH = path.join(__dirname, '..', '..', 'public', 'assets', 'img', 'blt-logo.jpeg');

function generateCertificateCode() {
  return 'BLT-' + crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
}

function streamCertificate(res, data) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 40,
    info: {
      Title: `Certificate of Appreciation — ${data.volunteerName}`,
      Author: 'Big Little Things Foundation',
      Subject: 'Volunteer Certificate',
      Keywords: `BLT, volunteer, certificate, ${data.code}`
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="BLT-Certificate-${data.code}.pdf"`);
  doc.pipe(res);

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  /* ---------------- BACKGROUND ---------------- */
  doc.rect(0, 0, pageW, pageH).fill(BRAND.white);

  /* ---------------- OUTER RED BORDER ---------------- */
  doc.rect(20, 20, pageW - 40, pageH - 40)
     .lineWidth(4)
     .stroke(BRAND.red);

  /* ---------------- INNER THIN BLACK BORDER ---------------- */
  doc.rect(32, 32, pageW - 64, pageH - 64)
     .lineWidth(1)
     .stroke(BRAND.black);

  /* ---------------- CORNER ACCENTS ---------------- */
  const cornerSize = 30;
  doc.moveTo(20, 20 + cornerSize).lineTo(20, 20).lineTo(20 + cornerSize, 20)
     .lineWidth(6).stroke(BRAND.red);
  doc.moveTo(pageW - 20 - cornerSize, 20).lineTo(pageW - 20, 20).lineTo(pageW - 20, 20 + cornerSize)
     .lineWidth(6).stroke(BRAND.red);
  doc.moveTo(20, pageH - 20 - cornerSize).lineTo(20, pageH - 20).lineTo(20 + cornerSize, pageH - 20)
     .lineWidth(6).stroke(BRAND.red);
  doc.moveTo(pageW - 20 - cornerSize, pageH - 20).lineTo(pageW - 20, pageH - 20).lineTo(pageW - 20, pageH - 20 - cornerSize)
     .lineWidth(6).stroke(BRAND.red);

  /* ---------------- LOGO ---------------- */
  const logoWidth = 90;
  const logoTop = 50;
  const logoLeft = (pageW - logoWidth) / 2;
  try {
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, logoLeft, logoTop, { width: logoWidth });
    }
  } catch (err) {
    console.warn('Certificate logo not loaded:', err.message);
  }

  /* ---------------- BRAND LINE ---------------- */
  doc.fontSize(11)
     .fillColor(BRAND.red)
     .font('Helvetica-Bold')
     .text('BIG LITTLE THINGS FOUNDATION', 0, 160, { align: 'center', characterSpacing: 3 });

  /* ---------------- TITLE ---------------- */
  doc.fontSize(34)
     .fillColor(BRAND.black)
     .font('Times-Bold')
     .text('Certificate of Appreciation', 0, 182, { align: 'center' });

  /* Thin red divider under title */
  doc.moveTo(pageW / 2 - 60, 228)
     .lineTo(pageW / 2 + 60, 228)
     .lineWidth(2)
     .stroke(BRAND.red);

  /* ---------------- PRESENTATION LINE ---------------- */
  doc.fontSize(12)
     .fillColor(BRAND.gray)
     .font('Helvetica')
     .text('This certificate is proudly presented to', 0, 258, { align: 'center' });

  /* ---------------- VOLUNTEER NAME ---------------- */
  doc.fontSize(30)
     .fillColor(BRAND.red)
     .font('Times-BoldItalic')
     .text(data.volunteerName, 0, 288, { align: 'center' });

  /* ---------------- STATEMENT ---------------- */
  doc.fontSize(12)
     .fillColor(BRAND.gray)
     .font('Helvetica')
     .text(`for volunteering ${data.hours} hour${parseFloat(data.hours) === 1 ? '' : 's'} at`, 0, 340, { align: 'center' });

  /* ---------------- EVENT NAME ---------------- */
  doc.fontSize(18)
     .fillColor(BRAND.black)
     .font('Times-Bold')
     .text(data.sessionTitle, 100, 366, { align: 'center', width: pageW - 200 });

  /* ---------------- DATE ---------------- */
  const formattedDate = new Date(data.sessionDate).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.fontSize(12)
     .fillColor(BRAND.gray)
     .font('Helvetica')
     .text(`on ${formattedDate}`, 0, 400, { align: 'center' });

  /* ---------------- CLOSING LINE ---------------- */
  doc.fontSize(13)
     .fillColor(BRAND.charcoal)
     .font('Times-Italic')
     .text('Thank you for making a difference.', 0, 460, { align: 'center' });

  /* ---------------- CERTIFICATE ID (bottom centre of the same page) ---------------- */
  doc.fontSize(9)
     .fillColor('#999999')
     .font('Helvetica')
     .text(`Certificate ID: ${data.code}`, 0, pageH - 60, { align: 'center', characterSpacing: 1.5 });

  doc.end();
}

module.exports = { generateCertificateCode, streamCertificate };