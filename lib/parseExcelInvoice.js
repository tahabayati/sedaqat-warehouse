import * as XLSX from 'xlsx';

const BARCODE_COL = 25;
const QUANTITY_COL = 12;

export function parseExcelInvoice(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  return rows
    .filter(
      (r) =>
        typeof r[BARCODE_COL] === 'string' &&
        /^[1][0-9]{12}$/.test(r[BARCODE_COL])
    )
    .map((r) => ({
      barcode: r[BARCODE_COL].trim(),
      quantity: Number(r[QUANTITY_COL]) || 0,
    }));
}
