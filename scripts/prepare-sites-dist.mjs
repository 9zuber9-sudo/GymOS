import { cp, mkdir, rm } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const dist = resolve(root, "dist");
const openNext = resolve(root, ".open-next");
const relativeDist = relative(root, dist);

if (
  !relativeDist ||
  relativeDist.startsWith("..") ||
  isAbsolute(relativeDist)
) {
  throw new Error(`Refusing to prepare an unsafe dist path: ${dist}`);
}

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, ".openai"), { recursive: true });
await cp(openNext, join(dist, ".open-next"), { recursive: true });
await cp(
  join(root, ".openai", "hosting.json"),
  join(dist, ".openai", "hosting.json"),
);
await cp(join(root, "wrangler.jsonc"), join(dist, "wrangler.jsonc"));
await cp(join(root, "package.json"), join(dist, "package.json"));

console.log("Prepared Sites OpenNext bundle in dist/.");
