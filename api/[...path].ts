import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_TARGET = "https://adserver-api.vercel.app";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathSegments = (req.query.path as string[]) ?? [];
  const pathname = "/" + pathSegments.join("/");

  const search = new URL(req.url ?? "", "http://localhost").search;
  const targetUrl = `${API_TARGET}${pathname}${search}`;

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const body = await upstream.text();

  res.status(upstream.status);
  res.setHeader("Content-Type", upstream.headers.get("Content-Type") ?? "application/json");
  res.send(body);
}
