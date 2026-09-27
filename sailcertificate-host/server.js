const http = require("http");

const PDF_URL = "https://raw.githubusercontent.com/MRGT2025/zagros-holdings/sailcertificate-direct-pdf/httproyal-oman-customs.sailcertificate.mrgt.co.pdf";
const PORT = process.env.PORT || 3000;

let pdfCache = null;

async function getPdf() {
  if (pdfCache) return pdfCache;
  const response = await fetch(PDF_URL, { redirect: "follow", cache: "no-store" });
  if (!response.ok) throw new Error(`PDF source returned ${response.status}`);
  pdfCache = Buffer.from(await response.arrayBuffer());
  return pdfCache;
}

function sendPdf(req, res, pdf) {
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'inline; filename="SAILCERTIFICATE.pdf"',
    "Content-Length": pdf.length,
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    "X-Content-Type-Options": "nosniff"
  });
  if (req.method === "HEAD") return res.end();
  res.end(pdf);
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;

  try {
    if (
      pathname === "/" ||
      pathname === "" ||
      pathname === "/MGTB" ||
      pathname === "/MGTB.pdf" ||
      pathname === "/mgtb"
    ) {
      const pdf = await getPdf();
      return sendPdf(req, res, pdf);
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
