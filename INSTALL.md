# Install — funnel-skills

## The fast way (one line)

```bash
curl -fsSL https://raw.githubusercontent.com/naveends798/funnel-skills/main/install.sh | bash
```

That single command:
- Clones the repo to `~/.funnel-skills/`
- Runs `npm install`
- Symlinks `.claude/skills/*` and `.claude/commands/*` into `~/.claude/` (so the slash commands work in **every** Claude Code project)
- Adds `FUNNEL_SKILLS_HOME` to your shell profile

After it finishes:
1. Open Claude Code in any folder.
2. Type **`/funnel-intake`** — Claude asks for client info, you paste anything.
3. When the funnel is live, type **`/audit <slug>`**.

## Prerequisites

- **Node.js 20+** — `node --version` to check. Install at https://nodejs.org/
- **Claude Code** — install at https://claude.com/claude-code
- **git** — should already be installed on macOS / most Linux

## Optional API keys (for deeper research)

Both optional. Without either, the skills fall back to Claude Code's built-in WebSearch (free, slightly less deep).

Add to `~/.funnel-skills/.env`:

```env
APIFY_TOKEN=...        # https://console.apify.com/account/integrations
OPENROUTER_API_KEY=... # https://openrouter.ai/keys (single key, hits perplexity/sonar-pro)
```

## Where output goes

When you run `/funnel-intake` from any folder, output lands at `<that folder>/output/<client-slug>/`.

So you can keep client work isolated:

```bash
cd ~/agency-clients/strong-method
# /funnel-intake → output/strong-method-coaching/

cd ~/agency-clients/shipflow
# /funnel-intake → output/shipflow/
```

## Manual install (if you don't trust the curl|bash)

```bash
git clone https://github.com/naveends798/funnel-skills.git ~/.funnel-skills
cd ~/.funnel-skills
npm install
mkdir -p ~/.claude/skills ~/.claude/commands
ln -s ~/.funnel-skills/.claude/skills/* ~/.claude/skills/
ln -s ~/.funnel-skills/.claude/commands/* ~/.claude/commands/
echo 'export FUNNEL_SKILLS_HOME=~/.funnel-skills' >> ~/.zshrc  # or ~/.bashrc
```

## Update

```bash
cd ~/.funnel-skills && git pull && npm install
```

## Uninstall

```bash
~/.funnel-skills/uninstall.sh        # removes symlinks, keeps your client output
~/.funnel-skills/uninstall.sh --purge # full removal
```

## Verify

```bash
ls -la ~/.claude/commands/funnel-intake.md  # should be a symlink to ~/.funnel-skills/...
ls -la ~/.claude/commands/audit.md          # same
echo $FUNNEL_SKILLS_HOME                    # should print ~/.funnel-skills
```

In Claude Code, `/funnel-intake` should auto-complete in the slash-command picker.

## Troubleshooting

**Symlink already exists** — installer backs up existing files to `*.bak` automatically.

**Slash command not visible in Claude Code** — restart Claude Code so it re-scans `~/.claude/commands/`.

**`/funnel-intake` runs but can't find `dashboard/`** — `FUNNEL_SKILLS_HOME` env var isn't set in the shell Claude Code is using. Restart Claude Code after install, OR run `/funnel-intake` from inside `~/.funnel-skills/` directly.

**Pre-existing user skills with the same names** — installer renames them to `*.bak` so nothing's destroyed. Check `~/.claude/skills/*.bak`.
