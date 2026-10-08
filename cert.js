// ============================================================
// NeuraX Certificate Generator
// Template: 1536 x 1024 px
// PDF: 300 x 200 mm
// ============================================================

const TPL_W = 1536;
const TPL_H = 1024;

const PAGE_W = 300;
const PAGE_H = 200;

const K = PAGE_W / TPL_W;


// ------------------------------------------------------------
// Load certificate template
// ------------------------------------------------------------

function loadTemplate() {
  return new Promise((res, rej) => {
    const img = new Image();

    img.onload = () => res(img);
    img.onerror = () => rej(new Error("template.jpg not found"));

    img.src = "template.jpg";
  });
}


// ------------------------------------------------------------
// Convert ArrayBuffer → Base64
// Required by jsPDF's addFileToVFS()
// ------------------------------------------------------------

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + chunkSize)
    );
  }

  return btoa(binary);
}


// ------------------------------------------------------------
// Load a TTF font into jsPDF
// ------------------------------------------------------------

async function loadFont(doc, file, family, style) {

  const response = await fetch(file);

  if (!response.ok) {
    throw new Error(`Font not found: ${file}`);
  }

  const buffer = await response.arrayBuffer();

  const base64 = arrayBufferToBase64(buffer);

  doc.addFileToVFS(file, base64);

  doc.addFont(file, family, style);
}


// ------------------------------------------------------------
// Date formatting
// Example: 2026-10-09 → October 9, 2026
// ------------------------------------------------------------

function prettyDate(iso) {

  const [y, m, d] = iso.split("-").map(Number);

  return new Date(
    Date.UTC(y, m - 1, d)
  ).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }
  );
}


// ============================================================
// CREATE CERTIFICATE
// ============================================================

async function makeCertificate(c) {

  const { jsPDF } = window.jspdf;

  const img = await loadTemplate();

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [PAGE_W, PAGE_H]
  });


  // ----------------------------------------------------------
  // Load Montserrat fonts
  // ----------------------------------------------------------

  await loadFont(
    doc,
    "Montserrat-Regular.ttf",
    "Montserrat",
    "normal"
  );

  await loadFont(
    doc,
    "Montserrat-LightItalic.ttf",
    "MontserratLight",
    "italic"
  );

  await loadFont(
    doc,
    "Montserrat-Medium.ttf",
    "MontserratMedium",
    "normal"
  );

  await loadFont(
    doc,
    "Montserrat-Bold.ttf",
    "Montserrat",
    "bold"
  );


  // ----------------------------------------------------------
  // Background template
  // ----------------------------------------------------------

  doc.addImage(
    img,
    "JPEG",
    0,
    0,
    PAGE_W,
    PAGE_H
  );


  // ==========================================================
  // STUDENT NAME
  // ==========================================================

  // NeuraX blue
  doc.setTextColor(18, 58, 155);

  // Montserrat Light Italic
  doc.setFont(
    "MontserratLight",
    "italic"
  );

  let size = 46;

  doc.setFontSize(size);


  // Automatically reduce size for long names
  while (
    doc.getTextWidth(c.name) > 150 &&
    size > 24
  ) {

    size -= 2;

    doc.setFontSize(size);
  }


  // Centered
  doc.text(
    c.name,
    768 * K,
    400 * K,
    {
      align: "center"
    }
  );


  // ==========================================================
  // ISSUE DATE
  // ==========================================================

  doc.setTextColor(
    20,
    43,
    85
  );

  doc.setFont(
    "MontserratMedium",
    "normal"
  );

  doc.setFontSize(15);

  doc.text(
    prettyDate(c.date),
    282 * K,
    857 * K,
    {
      align: "center"
    }
  );


  // ==========================================================
  // CERTIFICATE ID
  // ==========================================================

  doc.setTextColor(
    18,
    58,
    155
  );

  doc.setFont(
    "Montserrat",
    "bold"
  );

  doc.setFontSize(14);

  doc.text(
    c.id,
    780 * K,
    783 * K
  );


  // ==========================================================
  // QR CODE
  // ==========================================================

  const qr = qrcode(0, "M");

  qr.addData(c.verifyUrl);

  qr.make();

  doc.addImage(
    qr.createDataURL(10),
    "PNG",
    1060 * K,
    826 * K,
    90 * K,
    90 * K
  );


  return doc;
}
