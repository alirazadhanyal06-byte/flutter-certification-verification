// Draws the NeuraX certificate: template.jpg as background + name, date, ID and QR code on top.
// Coordinates are in pixels of the 1536x1024 template image.
const TPL_W = 1536, TPL_H = 1024, PAGE_W = 300, PAGE_H = 200, K = PAGE_W / TPL_W;

function loadTemplate() {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("template.jpg not found"));
    img.src = "template.jpg";
  });
}
function prettyDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US",
    { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

async function makeCertificate(c) {
  const { jsPDF } = window.jspdf;
  const img = await loadTemplate();
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [PAGE_W, PAGE_H] });
  doc.addImage(img, "JPEG", 0, 0, PAGE_W, PAGE_H);

  // Student name (centered above the line)
  doc.setTextColor(10, 40, 200); doc.setFont("helvetica", "bolditalic");
  let size = 46; doc.setFontSize(size);
  while (doc.getTextWidth(c.name) > 150 && size > 18) { size -= 2; doc.setFontSize(size); }
  doc.text(c.name, 768 * K, 400 * K, { align: "center" });

  // Issue date (above the "Issue Date" line)
  doc.setTextColor(20, 40, 110); doc.setFont("helvetica", "normal"); doc.setFontSize(15);
  doc.text(prettyDate(c.date), 282 * K, 857 * K, { align: "center" });

  // Certificate ID (inside the pill, after "Certificate ID:")
  doc.setTextColor(10, 40, 200); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text(c.id, 780 * K, 783 * K);

  // QR code (left of the "Verify this certificate at" text)
  const qr = qrcode(0, "M"); qr.addData(c.verifyUrl); qr.make();
  doc.addImage(qr.createDataURL(10), "PNG", 1060 * K, 826 * K, 90 * K, 90 * K);
  return doc;
}
