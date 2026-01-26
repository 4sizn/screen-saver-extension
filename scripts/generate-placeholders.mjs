#!/usr/bin/env node
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = `${__dirname}/../public/images/defaults`;

// Create output directory
await mkdir(OUTPUT_DIR, { recursive: true });

// Generate 15 placeholder images with gradient backgrounds
for (let i = 1; i <= 15; i++) {
  const hue = (i * 24) % 360; // Distribute hues across color wheel
  const lightness1 = 50;
  const lightness2 = 40;

  // Convert HSL to RGB for first color
  const rgb1 = hslToRgb(hue, 60, lightness1);
  const rgb2 = hslToRgb((hue + 30) % 360, 70, lightness2);

  // Create a gradient image
  const width = 1920;
  const height = 1080;
  const gradient = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    const factor = y / height;
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      gradient[idx] = r;
      gradient[idx + 1] = g;
      gradient[idx + 2] = b;
      gradient[idx + 3] = 255; // alpha
    }
  }

  // Create image with sharp and add text overlay
  const filename = `nature-${i.toString().padStart(2, '0')}.jpg`;

  const textSvg = `
    <svg width="${width}" height="${height}">
      <style>
        .title {
          fill: white;
          font-size: 72px;
          font-family: Arial, sans-serif;
          font-weight: 600;
        }
      </style>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="title">
        Placeholder ${i}
      </text>
    </svg>
  `;

  await sharp(gradient, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
    .composite([
      {
        input: Buffer.from(textSvg),
        top: 0,
        left: 0
      }
    ])
    .jpeg({ quality: 85 })
    .toFile(`${OUTPUT_DIR}/${filename}`);

  console.log(`Generated ${filename}`);
}

console.log('All 15 placeholder images generated successfully');

// Helper function to convert HSL to RGB
function hslToRgb(h, s, l) {
  s = s / 100;
  l = l / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}
