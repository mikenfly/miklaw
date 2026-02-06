---
name: setup
description: Initial NanoClaw setup following the quickstart guide. Choose your interface (PWA/WhatsApp/Both), install dependencies, configure authentication, and start the app. Simple and fast.
---

# NanoClaw Setup

Guide simplifié suivant [docs/quickstart.md](../../docs/quickstart.md).

Run commands automatically. Pause only for user actions (QR code scanning, choices).

**UX:** Use `AskUserQuestion` tool for interactive choices.

---

## 0. Choose Your Interface

**Use AskUserQuestion** to ask:

> NanoClaw supports multiple interfaces. Which do you want to use?
>
> **PWA only** - Modern web interface, no WhatsApp needed (Recommended)
> **WhatsApp only** - Bot in group chats
> **Both PWA + WhatsApp** - Best of both worlds

Store their choice - you'll use it to configure `channels.yaml`.

---

## 1. Install Dependencies

```bash
npm install
npm run build
```

---

## 2. Setup Container Runtime

Detect platform:

```bash
echo "Platform: $(uname -s)"
which container && echo "✓ Apple Container installed" || echo "✗ Apple Container not found"
which docker && docker info >/dev/null 2>&1 && echo "✓ Docker installed and running" || echo "✗ Docker not available"
```

### On Linux

Use Docker (Apple Container is macOS-only):

> You're on Linux, so we'll use Docker for container isolation.

**Use `/convert-to-docker` skill** to convert the codebase, then continue to step 3.

### On macOS

**If Apple Container installed:** Continue to step 3.

**If not installed:** Ask the user:

> NanoClaw needs containers for isolated agent execution. Choose one:
>
> 1. **Apple Container** (recommended) - macOS-native, lightweight
> 2. **Docker** - Cross-platform

**Option A: Apple Container**

> Download from https://github.com/apple/container/releases
> Install the .pkg file
> Run: `container system start`
>
> Let me know when done.

Then verify:
```bash
container system start
container --version
```

**Option B: Docker**

> You chose Docker. Let me set it up.

**Use `/convert-to-docker` skill**, then continue to step 3.

---

## 3. Configure Claude Authentication

Ask:

> Use your **Claude subscription** (Pro/Max) or an **Anthropic API key**?

### Option 1: Claude Subscription (Recommended)

> Open a terminal and run:
> ```
> claude setup-token
> ```
> Paste the token here or add it to `.env` yourself as `CLAUDE_CODE_OAUTH_TOKEN=<token>`

If they give you the token:
```bash
echo "CLAUDE_CODE_OAUTH_TOKEN=<token>" > .env
```

### Option 2: API Key

Ask if they have an existing key or need to create one.

**Create new:**
```bash
echo 'ANTHROPIC_API_KEY=' > .env
```

Tell them to add their key from https://console.anthropic.com/

**Verify:**
```bash
KEY=$(grep "^ANTHROPIC_API_KEY=" .env | cut -d= -f2)
[ -n "$KEY" ] && echo "✓ API key configured: ${KEY:0:10}...${KEY: -4}" || echo "✗ Missing"
```

---

## 4. Build Container Image

```bash
./container/build.sh
```

Verify (auto-detects runtime):
```bash
if which docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo '{}' | docker run -i --entrypoint /bin/echo nanoclaw-agent:latest "Container OK" || echo "✗ Build failed"
else
  echo '{}' | container run -i --entrypoint /bin/echo nanoclaw-agent:latest "Container OK" || echo "✗ Build failed"
fi
```

---

## 5. Configure Channels

Create/update `channels.yaml` based on their choice from step 0.

### If PWA only:

```bash
cat > channels.yaml << 'EOF'
channels:
  pwa:
    enabled: true
    port: 3000
    standalone: true
    tailscale_funnel: true

  whatsapp:
    enabled: false
    trigger: "@Jimmy"

assistant:
  name: "Jimmy"
  timezone: "Europe/Paris"

paths:
  data_dir: "./data"
  groups_dir: "./groups"
  store_dir: "./store"
EOF
```

Tell them:
> ✓ Configured PWA standalone mode. You'll get a QR code to connect your phone.

**Skip to step 8.**

### If WhatsApp only:

```bash
cat > channels.yaml << 'EOF'
channels:
  pwa:
    enabled: false

  whatsapp:
    enabled: true
    trigger: "@Jimmy"

assistant:
  name: "Jimmy"
  timezone: "Europe/Paris"

paths:
  data_dir: "./data"
  groups_dir: "./groups"
  store_dir: "./store"
EOF
```

Tell them:
> ✓ Configured WhatsApp mode.

**Continue to step 6.**

### If Both:

```bash
cat > channels.yaml << 'EOF'
channels:
  pwa:
    enabled: true
    port: 3000
    standalone: false  # Synchronized with WhatsApp
    tailscale_funnel: true

  whatsapp:
    enabled: true
    trigger: "@Jimmy"

assistant:
  name: "Jimmy"
  timezone: "Europe/Paris"

paths:
  data_dir: "./data"
  groups_dir: "./groups"
  store_dir: "./store"
EOF
```

Tell them:
> ✓ Configured PWA + WhatsApp synchronized mode.

**Continue to step 6.**

---

## 6. Authenticate WhatsApp

**Skip this if user chose "PWA only".**

```bash
npm run auth
```

Tell them:
> A QR code will appear. On your phone:
> 1. Open WhatsApp
> 2. Settings → Linked Devices → Link a Device
> 3. Scan the QR code

Wait for "Successfully authenticated" before continuing.

---

## 7. Register Main WhatsApp Channel

**Skip this if user chose "PWA only".**

Ask:
> Send a message to yourself in WhatsApp (the "Message Yourself" chat).
> Let me know when done.

After confirmation:

```bash
timeout 10 npm start || true
```

Find the JID:
```bash
sqlite3 store/messages.db "SELECT DISTINCT chat_jid FROM messages WHERE chat_jid LIKE '%@s.whatsapp.net' ORDER BY timestamp DESC LIMIT 1"
```

Create `data/registered_groups.json`:
```json
{
  "JID_FROM_ABOVE": {
    "name": "main",
    "folder": "main",
    "trigger": "@Jimmy",
    "added_at": "CURRENT_ISO_TIMESTAMP"
  }
}
```

Ensure folder exists:
```bash
mkdir -p groups/main/logs
```

---

## 8. Start NanoClaw

```bash
npm start
```

### For PWA users:

Tell them:
> ✓ NanoClaw is running!
>
> You should see:
> - A QR code (if Tailscale is configured)
> - URL: http://localhost:3000
> - A temporary access token
>
> **To connect:**
> 1. Scan the QR code with your phone, OR
> 2. Open the URL and enter the token
>
> **Install on iOS:**
> 1. Open in Safari
> 2. Share → Add to Home Screen
> 3. Use as native app!

### For WhatsApp users:

Tell them:
> ✓ NanoClaw is running!
>
> **Test it:**
> Send `@Jimmy hello` in your WhatsApp chat.

---

## Optional: Tailscale Funnel Setup

**For PWA users who want public HTTPS access.**

If they see "Tailscale Funnel not configured":

```bash
sudo tailscale set --operator=$USER
```

Then restart:
```bash
npm start
```

You'll get a permanent HTTPS URL: `https://[machine].tail[xxx].ts.net`

---

## Next Steps

Tell them:

> **Setup complete!** 🎉
>
> **Useful commands:**
> - `npm start` - Start NanoClaw
> - `npm run build` - Rebuild after code changes
> - `/channels` - Change interfaces later
> - `/customize` - Add features
>
> **Documentation:**
> - `docs/quickstart.md` - Quick reference
> - `docs/channels.md` - Detailed channel config

---

## Troubleshooting

**Container build fails:**
- Ensure Docker/Apple Container is running
- On macOS: `container system start`
- On Linux: `sudo systemctl start docker`

**WhatsApp won't connect:**
- Check phone is connected to internet
- Re-run `npm run auth`

**Port 3000 already in use:**
- Change port in `channels.yaml`: `pwa.port: 3001`

**No QR code for PWA:**
- Tailscale not configured (optional)
- App still works on `http://localhost:3000`
- Setup Tailscale or set `tailscale_funnel: false`
