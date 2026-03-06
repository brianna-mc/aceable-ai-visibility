import * as XLSX from 'xlsx';

/**
 * Converts the most data-rich sheet of an XLSX/XLS file to CSV.
 * Power BI exports often have a cover/instructions sheet first —
 * we pick the sheet with the most data rows instead of always using sheet[0].
 */
export function xlsxToCsv(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: 'array' });
  if (workbook.SheetNames.length === 0) throw new Error('No sheets found in workbook');

  // Pick the sheet with the most populated cells (rows × columns).
  // This handles Power BI exports where a cover sheet may have many
  // empty rows but few columns, while the data sheet is dense.
  let bestSheet = workbook.Sheets[workbook.SheetNames[0]];
  let bestScore = 0;
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1');
    const rows = range.e.r - range.s.r + 1;
    const cols = range.e.c - range.s.c + 1;
    const score = rows * cols; // area — data sheets tend to be wider too
    if (score > bestScore) {
      bestScore = score;
      bestSheet = sheet;
    }
  }

  return XLSX.utils.sheet_to_csv(bestSheet);
}

/** Returns the names of all sheets in a workbook — useful for debugging */
export function xlsxSheetNames(buffer: ArrayBuffer): string[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  return workbook.SheetNames;
}
