const http = require("http");
const { PDFDocument, rgb } = require("pdf-lib");
const QRCode = require("qrcode");

const UPSTREAM = "https://raw.githubusercontent.com/MRGT2025/zagros-holdings/sailcertificate-direct-pdf/httproyal-oman-customs.sailcertificate.mrgt.co.pdf";
const PORT = process.env.PORT || 3000;
const MGTB_URL = "https://royal-oman-customs.sailcertificate.mrgt.co/MGTB";

let sourceCache = null;
let mgtbCache = null;

async function getSourcePdf() {
  if (sourceCache) return sourceCache;
  const response = await fetch(UPSTREAM, { redirect: "follow" });
  if (!response.ok) throw new Error(`Upstream PDF returned ${response.status}`);
  sourceCache = Buffer.from(await response.arrayBuffer());
  return sourceCache;
}

async function getMgtbPdf() {
  if (mgtbCache) return mgtbCache;

  const source = await getSourcePdf();
  const pdf = await PDFDocument.load(source);

  // Keep only pages 1-2. The manifest (page 3) is removed.
  while (pdf.getPageCount() > 2) pdf.removePage(2);

  const page = pdf.getPage(1);
  const { height } = page.getSize();

  // Cover the original QR only; everything else remains untouched.
  page.drawRectangle({
    x: 34,
    y: height - 571.5,
    width: 67.5,
    height: 70,
    color: rgb(1, 1, 1),
    borderWidth: 0
  });

  const qrPng = await QRCode.toBuffer(MGTB_URL, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 4,
    scale: 12
  });
  const qrImage = await pdf.embedPng(qrPng);
  page.drawImage(qrImage, {
    x: 36,
    y: height - 567,
    width: 63.5,
    height: 63.5
  });

  mgtbCache = Buffer.from(await pdf.save({ useObjectStreams: false }));
  return mgtbCache;
}

function sendPdf(req, res, pdf, filename) {
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${filename}"`,
    "Content-Length": pdf.length,
    "Cache-Control": "public, max-age=300",
    "X-Content-Type-Options": "nosniff"
  });
  if (req.method === "HEAD") return res.end();
  res.end(pdf);
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;

  try {
    if (pathname === "/" || pathname === "") {
      const pdf = await getSourcePdf();
      return sendPdf(req, res, pdf, "SAILCERTIFICATE.pdf");
    }

    if (pathname === "/MGTB" || pathname === "/MGTB.pdf" || pathname === "/mgtb") {
      const pdf = await getMgtbPdf();
      return sendPdf(req, res, pdf, "SAILCERTIFICATE-MGTB.pdf");
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  } catch (error) {
    console.error(error);
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("PDF temporarily unavailable");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`PDF host listening on port ${PORT}`);
});
