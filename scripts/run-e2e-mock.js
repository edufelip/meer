const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const args = process.argv.slice(2);
const platformArgIndex = args.indexOf("--platform");
const platform = platformArgIndex >= 0 ? args[platformArgIndex + 1] : null;
const portArgIndex = args.indexOf("--port");
const port = portArgIndex >= 0 ? Number(args[portArgIndex + 1]) : 4010;
const devServerPortArgIndex = args.indexOf("--dev-server-port");
const devServerPort = devServerPortArgIndex >= 0 ? Number(args[devServerPortArgIndex + 1]) : 8081;
const skipDevServer = args.includes("--skip-dev-server");

if (!platform || (platform !== "ios" && platform !== "android")) {
  // eslint-disable-next-line no-console
  console.error("Usage: node scripts/run-e2e-mock.js --platform ios|android [--port 4010]");
  process.exit(1);
}

const baseUrl = `http://localhost:${port}`;
const devServerUrl = `http://localhost:${devServerPort}`;
const urlsPath = path.join(__dirname, "..", "constants", "urls.json");
let urlsBackup = null;

const applyMockApiBaseUrl = () => {
  urlsBackup = fs.readFileSync(urlsPath, "utf8");
  const parsed = JSON.parse(urlsBackup);
  const next = { ...parsed, devApiBaseUrl: baseUrl };
  fs.writeFileSync(urlsPath, `${JSON.stringify(next, null, 2)}\n`);
};

const restoreUrls = () => {
  if (urlsBackup === null) return;
  fs.writeFileSync(urlsPath, urlsBackup);
  urlsBackup = null;
};

const run = (command, commandArgs, env) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: "inherit",
      env: { ...process.env, ...env }
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });

const waitForServer = (timeoutMs = 20000) =>
  new Promise((resolve, reject) => {
    const start = Date.now();
    const ping = () => {
      const req = http.get(`${baseUrl}/health`, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else if (Date.now() - start > timeoutMs) {
          reject(new Error("Mock server did not become ready in time"));
        } else {
          setTimeout(ping, 300);
        }
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Mock server did not become ready in time"));
        } else {
          setTimeout(ping, 300);
        }
      });
    };
    ping();
  });

const waitForDevServer = (timeoutMs = 30000) =>
  new Promise((resolve, reject) => {
    const start = Date.now();
    const ping = () => {
      const req = http.get(`${devServerUrl}/status`, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200 && body.includes("packager-status:running")) {
            resolve();
          } else if (Date.now() - start > timeoutMs) {
            reject(new Error("Expo dev server did not become ready in time"));
          } else {
            setTimeout(ping, 500);
          }
        });
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Expo dev server did not become ready in time"));
        } else {
          setTimeout(ping, 500);
        }
      });
    };
    ping();
  });

let serverProcess;
let devServerProcess;

const cleanup = () => {
  restoreUrls();
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
  }
  if (devServerProcess && !devServerProcess.killed) {
    devServerProcess.kill("SIGTERM");
  }
};

process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});

(async () => {
  try {
    applyMockApiBaseUrl();
    serverProcess = spawn("node", ["mock-server/server.js"], {
      stdio: "inherit",
      env: {
        ...process.env,
        MOCK_SERVER_PORT: String(port)
      }
    });

    await waitForServer();

    if (!skipDevServer) {
      devServerProcess = spawn("npx", ["expo", "start", "--dev-client", "--port", String(devServerPort)], {
        stdio: "inherit",
        env: {
          ...process.env,
          EXPO_NO_TELEMETRY: "1",
          EXPO_CLI_DISABLE_INTERACTIVE: "1",
          CI: "1"
        }
      });
      await waitForDevServer();
    }

    const env = {
      DETOX_DEV_SERVER_URL: devServerUrl,
      EXPO_DEV_CLIENT_SERVER_URL: devServerUrl,
      EXPO_DEV_CLIENT_SCHEME: "meer",
      EXPO_DEV_CLIENT_SLUG: "meer"
    };
    const buildScript = platform === "ios" ? "e2e:build:ios" : "e2e:build:android";
    const testScript = platform === "ios" ? "e2e:ios" : "e2e:android";

    await run("npm", ["run", buildScript], env);
    await run("npm", ["run", testScript], env);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
})();
