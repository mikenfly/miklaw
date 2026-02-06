# NanoClaw Documentation

Assistant personnel Claude via messagerie. Simple, sécurisé, extensible.

## 🚀 Démarrage

**Première utilisation ?**

→ [Guide de démarrage rapide](quickstart.md) (5 minutes)

## 📖 Documentation

### Essentiel

- **[Démarrage rapide](quickstart.md)** - Installation et premier setup
- **[Channels](channels.md)** - Interfaces disponibles (PWA, WhatsApp, etc.)

### Avancé

- **[Architecture](architecture.md)** - Détails techniques pour contributeurs

## 🎯 Cas d'usage

### Usage personnel
Interface web moderne, pas besoin de WhatsApp
→ Voir [Channels - PWA](channels.md#pwa)

### Usage en équipe
Bot dans les groupes WhatsApp existants
→ Voir [Channels - WhatsApp](channels.md#whatsapp)

### Multi-interfaces
PWA + WhatsApp synchronisés
→ Voir [Channels - Configuration](channels.md#configuration)

## 🔗 Liens utiles

- [Repository GitHub](https://github.com/gavrielc/nanoclaw)
- [Issues & Support](https://github.com/gavrielc/nanoclaw/issues)
- [Contribution](../CONTRIBUTING.md)

## ⚡ Commandes rapides

```bash
npm start              # Démarrer NanoClaw
npm run auth          # Authentifier WhatsApp
npm run build         # Recompiler
npm run dev           # Mode développement
```

## 📝 Notes

Cette documentation est organisée pour être facilement extensible. Lors de l'ajout de nouvelles fonctionnalités (nouveaux channels, plugins, intégrations), ajoutez-les dans le fichier approprié :

- Nouveaux channels → `channels.md`
- Nouvelles features → `quickstart.md` ou créer un nouveau fichier
- Détails techniques → `architecture.md`
