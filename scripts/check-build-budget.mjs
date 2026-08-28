import { gzipSync } from 'node:zlib';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const assetsDirectory = fileURLToPath(new URL('../dist/_astro/', import.meta.url));
const files = await readdir(assetsDirectory);
const canvasChunk = files.find((name) => /^WorldCanvas\..+\.js$/.test(name));

if (!canvasChunk) throw new Error('Build budget failed: the lazy WorldCanvas chunk was not generated.');

const source = await readFile(new URL(`../dist/_astro/${canvasChunk}`, import.meta.url));
const gzipBytes = gzipSync(source).byteLength;
const maximumGzipBytes = 300 * 1024;

if (gzipBytes > maximumGzipBytes) {
  throw new Error(`Build budget failed: ${canvasChunk} is ${gzipBytes} gzip bytes; limit is ${maximumGzipBytes}.`);
}

console.log(`World canvas: ${source.byteLength} raw bytes / ${gzipBytes} gzip bytes (limit ${maximumGzipBytes}).`);
