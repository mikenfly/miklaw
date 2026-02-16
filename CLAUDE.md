# NanoClaw

Personal Claude assistant. See [README.md](README.md) for philosophy and setup. See [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) for architecture decisions.

## Quick Context

Single Node.js process that connects to WhatsApp, routes messages to Claude Agent SDK running in Apple Container (Linux VMs). Each group has isolated filesystem and memory.

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main app: WhatsApp connection, message routing, IPC |
| `src/config.ts` | Trigger pattern, paths, intervals |
| `src/container-runner.ts` | Spawns agent containers with mounts |
| `src/web-server.ts` | Express API + WebSocket + sert le frontend PWA |
| `src/task-scheduler.ts` | Runs scheduled tasks |
| `src/db.ts` | SQLite operations |
| `groups/{name}/CLAUDE.md` | Per-group memory (isolated) |
| `pwa/src/` | Frontend React (Vite + Zustand + React 19) |
| `container/agent-runner/` | Code exécuté dans les containers Docker |

## Skills

| Skill | When to Use |
|-------|-------------|
| `/setup` | First-time installation, authentication, service configuration |
| `/customize` | Adding channels, integrations, changing behavior |
| `/debug` | Container issues, logs, troubleshooting |

## Worktrees

On peut faire tourner plusieurs instances NanoClaw en parallèle grâce aux git worktrees. Chaque worktree a son propre store, data et groups isolés — il suffit de configurer un port différent via `.env`. Fonctionne en local pur ou avec Tailscale Funnel pour tester sur mobile.

→ **[docs/dev/worktrees.md](docs/dev/worktrees.md)** pour le setup et les variables d'environnement.

## Agent Tools

Des outils CLI sont disponibles pour les agents dans les containers :

- **agent-browser** : automatisation de navigateur headless (navigation, inspection d'accessibilité, interaction par refs, screenshots). Permet aux agents de rechercher sur le web, remplir des formulaires, extraire du contenu de pages.

→ **[docs/agent-tools/](docs/agent-tools/)** pour la référence des commandes.

## Build with Agent Team

On peut orchestrer des builds complexes avec une équipe d'agents Claude Code coordonnés. Un agent lead répartit le travail, impose des contrats d'interface entre agents (API contracts, schemas), et valide l'intégration end-to-end. Utile pour les projets multi-couches (frontend/backend/DB) où le parallélisme accélère le développement.

→ **[.claude/skills/build-with-agent-team/](/.claude/skills/build-with-agent-team/SKILL.md)** pour le protocole complet.

## Development

Run commands directly—don't tell the user to run them.

```bash
# Dev (backend + frontend hot reload)
npm run dev:all      # Lance backend + Vite ensemble
npm run dev          # Backend seul (tsx watch hot reload)
npm run dev:pwa      # Frontend seul (Vite hot reload, HTTPS)

# Les ports sont configurés dans .env (WEB_PORT) et pwa/vite.config.ts
# Vite proxy /api et /ws vers le backend automatiquement

# Build
npm run build        # Compile TypeScript backend
npm run build:pwa    # Build frontend (pwa/dist/)
./container/build.sh # Rebuild agent container image
```

### Authentication en dev

Un `DEV_TOKEN` stable est défini dans `.env`. Il ne expire jamais et évite de devoir re-générer un token à chaque relance. URL d'accès direct :

```
https://localhost:<vite-port>/?token=$DEV_TOKEN
```

### IMPORTANT : Ne pas relancer le serveur

**Le serveur tourne déjà en arrière-plan via `npm run dev:all`.** Le backend a le hot reload (`tsx watch`) et le frontend aussi (Vite HMR). Quand tu modifies du code, les changements sont appliqués automatiquement.

**NE JAMAIS faire :**
- `npm run dev` / `npm run dev:all` / `npm start` → le serveur tourne déjà
- `npx tsx src/index.ts` → crée un conflit de port
- Tuer/relancer le process pour "tester" → le hot reload suffit

**Si tu dois vérifier que le serveur tourne :**
```bash
ss -tlnp | grep $WEB_PORT   # Vérifie que le port est écouté
curl -s http://localhost:$WEB_PORT/api/health | head -1  # Health check
```

**Si le serveur ne tourne pas** (et seulement dans ce cas), l'utilisateur le lancera lui-même.

Service management (production) :
```bash
launchctl load ~/Library/LaunchAgents/com.nanoclaw.plist
launchctl unload ~/Library/LaunchAgents/com.nanoclaw.plist
```
