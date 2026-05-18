# WhatsApp AI Auto Reply

This is a local WhatsApp Web auto-reply bot. It listens for incoming messages from one configured contact, generates a short reply with OpenAI, and either logs the reply or sends it automatically.

Important: this uses WhatsApp Web automation, not the official WhatsApp Business API. Use a test account first if possible.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. For free local AI replies, install Ollama from:

   https://ollama.com/download

   Then pull a small chat model:

   ```bash
   ollama pull llama3.2:3b
   ```

3. Configure `.env.local`.

   Use Ollama:

   ```env
   REPLY_PROVIDER=ollama
   OLLAMA_MODEL=llama3.2:3b
   ```

   Add either:

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

4. Start in safe test mode:

   ```bash
   npm start
   ```

5. Scan the QR code in WhatsApp:

   WhatsApp > Linked devices > Link a device

6. When replies look good, set:

   ```env
   AUTO_SEND=true

   ```


7. After olama is installes  run the below coomad 

```
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull llama3.2:3b 
```
Wait for it to download.

Then test the AI reply:

```
npm run test-reply -- "hi"

```
and:

```
npm run test-reply -- "wt r u doing"
```
If those produce natural replies, start the WhatsApp bot:

```
npm start
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
