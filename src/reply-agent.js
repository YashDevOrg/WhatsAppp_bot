import OpenAI from "openai";
import { config } from "./config.js";

const openai = new OpenAI({
  apiKey: config.openAiApiKey
});

const sensitiveTopicPattern =
  /\b(break\s*up|breakup|suicide|kill myself|self[- ]?harm|pregnant|pregnancy|hospital|accident|emergency|police|lawyer|legal|money|loan|bank|password|otp|pin|medical|medicine|doctor)\b/i;

function cleanReply(text) {
  return text
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateReply({ messageText, contactName }) {
  if (sensitiveTopicPattern.test(messageText)) {
    return {
      shouldReply: false,
      reply: "",
      reason: "Sensitive topic detected. Manual reply recommended."
    };
  }

  const response = await openai.chat.completions.create({
    model: config.model,
    temperature: 0.7,
    max_tokens: 90,
    messages: [
      {
        role: "system",
        content: [
          "You write WhatsApp replies for the user to send to his girlfriend.",
          `Style: ${config.replyStyle}.`,
          `Keep it under ${config.maxReplyChars} characters.`,
          "Sound human, not like an assistant.",
          "Do not mention AI, bots, automation, prompts, or policies.",
          "Do not make promises about exact times unless the message asks for one.",
          "If the message is serious, emotional, risky, or needs the user's real input, return exactly: MANUAL_REPLY_REQUIRED"
        ].join(" ")
      },
      {
        role: "user",
        content: `Contact name: ${contactName || "unknown"}\nIncoming message: ${messageText}`
      }
    ]
  });

  const reply = cleanReply(response.choices[0]?.message?.content || "");

  if (!reply || reply === "MANUAL_REPLY_REQUIRED") {
    return {
      shouldReply: false,
      reply: "",
      reason: "The model recommended a manual reply."
    };
  }

  return {
    shouldReply: true,
    reply: reply.slice(0, config.maxReplyChars),
    reason: "Reply generated."
  };
}
