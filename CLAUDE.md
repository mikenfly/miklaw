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
| `src/task-scheduler.ts` | Runs scheduled tasks |
| `src/db.ts` | SQLite operations |
| `groups/{name}/CLAUDE.md` | Per-group memory (isolated) |

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
npm run dev          # Run with hot reload
npm run build        # Compile TypeScript
./container/build.sh # Rebuild agent container
```

Service management:
```bash
launchctl load ~/Library/LaunchAgents/com.nanoclaw.plist
launchctl unload ~/Library/LaunchAgents/com.nanoclaw.plist
```
