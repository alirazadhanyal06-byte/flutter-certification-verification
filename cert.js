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
const FONT_FILES = {
  lightItalic: "./fonts/Montserrat-LightItalic.ttf",
  medium: "./fonts/Montserrat-Medium.ttf",
  bold: "./fonts/Montserrat-Bold.ttf"
};

// ============================================================
// CERTIFICATE POSITIONS
// ============================================================
const DESIGN = {
  // ----------------------------------------------------------
  // STUDENT NAME
  // ----------------------------------------------------------
  name: {
    x: 768,
    baselineY: 400,
    maxWidth: 760,
    fontSize: 62,
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
  // CERTIFICATE ID (FIXED: Cleaned configuration variables)
  // ----------------------------------------------------------
  id: {
    x: 640,         // Base position matching layout box starting point
    baselineY: 857, // Aligned along the date line baseline
    fontSize: 20,
    color: "#142B55"
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
// UTILITY FUNCTIONS
// ============================================================
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

async function loadBrowserFont(family, url, weight, style = "normal") {
  const font = new FontFace(family, `url("${url}")`, { weight: String(weight), style: style });
  await font.load();
  document.fonts.add(font);
  return font;
}

async function loadCertificateFonts() {
  if (window.__neuraXFontsLoaded) return;

  await Promise.all([
    loadBrowserFont("NeuraXLightItalic", FONT_FILES.lightItalic, 300, "italic"),
    loadBrowserFont("NeuraXMedium", FONT_FILES.medium, 500, "normal"),
    loadBrowserFont("NeuraXBold", FONT_FILES.bold, 700, "normal")
  ]);

  await document.fonts.ready;

  await Promise.all([
    document.fonts.load(`italic 300 ${DESIGN.name.fontSize}px NeuraXLightItalic`),
    document.fonts.load(`500 ${DESIGN.date.fontSize}px NeuraXMedium`),
    document.fonts.load(`700 ${DESIGN.id.fontSize}px NeuraXBold`)
  ]);

  window.__neuraXFontsLoaded = true;
}

function prettyDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

function fitFontSize(ctx, text, makeFont, startSize, minSize, maxWidth) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = makeFont(size);
    const width = ctx.measureText(text).width;
    if (width <= maxWidth) break;
    size -= 1;
  }
  ctx.font = makeFont(size);
  return size;
}

function drawCenteredText(ctx, text, x, baselineY) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, baselineY);
}

function createQrDataUrl(url) {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  return qr.createDataURL(10);
}

// ============================================================
// RENDER COMPLETE CERTIFICATE
// ============================================================
async function renderCertificateCanvas(c) {
  if (!c || !c.name || !c.date || !c.id || !c.verifyUrl) {
    throw new Error("Missing certificate execution data mapping properties.");
  }

  await loadCertificateFonts();

  // Create canvas context template
  const canvas = document.createElement("canvas");
  canvas.width = TPL_W;
  canvas.height = TPL_H;
  const ctx = canvas.getContext("2d");

  // Draw background template image
  const background = await loadImage(TEMPLATE_PATH);
  ctx.drawImage(background, 0, 0, TPL_W, TPL_H);

  // 1. Draw Student Name (Dynamic Sizing)
  fitFontSize(
    ctx, 
    c.name, 
    (size) => `italic 300 ${size}px "NeuraXLightItalic"`, 
    DESIGN.name.fontSize, 
    DESIGN.name.minFontSize, 
    DESIGN.name.maxWidth
  );
  ctx.fillStyle = DESIGN.name.color;
  drawCenteredText(ctx, c.name, DESIGN.name.x, DESIGN.name.baselineY);

  // 2. Draw Issue Date
  ctx.font = `500 ${DESIGN.date.fontSize}px "NeuraXMedium"`;
  ctx.fillStyle = DESIGN.date.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(prettyDate(c.date), DESIGN.date.x, DESIGN.date.baselineY);

  // 3. Draw Dynamic ID (FIXED: Left aligned & offset past background text block)
  ctx.font = `700 ${DESIGN.id.fontSize}px "NeuraXBold"`;
  ctx.fillStyle = DESIGN.id.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Shift value to nudge text safely to the right of "Certificate ID:" background text layout 
  const offsetX = 110; 
  ctx.fillText(
    c.id,
    DESIGN.id.x + offsetX,
    DESIGN.id.baselineY
  );

  // 4. Draw QR Code
  const qrDataUrl = createQrDataUrl(c.verifyUrl);
  const qrImage = await loadImage(qrDataUrl);
  ctx.drawImage(qrImage, DESIGN.qr.x, DESIGN.qr.y, DESIGN.qr.size, DESIGN.qr.size);

  return canvas;
}
