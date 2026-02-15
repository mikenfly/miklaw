# PWA Test Plan — Feature Coverage

Ce document liste toutes les features de l'UI PWA avec les tests detailles pour chaque feature.
Chaque feature est validee via browser-test (agent-browser headless).

**URL de base** : `http://localhost:17284`

---

## F01 — Login par token

**Fichiers** : `LoginPage.tsx`, `authStore.ts`, `auth.ts`

**Tests** :
- [ ] T01.1 : La page `/login` s'affiche avec le titre "NanoClaw", le sous-titre "Assistant personnel Claude", un champ input et un bouton "Se connecter"
- [ ] T01.2 : Le bouton est disabled quand le champ est vide
- [ ] T01.3 : Saisir un token invalide affiche "Token invalide ou expire"
- [ ] T01.4 : Saisir un token valide redirige vers `/` (page chat)
- [ ] T01.5 : Apres login, recharger la page reste sur `/` (persistence localStorage)

---

## F02 — Login par URL (token dans query param)

**Fichiers** : `AuthGuard.tsx`

**Tests** :
- [ ] T02.1 : Naviguer vers `/?token=<valid_token>` connecte automatiquement sans passer par `/login`
- [ ] T02.2 : Naviguer vers `/?token=invalid` redirige vers `/login`

---

## F03 — Logout

**Fichiers** : `SettingsPage.tsx`, `authStore.ts`

**Tests** :
- [ ] T03.1 : Cliquer "Se deconnecter" dans `/settings` redirige vers `/login`
- [ ] T03.2 : Apres logout, naviguer vers `/` redirige vers `/login`

---

## F04 — Route guard

**Fichiers** : `AuthGuard.tsx`

**Tests** :
- [ ] T04.1 : Sans etre connecte, naviguer vers `/` redirige vers `/login`
- [ ] T04.2 : Sans etre connecte, naviguer vers `/settings` redirige vers `/login`

---

## F05 — Sidebar et liste des conversations

**Fichiers** : `Sidebar.tsx`, `ConversationList.tsx`, `ConversationItem.tsx`

**Tests** :
- [ ] T05.1 : Apres login, la sidebar est visible avec le titre "CONVERSATIONS"
- [ ] T05.2 : La sidebar contient un bouton "Nouvelle conversation" et un lien "Parametres"
- [ ] T05.3 : Les conversations existantes s'affichent dans la sidebar avec nom et temps relatif

---

## F06 — Creation de conversation

**Fichiers** : `NewConversationButton.tsx`, `conversationStore.ts`

**Tests** :
- [ ] T06.1 : Cliquer "Nouvelle conversation" cree une conversation dans la sidebar
- [ ] T06.2 : La nouvelle conversation est automatiquement selectionnee (active)
- [ ] T06.3 : La zone de chat affiche le champ de saisie

---

## F07 — Envoi de message et messages optimistes

**Fichiers** : `MessageInput.tsx`, `messageStore.ts`, `MessageBubble.tsx`

**Tests** :
- [ ] T07.1 : Taper un message et appuyer Enter l'envoie
- [ ] T07.2 : Le message apparait immediatement cote droit (bulles utilisateur)
- [ ] T07.3 : Le bouton d'envoi est disabled quand le textarea est vide
- [ ] T07.4 : Le textarea s'agrandit automatiquement avec le contenu (multi-ligne avec Shift+Enter)

---

## F08 — Reception de message agent (WebSocket)

**Fichiers** : `useWebSocket.ts`, `messageStore.ts`, `MessageBubble.tsx`

**Tests** :
- [ ] T08.1 : Apres envoi d'un message, l'agent repond et la reponse apparait cote gauche
- [ ] T08.2 : La reponse a un avatar different (gradient vert/cyan) de l'utilisateur (gradient violet)
- [ ] T08.3 : Le nom de l'agent s'affiche dans le header de la bulle

---

## F09 — Auto-rename de conversation

**Fichiers** : `pwa-channel.ts` (backend), `useWebSocket.ts`

**Tests** :
- [ ] T09.1 : Creer une conversation, envoyer un premier message → le nom dans la sidebar change du nom par defaut au contenu du message (tronque a 40 chars)

---

## F10 — Renommage manuel de conversation

**Fichiers** : `ContextMenu.tsx`, `conversationStore.ts`

**Tests** :
- [ ] T10.1 : Clic droit sur une conversation ouvre un menu contextuel
- [ ] T10.2 : Cliquer "Renommer" affiche un input inline avec le nom actuel
- [ ] T10.3 : Modifier le nom et appuyer Enter met a jour le nom dans la sidebar

---

## F11 — Suppression de conversation

**Fichiers** : `ContextMenu.tsx`, `ConfirmDialog.tsx`, `conversationStore.ts`

**Tests** :
- [ ] T11.1 : Clic droit > "Supprimer" ouvre un dialogue de confirmation
- [ ] T11.2 : Confirmer supprime la conversation de la sidebar
- [ ] T11.3 : Annuler ferme le dialogue sans supprimer

---

## F12 — Switching entre conversations

**Fichiers** : `ConversationItem.tsx`, `ChatArea.tsx`, `MessageList.tsx`

**Tests** :
- [ ] T12.1 : Creer 2 conversations, envoyer un message dans chacune
- [ ] T12.2 : Switcher entre les deux : chaque conversation affiche ses propres messages (pas de mix)
- [ ] T12.3 : La conversation active est highlight dans la sidebar (fond violet + barre laterale)

---

## F13 — Indicateur de connexion

**Fichiers** : `ConnectionStatus.tsx`, `uiStore.ts`

**Tests** :
- [ ] T13.1 : Quand connecte, une pastille verte est visible dans le header du chat

---

## F14 — Typing indicator (statut agent)

**Fichiers** : `TypingIndicator.tsx`, `agentStatusStore.ts`

**Tests** :
- [ ] T14.1 : Pendant que l'agent traite un message, un indicateur "typing" avec 3 points animes apparait

---

## F15 — Rendu Markdown des messages

**Fichiers** : `MessageContent.tsx`

**Tests** :
- [ ] T15.1 : L'agent peut repondre avec du markdown (gras, italique, listes, code)
- [ ] T15.2 : Le rendu HTML est correct (pas de balises brutes visibles)

---

## F16 — Auto-scroll et badge "Nouveaux messages"

**Fichiers** : `useAutoScroll.ts`, `MessageList.tsx`

**Tests** :
- [ ] T16.1 : Les nouveaux messages font scroller automatiquement vers le bas
- [ ] T16.2 : Si l'utilisateur a scroll vers le haut, pas d'auto-scroll + badge "Nouveaux messages" visible

---

## F17 — Empty state

**Fichiers** : `EmptyState.tsx`, `ChatArea.tsx`

**Tests** :
- [ ] T17.1 : Sans conversation selectionnee, affiche l'icone chat + "Selectionnez une conversation"

---

## F18 — Page Settings — Appareils

**Fichiers** : `SettingsPage.tsx`

**Tests** :
- [ ] T18.1 : Naviguer vers `/settings` affiche la liste des appareils connectes
- [ ] T18.2 : Chaque appareil affiche nom, date de creation, derniere utilisation
- [ ] T18.3 : Le bouton "Generer un token" affiche un token temporaire
- [ ] T18.4 : Le bouton "Revoquer" ouvre un dialogue de confirmation

---

## F19 — Dialogue de confirmation (composant generique)

**Fichiers** : `ConfirmDialog.tsx`

**Tests** :
- [ ] T19.1 : Le dialogue affiche titre, message, boutons Confirmer/Annuler
- [ ] T19.2 : En mode destructif, le bouton Confirmer est rouge
- [ ] T19.3 : Cliquer sur le backdrop ferme le dialogue

---

## F20 — Error Boundary

**Fichiers** : `ErrorBoundary.tsx`

**Tests** :
- [ ] T20.1 : (Difficilement testable via browser — test d'existence du composant dans le DOM)

---

## F21 — Theme dark violet

**Fichiers** : `index.css`, tous les `.css`

**Tests** :
- [ ] T21.1 : Le fond de l'app est sombre (`#0c0c0e`)
- [ ] T21.2 : Les accents sont violets (boutons, bordures, elements actifs)
- [ ] T21.3 : Les bulles utilisateur ont un fond violet translucide
