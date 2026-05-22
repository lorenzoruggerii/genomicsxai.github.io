---
post_id: "YYYY-NNN"
title: "Your Post Title"

# Optional: image filename "your-image.png" in the same folder

# Optional: Enable KaTeX for inline/block math (e.g. $10^{-K}$)
math: true

# Author(s): list of names (used for /authors/<slug>/)
authors: ["Author One", "Author Two"]

# Optional: full details for citation, display and JSON-LD
authors_display:
  - name: "Author One"
    affiliation: "Institution"
    orcid: ""
  - name: "Author Two"
    affiliation: "Institution"
    orcid: ""

editor: "Editor Name"

# Set automatically by the submission form to the GitHub login of the original
# submitter. Used by the form to surface "Update one of my previous posts" for
# the same account on later revisions. Safe to omit when authoring manually.
# submitter_github: "your-github-login"

# Add any number of tags. They're searchable on the blog homepage. See https://genomicsxai.github.io/tags/ for examples.
tags: ["genomics", "causal-inference"]
# Category determines which homepage pill filter the post appears under.
# Supported values: "Announcement", "Blog Post", "Tutorial", "Perspective"
#   - "Announcement" → appears under the Announcements pill (editorial/community announcements)
#   - "Blog Post"    → appears under the Blogs pill (default for most posts)
#   - "Tutorial"     → appears under the Tutorials pill (step-by-step technical guides)
#   - "Perspective"  → appears under the Perspectives pill (opinion pieces, commentary)
# Note: the homepage pills filter by `categories` only, not by `scope`.
categories: ["Blog Post"]

# One or more: protocols, tutorials, negative-results, discussions, insights, ideas
scope: ["insights"]
# One or more: within-field, general, intro-to-field
audience: ["within-field"]
labs: ["Your Lab Name"]

status: "submitted"
revision: 1

date_submitted: 2026-02-19
date_accepted: 
date: 2026-02-19

doi: ""
zenodo_url: ""
revision_history:
  - version: 1
    date: 2026-02-19
    notes: "Initial submission"
    # Optional: version-specific DOI / Zenodo record link
    doi: ""
    zenodo_url: ""
---

{{< summary >}}

Include a high-level summary of your post here. Alternatively editors can write a summary of the post if requested.

{{< /summary >}}

---

## Introduction (or other name for your first section)

Your content here. Use standard Markdown. For images in the post folder:

![Alt text](filename.png "width=400")

## Section two

...
```

Maintainers can also populate DOI metadata automatically at deploy time via `data/zenodo.json` when `ZENODO_API_TOKEN` is configured in GitHub Actions.

See [BLOG_SPEC.md](./BLOG_SPEC.md) for full frontmatter and tag options.

## References
