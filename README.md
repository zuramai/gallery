# Saugi — A photographic journal

A personal photography portfolio built with Astro. The gallery uses the photos' original proportions, with tag filters and a keyboard-accessible photo-detail lightbox.

## Development

Use Node.js 22.12+ and pnpm 11+.

```sh
pnpm install
pnpm dev --background
```

| Command | Action |
| --- | --- |
| `pnpm astro dev status` | Check the background server |
| `pnpm astro dev logs` | View server logs |
| `pnpm astro dev stop` | Stop the server |
| `pnpm check` | Validate Astro and TypeScript files |
| `pnpm build` | Build the static site into `dist/` |
| `pnpm preview` | Preview the production build |

## Adding photographs

Put your image in `src/photos/images/` and add a Markdown file in `src/photos/`:

```yaml
---
title: A moment worth keeping
description: A short description of what is in the photograph.
location: Hanoi, Vietnam
src: images/your-photo.JPG
tags:
  - Street
  - Vietnam
camera_settings:
  camera: X-M5
  iso: 100
  aperture: 2.8
  focal_length: 45
---
```

Titles, descriptions, locations, tags, and camera settings are validated by `src/content.config.ts`. Filters and counts are generated automatically from the tags. Photos are ordered by filename, so a numeric prefix sets their order. Use `Location unrecorded` when a location is unknown.

Astro and Sharp generate responsive WebP thumbnails and larger lightbox images, respecting the original image orientation. Fonts are downloaded at build time and served locally.

## Social links

Edit the header links in `src/components/SiteHeader.astro` and the Instagram link in `src/pages/index.astro`.
