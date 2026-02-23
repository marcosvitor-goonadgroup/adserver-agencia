import type { VercelRequest, VercelResponse } from "@vercel/node";
import https from "https";

const API_TARGET_HOST = "adserver-api.vercel.app";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const pathSegments = (req.query.path as string[]) ?? [];
  const pathname = "/" + pathSegments.join("/");

  // Preserve query string (ex: dateBegin=...&dateEnd=...)
  const fullUrl = req.url ?? "";
  const qIndex = fullUrl.indexOf("?");
  const search = qIndex !== -1 ? fullUrl.slice(qIndex) : "";

  const targetPath = pathname + search;

  const options: https.RequestOptions = {
    hostname: API_TARGET_HOST,
    path: targetPath,
    method: req.method ?? "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode ?? 200);
    res.setHeader(
      "Content-Type",
      proxyRes.headers["content-type"] ?? "application/json"
    );

    const chunks: Buffer[] = [];
    proxyRes.on("data", (chunk: Buffer) => chunks.push(chunk));
    proxyRes.on("end", () => {
      res.send(Buffer.concat(chunks));
    });
  });

  proxyReq.on("error", (err) => {
    res.status(502).json({ error: "Proxy error", detail: err.message });
  });

  proxyReq.end();
}
