export const TOOL_NAME = 'Hogwarts Legacy CK Thumbnail Extractor';
export const TOOL_VERSION = '1.0.0';

export function createManifest({ channelMode, files, createdAt = new Date().toISOString() }) {
  const summary = { extracted: 0, cacheMisses: 0, failed: 0 };
  for (const file of files) {
    if (file.status === 'extracted') summary.extracted += 1;
    else if (file.status === 'cache-miss') summary.cacheMisses += 1;
    else summary.failed += 1;
  }

  return {
    schemaVersion: 1,
    tool: { name: TOOL_NAME, version: TOOL_VERSION },
    createdAt,
    channelMode,
    summary,
    files,
  };
}
