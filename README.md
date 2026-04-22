# genomicsxai.github.io

[website](https://genomicsxai.github.io/)

## Manual Test Publish

Use the `Test Publish Pipeline` GitHub Actions workflow to exercise the production publish path on a branch without touching the live site.

Required secrets when repository `GITHUB_TOKEN` is read-only:

- `GH_PAGES_TOKEN`: PAT or fine-grained token with access to push to `gh-pages`.
- `GH_CONTENTS_WRITE_TOKEN`: PAT or fine-grained token with contents write access if you want workflows to commit `data/zenodo.json` back to a branch.
- `GH_DISCUSSIONS_TOKEN`: PAT with repository discussions write if you want the workflow to create missing discussions.
- `GH_EDITORS_TOKEN`: optional PAT with `read:org` to populate the editorial board.
- `ZENODO_API_TOKEN`: only needed for real Zenodo sync, not dry-run.

Recommended first run:

1. Open `Actions > Test Publish Pipeline`.
2. Choose your branch.
3. Set `blog_post_paths` to a specific post such as `content/blogs/2026-004/index.md`.
4. Set `preview_slug` to a stable name such as `zenodo-test`.
5. Leave `deploy_preview=true` and `zenodo_dry_run=true`.
6. Run the workflow and check the preview under `https://genomicsxai.github.io/previews/manual/<preview_slug>/`.

For an end-to-end Zenodo test, set `zenodo_dry_run=false`, point `zenodo_api_base` at `https://sandbox.zenodo.org/api`, and make sure the selected post has frontmatter `status: "accepted"`.
