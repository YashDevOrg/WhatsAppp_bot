# WhatsApp AI Auto Reply

This is a local WhatsApp Web auto-reply bot. It listens for incoming messages from one configured contact, generates a short reply with OpenAI, and either logs the reply or sends it automatically.

Important: this uses WhatsApp Web automation, not the official WhatsApp Business API. Use a test account first if possible.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure `.env.local`.

   `OPENAI_API_KEY` is already created for this project. Add either:

   ```env
   WA_TARGET_CONTACT=919876543210@c.us
   ```

   or:

   ```env
   WA_TARGET_NAME=Her WhatsApp Name
   ```

   To find the exact contact id, run:

   ```bash
   npm run list-chats
   ```

   Scan the QR code, then copy the right `id` into `WA_TARGET_CONTACT`.
   For only the first two recent chats, run:

   ```bash
   npm run list-top-2
   ```

3. Start in safe test mode:

   ```bash
   npm start
   ```

4. Scan the QR code in WhatsApp:

   WhatsApp > Linked devices > Link a device

5. When replies look good, set:

   ```env
   AUTO_SEND=true
   ```

## Safety Behavior

- Ignores groups.
- Replies only to the configured contact.
- Uses a cooldown so it does not spam.
- Refuses to generate replies for sensitive topics like breakup, emergency, self-harm, pregnancy, medical, legal, or financial issues.
- Keeps replies short and natural.

## Commands

```bash
npm run check-config
npm run list-chats
npm run list-top-2
npm run reset-session
npm start
```
