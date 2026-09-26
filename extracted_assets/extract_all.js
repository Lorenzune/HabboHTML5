#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Script directory
const scriptDir = __dirname;

// CLI arguments or auto-detect
const args = process.argv.slice(2);
const customInput = args[0];
const customOutput = args[1];

const candidateInputDirs = [
  customInput,
  path.join(scriptDir, 'raw_hab_bundles'),
  path.join(scriptDir, '..', 'resources', 'app', 'client'),
  path.join(scriptDir, 'resources', 'app', 'client'),
  path.join(scriptDir, 'client')
].filter(Boolean);

const inputBaseDir = candidateInputDirs.find(dir => fs.existsSync(dir));
const outputBaseDir = customOutput ? path.resolve(customOutput) : scriptDir;

if (!inputBaseDir) {
  console.error('[ERROR] Could not find .hab files directory.');
  console.error('Usage: node extract_all.js [input_hab_directory] [output_directory]');
  process.exit(1);
}

function resolveFileName(name, mimeType) {
  if (path.extname(name)) return name;

  const suffixMap = {
    '_png': '.png',
    '_xml': '.xml',
    '_gif': '.gif',
    '_txt': '.txt',
    '_mp3': '.mp3',
    '_ttf': '.ttf',
    '_json': '.json'
  };

  for (const [suffix, ext] of Object.entries(suffixMap)) {
    if (name.endsWith(suffix)) {
      return name.slice(0, -suffix.length) + ext;
    }
  }

  const mimeMap = {
    'image/png': '.png',
    'image/gif': '.gif',
    'text/xml': '.xml',
    'text/plain': '.txt',
    'sound/mp3': '.mp3',
    'application/x-font-truetype': '.ttf',
    'application/json': '.json',
    'application/octet-stream': '.bin'
  };

  return name + (mimeMap[mimeType] || '.bin');
}

function findHabFiles(dir) {
  const results = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...findHabFiles(fullPath));
    } else if (item.endsWith('.hab')) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractHab(habPath) {
  const relPath = path.relative(inputBaseDir, habPath);
  const bundleFolder = path.join(outputBaseDir, relPath.replace(/\.hab$/, ''));
  fs.mkdirSync(bundleFolder, { recursive: true });

  const buf = fs.readFileSync(habPath);
  if (buf.length < 20 || buf.subarray(0, 4).toString('ascii') !== 'HAB\0') {
    console.error(`[SKIP] Invalid HAB format: ${relPath}`);
    return;
  }

  const d = buf.readUInt32LE(8);
  const c = buf.readUInt32LE(12);
  const f = buf.readUInt32LE(16);

  const indexRaw = buf.subarray(20, 20 + d);
  let indexJson;
  try {
    indexJson = JSON.parse(zlib.inflateSync(indexRaw).toString('utf8'));
  } catch (err) {
    console.error(`[ERR] Failed to decompress index for: ${relPath}`, err);
    return;
  }

  // Save manifest index
  fs.writeFileSync(
    path.join(bundleFolder, '_manifest_index.json'),
    JSON.stringify(indexJson, null, 2),
    'utf8'
  );

  const dataBlob = buf.subarray(20 + d, 20 + d + f);
  let fileCount = 0;

  for (const entry of indexJson.entries || []) {
    const entryDataRaw = dataBlob.subarray(entry.offset, entry.offset + entry.storedLength);
    const uncompressed = entry.compression === 'deflate'
      ? zlib.inflateSync(entryDataRaw)
      : entryDataRaw;

    const outName = resolveFileName(entry.name, entry.mimeType);
    const outPath = path.join(bundleFolder, outName);
    fs.writeFileSync(outPath, uncompressed);
    fileCount++;
  }

  // Copy source .hab file into the unpacked bundle directory if not already there
  const habTarget = path.join(bundleFolder, path.basename(habPath));
  if (!fs.existsSync(habTarget)) {
    fs.copyFileSync(habPath, habTarget);
  }

  console.log(`[OK] Extracted: ${relPath} -> ${bundleFolder} (${fileCount} assets)`);
}

console.log('Habbo .hab Asset Extractor');
console.log(`Source: ${inputBaseDir}`);
console.log(`Destination: ${outputBaseDir}\n`);

const habFiles = findHabFiles(inputBaseDir);
for (const hab of habFiles) {
  extractHab(hab);
}
console.log(`\nSuccessfully processed ${habFiles.length} .hab bundle(s)!`);
