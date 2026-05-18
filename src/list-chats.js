import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
import { config } from "./config.js";

const { Client, LocalAuth } = pkg;
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const chatLimit = Number.parseInt(limitArg?.split("=")[1] || "30", 10);
const limit = Number.isFinite(chatLimit) && chatLimit > 0 ? chatLimit : 30;
const maxAttempts = 3;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createClient() {
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: config.headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-extensions"
      ]
    }
  });

  client.on("qr", (qr) => {
    console.log("Scan this QR code with WhatsApp > Linked devices > Link a device:");
    qrcode.generate(qr, { small: true });
  });

  client.on("authenticated", () => {
    console.log("Authenticated. Waiting for WhatsApp chats to load...");
  });

  client.on("auth_failure", (message) => {
    console.error("Authentication failed:", message);
  });

  client.on("loading_screen", (percent, message) => {
    console.log(`Loading WhatsApp: ${percent}% ${message || ""}`.trim());
  });

  client.on("ready", async () => {
    console.log("WhatsApp is ready. Reading chats...");
    const chats = await client.getChats();
    const privateChats = chats
      .filter((chat) => !chat.isGroup)
      .slice(0, limit)
      .map((chat) => ({
        name: chat.name || "(no name)",
        id: chat.id._serialized
      }));

    console.table(privateChats);
    await client.destroy();
  });

  client.on("disconnected", (reason) => {
    console.log("WhatsApp disconnected:", reason);
  });

  return client;
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const client = createClient();

  try {
    await client.initialize();
    break;
  } catch (error) {
    await client.destroy().catch(() => {});

    if (
      attempt < maxAttempts &&
      error.message.includes("Execution context was destroyed")
    ) {
      console.log(
        `WhatsApp Web reloaded during startup. Retrying ${attempt + 1}/${maxAttempts}...`
      );
      await wait(3000);
      continue;
    }

    throw error;
  }
}
