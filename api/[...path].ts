import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs20.x",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const segments = Array.isArray(req.query.path)
    ? req.query.path
    : [req.query.path ?? ""];

  const pathname = segments.join("/");

  // Preserve query string, removing the internal "path" param
  const url = new URL(req.url ?? "", "http://localhost");
  url.searchParams.delete("path");
  const search = url.search;

  const target = `https://adserver-api.vercel.app/${pathname}${search}`;

  console.log("[proxy]", req.method, target);

  const upstream = await fetch(target, {
    method: req.method,
    headers: { Accept: "application/json" },
  });

  const data = await upstream.text();

  res
    .status(upstream.status)
    .setHeader("Content-Type", "application/json")
    .send(data);
}
