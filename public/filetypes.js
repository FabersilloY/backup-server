'use strict';

// File-type page icons: a page with a coloured extension badge (PDF, DOCX, XLSX…).
// Loaded as a plain <script> by the web app and require()d by the server for the
// public share page, so both always show the same icon.
const FileTypes = (() => {
  const TYPES = [
    { color: '#e5372b', exts: ['pdf'] },
    { color: '#2b6cdf', exts: ['doc', 'docx', 'odt', 'rtf', 'pages'] },
    { color: '#1f9d55', exts: ['xls', 'xlsx', 'xlsm', 'xlsb', 'ods', 'numbers'] },
    { color: '#e8590c', exts: ['ppt', 'pptx', 'odp', 'key'] },
    { color: '#0d9488', exts: ['csv', 'tsv'] },
    { color: '#8b5cf6', exts: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'zst'] },
    { color: '#2e90fa', exts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'ico', 'heic', 'tif', 'tiff', 'svg', 'raw', 'psd'] },
    { color: '#e04f5f', exts: ['mp4', 'webm', 'm4v', 'mov', 'ogv', 'mkv', 'avi', 'wmv', 'flv'] },
    { color: '#d6457b', exts: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'flac', 'aac', 'opus', 'wma', 'aiff'] },
    { color: '#0ea5e9', exts: ['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'php', 'java', 'c', 'h', 'cpp', 'cs', 'go', 'rs', 'sh', 'bat', 'ps1', 'html', 'htm', 'css', 'swift', 'kt'] },
    { color: '#d97706', exts: ['json', 'xml', 'yml', 'yaml', 'toml', 'ini', 'conf', 'cfg', 'env', 'properties', 'sql', 'sqlite', 'db'] },
    { color: '#64748b', exts: ['txt', 'log', 'md', 'srt', 'vtt', 'gitignore'] },
    { color: '#475569', exts: ['iso', 'dmg', 'img', 'exe', 'msi', 'apk', 'deb', 'rpm', 'pkg', 'bin'] },
    { color: '#c026d3', exts: ['ttf', 'otf', 'woff', 'woff2'] },
  ];
  const COLORS = new Map(TYPES.flatMap((t) => t.exts.map((e) => [e, t.color])));
  const cache = new Map();

  /** SVG markup for a file extension (lowercase, no dot). Needs the .pg / .fold classes styled by the page. */
  function icon(ext) {
    if (cache.has(ext)) return cache.get(ext);
    const color = COLORS.get(ext) || '#94a3b8';
    const label = ext.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase(); // sanitized: it ends up in markup
    const page = 'M5 1h13.5L26 8.5V35a2.5 2.5 0 0 1-2.5 2.5h-17A2.5 2.5 0 0 1 4 35V3.5A2.5 2.5 0 0 1 5 1z';
    const size = label.length <= 2 ? 10.5 : label.length === 3 ? 9 : 7.6;
    const svg = '<svg viewBox="0 0 30 38">'
      + `<path class="pg" d="${page}" stroke-width="1.3"/>`
      + `<path d="${page}" fill="${color}" fill-opacity=".09"/>`
      + '<path class="fold" d="M18.5 1v5a2.5 2.5 0 0 0 2.5 2.5h5" stroke-width="1.3" stroke-linejoin="round"/>'
      + (label
        ? `<rect x="1" y="20" width="26" height="12" rx="2.6" fill="${color}"/>`
          + `<text x="14" y="${29.1 - (label.length === 4 ? .3 : 0)}" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="800" font-size="${size}" fill="#fff">${label}</text>`
        : `<path d="M9 21h12M9 26h12M9 31h7" stroke="${color}" stroke-width="1.8" stroke-linecap="round" fill="none"/>`)
      + '</svg>';
    cache.set(ext, svg);
    return svg;
  }

  return { icon };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = FileTypes;
