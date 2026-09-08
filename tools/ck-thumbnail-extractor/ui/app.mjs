import { allocateOutputName, createManifestRecord, sanitizeRelativePath } from '../src/browser-model.mjs';
import { extractEmbeddedPng, ThumbnailError } from '../src/embedded-png.mjs';
import { createManifest } from '../src/manifest.mjs';
import { createStoredZip } from '../src/zip.mjs';

const elements = {
  dropZone: document.querySelector('#drop-zone'),
  fileInput: document.querySelector('#file-input'),
  folderInput: document.querySelector('#folder-input'),
  chooseFiles: document.querySelector('#choose-files'),
  chooseFolder: document.querySelector('#choose-folder'),
  clear: document.querySelector('#clear'),
  queue: document.querySelector('#queue'),
  queueTitle: document.querySelector('#queue-title'),
  activeStatus: document.querySelector('#active-status'),
  previewFrame: document.querySelector('#preview-frame'),
  previewEmpty: document.querySelector('#preview-empty'),
  resultTitle: document.querySelector('#result-title'),
  dimensions: document.querySelector('#dimensions'),
  offset: document.querySelector('#offset'),
  resultMessage: document.querySelector('#result-message'),
  download: document.querySelector('#download'),
  summary: document.querySelector('#summary'),
  processing: document.querySelector('#processing'),
};

const state = {
  items: [],
  activeIndex: 0,
  channelMode: 'bgra',
  processing: false,
};

function publicName(file) {
  return sanitizeRelativePath(file.webkitRelativePath || file.name);
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function canvasToPng(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('The browser could not encode the PNG.'));
      else blob.arrayBuffer().then((buffer) => resolve(new Uint8Array(buffer)), reject);
    }, 'image/png');
  });
}

async function decodeAndConvert(pngBytes, channelMode, expectedDimensions) {
  const sourceBlob = new Blob([pngBytes], { type: 'image/png' });
  let bitmap;
  try {
    bitmap = await createImageBitmap(sourceBlob);
  } catch {
    throw new ThumbnailError('Cached PNG image data could not be decoded.', 'PNG_DECODE_FAILED');
  }

  try {
    if (bitmap.width !== expectedDimensions.width || bitmap.height !== expectedDimensions.height) {
      throw new ThumbnailError('Cached PNG dimensions changed during decoding.', 'PNG_DECODE_FAILED');
    }
    if (channelMode === 'rgba') return pngBytes;

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas image processing is unavailable.');
    context.drawImage(bitmap, 0, 0);
    const image = context.getImageData(0, 0, bitmap.width, bitmap.height);
    for (let index = 0; index < image.data.length; index += 4) {
      const red = image.data[index];
      image.data[index] = image.data[index + 2];
      image.data[index + 2] = red;
    }
    context.putImageData(image, 0, 0);
    return canvasToPng(canvas);
  } finally {
    bitmap.close();
  }
}

function safeMessage(error) {
  if (error instanceof ThumbnailError) return error.message;
  return 'This package could not be processed in the browser.';
}

function revokePreviews(items) {
  for (const item of items) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }
}

async function processItem(item) {
  try {
    const sourceBytes = new Uint8Array(await item.file.arrayBuffer());
    const extracted = extractEmbeddedPng(sourceBytes);
    const pngBytes = await decodeAndConvert(
      extracted.bytes,
      state.channelMode,
      extracted.dimensions,
    );
    return {
      ...item,
      status: 'extracted',
      sourceBytes,
      pngBytes,
      dimensions: extracted.dimensions,
      offset: extracted.offset,
      sourceSha256: await sha256Hex(sourceBytes),
      outputSha256: await sha256Hex(pngBytes),
      previewUrl: URL.createObjectURL(new Blob([pngBytes], { type: 'image/png' })),
      error: null,
    };
  } catch (error) {
    return {
      ...item,
      status: error instanceof ThumbnailError && error.code === 'NO_CACHED_PNG'
        ? 'cache-miss'
        : 'failed',
      error: safeMessage(error),
    };
  }
}

async function loadFiles(fileList) {
  if (state.processing) return;
  const files = [...fileList].filter((file) => file.name.toLowerCase().endsWith('.uasset'));
  if (files.length === 0) {
    elements.resultMessage.textContent = 'No .uasset files were selected. Choose Creator Kit package files.';
    return;
  }

  revokePreviews(state.items);
  const usedNames = new Set();
  state.items = files
    .map((file) => ({
      file,
      source: publicName(file),
      output: allocateOutputName(publicName(file), usedNames),
      status: 'pending',
      error: null,
    }))
    .sort((left, right) => left.source.localeCompare(right.source));
  state.activeIndex = 0;
  state.processing = true;
  render();

  for (let index = 0; index < state.items.length; index += 1) {
    state.activeIndex = index;
    state.items[index] = { ...state.items[index], status: 'processing' };
    render();
    state.items[index] = await processItem(state.items[index]);
    render();
  }

  state.activeIndex = Math.max(0, state.items.findIndex((item) => item.status === 'extracted'));
  state.processing = false;
  elements.fileInput.value = '';
  elements.folderInput.value = '';
  render();
}

function statusLabel(status) {
  return {
    pending: 'Queued',
    processing: 'Inspecting PNG cache',
    extracted: 'PNG extracted',
    'cache-miss': 'No cached PNG',
    failed: 'Failed',
  }[status] || status;
}

function renderQueue() {
  elements.queue.replaceChildren();
  if (state.items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'queue-empty';
    const instruction = document.createElement('span');
    instruction.textContent = 'Choose one or more Creator Kit .uasset files';
    const status = document.createElement('span');
    status.textContent = 'Idle';
    empty.append(instruction, status);
    elements.queue.append(empty);
    return;
  }

  state.items.forEach((item, index) => {
    const row = document.createElement('li');
    row.dataset.active = String(index === state.activeIndex);
    row.dataset.status = item.status;
    const button = document.createElement('button');
    button.type = 'button';
    button.addEventListener('click', () => {
      state.activeIndex = index;
      render();
    });
    const name = document.createElement('span');
    name.textContent = item.source;
    const status = document.createElement('span');
    status.textContent = statusLabel(item.status);
    button.append(name, status);
    row.append(button);
    elements.queue.append(row);
  });
}

function renderActive() {
  let previewImage = document.querySelector('#preview-image');
  const active = state.items[state.activeIndex];
  if (!active) {
    elements.queueTitle.textContent = 'Select CK package files';
    elements.activeStatus.textContent = 'Waiting for CK packages';
    elements.activeStatus.dataset.state = 'idle';
    elements.resultTitle.textContent = 'No cached PNG inspected';
    elements.dimensions.textContent = '—';
    elements.offset.textContent = '—';
    elements.resultMessage.textContent = 'Choose files above or drop .uasset files anywhere on this page.';
    previewImage?.remove();
    elements.previewEmpty.hidden = false;
    return;
  }

  elements.queueTitle.textContent = active.source;
  elements.activeStatus.textContent = statusLabel(active.status);
  elements.activeStatus.dataset.state = active.status;
  elements.resultTitle.textContent = active.status === 'extracted'
    ? 'Cached PNG found'
    : statusLabel(active.status);
  elements.dimensions.textContent = active.dimensions
    ? `${active.dimensions.width} × ${active.dimensions.height}`
    : '—';
  elements.offset.textContent = Number.isInteger(active.offset)
    ? active.offset.toLocaleString('en-US')
    : '—';
  elements.resultMessage.textContent = active.error
    || (active.status === 'extracted'
      ? `${state.channelMode === 'bgra' ? 'CK cached BGRA was converted to RGBA' : 'Embedded RGBA bytes were preserved'}. Ready for your script assets.`
      : 'Reading the selected Creator Kit package in this browser.');
  elements.previewEmpty.hidden = Boolean(active.previewUrl);
  if (active.previewUrl) {
    if (!previewImage) {
      previewImage = document.createElement('img');
      previewImage.id = 'preview-image';
      previewImage.alt = 'Extracted cached thumbnail preview';
      elements.previewFrame.prepend(previewImage);
    }
    previewImage.src = active.previewUrl;
  } else {
    previewImage?.remove();
  }
}

function renderSummary() {
  const ready = state.items.filter((item) => item.status === 'extracted').length;
  const cacheMisses = state.items.filter((item) => item.status === 'cache-miss').length;
  const failed = state.items.filter((item) => item.status === 'failed').length;
  elements.summary.textContent = `${ready} ready · ${cacheMisses} no cache · ${failed} failed`;
  elements.processing.textContent = state.processing ? 'Processing…' : (state.items.length ? 'Complete' : 'Idle');
  elements.download.disabled = ready === 0 || state.processing;
  elements.download.textContent = ready > 0
    ? `Download ${ready} PNG${ready === 1 ? '' : 's'} + manifest`
    : 'Download PNGs + manifest';
  elements.clear.disabled = state.items.length === 0 || state.processing;
}

function render() {
  renderQueue();
  renderActive();
  renderSummary();
}

async function reprocess() {
  if (state.items.length === 0 || state.processing) return;
  await loadFiles(state.items.map((item) => item.file));
}

function downloadArchive() {
  const successful = state.items.filter((item) => item.status === 'extracted');
  if (successful.length === 0) return;
  const records = state.items.map((item) => createManifestRecord({
    source: item.source,
    output: item.status === 'extracted' ? item.output : null,
    status: item.status,
    width: item.dimensions?.width,
    height: item.dimensions?.height,
    offset: item.offset,
    sourceSha256: item.sourceSha256,
    outputSha256: item.outputSha256,
    error: item.error,
  }));
  const manifest = createManifest({ channelMode: state.channelMode, files: records });
  const entries = successful.map((item) => ({ name: item.output, bytes: item.pngBytes }));
  entries.push({
    name: 'manifest.json',
    bytes: new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`),
  });
  const zipBytes = createStoredZip(entries);
  const url = URL.createObjectURL(new Blob([zipBytes], { type: 'application/zip' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'hl-ck-thumbnails.zip';
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

elements.chooseFiles.addEventListener('click', () => elements.fileInput.click());
elements.chooseFolder.addEventListener('click', () => elements.folderInput.click());
elements.fileInput.addEventListener('change', () => loadFiles(elements.fileInput.files));
elements.folderInput.addEventListener('change', () => loadFiles(elements.folderInput.files));
elements.clear.addEventListener('click', () => {
  revokePreviews(state.items);
  state.items = [];
  state.activeIndex = 0;
  render();
});
elements.download.addEventListener('click', downloadArchive);
document.querySelectorAll('input[name="channels"]').forEach((radio) => {
  radio.addEventListener('change', async (event) => {
    state.channelMode = event.target.value;
    await reprocess();
  });
});

for (const eventName of ['dragenter', 'dragover']) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add('is-dragging');
  });
}
for (const eventName of ['dragleave', 'drop']) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove('is-dragging');
  });
}
elements.dropZone.addEventListener('drop', (event) => loadFiles(event.dataTransfer.files));
window.addEventListener('beforeunload', () => revokePreviews(state.items));

render();
