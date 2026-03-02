# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server
bun run build    # Full build: astro sync && astro check && astro build
bun run preview  # Preview production build
```

The build command runs type checking (`astro check`) before building — use it to verify changes.

## Architecture

Personal portfolio and blog for Shreyas Londhe (shreyaslondhe.xyz), built with **Astro 5**, deployed on **Vercel**.

### Stack
- **Astro** with MDX for content, static output + Vercel adapter for API routes
- **Tailwind CSS 4** (configured in `src/global.css`, not tailwind.config)
- **TypeScript** (strictest tsconfig)
- **Bun** as package manager

### Key Structure
- `src/components/layout.astro` — Base layout with meta tags, OG config, theme script
- `src/components/header.astro` / `footer.astro` — Site-wide nav and theme toggle
- `src/components/main.astro` — Home page: featured projects + social links
- `src/pages/projects.astro` — Full projects listing with roles, stars, descriptions
- `src/pages/writing/*.mdx` — Blog posts with frontmatter (`title`, `description`, `pubDate`)
- `src/pages/writing/index.astro` — Blog listing, auto-discovers posts via `import.meta.glob()`
- `src/pages/api/og.ts` — Dynamic OG image generation via `@vercel/og`

### Content
Blog posts are MDX files in `src/pages/writing/` with this frontmatter:
```
---
layout: ../../components/blog-post.astro
title: "Post Title"
description: "Summary"
pubDate: "YYYY-MM-DD"
---
```

### Styling
- Tailwind utilities as primary styling approach
- Dark mode via `.dark` class on `<html>`, toggled in footer with localStorage persistence
- Intro animation defined in `src/global.css`
- Custom breakpoint: `xs` (500px)
- Inter font loaded from `/public/inter/`

### Important Notes
- Icon files in `src/components/icons/` use PascalCase (`Index.astro`, `Link.astro`) — imports must match casing exactly
- Resume PDF is at `/public/shreyas_resume.pdf`

## Conventions
- Prettier with `prettier-plugin-astro` and `prettier-plugin-tailwindcss`
- Astro components use frontmatter block for props and logic
- Icon components live in `src/components/icons/`
- External links open in new tabs (configured via rehype-external-links in astro.config.mjs)
