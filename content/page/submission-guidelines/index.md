---
title: "Submission Guidelines"
date: 2026-05-01
url: "/submission-guidelines/"
---

## Submit Your Blog Post

The Genomics × AI blog uses a peer-reviewed, Git-native workflow. Write your
post from the template, sign in with GitHub, and the form below will fork the
repository, commit your files, and open a pull request — all automatically.

You'll need a [GitHub account](https://github.com/signup).

{{< submission-form >}}

---

## How submission works

1. **Write your post** — Download the template (button above), fill in the YAML
   frontmatter, write your Summary + Sections, and run an internal lab review.
2. **Submit via the form** — Upload your `index.md` and any images. The form
   validates frontmatter, forks the repo, creates a branch, commits, and opens
   a PR for you.
3. **Preview** — Within a few minutes a bot posts a comment with a live preview
   URL. It updates on each new commit. The preview may 404 for 1–2 minutes
   while GitHub Pages propagates.
4. **Editor review** — Editors run a lightweight
   [Minimal Viable Review (MVR)](https://genomicsxai.github.io/editorial-review/)
   for clarity, correctness, and fit. They may request changes via PR comments.
5. **Going live** — Once approved, editors merge the PR and GitHub Actions
   deploys the post.
6. **Updates** — After your post is merged you can revise it through the same
   form. Sign in, choose **Update one of my previous posts**, pick the post
   from the dropdown (only posts you originally submitted appear), and add a
   one-line revision note. You can either pre-fill the form from the published
   version and edit, or start blank for a full rewrite. Submitting opens a PR
   that bumps `revision`, appends to `revision_history`, and re-enters
   editorial review.

On first use, the form asks you to authorize the **Genomics × AI Submission**
OAuth app. It requests the `public_repo` scope — enough to fork, branch,
commit, and PR on your behalf. It can't read private repositories or change
your account settings. Revoke any time from your
[Authorized OAuth Apps](https://github.com/settings/applications).

### Prefer Git? Submit a PR manually

If you'd rather work directly in Git:

- [Fork the repository](https://github.com/genomicsxai/genomicsxai.github.io/fork).
- Add your post to `content/blogs/YYYY-NNN/index.md`; place images in the
  **same folder** (e.g. `content/blogs/YYYY-NNN/figure1.png`).
- Your PR must contain **only** files inside `content/blogs/YYYY-NNN/` — no
  changes to `static/`, `config.toml`, `.github/`, etc. If the preview bot
  posts "Preview Deployment Skipped", the comment lists the offending files.
- Open a pull request against `main` with the submission template filled out.

## Writing notes

- There are no strict stylistic requirements, but posts should be clear,
  accessible, and engaging for a broad scientific audience.
- Use headings, figures, and examples where helpful.
- Cite prior work via hyperlinks or formal inline citations; a references
  section at the end is encouraged.
- Ensure claims are supported by appropriate sources.

## What editors look for

Editors aim to confirm, in a lightweight pass, that your post:

- **Belongs here** — genomics × AI remit; `scope`, tags, and `audience` match
  the content
- **Holds up technically** — no obvious factual errors; claims match the
  evidence you provide
- **Works for readers** — logical flow (motivation → content → takeaway),
  appropriate level for the audience
- **Is complete in the basics** — opening summary via the `summary`
  shortcode, reasonable attribution, working links, clean formatting

For the full framework, see
**[Editorial Review (MVR)](https://genomicsxai.github.io/editorial-review/)**.

## Example of a strong post

Style and length can vary, but a good reference is
[**Adapting AlphaGenome to MPRA data**](https://genomicsxai.github.io/blogs/2026-002/):
it states the problem clearly, walks through methods and results in order,
includes a reader-facing **Summary**, figures, code-oriented guidance,
references, and honest limitations. Use it as inspiration, not a rigid
template.

## Getting notified of comments and likes

Comments and likes use **GitHub Discussions**. To get notified:

1. **Watch the repository** — On the
   [repo page](https://github.com/genomicsxai/genomicsxai.github.io), click
   **Watch** → **Custom** → enable **Discussions**.
2. **Subscribe to your post's discussion** — Once your post has at least one
   comment or reaction, a discussion appears under
   [Post Discussions](https://github.com/genomicsxai/genomicsxai.github.io/discussions/categories/post-discussions).
   Open your discussion and click **Subscribe** for that thread only.

Editors and maintainers can use the same options to follow all post activity.
