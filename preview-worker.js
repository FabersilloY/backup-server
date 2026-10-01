'use strict';

/*
 * Runs in a worker_thread (see runPreviewJob in server.js) so a huge or hostile
 * document can only exhaust the worker's own memory limit / time budget and never
 * the main server process. Receives { kind, file } and posts back
 * { result } or { error }.
 */

const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');

const MAX_SHEETS = 25;
const MAX_ROWS = 1000;
const MAX_COLS = 60;
const MAX_CELL_CHARS = 1000;
const MAX_HTML_BYTES = 12 * 1024 * 1024;
const SAFE_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp']);

// ---------------------------------------------------------------------------
// Spreadsheets (.xlsx .xlsm .xlsb .xls .ods) -> [{ name, rows, totals }]
// ---------------------------------------------------------------------------
function previewSheet(file) {
  const XLSX = require('xlsx');
  const wb = XLSX.read(fs.readFileSync(file), {
    type: 'buffer',
    cellDates: true,
    sheetRows: MAX_ROWS + 1, // parse only what we show (+1 so we know if there is more)
    cellFormula: false,
    cellStyles: false,
  });

  const meta = (wb.Workbook && wb.Workbook.Sheets) || [];
  let names = wb.SheetNames.filter((_, i) => !(meta[i] && meta[i].Hidden));
  if (!names.length) names = wb.SheetNames.slice();

  const sheets = [];
  for (const name of names.slice(0, MAX_SHEETS)) {
    const ws = wb.Sheets[name];
    const full = ws['!fullref'] || ws['!ref'];
    const range = full ? XLSX.utils.decode_range(full) : null;
    const totalRows = range ? range.e.r - range.s.r + 1 : 0;
    const totalCols = range ? range.e.c - range.s.c + 1 : 0;

    let rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '', blankrows: true });
    rows = rows.slice(0, MAX_ROWS).map((r) =>
      r.slice(0, MAX_COLS).map((v) => {
        const s = String(v == null ? '' : v);
        return s.length > MAX_CELL_CHARS ? s.slice(0, MAX_CELL_CHARS) + '…' : s;
      })
    );
    // drop trailing empty rows / columns
    while (rows.length && rows[rows.length - 1].every((c) => c === '')) rows.pop();
    let cols = 0;
    for (const r of rows) {
      let n = r.length;
      while (n && r[n - 1] === '') n--;
      if (n > cols) cols = n;
    }
    rows = rows.map((r) => {
      const out = r.slice(0, cols);
      while (out.length < cols) out.push('');
      return out;
    });

    sheets.push({
      name,
      rows,
      totalRows,
      totalCols,
      truncatedRows: totalRows > MAX_ROWS,
      truncatedCols: totalCols > MAX_COLS,
    });
  }
  return { sheets, hiddenOrSkipped: wb.SheetNames.length - sheets.length };
}

// ---------------------------------------------------------------------------
// Word (.docx) -> sanitized HTML fragment
// ---------------------------------------------------------------------------
function sanitizeHtml(html) {
  return html
    // anything that isn't http(s)/mailto/#anchor loses its href (blocks javascript:, data:, file: …)
    .replace(/\shref="([^"]*)"/gi, (m, url) => (/^(https?:|mailto:|#)/i.test(url.trim()) ? ` href="${url}" rel="noopener noreferrer"` : ''))
    // images we could not safely inline
    .replace(/<img\b[^>]*\bsrc=""[^>]*>/gi, '')
    // belt and braces: mammoth never emits these, but make sure
    .replace(/<\/?(script|style|iframe|object|embed|link|meta|form|svg)\b[^>]*>/gi, '');
}

async function previewDoc(file) {
  const mammoth = require('mammoth');
  let imageBytes = 0;
  const result = await mammoth.convertToHtml(
    { path: file },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        if (!SAFE_IMAGE_TYPES.has(image.contentType)) return { src: '' };
        const b64 = await image.read('base64');
        imageBytes += b64.length;
        if (imageBytes > MAX_HTML_BYTES / 2) return { src: '' }; // keep the page a sane size
        return { src: `data:${image.contentType};base64,${b64}` };
      }),
    }
  );
  if (Buffer.byteLength(result.value) > MAX_HTML_BYTES) throw new Error('Document is too large to preview');
  return { html: sanitizeHtml(result.value) };
}

(async () => {
  try {
    const { kind, file } = workerData;
    const result = kind === 'sheet' ? previewSheet(file) : kind === 'doc' ? await previewDoc(file) : null;
    if (!result) throw new Error('Unsupported preview type');
    parentPort.postMessage({ result });
  } catch (e) {
    parentPort.postMessage({ error: friendly(e) });
  }
})();

function friendly(e) {
  const m = String((e && e.message) || e);
  if (/password|encrypted/i.test(m)) return 'This file is password-protected and cannot be previewed';
  if (/zip|central directory|corrupt|unsupported file|bad compressed|not a valid|end of data/i.test(m))
    return 'This file looks corrupted or is not a valid Office document';
  return 'Could not preview this file: ' + m.slice(0, 200);
}
