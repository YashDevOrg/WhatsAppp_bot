import { config, validateConfig } from "./config.js";

const missing = validateConfig();

if (missing.length > 0) {
  console.error(`Missing required config: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Config looks ready.");
console.log(`Target contact: ${config.targetContact || "(matching by name)"}`);
console.log(`Target name: ${config.targetName || "(matching by contact id)"}`);
console.log(`Target number: ${config.targetNumber || "(not set)"}`);
console.log(`Debug messages: ${config.debugMessages ? "enabled" : "disabled"}`);
console.log(`Headless browser: ${config.headless ? "enabled" : "disabled"}`);
console.log(`Ready timeout: ${config.readyTimeoutSeconds} second(s)`);
console.log(`Auto send: ${config.autoSend ? "enabled" : "disabled"}`);
console.log(`Cooldown: ${config.cooldownMinutes} minute(s)`);
console.log(`Model: ${config.model}`);
console.log(`Fallback replies: ${config.fallbackReplies.length}`);
