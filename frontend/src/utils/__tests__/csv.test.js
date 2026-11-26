import { describe, expect, it } from "vitest";
import { buildCsv, CSV_BOM, escapeCsvCell } from "../csv";

describe("escapeCsvCell (Excel formula injection)", () => {
  it("prefixes formula-leading cells with an apostrophe", () => {
    expect(escapeCsvCell('=HYPERLINK("http://evil")')).toBe(
      '"\'=HYPERLINK(""http://evil"")"'
    );
    expect(escapeCsvCell("+SUM(A1:A2)")).toBe('"\'+SUM(A1:A2)"');
    expect(escapeCsvCell("-1+1")).toBe('"\'-1+1"');
    expect(escapeCsvCell("@SUM(A1)")).toBe('"\'@SUM(A1)"');
  });

  it("also guards whitespace-prefixed formulas", () => {
    expect(escapeCsvCell("\t=HYPERLINK(\"http://evil\")")).toBe(
      '"\'\t=HYPERLINK(""http://evil"")"'
    );
    expect(escapeCsvCell("\r\n=1+1")).toBe('"\'\r\n=1+1"');
    expect(escapeCsvCell(" =1+1")).toBe('"\' =1+1"');
  });

  it("leaves ordinary values alone", () => {
    expect(escapeCsvCell("Printer not working")).toBe(
      '"Printer not working"'
    );
    expect(escapeCsvCell("Ticket TKT-1001")).toBe(
      '"Ticket TKT-1001"'
    );
    expect(escapeCsvCell("")).toBe('""');
    expect(escapeCsvCell(null)).toBe('""');
  });

  it("doubles embedded quotes", () => {
    expect(escapeCsvCell('He said "hello"')).toBe(
      '"He said ""hello"""'
    );
  });
});

describe("buildCsv", () => {
  it("keeps Hindi / Urdu text and BOM intact", () => {
    const csv = buildCsv(
      ["Ticket ID", "Title"],
      [["TKT-1", "打印机 صارف کا مسئلہ"]]
    );

    expect(csv).toContain("打印机 صارف کا مسئلہ");
    expect(CSV_BOM).toBe("\uFEFF");
  });

  it("writes one quoted cell per column and one line per row", () => {
    const csv = buildCsv(
      ["A", "B"],
      [
        ["=1+1", "x"],
        ["y", "z"],
      ]
    );

    expect(csv.split("\n")).toHaveLength(3);
    expect(csv.split("\n")[1]).toBe('"\'=1+1","x"');
  });
});
