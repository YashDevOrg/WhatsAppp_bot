import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toNonNegativeInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseFallbackReplies() {
  const rawReplies = process.env.FALLBACK_REPLIES || process.env.FALLBACK_REPLY;
  const replies = rawReplies
    ?.split("|")
    .map((reply) => reply.trim())
    .filter(Boolean);

  return replies?.length
    ? replies
    : ["Hey, I am a little busy right now. I will text you properly in a bit."];
}

export const config = {
  replyProvider: process.env.REPLY_PROVIDER?.trim().toLowerCase() || "ollama",
  openAiApiKey: process.env.OPENAI_API_KEY,
  targetContact: process.env.WA_TARGET_CONTACT?.trim(),
  targetName: process.env.WA_TARGET_NAME?.trim(),
  targetNumber: process.env.WA_TARGET_NUMBER?.replace(/\D/g, ""),
  debugMessages: process.env.DEBUG_MESSAGES === "true",
  headless: process.env.HEADLESS !== "false",
  readyTimeoutSeconds: toPositiveInt(process.env.READY_TIMEOUT_SECONDS, 120),
  fallbackReplies: parseFallbackReplies(),
  autoSend: process.env.AUTO_SEND === "true",
  cooldownMinutes: toNonNegativeInt(process.env.COOLDOWN_MINUTES, 10),
  maxReplyChars: toPositiveInt(process.env.MAX_REPLY_CHARS, 180),
  model: process.env.MODEL?.trim() || "gpt-4.1-mini",
  ollamaUrl: process.env.OLLAMA_URL?.trim() || "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL?.trim() || "llama3.2:3b",
  replyStyle:
    process.env.REPLY_STYLE?.trim() ||
    "short, warm, casual, caring, and natural"
};

export function validateConfig() {
  const missing = [];

  if (config.replyProvider === "openai" && !config.openAiApiKey) {
    missing.push("OPENAI_API_KEY");
  }

  if (!["ollama", "openai"].includes(config.replyProvider)) {
    missing.push("REPLY_PROVIDER must be ollama or openai");
  }

  if (!config.targetContact && !config.targetName && !config.targetNumber) {
    missing.push("WA_TARGET_CONTACT, WA_TARGET_NAME, or WA_TARGET_NUMBER");
  }

  return missing;
}
