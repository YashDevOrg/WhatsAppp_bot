import fs from "node:fs/promises";

const paths = [".wwebjs_auth", ".wwebjs_cache"];

for (const path of paths) {
  await fs.rm(path, { recursive: true, force: true });
  console.log(`Removed ${path}`);
}

console.log("WhatsApp session reset. Run npm start and scan a fresh QR code.");
