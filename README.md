# philpegram.com

Static site served by GitHub Pages from the root of `main` (see `CNAME` and `.nojekyll`). There is no build step.

## Structure

- `*.html`: one file per page, served at extensionless URLs (for example `/about`).
- `styles.css`: shared styles. `home-resources.css`, `playbook.css` and `decision-profile.css` are page-specific.
- `site.js`: navigation, contact message templates and shared behaviour.
- `playbook.js`, `decision-profile.js`: the two free resources.
- `robots.txt`, `sitemap.xml`, `llms.txt`: crawler and discovery files.

## Preview locally

    python3 -m http.server 8000

Then open http://localhost:8000. Extensionless URLs only resolve on GitHub Pages, so use `/about.html` locally.

## Checks

    python3 scripts/check_site.py

Checks titles, canonicals, descriptions, one H1 per page, duplicate IDs, JSON-LD syntax, local links and fragments, and that every sitemap URL has a matching file. The same script runs on every pull request via `.github/workflows/site-checks.yml`.

## Release checklist

1. Open a pull request and wait for the checks to pass.
2. Merge to `main`, then confirm the Pages deployment finished (Actions tab).
3. Load the live homepage and one changed page in a private window to rule out caching.
4. Add any new page to `sitemap.xml` and `llms.txt`.
