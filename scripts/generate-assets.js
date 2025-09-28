#!/usr/bin/env node
/*
  Generates required PNG assets for Marketplace:
  - Converts SVG icons in media/ to PNG (256x256)
  - Creates placeholder screenshots in media/screenshots/
*/
const fs = require('fs');
const path = require('path');

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function writePngPlaceholder(filePath, width = 1280, height = 800, label = 'Placeholder') {
  // Minimal PNG placeholder via Canvas-like generation avoided; instead, embed a small PNG buffer from SVG rasterization with sharp if available.
  const sharp = require('sharp');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#0d1117"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial,sans-serif" font-size="42" fill="#c9d1d9">${label}</text>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await fs.promises.writeFile(filePath, png);
}

async function convertSvgToPng(svgPath, outPath, size = 256) {
  const sharp = require('sharp');
  const input = await fs.promises.readFile(svgPath);
  const png = await sharp(input, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.promises.writeFile(outPath, png);
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const mediaDir = path.join(repoRoot, 'media');
  const screenshotsDir = path.join(mediaDir, 'screenshots');
  await ensureDir(mediaDir);
  await ensureDir(screenshotsDir);

  // Convert existing emblem SVG to required marketplace PNG
  const darkSvg = path.join(mediaDir, 'taiga-emblem-dark.svg');
  const outPng = path.join(mediaDir, 'taiga-emblem-mono-black-256.png');
  if (fs.existsSync(darkSvg)) {
    await convertSvgToPng(darkSvg, outPng, 256);
    console.log(`Icon generated: ${path.relative(repoRoot, outPng)}`);
  } else {
    console.warn('Warning: media/taiga-emblem-dark.svg not found; skipping icon conversion.');
  }

  // Placeholder screenshots requested by user with specific filenames
  const shots = [
    { file: 'sidebar.png', label: 'Projects and Filters Sidebar' },
    { file: 'epic.png', label: 'Epic Editor' },
    { file: 'story.png', label: 'Story Editor' },
    { file: 'task.png', label: 'Task Editor' },
    { file: 'issue.png', label: 'Issue Editor' },
  ];

  for (const s of shots) {
    const p = path.join(screenshotsDir, s.file);
    if (!fs.existsSync(p)) {
      await writePngPlaceholder(p, 1280, 800, s.label);
      console.log(`Screenshot placeholder created: ${path.relative(repoRoot, p)}`);
    } else {
      console.log(`Screenshot exists (skipped): ${path.relative(repoRoot, p)}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
