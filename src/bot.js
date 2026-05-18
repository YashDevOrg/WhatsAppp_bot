import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
import { config, validateConfig } from "./config.js";
import { generateReply } from "./reply-agent.js";

const { Client, LocalAuth } = pkg;
const lastReplyAtByChatId = new Map();
const maxAttempts = 3;
let readyTimer;
let fallbackReplyIndex = 0;

const missing = validateConfig();
if (missing.length > 0) {
  console.error(`Missing required config: ${missing.join(", ")}`);
  process.exit(1);
}

function isTargetContact(contact) {
  const contactId = contact.id?._serialized;
  const contactNumber = contact.number?.replace(/\D/g, "");
  const nameCandidates = [
    contact.name,
    contact.pushname,
    contact.shortName,
    contact.number
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (config.targetContact && contactId === config.targetContact) {
    return true;
  }

  if (config.targetNumber) {
    const candidateNumbers = [
      contactNumber,
      contactId?.replace(/\D/g, ""),
      ...nameCandidates.map((name) => name.replace(/\D/g, ""))
    ].filter(Boolean);

    if (candidateNumbers.some((number) => number.endsWith(config.targetNumber))) {
      return true;
    }
  }

  if (config.targetName) {
    const expected = config.targetName.toLowerCase();
    return nameCandidates.some((name) => name.includes(expected));
  }

  return false;
}

function isCoolingDown(chatId) {
  if (config.cooldownMinutes === 0) {
    return false;
  }

  const lastReplyAt = lastReplyAtByChatId.get(chatId);
  if (!lastReplyAt) {
    return false;
  }

  const cooldownMs = config.cooldownMinutes * 60 * 1000;
  return Date.now() - lastReplyAt < cooldownMs;
}

function nextFallbackReply() {
  const reply =
    config.fallbackReplies[fallbackReplyIndex % config.fallbackReplies.length];
  fallbackReplyIndex += 1;
  return reply;
}

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

  client.on("loading_screen", (percent, message) => {
    console.log(`Loading WhatsApp: ${percent}% ${message || ""}`.trim());
  });

  client.on("ready", () => {
    clearTimeout(readyTimer);
    console.log("WhatsApp auto-reply bot is ready.");
    console.log(`Auto send is ${config.autoSend ? "ON" : "OFF - dry run only"}.`);
  });

  client.on("message", async (message) => {
    try {
      if (message.fromMe || message.isStatus) {
        return;
      }

      const chat = await message.getChat();
      if (chat.isGroup) {
        return;
      }

      const contact = await message.getContact();
      if (config.debugMessages) {
        console.log(
          `Private message from "${contact.name || contact.pushname || contact.number || "unknown"}" id=${contact.id?._serialized || "unknown"} number=${contact.number || "unknown"}`
        );
      }

      if (!isTargetContact(contact)) {
        if (config.debugMessages) {
          console.log("Ignored because it did not match the configured target.");
        }
        return;
      }

      if (isCoolingDown(chat.id._serialized)) {
        console.log("Skipping message because cooldown is active.");
        return;
      }

      const messageText = message.body?.trim();
      if (!messageText) {
        return;
      }

      const result = await generateReply({
        messageText,
        contactName: contact.name || contact.pushname || contact.number
      }).catch((error) => {
        if (error.status === 429 || error.code === "insufficient_quota") {
          console.log("OpenAI quota is unavailable. Using fallback reply.");
          return {
            shouldReply: true,
            reply: nextFallbackReply(),
            reason: "Fallback reply used because OpenAI quota is unavailable."
          };
        }

        throw error;
      });

      if (!result.shouldReply) {
        console.log(`Manual reply recommended: ${result.reason}`);
        return;
      }

      console.log(`Incoming: ${messageText}`);
      console.log(`Suggested reply: ${result.reply}`);

      if (config.autoSend) {
        await message.reply(result.reply);
        lastReplyAtByChatId.set(chat.id._serialized, Date.now());
        console.log("Reply sent.");
      } else {
        console.log("Dry run only. Set AUTO_SEND=true to send automatically.");
      }
    } catch (error) {
      console.error("Failed to handle message:", error.message);
    }
  });

  return client;
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const client = createClient();

  try {
    readyTimer = setTimeout(async () => {
      console.error(
        `WhatsApp did not become ready within ${config.readyTimeoutSeconds} seconds.`
      );
      console.error(
        "Try setting HEADLESS=false in .env.local, then restart to see the WhatsApp Web window."
      );
      console.error(
        "If the window is stuck, run npm run reset-session, then scan a fresh QR code."
      );
      await client.destroy().catch(() => {});
      process.exit(1);
    }, config.readyTimeoutSeconds * 1000);

    await client.initialize();
    break;
  } catch (error) {
    clearTimeout(readyTimer);
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
