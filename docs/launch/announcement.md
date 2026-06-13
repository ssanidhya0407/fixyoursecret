# Launch Announcement Drafts

Channel-specific copy. Honest, differentiator-first, feedback-seeking. Replace
`LINK` with the repo/npm URL. Don't claim to beat established tools — lead with
what's genuinely different and let the benchmark speak.

---

## Hacker News (Show HN)

**Title:**
Show HN: FixYourSecret – a secret scanner that ranks leaks by exploitability and generates the fix

**Body:**
Most secret scanners stop at finding — you get a wall of leaked strings and it's on you to figure out which ones actually matter and what to do about them.

I built FixYourSecret to close that loop:

- **Risk ranking by real exposure.** A key in `src/components/` ships to every browser; the same key in a backend `.env` is far less urgent. It escalates the frontend-exposed ones to HIGH so you triage what's actually exploitable.
- **Remediation, not just detection.** It generates a backend proxy + frontend patch to move the secret server-side, and walks you through rotating the key.
- **Full git-history scanning** with commit attribution — catches secrets that were committed then deleted, which a working-tree scan never sees.
- **Verifiable accuracy.** There's a labeled-corpus benchmark in the repo (known secrets planted at known locations + realistic hard negatives) so you can run `npm run benchmark:corpus` and see the precision/recall yourself, rather than trusting a number in a README.
- **Custom rules** for internal token formats, a one-line **GitHub Action** (SARIF → code scanning), and a **pre-commit hook**.

It's early and single-maintainer, so I'd genuinely value feedback — especially false positives on real codebases and detector formats you'd want added.

CLI: `npx fixyoursecret scan`
Repo: LINK

---

## Reddit (r/devops, r/netsec, r/node)

**Title:** I built a secret scanner that ranks leaks by exploitability and generates the fix (not just a list)

**Body:**
Every secret scanner I tried gave me a list of findings and stopped there. FixYourSecret tries to be the whole workflow:

1. **Find** — across the working tree *or* full git history (deleted commits included, with commit attribution).
2. **Prioritize** — frontend-exposed secrets → HIGH automatically. A key in client code is shipping to every user; it shouldn't rank the same as one in a backend env file.
3. **Fix** — generates a backend proxy + frontend patch to move the secret server-side.
4. **Rotate** — guided key rotation that updates your `.env`.
5. **Gate CI** — one-line GitHub Action with SARIF code-scanning output, plus a pre-commit hook.

Accuracy is measured against a labeled corpus with ground truth (`npm run benchmark:corpus`) so it's reproducible, not a vanity number. Custom rules let you add internal token formats without forking.

MIT, Node ≥ 20. It's new and I'm one person — feedback and false-positive reports on real repos are very welcome.

LINK

---

## dev.to / Hashnode (article)

**Title:** Finding a leaked API key is the easy part. FixYourSecret does the rest.

**Outline:**
- **The gap:** scanners are great at detection and terrible at *what next*. A 300-line findings report is a to-do list, not a fix — and most of it is low-risk noise.
- **Exploitability ranking:** why location matters. `src/` vs `server/.env`, public-env prefixes (`NEXT_PUBLIC_`, `VITE_`), and how FixYourSecret escalates the genuinely dangerous leaks.
- **Remediation built in:** walk through `fix` (backend proxy + frontend patch) and `rotate`.
- **The leak you can't see:** full git-history scanning and why deleted-but-committed secrets are the most common real breach vector.
- **Trust, earned:** the labeled-corpus benchmark — show the ground-truth method and the reproducible command.
- **Adopt in one paste:** the GitHub Action + SARIF, the pre-commit hook, and custom rules.
- **Call to action:** try it, file false positives, request detectors.

---

## X / LinkedIn (short)

Finding a leaked API key is the easy part.

FixYourSecret ranks each leak by *real* exploitability (frontend-exposed → HIGH), generates the backend fix, guides rotation, and scans your full git history for secrets that were committed then deleted.

One-line GitHub Action. Reproducible accuracy benchmark. MIT.

→ LINK
