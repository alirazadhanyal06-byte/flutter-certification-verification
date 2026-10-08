// ============================================================
// NeuraX Certificate Generator
// ============================================================
// Template: 1536 x 1024 px
// PDF: 300 x 200 mm
// Font: Montserrat
// ============================================================

const TPL_W = 1536;
const TPL_H = 1024;

const PAGE_W = 300;
const PAGE_H = 200;

const K = PAGE_W / TPL_W;

// ============================================================
// FILE PATHS
// ============================================================

const TEMPLATE_PATH = "./template.jpg";

const FONT_PATHS = {
  regular: "./fonts/Montserrat-Regular.ttf",
  lightItalic: "./fonts/Montserrat-LightItalic.ttf",
  medium: "./fonts/Montserrat-Medium.ttf",
  bold: "./fonts/Montserrat-Bold.ttf"
};

// ============================================================
// LOAD CERTIFICATE TEMPLATE
// ============================================================

function loadTemplate() {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () => {
      reject(
        new Error(
          `Certificate template not found: ${TEMPLATE_PATH}`
        )
      );
    };

    img.src = TEMPLATE_PATH;
  });
}

// ============================================================
// ARRAY BUFFER → BASE64
// ============================================================

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

// ============================================================
// LOAD TTF FONT INTO JSPDF
// ============================================================

async function loadFont(doc, file, family, style) {

  const response = await fetch(file, {
    cache: "no-cache"
  });

  if (!response.ok) {
    throw new Error(
      `Font could not be loaded (${response.status}): ${file}`
    );
  }

  const buffer = await response.arrayBuffer();

  if (!buffer.byteLength) {
    throw new Error(`Font file is empty: ${file}`);
  }

  const base64 = arrayBufferToBase64(buffer);

  doc.addFileToVFS(
    file,
    base64
  );

  doc.addFont(
    file,
    family,
    style
  );
}

// ============================================================
// LOAD ALL MONTSERRAT FONTS
// ============================================================

async function loadMontserratFonts(doc) {

  await loadFont(
    doc,
    FONT_PATHS.regular,
    "Montserrat",
    "normal"
  );

  await loadFont(
    doc,
    FONT_PATHS.lightItalic,
    "MontserratLight",
    "italic"
  );

  await loadFont(
    doc,
    FONT_PATHS.medium,
    "MontserratMedium",
    "normal"
  );

  await loadFont(
    doc,
    FONT_PATHS.bold,
    "Montserrat",
    "bold"
  );
}

// ============================================================
// DATE FORMATTER
// ============================================================
// Example:
// 2026-10-09
// → October 9, 2026
// ============================================================

function prettyDate(iso) {

  if (!iso) {
    return "";
  }

  const [y, m, d] = iso
    .split("-")
    .map(Number);

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

  // ----------------------------------------------------------
  // Validate certificate data
  // ----------------------------------------------------------

  if (!c) {
    throw new Error(
      "Certificate data is missing."
    );
  }

  if (!c.name) {
    throw new Error(
      "Student name is required."
    );
  }

  if (!c.date) {
    throw new Error(
      "Certificate issue date is required."
    );
  }

  if (!c.id) {
    throw new Error(
      "Certificate ID is required."
    );
  }

  if (!c.verifyUrl) {
    throw new Error(
      "Certificate verification URL is required."
    );
  }

  // ----------------------------------------------------------
  // Get jsPDF
  // ----------------------------------------------------------

  const { jsPDF } = window.jspdf;

  // ----------------------------------------------------------
  // Load template
  // ----------------------------------------------------------

  const img = await loadTemplate();

  // ----------------------------------------------------------
  // Create PDF
  // ----------------------------------------------------------

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [PAGE_W, PAGE_H],
    compress: true
  });

  // ----------------------------------------------------------
  // Load Montserrat fonts
  // ----------------------------------------------------------

  await loadMontserratFonts(doc);

  // ----------------------------------------------------------
  // Background certificate template
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
  //
  // Font:
  // Montserrat Light Italic
  //
  // Size:
  // 46 pt
  //
  // Color:
  // #123A9B
  //
  // Automatically shrinks for long names.
  // ==========================================================

  doc.setTextColor(
    18,
    58,
    155
  );

  doc.setFont(
    "MontserratLight",
    "italic"
  );

  let nameSize = 46;

  doc.setFontSize(
    nameSize
  );

  while (
    doc.getTextWidth(c.name) > 150 &&
    nameSize > 24
  ) {

    nameSize -= 2;

    doc.setFontSize(
      nameSize
    );
  }

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
  //
  // Font:
  // Montserrat Medium
  //
  // Size:
  // 15 pt
  //
  // Color:
  // #142B55
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

  doc.setFontSize(
    15
  );

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
  //
  // Font:
  // Montserrat Bold
  //
  // Size:
  // 14 pt
  //
  // Color:
  // #123A9B
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

  doc.setFontSize(
    14
  );

  doc.text(
    c.id,
    780 * K,
    783 * K
  );

  // ==========================================================
  // QR CODE
  // ==========================================================

  const qr = qrcode(
    0,
    "M"
  );

  qr.addData(
    c.verifyUrl
  );

  qr.make();

  doc.addImage(
    qr.createDataURL(10),
    "PNG",
    1060 * K,
    826 * K,
    90 * K,
    90 * K
  );

  // ==========================================================
  // RETURN PDF
  // ==========================================================

  return doc;
}
