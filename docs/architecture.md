# Architecture - Détails techniques

Documentation technique pour contributeurs et développeurs.

## Vue d'ensemble

NanoClaw est un assistant Claude personnel avec architecture modulaire basée sur des **channels**.

**Principe** : Un processus Node.js central route les messages vers l'agent Claude SDK dans des conteneurs isolés.

## Architecture globale

```
┌─────────────────────────────────────────────────────────────┐
│                     Channels (Interfaces)                    │
├─────────────────────────────────────────────────────────────┤
│  PWA Frontend     WhatsApp        Telegram       Slack       │
│  (WebSocket)      (Baileys)       (Bot API)     (Bot API)    │
└──────────┬─────────────┬─────────────┬─────────────┬────────┘
           │             │             │             │
           └─────────────┴─────────────┴─────────────┘
                         │
                    ┌────▼────┐
                    │  Router │  (src/index.ts)
                    └────┬────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
      ┌────▼────┐               ┌─────▼──────┐
      │   DB    │               │ Container  │
      │ SQLite  │               │   Runner   │
      └─────────┘               └─────┬──────┘
                                      │
                          ┌───────────┴───────────┐
                          │  Apple Container /    │
                          │  Docker               │
                          │                       │
                          │  Claude Agent SDK     │
                          │  (isolated env)       │
                          └───────────────────────┘
```

## Composants principaux

### Router (src/index.ts)

Point d'entrée central. Gère :
- Chargement configuration channels
- Initialisation des channels actifs
- Routage des messages vers l'agent
- Gestion de l'état global

### Channels

Chaque channel est un module indépendant :

**PWA** (`src/pwa-channel.ts`, `src/web-server.ts`) :
- Conversations en mémoire
- API REST + WebSocket
- Authentification par tokens
- Mode standalone ou synchronisé

**WhatsApp** (`src/index.ts`) :
- Connexion via Baileys
- Stockage messages SQLite
- Groupes isolés
- Trigger patterns

### Container Runner (src/container-runner.ts)

Exécute l'agent Claude dans un conteneur isolé :
- Support Docker et Apple Container
- Mounts sécurisés (projet, groupes)
- Session persistence
- Timeout et gestion d'erreurs

### Database (src/db.ts)

SQLite pour :
- Messages WhatsApp
- Tâches programmées
- Métadonnées des chats

### Task Scheduler (src/task-scheduler.ts)

Exécution de tâches programmées :
- Cron expressions
- Intervalles
- One-time tasks
- Context modes (isolated/group)

## Flux de messages

### PWA Standalone

```
1. User → PWA Frontend
2. Frontend → POST /api/conversations/:jid/messages
3. web-server.ts → pwa-channel.ts (sendToPWAAgent)
4. pwa-channel.ts → container-runner.ts (runContainerAgent)
5. container-runner.ts → Docker/Container
6. Container → Claude Agent SDK
7. Response → container-runner.ts
8. Response → pwa-channel.ts (addMessage)
9. Response → WebSocket → Frontend
10. User sees response
```

### WhatsApp

```
1. User → WhatsApp
2. WhatsApp → Baileys → index.ts (messages.upsert)
3. index.ts → storeMessage (DB)
4. index.ts → processMessage
5. processMessage → buildPrompt → runContainerAgent
6. container-runner.ts → Docker/Container
7. Container → Claude Agent SDK
8. Response → sendMessage (Baileys)
9. Baileys → WhatsApp → User
```

## Configuration

### channels.yaml

```yaml
channels:
  pwa:
    enabled: boolean
    port: number
    standalone: boolean
    tailscale_funnel: boolean
  whatsapp:
    enabled: boolean
    trigger: string
```

**Chargement** : `src/channels-config.ts`
- Lecture YAML
- Validation structure
- Defaults si fichier absent

### Isolation des groupes

Chaque groupe/conversation a :
- Dossier séparé : `groups/{folder}/`
- `CLAUDE.md` : Instructions spécifiques
- Mémoire isolée
- Session isolée

**Main group** (`groups/main/`) :
- Groupe principal
- Permissions élevées
- Peut enregistrer d'autres groupes

## Authentification (PWA)

### Système de tokens

**Tokens temporaires** :
- Générés au démarrage
- Validité : 5 minutes
- Usage unique
- Pour pairing initial

**Tokens permanents** :
- Un par device
- Pas d'expiration
- Révocables
- Stockés dans `data/auth.json`

**Structure** :
```json
{
  "temporary_tokens": [
    {
      "token": "abc123...",
      "created_at": "2024-02-06T10:30:00Z",
      "expires_at": "2024-02-06T10:35:00Z",
      "used": false
    }
  ],
  "permanent_tokens": [
    {
      "token": "def456...",
      "device_name": "iPhone",
      "created_at": "2024-02-06T10:31:00Z",
      "last_used": "2024-02-06T12:00:00Z"
    }
  ]
}
```

### Flow d'authentification

1. **Génération temporaire** (`ensureAccessToken`)
   ```typescript
   const tempToken = generateTemporaryToken(); // 5 min TTL
   displayConnectionQR(url, tempToken);
   ```

2. **Première connexion** (`POST /api/login`)
   ```typescript
   if (verifyTemporaryToken(token)) {
     const permanentToken = createPermanentToken(deviceName);
     markTemporaryTokenUsed(token);
     return { token: permanentToken };
   }
   ```

3. **Connexions suivantes** (`authMiddleware`)
   ```typescript
   if (verifyPermanentToken(token)) {
     updateLastUsed(token);
     next();
   }
   ```

## Tailscale Funnel

### Auto-configuration

```typescript
// src/tailscale-funnel.ts

export async function setupTailscaleFunnel() {
  // 1. Vérifier Tailscale actif
  execSync('tailscale status');

  // 2. Reset anciens funnels
  execSync('tailscale funnel reset');

  // 3. Configurer funnel
  execSync(`tailscale funnel --bg ${WEB_PORT}`);

  // 4. Obtenir URL
  const status = execSync('tailscale serve status');
  const url = parseUrl(status);

  return { funnelUrl: url, hostname: parseHostname(url) };
}
```

### Fallback gracieux

Si Tailscale non disponible :
- Détection silencieuse
- Fallback sur localhost
- Message utilisateur clair
- Pas de crash

## Container Runtime

### Détection auto

```typescript
function ensureContainerSystemRunning() {
  // 1. Try Docker (cross-platform)
  try {
    execSync('docker info');
    return;
  } catch {}

  // 2. Try Apple Container (macOS)
  try {
    execSync('container system status');
    return;
  } catch {}

  // 3. Start Apple Container
  execSync('container system start');
}
```

### Cleanup automatique

Au démarrage, suppression des conteneurs stoppés :
```typescript
const stale = execSync('container ls -a')
  .split('\n')
  .filter(n => n.startsWith('nanoclaw-'));
execSync(`container rm ${stale.join(' ')}`);
```

## IPC (Inter-Process Communication)

Les agents dans les conteneurs communiquent avec le router via fichiers IPC.

### Namespace par groupe

```
store/ipc/
├── main/             # Main group IPC
│   ├── task_123.json
│   └── group_456.json
└── other-group/      # Other group IPC
    └── task_789.json
```

**Sécurité** : Un groupe ne peut pas lire/écrire dans le namespace d'un autre.

### Types de messages IPC

```typescript
// Schedule task
{
  type: 'schedule_task',
  prompt: '...',
  schedule_type: 'cron' | 'interval' | 'once',
  schedule_value: '0 9 * * *',
  groupFolder: 'main'
}

// Register group (main only)
{
  type: 'register_group',
  jid: '...',
  name: '...',
  folder: '...',
  trigger: '@Jimmy'
}
```

## Extensibilité

### Ajouter un nouveau channel

1. **Créer le module** : `src/telegram-channel.ts`
   ```typescript
   export function initTelegramChannel(config) {
     // Setup bot
     // Event handlers
     // Call runContainerAgent()
   }
   ```

2. **Ajouter config** : `channels.yaml`
   ```yaml
   telegram:
     enabled: true
     bot_token: "..."
   ```

3. **Loader** : `src/index.ts`
   ```typescript
   if (isChannelEnabled('telegram')) {
     const { initTelegramChannel } = await import('./telegram-channel.js');
     initTelegramChannel(config.channels.telegram);
   }
   ```

4. **Documentation** : Ajouter section dans `docs/channels.md`

### Ajouter un nouveau plugin

Exemple : Intégration Gmail

1. **Créer skill** : `.claude/skills/add-gmail/SKILL.md`
2. **Implémenter** : `src/integrations/gmail.ts`
3. **Documentation** : Section dans `docs/channels.md` ou nouveau fichier
4. **Configuration** : Ajouter à `channels.yaml` si nécessaire

## Fichiers clés

```
src/
├── index.ts                # Router principal
├── config.ts               # Configuration globale
├── channels-config.ts      # Loader channels.yaml
├── pwa-channel.ts          # Logic PWA standalone
├── web-server.ts           # API REST + WebSocket
├── auth.ts                 # Authentification tokens
├── tailscale-funnel.ts     # Setup Tailscale auto
├── container-runner.ts     # Exécution agent
├── db.ts                   # SQLite operations
├── task-scheduler.ts       # Tâches programmées
├── logger.ts               # Logging (Pino)
└── types.ts                # Types TypeScript

public/                     # PWA Frontend
├── index.html
├── app.js                  # Client logic
├── styles.css
├── sw.js                   # Service Worker
└── manifest.json           # PWA manifest

channels.yaml               # Configuration channels
groups/                     # Conversations isolées
data/                       # Runtime data
store/                      # Persistence (DB, auth, IPC)
```

## Dépendances principales

```json
{
  "dependencies": {
    "@whiskeysockets/baileys": "WhatsApp client",
    "better-sqlite3": "SQLite database",
    "cron-parser": "Parse cron expressions",
    "pino": "Fast logging",
    "express": "Web server",
    "ws": "WebSocket",
    "js-yaml": "YAML parsing",
    "qrcode-terminal": "QR codes in terminal"
  }
}
```

## Performance

### Optimisations

- **Polling interval** : 2s pour messages, 60s pour scheduler
- **Connection reuse** : WebSocket pour PWA (pas de HTTP polling)
- **Container reuse** : Sessions persistées entre exécutions
- **Lazy loading** : Channels chargés à la demande

### Limites

- Messages WhatsApp : Stockage illimité (SQLite)
- Conversations PWA : En mémoire (limitées par RAM)
- Containers : 1 par exécution agent (pas de pool)
- WebSocket clients : Pas de limite hard

## Sécurité

### Tokens

- Génération : `crypto.randomBytes(32)` (256 bits)
- Stockage : `data/auth.json` (local filesystem)
- Transmission : HTTPS (Tailscale Funnel)
- Pas de password (tokens suffisent)

### Container isolation

- Chaque groupe dans un conteneur isolé
- Mounts read-only pour projet
- Mounts read-write pour groupes (isolés)
- Pas d'accès réseau par défaut

### IPC namespace

- Un groupe ne peut pas lire IPC d'un autre
- Main group a permissions élevées
- Validation systématique des sources

## Troubleshooting

### Logs

```bash
# Logs en temps réel
npm start

# Logs dans fichiers
tail -f store/logs/*.log
```

### Debug container

```bash
# Voir containers actifs
docker ps
# ou
container ls

# Logs d'un container
docker logs <container-id>
# ou
container logs <container-id>
```

### Reset complet

```bash
# Supprimer toutes les données
rm -rf data/ store/

# Rebuild
npm run build

# Redémarrer
npm start
```

## Tests

**Status** : Pas de tests automatisés pour l'instant.

**Plan** :
- Unit tests : channels-config, auth
- Integration tests : API endpoints
- E2E tests : Flow complet PWA/WhatsApp

## Contribution

Voir [CONTRIBUTING.md](../CONTRIBUTING.md) pour :
- Guidelines de code
- Process PR
- Style guide

## Roadmap

- [ ] Persistence SQLite pour PWA
- [ ] Support Telegram
- [ ] Support Slack
- [ ] Multi-user PWA
- [ ] Tests automatisés
- [ ] Metrics et monitoring
