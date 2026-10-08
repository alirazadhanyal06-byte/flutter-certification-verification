// Builds the certificate PDF (A4 landscape) with a QR code that points to the verify page.
function makeCertificate(c) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210, navy = [13, 71, 161], gold = [191, 144, 0];

  doc.setDrawColor(...navy); doc.setLineWidth(2.5); doc.rect(8, 8, W - 16, H - 16);
  doc.setDrawColor(...gold); doc.setLineWidth(0.6); doc.rect(13, 13, W - 26, H - 26);

  doc.setTextColor(...navy); doc.setFont("helvetica", "bold"); doc.setFontSize(38);
  doc.text("CERTIFICATE OF COMPLETION", W / 2, 50, { align: "center" });

  doc.setTextColor(90); doc.setFont("helvetica", "normal"); doc.setFontSize(15);
  doc.text("This is to certify that", W / 2, 72, { align: "center" });

  doc.setTextColor(...navy); doc.setFont("helvetica", "bolditalic");
  let size = 36; doc.setFontSize(size);
  while (doc.getTextWidth(c.name) > 230 && size > 16) { size -= 2; doc.setFontSize(size); }
  doc.text(c.name, W / 2, 95, { align: "center" });
  doc.setDrawColor(...gold); doc.setLineWidth(0.5); doc.line(60, 100, W - 60, 100);

  doc.setTextColor(90); doc.setFont("helvetica", "normal"); doc.setFontSize(15);
  doc.text("has successfully completed and passed the", W / 2, 116, { align: "center" });
  doc.setTextColor(30); doc.setFont("helvetica", "bold"); doc.setFontSize(22);
  doc.text(c.course, W / 2, 130, { align: "center" });

  doc.setTextColor(90); doc.setFont("helvetica", "normal"); doc.setFontSize(13);
  doc.text("Date: " + c.date, 30, 175);
  doc.text("Certificate ID: " + c.id, 30, 183);

  const qr = qrcode(0, "M"); qr.addData(c.verifyUrl); qr.make();
  doc.addImage(qr.createDataURL(8), "PNG", W - 65, 150, 36, 36);
  doc.setFontSize(9); doc.text("Scan to verify", W - 47, 190, { align: "center" });
  return doc;
}
