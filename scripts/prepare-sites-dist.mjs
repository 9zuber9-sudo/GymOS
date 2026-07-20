import { cp, mkdir, rename, rm } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { spawn } from "node:child_process";

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
await mkdir(join(dist, "server"), { recursive: true });

// Sites executes dist/server/index.js directly. OpenNext's worker source still
// contains Node-style module calls until Wrangler performs its final bundle.
// Shipping the unbundled source causes `require is not defined` at runtime.
const wrangler = join(root, "node_modules", "wrangler", "bin", "wrangler.js");
await new Promise((resolveBundle, rejectBundle) => {
  const child = spawn(
    process.execPath,
    [wrangler, "deploy", "--dry-run", "--outdir", join(dist, "server")],
    {
      cwd: root,
      env: {
        ...process.env,
        XDG_CONFIG_HOME: join(root, ".wrangler"),
        WRANGLER_SEND_METRICS: "false",
      },
      stdio: "inherit",
    },
  );

  child.once("error", rejectBundle);
  child.once("exit", (code) => {
    if (code === 0) {
      resolveBundle();
      return;
    }
    rejectBundle(new Error(`Wrangler bundle failed with exit code ${code}`));
  });
});

await rename(
  join(dist, "server", "worker.js"),
  join(dist, "server", "index.js"),
);
// Sites' deployable full-stack layout uses dist/client for browser assets.
await cp(join(openNext, "assets"), join(dist, "client"), {
  recursive: true,
});
await cp(
  join(root, ".openai", "hosting.json"),
  join(dist, ".openai", "hosting.json"),
);

console.log("Prepared Sites OpenNext bundle in dist/.");
