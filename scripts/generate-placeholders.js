#!/usr/bin/env node

/**
 * Generate 15 placeholder images for default nature landscape images
 * This is a temporary solution - these should be replaced with real images later
 *
 * TODO: Replace placeholder images with real Unsplash nature images
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color gradients for 15 unique placeholders
const colors = [
  { color: '#1A5D7E', label: 'Sky Blue' },
  { color: '#2D5016', label: 'Forest Green' },
  { color: '#8B4513', label: 'Earth Brown' },
  { color: '#4A148C', label: 'Deep Purple' },
  { color: '#01579B', label: 'Ocean Blue' },
  { color: '#1B5E20', label: 'Mountain Green' },
  { color: '#BF360C', label: 'Sunset Orange' },
  { color: '#004D40', label: 'Teal' },
  { color: '#311B92', label: 'Violet' },
  { color: '#424242', label: 'Storm Gray' },
  { color: '#33691E', label: 'Lime Green' },
  { color: '#006064', label: 'Cyan' },
  { color: '#4E342E', label: 'Canyon Brown' },
  { color: '#1A237E', label: 'Indigo' },
  { color: '#263238', label: 'Blue Gray' }
];

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Create SVG with gradient and text
function createSvg(width, height, color, text) {
  const rgb = hexToRgb(color);

  // Create a gradient effect by varying the color
  const lighterColor = `rgb(${Math.min(rgb.r + 40, 255)}, ${Math.min(rgb.g + 40, 255)}, ${Math.min(rgb.b + 40, 255)})`;
  const darkerColor = `rgb(${Math.max(rgb.r - 40, 0)}, ${Math.max(rgb.g - 40, 0)}, ${Math.max(rgb.b - 40, 0)})`;

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${lighterColor};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkerColor};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad)" />
  <text x="50%" y="45%" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" style="text-shadow: 2px 2px 8px rgba(0,0,0,0.7);">${text}</text>
  <text x="50%" y="55%" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="rgba(255,255,255,0.6)" text-anchor="middle" dominant-baseline="middle">TODO: Replace with real image</text>
</svg>`;
}

async function generatePlaceholders() {
  const outputDir = path.join(__dirname, '../public/images/defaults');

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating 15 placeholder images...');
  console.log('TODO: These placeholders should be replaced with real nature images from Unsplash\n');

  for (let i = 0; i < colors.length; i++) {
    const { color, label } = colors[i];
    const filename = `nature-${String(i + 1).padStart(2, '0')}.jpg`;
    const filepath = path.join(outputDir, filename);

    const svg = createSvg(1920, 1080, color, `Placeholder ${i + 1}`);

    await sharp(Buffer.from(svg))
      .jpeg({ quality: 85 })
      .toFile(filepath);

    const stats = fs.statSync(filepath);
    const sizeKb = (stats.size / 1024).toFixed(1);

    console.log(`✓ Created ${filename} - ${label} (${sizeKb} KB)`);
  }

  console.log('\n✓ All 15 placeholder images generated');
  console.log('⚠ Remember to replace these with real nature images!');
}

generatePlaceholders().catch(console.error);
