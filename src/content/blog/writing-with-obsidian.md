---
title: 'Writing posts with Obsidian'
description: 'The workflow: write Markdown locally, put images next to the post, push, done.'
pubDate: 2026-07-01
tags: ['workflow', 'obsidian']
---

This post exists mostly to document (and test) the publishing workflow.

## The workflow

1. Open Obsidian, pointed at `src/content/blog/` in this repo.
2. Write a note with the frontmatter fields: `title`, `pubDate`, and optionally `description`, `tags`, `draft`.
3. Images go right next to the Markdown file and are referenced relatively:

```md
![a cozy valley](./images/valley.png)
```

4. `git push`. GitHub Actions builds the site and deploys it to GitHub Pages.

## Drafts

Set `draft: true` in the frontmatter and the post is excluded from the build. Remove it (or set it to `false`) when it's ready to ship.

That's the entire system. No plugins, no sync services, no database.
