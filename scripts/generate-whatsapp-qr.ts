import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { loadConfig } from "../src/config/config.js";
import { resolveDefaultWebAuthDir } from "../src/web/auth-store.js";
import { startWebLoginWithQr, waitForWebLogin } from "../src/web/login-qr.js";

// Ensure we don't crash on unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

async function main() {
  console.log("Initializing fresh WhatsApp login with ISOLATED state...");

  // Use a local temp directory for state to ensure absolutely no conflicts
  const tempStateDir = path.resolve(process.cwd(), "temp-state");
  const homeDir = os.homedir();

  // Set env var to redirect state dir resolution
  process.env.OPENCLAW_STATE_DIR = tempStateDir;

  // Clean it first
  if (fs.existsSync(tempStateDir)) {
    console.log("Cleaning temp state dir...");
    fs.rmSync(tempStateDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempStateDir, { recursive: true });

  // Ensure config is loaded
  loadConfig();

  // Log where we think auth is going
  const authDir = resolveDefaultWebAuthDir();
  console.log(`Using temporary auth directory: ${authDir}`);

  const PORT = 58886;
  const outFile = path.resolve(process.cwd(), "whatsapp-qr.html");

  // Keep server running outside the retry loop
  const server = http.createServer((req, res) => {
    if (fs.existsSync(outFile)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      fs.createReadStream(outFile).pipe(res);
    } else {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("Generating QR in isolated env... please refresh in 5 seconds.");
    }
  });

  server.listen(PORT, () => {
    console.log(`QR Code Link: http://localhost:${PORT}`);
  });

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts}: Requesting new QR code...`);

    try {
      const result = await startWebLoginWithQr({
        verbose: true,
        force: true, // This will clear the tempDir again, which is fine
        timeoutMs: 120000,
      });

      if (result.qrDataUrl) {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Login QR (Isolated)</title>
  <style>
    body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #e0f7fa; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
    h1 { margin-bottom: 1rem; color: #006064; }
    p { margin-bottom: 1.5rem; color: #666; }
    img { max-width: 100%; height: auto; border: 1px solid #ddd; }
  </style>
  <meta http-equiv="refresh" content="5">
</head>
<body>
  <div class="card">
    <h1>Scan with WhatsApp</h1>
    <p>Open WhatsApp on your phone > Menu > Linked Devices > Link a Device</p>
    <img src="${result.qrDataUrl}" alt="WhatsApp QR Code" />
    <p><small>This page will refresh every 5 seconds.</small></p>
    <p>Attempt ${attempts}</p>
  </div>
</body>
</html>
          `;

        fs.writeFileSync(outFile, html);
        console.log(`QR code updated.`);

        console.log("Waiting for connection...");
        const waitResult = await waitForWebLogin({ timeoutMs: 120000 });

        if (waitResult.connected) {
          console.log("SUCCESS: WhatsApp connected successfully in temp env!");

          // MIGRATION LOGIC
          // We need to copy 'authDir' content to the real location
          // Real location:
          const realStateDir = path.join(homeDir, ".openclaw"); // Default since we overwrote env
          // But wait, resolveDefaultWebAuthDir depends on resolveStateDir.
          // We need to construct target path manually to correspond to structure.
          // Structure is: <stateDir>/credentials/whatsapp/<accountId> (default)

          // We assume default account ID
          const relativePath = path.relative(tempStateDir, authDir);
          const targetDir = path.join(realStateDir, relativePath);

          console.log(`Migrating credentials from ${authDir} to ${targetDir}...`);

          if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
          }
          fs.mkdirSync(targetDir, { recursive: true });
          fs.cpSync(authDir, targetDir, { recursive: true });

          console.log("Migration complete.");

          const successHtml =
            "<h1>SUCCESS: WhatsApp connected!</h1><p>Credentials migrated. You can close this tab.</p><script>setTimeout(() => window.close(), 5000)</script>";
          fs.writeFileSync(outFile, successHtml);
          setTimeout(() => {
            server.close();
            process.exit(0);
          }, 5000);
          return;
        } else {
          console.error("Connection failed: " + waitResult.message);
        }
      }
    } catch (error) {
      console.error("Error generating/waiting QR:", error);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("Max attempts reached. Exiting.");
  server.close();
  process.exit(1);
}

void main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
