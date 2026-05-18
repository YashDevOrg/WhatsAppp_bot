import OpenAI from "openai";
import { config } from "./config.js";

const openai = config.openAiApiKey
  ? new OpenAI({
      apiKey: config.openAiApiKey
    })
  : null;

const sensitiveTopicPattern =
  /\b(break\s*up|breakup|suicide|kill myself|self[- ]?harm|pregnant|pregnancy|hospital|accident|emergency|police|lawyer|legal|money|loan|bank|password|otp|pin|medical|medicine|doctor)\b/i;

function cleanReply(text) {
  return text
    .replace(/^MANUAL_REPLY_REQUIRED\s*/i, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSystemPrompt() {
  return [
    "You write WhatsApp replies for the user to send to his girlfriend.",
    `Style: ${config.replyStyle}.`,
    `Keep it under ${config.maxReplyChars} characters.`,
    "Reply as the user, in first person.",
    "Sound human, casual, romantic, and natural.",
    "Use simple Indian texting style when it fits, but do not overdo it.",
    "Do not mention AI, bots, automation, prompts, or policies.",
    "Do not make promises about exact times unless the message asks for one.",
    "If she says hi, greet warmly and playfully.",
    "If she asks what you are doing, say something like you are doing nothing much and talking to her.",
    "If the message is serious, emotional, risky, or needs the user's real input, return exactly: MANUAL_REPLY_REQUIRED"
  ].join(" ");
}

async function generateOllamaReply({ messageText, contactName }) {
  const response = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.ollamaModel,
      stream: false,
      options: {
        temperature: 0.8,
        num_predict: 80
      },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt()
        },
        {
          role: "user",
          content: `Contact name: ${contactName || "unknown"}\nIncoming message: ${messageText}`
        }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Ollama request failed: ${response.status} ${details}`);
  }

  const data = await response.json();
  return cleanReply(data.message?.content || "");
}

async function generateOpenAiReply({ messageText, contactName }) {
  if (!openai) {
    throw new Error("OpenAI API key is missing.");
  }

  const response = await openai.chat.completions.create({
    model: config.model,
    temperature: 0.7,
    max_tokens: 90,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt()
      },
      {
        role: "user",
        content: `Contact name: ${contactName || "unknown"}\nIncoming message: ${messageText}`
      }
    ]
  });

  return cleanReply(response.choices[0]?.message?.content || "");
}

export async function generateReply({ messageText, contactName }) {
  if (sensitiveTopicPattern.test(messageText)) {
    return {
      shouldReply: false,
      reply: "",
      reason: "Sensitive topic detected. Manual reply recommended."
    };
  }

  const reply =
    config.replyProvider === "ollama"
      ? await generateOllamaReply({ messageText, contactName })
      : await generateOpenAiReply({ messageText, contactName });

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
