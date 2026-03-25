# Secretlint 30-Second Quickstart (Transcript)

```bash
$ secretlint init
Initialized .secretlintrc.json
Initialized .secretlint-baseline.json

$ secretlint scan
[HIGH]
File: src/App.js:6:30
Issue: OpenAI key exposed
Rule: openai-key
Risk: HIGH
Snippet: Authorization: "Bearer sk-proj-..."
Reason: Sensitive key appears in likely frontend context
Fix: Move secret to backend proxy and call internal endpoint instead.

1 issues found (1 high risk, 0 medium, 0 low)

$ secretlint fix
Generated: secretlint-output/backend.js
Generated: secretlint-output/frontend.patch.js

$ secretlint rotate openai --dry-run
[1] Open: https://platform.openai.com/api-keys
[2] Create a new key with least privilege
[3] Rotate without committing plaintext keys
Dry run enabled: no file was modified.
Would update .env with OPENAI_API_KEY
```
