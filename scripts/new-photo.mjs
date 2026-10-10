#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import exifr from "exifr";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const photosDir = join(root, "src", "photos");
const imagesDir = join(photosDir, "images");

const [imagePathArg, filenameArg] = process.argv.slice(2);

if (!imagePathArg || !filenameArg) {
    console.error("Usage: pnpm new-photo <image-path> <filename>");
    process.exit(1);
}

const imagePath = join(process.cwd(), imagePathArg);
if (!existsSync(imagePath)) {
    console.error(`Image not found: ${imagePathArg}`);
    process.exit(1);
}

const slug = basename(filenameArg, extname(filenameArg))
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

if (!slug) {
    console.error(`Invalid filename: ${filenameArg}`);
    process.exit(1);
}

const ext = extname(imagePathArg) || ".jpg";
const imageName = `${slug}${ext}`;
const targetImage = join(imagesDir, imageName);

if (existsSync(targetImage)) {
    console.error(`Image already exists: src/photos/images/${imageName}`);
    process.exit(1);
}

const nextNumber =
    readdirSync(photosDir)
        .map((file) => file.match(/^(\d+)-/)?.[1])
        .filter(Boolean)
        .reduce((max, n) => Math.max(max, Number(n)), 0) + 1;

const markdownPath = join(photosDir, `${nextNumber}-${slug}.md`);
if (existsSync(markdownPath)) {
    console.error(`Markdown already exists: src/photos/${nextNumber}-${slug}.md`);
    process.exit(1);
}

let exif = {};
try {
    exif = await exifr.parse(imagePath, {
        pick: ["Make", "Model", "FNumber", "ApertureValue", "ISO", "FocalLength"],
    }) ?? {};
} catch (error) {
    console.warn(`Could not read EXIF: ${error.message}`);
}

const camera = (exif.Model || exif.Make || "Unknown").trim();
const iso = exif.ISO ?? 100;
const aperture = exif.FNumber ?? (exif.ApertureValue ? Number((2 ** (exif.ApertureValue / 2)).toFixed(1)) : 2.8);
const focalLength = exif.FocalLength ?? 50;

const missing = [
    !exif.Model && !exif.Make && "camera",
    exif.ISO == null && "iso",
    exif.FNumber == null && exif.ApertureValue == null && "aperture",
    exif.FocalLength == null && "focal_length",
].filter(Boolean);
if (missing.length > 0) {
    console.warn(`Missing EXIF for: ${missing.join(", ")} (using defaults — please review)`);
}

const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const frontmatter = `---
title: ${title}
description: A short description of what is in the photograph.
location: Location unrecorded
src: images/${imageName}
tags:
  - Uncategorized
camera_settings:
  camera: ${camera}
  iso: ${iso}
  aperture: ${aperture}
  focal_length: ${focalLength}
---
`;

mkdirSync(imagesDir, { recursive: true });
copyFileSync(imagePath, targetImage);
writeFileSync(markdownPath, frontmatter);

console.log(`Created src/photos/${nextNumber}-${slug}.md`);
console.log(`Copied image to src/photos/images/${imageName}`);
