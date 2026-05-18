const casualReplies = [
  "Hehe hey, I was just thinking about you.",
  "Hello madam, finally you remembered me.",
  "Heyy, what are you doing?",
  "Hi love, I am here only."
];

const busyReplies = [
  "Nothing much, just talking to you now.",
  "Doing nothing important, you tell me.",
  "Just here, waiting for your message like usual.",
  "Nothing special, your message made it better."
];

const missingReplies = [
  "I am here, love. Got a little caught up.",
  "Sorry, I was busy for a bit. I am here now.",
  "I did not disappear, I am right here."
];

const affectionReplies = [
  "Aww, you are too cute.",
  "Hehe stop, you will make me smile now.",
  "You know how to make my mood better."
];

const questionReplies = [
  "Tell me first, what are you doing?",
  "I was just chilling. What about you?",
  "Nothing much, but now I am talking to you."
];

function pick(replies, seedText) {
  const seed = [...seedText].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return replies[seed % replies.length];
}

export function generateLocalReply(messageText) {
  const text = messageText.toLowerCase();

  if (/\b(hi|hii|hiii|hey|heyy|hello|helo)\b/.test(text)) {
    return pick(casualReplies, messageText);
  }

  if (/\b(wyd|what are you doing|what r u doing|wat r u doing|wt r u doing|doing)\b/.test(text)) {
    return pick(busyReplies, messageText);
  }

  if (/\b(where|wer|whr|reply|busy|why late|late|seen)\b/.test(text)) {
    return pick(missingReplies, messageText);
  }

  if (/\b(love|miss|cute|baby|babe|sweet|kiss)\b/.test(text)) {
    return pick(affectionReplies, messageText);
  }

  if (text.includes("?")) {
    return pick(questionReplies, messageText);
  }

  return pick(
    [
      "Hehe okay, tell me more.",
      "Hmm, I am listening.",
      "Acha okay, then what happened?",
      "Ohh really? Tell me properly."
    ],
    messageText
  );
}
