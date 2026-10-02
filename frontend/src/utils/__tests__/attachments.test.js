import { describe, expect, it } from "vitest";
import {
  ACCEPT,
  MAX_FILE_SIZE,
  MAX_FILES,
  formatBytes,
  isImage,
  isPdf,
  validateFiles,
} from "../attachments";

// validateFiles only reads name and size
const file = (name, size = 1024) => ({ name, size });

describe("validateFiles", () => {
  it("returns an empty string for valid files", () => {
    expect(validateFiles([file("a.png"), file("b.PDF"), file("c.docx")])).toBe("");
    expect(validateFiles([])).toBe("");
  });

  it("rejects too many files", () => {
    const six = Array.from({ length: 6 }, (_, i) => file(`f${i}.txt`));
    expect(validateFiles(six)).toBe("You can attach up to 5 files at a time.");
  });

  it("counts files that are already selected", () => {
    expect(validateFiles([file("a.png")], 4)).toBe("");
    expect(validateFiles([file("a.png"), file("b.png")], 4)).toBe(
      `You can attach up to ${MAX_FILES} files at a time.`
    );
  });

  it("rejects bad extensions", () => {
    expect(validateFiles([file("logo.svg")])).toBe(
      '"logo.svg" is not an allowed file type.'
    );
    expect(validateFiles([file("setup.exe")])).toBe(
      '"setup.exe" is not an allowed file type.'
    );
    expect(validateFiles([file("README")])).toBe(
      '"README" is not an allowed file type.'
    );
  });

  it("rejects files over 5 MB", () => {
    expect(validateFiles([file("big.pdf", MAX_FILE_SIZE + 1)])).toBe(
      '"big.pdf" is larger than 5 MB.'
    );
    expect(validateFiles([file("exact.pdf", MAX_FILE_SIZE)])).toBe("");
  });

  it("reports the first bad file", () => {
    expect(
      validateFiles([file("ok.png"), file("bad.zip"), file("big.pdf", MAX_FILE_SIZE * 2)])
    ).toBe('"bad.zip" is not an allowed file type.');
  });

  it("exposes the accept list for the file input", () => {
    expect(ACCEPT).toContain(".png");
    expect(ACCEPT).not.toContain(".svg");
  });
});

describe("formatBytes", () => {
  it("formats bytes, KB and MB", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes()).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("2 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
});

describe("isImage / isPdf", () => {
  it("detects images by MIME type", () => {
    expect(isImage("image/png")).toBe(true);
    expect(isImage("image/jpeg")).toBe(true);
    expect(isImage("application/pdf")).toBe(false);
    expect(isImage()).toBe(false);
  });

  it("detects PDFs by MIME type", () => {
    expect(isPdf("application/pdf")).toBe(true);
    expect(isPdf("image/png")).toBe(false);
    expect(isPdf()).toBe(false);
  });
});
