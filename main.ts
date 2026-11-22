// main.ts — entry program for world-news-image-20261121.
//
// This competition's entry is a program (Node 22, standard library only, no
// network) that writes one image to /output/entry.png. The image is entry.png
// in this repository: a one-page newspaper poster of Saturday 21 November
// 2026 (15 illustrated stories, 31 numbered briefs, a world map with pins,
// and a date-check box), drawn in poster.html and rendered to PNG by
// render.mjs, both kept in the repo so the picture's source stays auditable.
//
// This program does no drawing: it checks the held image is a whole PNG or
// JPEG inside the gate's limits, then copies it byte for byte, so repeated
// runs always write identical bytes.
//
// Run it outside the grader's container with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MAX_BYTES = 1024 * 1024; // the gate takes at most 1 MiB
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const JPEG_SIG = Buffer.from([0xff, 0xd8, 0xff]);

function startsWith(bytes: Buffer, sig: Buffer): boolean {
  return bytes.length >= sig.length && bytes.subarray(0, sig.length).equals(sig);
}

function pngSize(bytes: Buffer): { width: number; height: number } {
  // PNG: 8-byte signature, then the IHDR chunk; width and height are the
  // first two big-endian uint32s of the IHDR data, at offsets 16 and 20.
  if (bytes.length < 24 || bytes.readUInt32BE(12) !== 0x49484452) {
    throw new Error('entry.png is not a well-formed PNG (missing IHDR)');
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function main(): void {
  const here = new URL('.', import.meta.url).pathname;
  const src = path.join(here, 'entry.png');
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  const dest = path.join(outDir, 'entry.png');

  const bytes = fs.readFileSync(src);
  const isPng = startsWith(bytes, PNG_SIG);
  const isJpeg = startsWith(bytes, JPEG_SIG);
  if (!isPng && !isJpeg) {
    throw new Error('entry.png is neither a PNG nor a JPEG');
  }
  if (bytes.length > MAX_BYTES) {
    throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB gate`);
  }
  if (isPng) {
    const { width, height } = pngSize(bytes);
    if (width > 1024 || height > 1024) {
      throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 gate`);
    }
    console.log(`entry.png: ${width}x${height} PNG, ${bytes.length} bytes`);
  } else {
    console.log(`entry.png: JPEG, ${bytes.length} bytes`);
  }
  console.log(`sha256: ${createHash('sha256').update(bytes).digest('hex')}`);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(dest, bytes);
  console.log(`wrote ${dest}`);
}

main();
