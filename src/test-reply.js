import { generateLocalReply } from "./local-reply.js";
import { generateReply } from "./reply-agent.js";

const messageText = process.argv.slice(2).join(" ") || "hi";

try {
  const result = await generateReply({
    messageText,
    contactName: "Yashuu"
  });

  if (result.shouldReply) {
    console.log(result.reply);
  } else {
    console.log(`Manual reply recommended: ${result.reason}`);
  }
} catch (error) {
  console.error(error.message);
  console.log(generateLocalReply(messageText));
}
