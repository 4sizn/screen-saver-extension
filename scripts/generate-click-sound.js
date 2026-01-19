/**
 * Generate a simple click sound using Web Audio API
 * Creates a short percussive sound (click/pop) for activation feedback
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate WAV file with a simple click sound
function generateClickSound() {
  const sampleRate = 44100;
  const duration = 0.15; // 150ms
  const numSamples = Math.floor(sampleRate * duration);

  // Create audio buffer
  const buffer = Buffer.alloc(44 + numSamples * 2); // WAV header + 16-bit samples

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4); // File size - 8
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1 size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // Audio format (1 = PCM)
  buffer.writeUInt16LE(1, 22); // Num channels (mono)
  buffer.writeUInt32LE(sampleRate, 24); // Sample rate
  buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  buffer.writeUInt16LE(2, 32); // Block align
  buffer.writeUInt16LE(16, 34); // Bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40); // Subchunk2 size

  // Generate click sound (short exponential decay envelope)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Exponential decay envelope
    const envelope = Math.exp(-t * 40);

    // Mix of frequencies for click characteristic
    const freq1 = 1200; // Primary frequency
    const freq2 = 2400; // Harmonic
    const signal = 0.7 * Math.sin(2 * Math.PI * freq1 * t) +
                   0.3 * Math.sin(2 * Math.PI * freq2 * t);

    // Apply envelope and convert to 16-bit integer
    const sample = Math.floor(signal * envelope * 32767 * 0.6); // 0.6 for volume reduction

    // Write sample as 16-bit signed integer (little-endian)
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  return buffer;
}

// Write WAV file
const outputPath = path.join(__dirname, '../public/sounds/click.wav');
const wavBuffer = generateClickSound();
fs.writeFileSync(outputPath, wavBuffer);

console.log(`Generated click sound: ${outputPath}`);
console.log(`File size: ${Math.round(wavBuffer.length / 1024 * 10) / 10} KB`);
