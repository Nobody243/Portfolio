# Git & Security Checklist — read before every commit

This applies to every ticket, every commit, no exceptions. The implementer agent must follow this
checklist before running `git add` or `git commit` — not just on the first commit.

## 1. Before the very first commit in this repo
Confirm `.gitignore` exists at the project root and includes at minimum:
```
node_modules/
.next/
.env
.env.local
.env*.local
.DS_Store
*.log
```
If it's missing or incomplete, create/fix it **before** staging anything else.

## 2. Before every single commit, in this order
1. Run `git status` and actually read the output — don't skip this because it "should" be fine.
2. If anything named `.env*`, `*secret*`, `*key*`, `*credential*`, or any file you don't recognize
   appears in the list of changes, **stop** — do not add or commit it. Figure out why it's there
   (missing gitignore entry, accidental file, etc.) and fix that first.
3. Never hardcode an API key, token, password, or credential directly in source code — always via
   an environment variable, even during early scaffolding when no real key exists yet. If a ticket
   needs a placeholder, use something like `process.env.RESEND_API_KEY` with a comment, never a
   literal-looking fake key string that could be mistaken for real later.
4. Only after both checks pass: `git add` the specific intended files (prefer explicit paths over
   `git add .` when unsure what changed), then `git commit` with a clear, specific message describing
   what that commit actually does (e.g. "Ticket 3: hero camera pull-back timing" — not "updates").

## 3. If a secret ever does get committed
Stop immediately and tell Saad directly — do not attempt to fix it by simply deleting the file in a
new commit, since the secret remains in git history and will be pushed anyway if a remote is
connected. This has happened before on a previous project (ClashChat, Firebase key) and was fixed
with `git filter-repo` to actually rewrite history — the same approach applies here if it recurs.
Rotating/invalidating the exposed key at its source is also required, not just removing it from git.

## 4. Before every `git push`
Confirm you're pushing to the correct, intended remote and branch. Never push force (`--force`)
without explicit confirmation from Saad first, since it can overwrite remote history other work may
depend on.
