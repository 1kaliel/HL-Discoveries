const WINDOWS_ABSOLUTE = /^[a-zA-Z]:[\\/]/;

export function sanitizeRelativePath(value) {
  const raw = String(value ?? '').replaceAll('\\', '/');
  const wasAbsolute = WINDOWS_ABSOLUTE.test(raw) || raw.startsWith('/');
  const source = wasAbsolute ? raw.split('/').at(-1) : raw;
  const parts = source
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .map((part) => part.replace(/[\u0000-\u001f<>:"|?*]/g, '_'))
    .filter(Boolean);
  return parts.join('/') || 'unnamed';
}

export function allocateOutputName(sourceName, usedNames) {
  const safeSource = sanitizeRelativePath(sourceName);
  const dot = safeSource.lastIndexOf('.');
  const slash = safeSource.lastIndexOf('/');
  const stem = dot > slash ? safeSource.slice(0, dot) : safeSource;
  let candidate = `${stem}.png`;
  let suffix = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${stem}-${suffix}.png`;
    suffix += 1;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

export function createManifestRecord(fields) {
  return {
    source: sanitizeRelativePath(fields.source),
    output: fields.output == null ? null : sanitizeRelativePath(fields.output),
    status: fields.status,
    width: fields.width ?? null,
    height: fields.height ?? null,
    offset: fields.offset ?? null,
    sourceSha256: fields.sourceSha256 ?? null,
    outputSha256: fields.outputSha256 ?? null,
    error: fields.error ?? null,
  };
}
