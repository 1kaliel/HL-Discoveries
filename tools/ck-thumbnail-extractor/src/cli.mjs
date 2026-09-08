import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { ThumbnailError } from './embedded-png.mjs';
import { createManifest } from './manifest.mjs';
import { processThumbnail, sha256Hex } from './node-thumbnail.mjs';

const HELP = `Hogwarts Legacy CK Thumbnail Extractor

Usage:
  ck-thumbnail-extractor <input> --output <directory> [options]

Options:
  --channels <bgra|rgba>  Convert CK cached BGRA to RGBA (default: bgra),
                          or preserve the embedded PNG bytes with rgba.
  --overwrite             Replace existing PNG and manifest files.
  --manifest <filename>   Manifest filename inside the output directory.
  -h, --help              Show this help.
`;

function parseArguments(arguments_) {
  const options = {
    input: null,
    output: null,
    channelMode: 'bgra',
    overwrite: false,
    manifestName: 'manifest.json',
    help: false,
  };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '-h' || argument === '--help') {
      options.help = true;
    } else if (argument === '--overwrite') {
      options.overwrite = true;
    } else if (argument === '--output') {
      options.output = arguments_[index += 1] ?? null;
    } else if (argument === '--channels') {
      options.channelMode = arguments_[index += 1] ?? '';
    } else if (argument === '--manifest') {
      options.manifestName = arguments_[index += 1] ?? '';
    } else if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`);
    } else if (options.input === null) {
      options.input = argument;
    } else {
      throw new Error('Only one input file or directory can be processed at a time.');
    }
  }

  if (options.help) return options;
  if (!options.input) throw new Error('An input .uasset file or directory is required.');
  if (!options.output) throw new Error('An output directory is required.');
  if (!['bgra', 'rgba'].includes(options.channelMode)) {
    throw new Error('Channel mode must be bgra or rgba.');
  }
  if (
    !options.manifestName
    || path.basename(options.manifestName) !== options.manifestName
    || !options.manifestName.toLowerCase().endsWith('.json')
  ) {
    throw new Error('Manifest must be a .json filename without directory segments.');
  }
  return options;
}

function toPublicPath(relativePath) {
  return relativePath.split(path.sep).join('/');
}

async function discoverPackages(root) {
  const files = [];

  async function visit(directory, relativeDirectory = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const relativeName = path.join(relativeDirectory, entry.name);
      const absoluteName = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absoluteName, relativeName);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.uasset')) {
        files.push({ absoluteName, relativeName });
      }
    }
  }

  await visit(root);
  return files;
}

function outputNameFor(relativeName) {
  return relativeName.slice(0, -path.extname(relativeName).length) + '.png';
}

function safeError(error, outputName) {
  if (error?.code === 'EEXIST') return `Output already exists: ${toPublicPath(outputName)}`;
  if (error instanceof ThumbnailError) return error.message;
  return 'The package could not be processed.';
}

async function processOne(file, outputRoot, options) {
  const source = toPublicPath(file.relativeName);
  const outputRelative = outputNameFor(file.relativeName);
  let sourceBytes;
  try {
    sourceBytes = await readFile(file.absoluteName);
    const result = await processThumbnail(sourceBytes, { channelMode: options.channelMode });
    const outputPath = path.join(outputRoot, outputRelative);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, result.pngBytes, { flag: options.overwrite ? 'w' : 'wx' });
    return {
      source,
      output: toPublicPath(outputRelative),
      status: 'extracted',
      width: result.dimensions.width,
      height: result.dimensions.height,
      offset: result.offset,
      sourceSha256: await sha256Hex(sourceBytes),
      outputSha256: await sha256Hex(result.pngBytes),
      error: null,
    };
  } catch (error) {
    const cacheMiss = error instanceof ThumbnailError && error.code === 'NO_CACHED_PNG';
    return {
      source,
      output: null,
      status: cacheMiss ? 'cache-miss' : 'failed',
      width: null,
      height: null,
      offset: null,
      sourceSha256: sourceBytes ? await sha256Hex(sourceBytes) : null,
      outputSha256: null,
      error: safeError(error, outputRelative),
    };
  }
}

async function writeManifest(outputRoot, manifestName, manifest, overwrite) {
  await mkdir(outputRoot, { recursive: true });
  const payload = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(path.join(outputRoot, manifestName), payload, {
    flag: overwrite ? 'w' : 'wx',
  });
}

export async function runCli(arguments_, io = process) {
  let options;
  try {
    options = parseArguments(arguments_);
  } catch (error) {
    io.stderr.write(`Error: ${error.message}\n\n${HELP}`);
    return 2;
  }

  if (options.help) {
    io.stdout.write(HELP);
    return 0;
  }

  const inputPath = path.resolve(options.input);
  const publicInputName = path.basename(inputPath) || 'input';
  let inputStat;
  try {
    inputStat = await lstat(inputPath);
  } catch {
    io.stderr.write(`Error: Input not found: ${publicInputName}\n`);
    return 2;
  }

  if (inputStat.isSymbolicLink()) {
    io.stderr.write(`Error: Symlink inputs are not supported: ${publicInputName}\n`);
    return 2;
  }

  let files;
  if (inputStat.isDirectory()) {
    files = await discoverPackages(inputPath);
  } else if (inputStat.isFile() && inputPath.toLowerCase().endsWith('.uasset')) {
    files = [{ absoluteName: inputPath, relativeName: path.basename(inputPath) }];
  } else {
    io.stderr.write(`Error: Input must be a .uasset file or directory: ${publicInputName}\n`);
    return 2;
  }

  if (files.length === 0) {
    io.stderr.write(`Error: No .uasset files were found in ${publicInputName}.\n`);
    return 2;
  }

  const records = [];
  for (const file of files) records.push(await processOne(file, path.resolve(options.output), options));
  const manifest = createManifest({ channelMode: options.channelMode, files: records });

  try {
    await writeManifest(path.resolve(options.output), options.manifestName, manifest, options.overwrite);
  } catch (error) {
    const message = error?.code === 'EEXIST'
      ? `Manifest already exists: ${options.manifestName}`
      : 'The manifest could not be written.';
    io.stderr.write(`Error: ${message}\n`);
    return 1;
  }

  io.stdout.write(
    `${manifest.summary.extracted} extracted, ${manifest.summary.cacheMisses} cache ${manifest.summary.cacheMisses === 1 ? 'miss' : 'misses'}, ${manifest.summary.failed} failed.\n`,
  );

  for (const record of records) {
    if (record.status !== 'extracted') {
      io.stderr.write(`${record.source}: ${record.error}\n`);
    }
  }

  const isSingleCacheMiss = !inputStat.isDirectory() && manifest.summary.cacheMisses === 1;
  return manifest.summary.failed > 0 || isSingleCacheMiss ? 1 : 0;
}
