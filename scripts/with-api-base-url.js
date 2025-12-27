const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const args = process.argv.slice(2);
const baseIndex = args.indexOf("--base-url");
const separatorIndex = args.indexOf("--");

if (baseIndex < 0 || !args[baseIndex + 1] || separatorIndex < 0 || separatorIndex === args.length - 1) {
  // eslint-disable-next-line no-console
  console.error("Usage: node scripts/with-api-base-url.js --base-url <url> -- <command> [args...]");
  process.exit(1);
}

const baseUrl = args[baseIndex + 1];
const command = args[separatorIndex + 1];
const commandArgs = args.slice(separatorIndex + 2);

const urlsPath = path.join(__dirname, "..", "constants", "urls.json");
const originalUrls = fs.readFileSync(urlsPath, "utf8");
let restored = false;

const restoreUrls = () => {
  if (restored) return;
  fs.writeFileSync(urlsPath, originalUrls);
  restored = true;
};

process.on("SIGINT", () => {
  restoreUrls();
  process.exit(130);
});

process.on("SIGTERM", () => {
  restoreUrls();
  process.exit(143);
});

const parsed = JSON.parse(originalUrls);
const next = { ...parsed, devApiBaseUrl: baseUrl };
fs.writeFileSync(urlsPath, `${JSON.stringify(next, null, 2)}\n`);

const child = spawn(command, commandArgs, {
  stdio: "inherit",
  env: process.env
});

child.on("error", (err) => {
  restoreUrls();
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

child.on("close", (code) => {
  restoreUrls();
  process.exit(code ?? 1);
});
