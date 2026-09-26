const http = require("http");

const UPSTREAM = "https://www.mrgt.co/s/httpsroyal-oman-customssailcertificatemrgtco.pdf";
const PORT = process.env.PORT || 3000;

async function getPdf() {
  const response = await fetch(UPSTREAM, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Upstream PDF returned ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;

  if (pathname !== "/") {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  try {
    const pdf = await getPdf();
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="SAILCERTIFICATE.pdf"',
      "Content-Length": pdf.length,
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff"
    });

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    res.end(pdf);
  } catch (error) {
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("PDF temporarily unavailable");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`PDF host listening on port ${PORT}`);
});
