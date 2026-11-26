// =========================
// CSV EXPORT HELPERS
// =========================
// Excel treats cells starting with = + - @ as formulas. A leading
// apostrophe forces them to be read as plain text. BOM keeps
// Hindi/Urdu text intact when the file is opened in Excel.

export const CSV_BOM = "\uFEFF";

export const escapeCsvCell = (value) => {
  let text = String(value ?? "");

  // OWASP also lists whitespace prefixes (tab, CR, LF, space) as
  // dangerous because Excel strips them before evaluating a formula.
  if (/^[\s=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

export const buildCsv = (header, rows) =>
  [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
