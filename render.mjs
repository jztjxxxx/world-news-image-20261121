// render.mjs — renders poster.html to entry.png with Playwright.
//
// Run from this directory with:  node render.mjs
// It opens the poster at exactly 1024x1024, waits for fonts, screenshots
// it to entry.png, and prints the file size and sha256 so the run can be
// checked for byte-identical repeats.

import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(dir, 'poster.html');
const pngPath = path.join(dir, 'entry.png');

async function renderOnce() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1024, height: 1024 },
      deviceScaleFactor: 1,
    });
    await page.goto('file://' + htmlPath, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: pngPath });
  } finally {
    await browser.close();
  }
  const bytes = fs.readFileSync(pngPath);
  return {
    size: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

const first = await renderOnce();
console.log(`entry.png: ${first.size} bytes, sha256 ${first.sha256}`);
