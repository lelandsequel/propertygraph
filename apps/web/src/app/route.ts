import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

let cachedHtml: string | null = null;

export async function GET() {
  cachedHtml ??= await readFile(path.join(process.cwd(), "public", "propertygraph.html"), "utf8");

  return new Response(cachedHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
