---
name: notebooklm
description: Interact with Google NotebookLM via the nlm CLI. Use when the user wants to manage notebooks, add sources, generate podcasts/videos/reports, research topics, query notebook content, or download artifacts.
disable-model-invocation: true
argument-hint: "[action] [args...]"
allowed-tools: Bash(nlm *), Read
---

# NotebookLM CLI Skill

Interact with Google NotebookLM through the `nlm` CLI. All operations go through shell commands — no MCP server needed.

## Before Any Operation

Check auth status first. If it fails, tell the user to re-export cookies via `nlm login --manual --file <path>` (no browser available on this machine).

```bash
nlm auth status
```

## Core Workflows

### List & explore notebooks
```bash
nlm notebook list
nlm notebook get <id>
nlm notebook describe <id>
nlm source list <notebook-id>
```

### Query notebook content (one-shot, NEVER use `nlm chat start`)
```bash
nlm notebook query <id> "your question"
nlm notebook query <id> "follow up" --conversation-id <cid>
```

### Add sources
```bash
nlm source add <id> --url "https://..." --wait
nlm source add <id> --text "content" --title "Title"
nlm source add <id> --file /path/to/doc.pdf --wait
nlm source add <id> --drive <doc-id>
```

### Generate content (always use --confirm)
```bash
nlm audio create <id> --confirm                    # Podcast
nlm video create <id> --confirm                    # Video
nlm report create <id> --confirm                   # Report
nlm quiz create <id> --count 5 --difficulty 3 --confirm
nlm flashcards create <id> --confirm
nlm mindmap create <id> --confirm
nlm slides create <id> --confirm
nlm infographic create <id> --confirm
```

### Check status & download
```bash
nlm studio status <id>
nlm download audio <id> --id <artifact-id> --output file.mp3
nlm download video <id> --id <artifact-id>
nlm download report <id> --id <artifact-id>
```

### Research
```bash
nlm research start "query" --notebook-id <id>              # Fast web
nlm research start "query" --notebook-id <id> --mode deep  # Deep (~5min)
nlm research status <id>
nlm research import <id> <task-id>
```

### Aliases (shortcuts for UUIDs)
```bash
nlm alias list
nlm alias set myname <uuid>
nlm notebook get myname        # Use alias anywhere
```

## Important Rules

1. **Never use `nlm chat start`** — it opens an interactive REPL. Use `nlm notebook query` instead.
2. **Always use `--confirm`** on generation and delete commands to avoid blocking prompts.
3. **Always ask the user before deleting** anything — deletions are irreversible.
4. **Use `--wait`** when adding sources before querying them.
5. **Poll `nlm studio status`** before downloading — generation takes 30s to 5min.
6. **Use default output** (no flags) for status checks — it's token-efficient. Use `--json` only when parsing specific fields.
7. **Auth is cookie-based** and may expire. If any command returns auth errors, inform the user.

## Arguments

If invoked as `/notebooklm <action>`, interpret the action naturally:
- `/notebooklm list` → list notebooks
- `/notebooklm query mynotebook "question"` → query
- `/notebooklm create podcast for mynotebook` → audio create
- `/notebooklm add https://url to mynotebook` → source add

For complete command reference with all flags and options, see [references/command-reference.md](references/command-reference.md).
