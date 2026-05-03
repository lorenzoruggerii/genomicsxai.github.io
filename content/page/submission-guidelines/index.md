---
title: "Submission Guidelines"
date: 2026-05-01
url: "/submission-guidelines/"
---

## How to Submit a Blog Post

The Genomics × AI blog uses a Git-native, PR-based submission workflow. All submissions go through peer review before the post goes live.

### Submission Process

1. **Write Your Post**  
   - <a href="/blog-post-template.md" download="blog-post-template.md">Download this blog post template</a>. 
   - Fill in the required fields of the YAML frontmatter
   - Fill in Summary + Sections with your content
   - Conduct internal lab review first  

2. **Submit to our Form or Create a Pull Request Yourself**  
   If you don't have a GitHub account yet, create one. Then you can choose between:
   - Forking the repository and creating a git PR yourself
   - Or submitting your post as a markdown file + images to our submission form LINK: this will handle everything for you (checking that the template satisfies required fields/format + forking the repo + creating PR), but it will prompt you to grant an application (Genomics x AI submission) form access to your GitHub account. ADD DETAILS ABOUT THE SCOPE OF THIS PERMISSION
  
   If creating the PR on your own:
   - Fork LINK
   - Add your post to `content/blogs/YYYY-NNN/index.md`; place all images and assets in the **same folder** (e.g. `content/blogs/YYYY-NNN/figure1.png`)  
   - Your PR must **only** contain files inside `content/blogs/YYYY-NNN/` — do not modify any files outside this folder (no `static/`, `config.toml`, `.github/`, etc.)  
   - Create a PR with the template filled out  

3. **Preview Your Post**  
   - Within a few minutes of submitting the form/opening the PR, a bot will post a comment with a live preview URL  
   - Once the link appears, it may show a 404 for 1–2 minutes while GitHub Pages propagates — refresh until the post loads  
   - The preview renders your post exactly as it will appear on the blog  
   - It updates automatically on each new commit to the PR (allow 1–2 minutes after each push)  
   - If the bot instead posts "Preview Deployment Skipped", it means the PR contains files outside `content/blogs/` — the comment will list the offending files so you can remove them  
   - The preview is not indexed by search engines and is not linked from the main blog; it is deleted automatically when the PR is closed  

4. **Editor Review**  
   - Editors review submissions with a minimal [Editorial Review (MVR)](https://genomicsxai.github.io/editorial-review/) —a quality gate for clarity, correctness, and fit, not full academic peer review  
   - They may request changes via PR comments  
   - Address feedback and update your PR   

5. **Going live**  
   - Once approved, editors will merge your PR  
   - The post will be automatically deployed via GitHub Actions  
   - Your post will appear on the blog  

6. **Updates**
   - Once merged, you can continue to submit updates to your post which will alter the updated date.

### Writing Notes

   - There are no strict stylistic requirements, but posts should be clear, accessible, and engaging for a broad scientific audience.
   - Use headings, figures, and examples where helpful to improve readability.
   - Cite relevant prior work using hyperlinks or a formal inline citation style, and the inclusion of a references section at the end of the post is encouraged.
   - Ensure that claims are supported by appropriate sources.
## What editors look for (high level)

Editors aim to confirm, in a lightweight pass, that your post:

* **Belongs here** — genomics × AI remit; `scope`, tags, and `audience` match the content  
* **Holds up technically** — no obvious factual errors; claims match the evidence you provide  
* **Works for readers** — logical flow (motivation → content → takeaway), appropriate level for the audience  
* **Is complete in the basics** — opening summary via the `summary` shortcode, reasonable attribution, working links, and clean formatting  

For the full framework (checklist, review outcomes, escalation, and time expectations), see **[Editorial Review (MVR)](https://genomicsxai.github.io/editorial-review/)**.


## Example of a strong post

Style and length can vary, but a good reference for structure and depth is [**Adapting AlphaGenome to MPRA data**](https://genomicsxai.github.io/blogs/2026-002/): it states the problem clearly, walks through methods and results in order, includes a reader-facing **Summary**, figures, code-oriented guidance, references, and honest limitations. Use it as inspiration, not a rigid template.


### Getting notified of comments and likes

Comments and likes on the blog use **GitHub Discussions**. To get notified when someone comments or reacts to your post:

1. **Watch the repository**  
   On the [repo page](https://github.com/genomicsxai/genomicsxai.github.io), click **Watch** → **Custom** → enable **Discussions**. You’ll get GitHub notifications (and email if your GitHub settings allow it) for new discussions and comments.

2. **Subscribe to your post’s discussion**  
   Once your post has at least one comment or reaction, a discussion is created under [Post Discussions](https://github.com/genomicsxai/genomicsxai.github.io/discussions/categories/post-discussions). Open your post’s discussion and click **Subscribe** (top right) to get notified only for that thread.

Editors and maintainers can use the same options to follow all post activity.

---

## Submit Your Blog Post

Use the form below to upload your blog post and create a pull request automatically. You'll need a GitHub account.

{{< submission-form >}}
