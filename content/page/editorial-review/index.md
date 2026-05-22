---
title: "Editorial Review (MVR)"
date: 2026-03-30
url: "/editorial-review/"
---

This page describes the **Minimal Editorial Review (MVR)** framework used by editors when reviewing pull requests. It is a **quality gate**, not academic peer review.

## Goal

Ensure posts are **accurate, readable, appropriately tagged, and safe to publish**—while maintaining a fast turnaround (target: 48–72 hours).

---

## 1. Core review dimensions

### A. Scope and relevance (fast gate)

* Fits the **genomics × AI** remit
* Declared **`scope`** (e.g. tutorials, protocols, insights, ideas, discussions, negative-results) matches the actual content
* **`audience`** (within-field, general, intro-to-field) is plausible for the writing

**Decision rule:** If misaligned → reject or ask the author to reclassify early (update frontmatter and framing).

### B. Technical soundness (lightweight)

* No obvious factual errors
* Methods and tools described correctly
* Claims are **proportionate to evidence**

**For tutorials and protocols:** Steps are logically reproducible; code snippets are coherent (they need not be executed in review).

**For opinion or perspective-style pieces:** Framing is clear (opinion vs. established fact).

**Decision rule:** If correctness is uncertain → escalate to the author (or optional second reviewer; see below).

### C. Clarity and readability

* Clear target audience (implicit or explicit)
* Logical structure: introduction → content → takeaway
* Minimal ambiguity or confusing phrasing

**Heuristic:** A domain peer should be able to follow without re-reading sections multiple times.

### D. Metadata and tagging

* **`tags`** are relevant and consistent with the post
* **At least one discipline tag** is present (`seq2func`, `context-seq2func`, `single-cell`, `synthetic-biology`, `interpretability`, `multi-omics`, or `experimental-design`) so the post surfaces under the homepage Discipline filter
* **`categories`** and **`scope`** reflect the piece
* Title accurately reflects content

### E. Compliance and risk

* No plagiarism
* No slander or defamation
* Proper attribution (figures, code, ideas)
* No unethical or sensitive data misuse (especially genomics)

### F. Presentation quality

* Clean formatting (headers, spacing)
* Figures render correctly
* Links work
* Code blocks properly formatted

### G. Security: posts can run code in a reader's browser

Hugo on this site is configured with `unsafe = true` in `config.toml`, so raw HTML inside a Markdown file is passed through to the published page. The blog is served from the same origin as the submission form, and the submission form stores the author's GitHub OAuth token in `sessionStorage` (key: `gh_token`) — not in an HttpOnly cookie. **A malicious script inside a published post can read that token from any signed-in visitor's browser** and use it to fork, commit, and open PRs in their name. It can also stage CSRF-style state changes against GitHub on the signed-in reader's behalf.

Treat any of the following in a submitted `index.md` as a hard-fail unless the author has a genuine, narrow reason and you've sanity-checked it line by line:

* `<script>` tags (any variant, including `type="module"`, `type="text/javascript"`, async/defer, etc.)
* Inline event handlers — anything matching `on*=` (`onerror`, `onload`, `onclick`, `onmouseover`, `onfocus`, `onpointerdown`, …)
* `javascript:` URIs in `href`, `src`, `action`, or any other URL attribute
* `data:text/html`, `data:application/javascript`, or other executable `data:` URIs
* `<iframe>`, `<frame>`, `<object>`, `<embed>`, `<applet>`, `<portal>`
* `<svg>` elements containing `<script>`, `<foreignObject>`, or event handlers
* `<meta http-equiv="refresh">` (used for auto-redirects/phishing) or `<meta http-equiv="content-security-policy">` (could weaken site CSP)
* `<link rel="import">`, `<link rel="preload" as="script">`, or `<link>` pointing at unfamiliar origins
* `<style>` containing `expression(...)`, `@import`, or `url(javascript:...)`
* `<form>` elements that POST anywhere other than this site — credential-phishing risk
* KaTeX `\href{javascript:...}` and similar protocol-handler tricks inside math blocks
* Base64- or hex-obfuscated blobs in attributes whose decoded content you can't read at a glance
* Outbound `target="_blank"` links missing `rel="noopener"` — tabnabbing risk
* Visible HTML that imitates the site's "Sign in with GitHub" button or any other auth prompt — clickjacking / fake-login risk

**Pre-merge grep on the PR diff** (run at the repo root after checking out the PR branch):

```bash
grep -nEi '<script|<iframe|<object|<embed|<applet|<portal|on[a-z]+=|javascript:|data:text/html|data:application/javascript|<meta[[:space:]]+http-equiv|<form|<link[[:space:]]+rel="import"|expression\(|@import' content/blogs/YYYY-NNN/
```

False positives are usually obvious (the word `onclick` inside a fenced code block discussing event handlers, the string `<script>` inside a quoted example). If a match is genuine raw HTML the author intended to publish, ask them to either remove it or convert it to a fenced code block (` ``` `) so it renders as text, not as live HTML. **When in doubt, reject.**

Until the site moves the OAuth token to an HttpOnly cookie or adopts a strict CSP, this check is the only thing standing between a malicious submission and every signed-in reader's GitHub account.

---

## 2. Executive summary requirement

### Purpose

Provide a **clear, concise entry point** for readers across disciplines.

### Requirement

Each post must include an **executive summary** (3–5 bullets or a short paragraph) that:

* States the topic
* Highlights key takeaway(s)
* Indicates intended audience

On this site, that content lives in the **`{{</* summary */>}}` … `{{</* /summary */>}}`** shortcode pair in the post body (see [submission guidelines](/submission-guidelines/) and the blog post template).

### Responsibility

* **Preferred:** Provided by the author
* **Fallback:** Added or refined by the handling editor if missing or unclear

### Editor guidelines

* Neutral and faithful to content
* No hype or reinterpretation
* Plain language
* About 75–100 words or 3–5 bullets

---

## 3. Review outcomes

Editors choose one:

* **Accept**
* **Minor revisions**
* **Major revisions**
* **Not Accepted** (out of scope or insufficient quality)

---

## 4. Minimal review checklist

### Must pass (hard requirements)

* [ ] In scope (genomics × AI)
* [ ] No obvious technical errors
* [ ] No plagiarism / slander
* [ ] Tags, scope, and audience correctly applied
* [ ] **At least one discipline tag** present (see [§1D](#d-metadata-and-tagging))
* [ ] Readable and logically structured
* [ ] Executive summary present in the summary shortcode (or added by editor)
* [ ] No raw HTML/JS that could execute in a reader's browser — ran the §1.G grep and reviewed any matches

### Should pass (soft requirements)

* [ ] Clear takeaway or value
* [ ] Appropriate level for audience
* [ ] References and links included where needed
* [ ] Formatting clean

---

## 5. Time expectations

* Initial triage: under 10 minutes
* Full minimal review: 30–45 minutes
* Total turnaround: 2–3 days (target)

---

## 6. Escalation (optional review layer)

Escalate beyond MVR only if:

* Highly technical or novel method
* Potentially controversial claims
* Uncertainty about correctness
* High-visibility post

**Action:** Assign a second reviewer (focus on correctness, clarity, and usefulness).

---

## 7. Roles and responsibilities

### Handling editor

* Owns the review process
* Completes the MVR checklist
* Adds or refines the executive summary if needed
* Makes the recommendation to the team

### Optional reviewer

* Provides input when escalated
* Focus on correctness, clarity, and usefulness

---

## 8. Guiding principle

> We are not performing academic peer review—we are ensuring clarity, correctness, and usefulness.

---

## 9. Optional submission enhancements

Authors are encouraged to make explicit:

* **Who is this for?**
* **What will the reader learn?**

These improve review efficiency and content clarity. They can sit in the summary block or the introduction.
