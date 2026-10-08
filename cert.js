// ============================================================
// NeuraX Certificate Generator
// ============================================================
// IMPORTANT:
// The certificate is rendered ONCE with the browser Canvas API.
// The exact same rendered canvas is then placed into the PDF.
//
// This makes the PDF visually match the PNG because the browser
// renders the background, Montserrat text, and QR together.
//
// Template: 1536 x 1024 px
// PDF:      300 x 200 mm
// ============================================================

const TPL_W = 1536;
const TPL_H = 1024;

const PAGE_W = 300;
const PAGE_H = 200;

const TEMPLATE_PATH = "./template.jpg";

// ============================================================
// MONTSERRAT FONT FILES
// ============================================================
//
// Put these files inside:
//
// fonts/
//
// Your GitHub repository should contain:
//
// fonts/
//   Montserrat-LightItalic.ttf
//   Montserrat-Medium.ttf
//   Montserrat-Bold.ttf
//
// ============================================================

const FONT_FILES = {
  lightItalic: "./fonts/Montserrat-LightItalic.ttf",
  medium: "./fonts/Montserrat-Medium.ttf",
  bold: "./fonts/Montserrat-Bold.ttf"
};

// ============================================================
// CERTIFICATE POSITIONS
// ============================================================
//
// These coordinates are based on your 1536 x 1024 PNG.
//
// IMPORTANT:
// These are PIXEL coordinates, not PDF millimeters.
// ============================================================

const DESIGN = {

  // ----------------------------------------------------------
  // STUDENT NAME
  // ----------------------------------------------------------
  name: {
    x: 768,
    baselineY: 400,

    // Maximum width of the name.
    maxWidth: 760,

    // Starting font size.
    fontSize: 62,

    // Smallest font size allowed for long names.
    minFontSize: 34,

    color: "#123A9B"
  },

  // ----------------------------------------------------------
  // ISSUE DATE
  // ----------------------------------------------------------
  date: {
    x: 282,
    baselineY: 857,

    maxWidth: 300,

    fontSize: 20,

    color: "#142B55"
  },

  // ----------------------------------------------------------
  // CERTIFICATE ID
  // ----------------------------------------------------------
  id: {
    x: 780,
    baselineY: 783,

    maxWidth: 220,

    fontSize: 19,

    color: "#123A9B"
  },

  // ----------------------------------------------------------
  // QR CODE
  // ----------------------------------------------------------
  qr: {
    x: 1060,
    y: 826,
    size: 90
  }
};

// ============================================================
// LOAD IMAGE
// ============================================================

function loadImage(src) {

  return new Promise((resolve, reject) => {

    const img = new Image();

    img.onload = () => {
      resolve(img);
    };

    img.onerror = () => {
      reject(
        new Error(
          `Could not load image: ${src}`
        )
      );
    };

    img.src = src;
  });
}

// ============================================================
// LOAD FONT INTO BROWSER
// ============================================================

async function loadBrowserFont(
  family,
  url,
  weight,
  style = "normal"
) {

  const font = new FontFace(
    family,
    `url("${url}")`,
    {
      weight: String(weight),
      style: style
    }
  );

  await font.load();

  document.fonts.add(font);

  return font;
}

// ============================================================
// LOAD ALL CERTIFICATE FONTS
// ============================================================

async function loadCertificateFonts() {

  // Prevent loading the fonts every time a certificate
  // is generated.
  if (window.__neuraXFontsLoaded) {
    return;
  }

  await Promise.all([

    // Student Name
    loadBrowserFont(
      "NeuraXLightItalic",
      FONT_FILES.lightItalic,
      300,
      "italic"
    ),

    // Issue Date
    loadBrowserFont(
      "NeuraXMedium",
      FONT_FILES.medium,
      500,
      "normal"
    ),

    // Certificate ID
    loadBrowserFont(
      "NeuraXBold",
      FONT_FILES.bold,
      700,
      "normal"
    )

  ]);

  // Wait until browser fonts are ready.
  await document.fonts.ready;

  // Warm up the fonts.
  await Promise.all([

    document.fonts.load(
      `italic 300 ${DESIGN.name.fontSize}px NeuraXLightItalic`
    ),

    document.fonts.load(
      `500 ${DESIGN.date.fontSize}px NeuraXMedium`
    ),

    document.fonts.load(
      `700 ${DESIGN.id.fontSize}px NeuraXBold`
    )

  ]);

  window.__neuraXFontsLoaded = true;
}

// ============================================================
// FORMAT DATE
// ============================================================
//
// Example:
//
// 2026-10-09
//
// becomes:
//
// October 9, 2026
//
// ============================================================

function prettyDate(iso) {

  if (!iso) {
    return "";
  }

  const [y, m, d] =
    iso.split("-").map(Number);

  return new Date(
    Date.UTC(
      y,
      m - 1,
      d
    )
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
// FIT FONT SIZE
// ============================================================
//
// Automatically reduces the font size when the student name
// is too long.
// ============================================================

function fitFontSize(
  ctx,
  text,
  makeFont,
  startSize,
  minSize,
  maxWidth
) {

  let size = startSize;

  while (size > minSize) {

    ctx.font = makeFont(size);

    const width =
      ctx.measureText(text).width;

    if (width <= maxWidth) {
      break;
    }

    size -= 1;
  }

  ctx.font = makeFont(size);

  return size;
}

// ============================================================
// DRAW CENTERED TEXT
// ============================================================

function drawCenteredText(
  ctx,
  text,
  x,
  baselineY
) {

  ctx.textAlign = "center";

  ctx.textBaseline = "alphabetic";

  ctx.fillText(
    text,
    x,
    baselineY
  );
}

// ============================================================
// CREATE QR CODE
// ============================================================

function createQrDataUrl(url) {

  const qr =
    qrcode(0, "M");

  qr.addData(url);

  qr.make();

  return qr.createDataURL(10);
}

// ============================================================
// RENDER COMPLETE CERTIFICATE
// ============================================================
//
// Everything is rendered onto ONE canvas.
//
// Background
// Student Name
// Issue Date
// Certificate ID
// QR
//
// Then this exact canvas is used for the PDF.
// ============================================================

async function renderCertificateCanvas(c) {

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
  // Load fonts
  // ----------------------------------------------------------

  await loadCertificateFonts();

  // ----------------------------------------------------------
  // Load certificate background
  // ----------------------------------------------------------

  const template =
    await loadImage(
      TEMPLATE_PATH
    );

  // ----------------------------------------------------------
  // Create exact 1536 × 1024 canvas
  // ----------------------------------------------------------

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    TPL_W;

  canvas.height =
    TPL_H;

  const ctx =
    canvas.getContext("2d");

  // High quality rendering.
  ctx.imageSmoothingEnabled = true;

  ctx.imageSmoothingQuality =
    "high";

  // ==========================================================
  // BACKGROUND
  // ==========================================================

  ctx.drawImage(
    template,
    0,
    0,
    TPL_W,
    TPL_H
  );

  // ==========================================================
  // STUDENT NAME
  // ==========================================================

  const nameFont =
    size =>
      `italic 300 ${size}px "NeuraXLightItalic"`;

  const nameSize =
    fitFontSize(
      ctx,
      c.name,
      nameFont,
      DESIGN.name.fontSize,
      DESIGN.name.minFontSize,
      DESIGN.name.maxWidth
    );

  ctx.font =
    nameFont(nameSize);

  ctx.fillStyle =
    DESIGN.name.color;

  drawCenteredText(
    ctx,
    c.name,
    DESIGN.name.x,
    DESIGN.name.baselineY
  );

  // ==========================================================
  // ISSUE DATE
  // ==========================================================

  const date =
    prettyDate(c.date);

  ctx.font =
    `500 ${DESIGN.date.fontSize}px "NeuraXMedium"`;

  ctx.fillStyle =
    DESIGN.date.color;

  drawCenteredText(
    ctx,
    date,
    DESIGN.date.x,
    DESIGN.date.baselineY
  );

  // ==========================================================
  // CERTIFICATE ID
  // ==========================================================

  ctx.font =
    `700 ${DESIGN.id.fontSize}px "NeuraXBold"`;

  ctx.fillStyle =
    DESIGN.id.color;

  drawCenteredText(
    ctx,
    c.id,
    DESIGN.id.x,
    DESIGN.id.baselineY
  );

  // ==========================================================
  // QR CODE
  // ==========================================================

  const qrDataUrl =
    createQrDataUrl(
      c.verifyUrl
    );

  const qrImage =
    await loadImage(
      qrDataUrl
    );

  ctx.drawImage(
    qrImage,
    DESIGN.qr.x,
    DESIGN.qr.y,
    DESIGN.qr.size,
    DESIGN.qr.size
  );

  // ----------------------------------------------------------
  // Return final certificate canvas
  // ----------------------------------------------------------

  return canvas;
}

// ============================================================
// CREATE PDF
// ============================================================
//
// IMPORTANT:
//
// The PDF does NOT render Student Name, Date or ID itself.
//
// Instead, the already-rendered canvas is inserted into the PDF.
//
// Therefore:
//
//        PNG appearance
//             =
//        Canvas appearance
//             =
//        PDF appearance
//
// ============================================================

async function makeCertificate(c) {

  const { jsPDF } =
    window.jspdf;

  // Render the complete certificate once.
  const canvas =
    await renderCertificateCanvas(c);

  // ----------------------------------------------------------
  // Create PDF
  // ----------------------------------------------------------

  const doc =
    new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [
        PAGE_W,
        PAGE_H
      ],
      compress: true
    });

  // ----------------------------------------------------------
  // Put exact canvas into PDF
  // ----------------------------------------------------------

  doc.addImage(
    canvas,
    "PNG",
    0,
    0,
    PAGE_W,
    PAGE_H,
    undefined,
    "FAST"
  );

  return doc;
}

// ============================================================
// OPTIONAL PNG DOWNLOAD
// ============================================================
//
// You can use this to compare the PNG and PDF.
//
// Example:
//
// const canvas = await renderCertificateCanvas(c);
// downloadCertificatePNG(c);
//
// ============================================================

async function downloadCertificatePNG(c) {

  const canvas =
    await renderCertificateCanvas(c);

  const link =
    document.createElement(
      "a"
    );

  link.download =
    `Certificate-${c.id}.png`;

  link.href =
    canvas.toDataURL(
      "image/png"
    );

  link.click();
}
