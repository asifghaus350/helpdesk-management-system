const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  fileFilter,
  ALLOWED,
  MAX_FILE_SIZE,
  MAX_FILES,
} = require("../src/middleware/uploadMiddleware");

// Calls the multer fileFilter and returns what it reported
const filter = (originalname, mimetype) => {
  let result;
  fileFilter({}, { originalname, mimetype }, (error, accepted) => {
    result = { error, accepted };
  });
  return result;
};

const expectAllowed = (name, mime) => {
  const { error, accepted } = filter(name, mime);
  assert.equal(error, null, `${name} (${mime}) should be allowed`);
  assert.equal(accepted, true);
};

const expectBlocked = (name, mime) => {
  const { error } = filter(name, mime);
  assert.ok(error instanceof Error, `${name} (${mime}) should be blocked`);
  assert.equal(error.status, 400);
  assert.match(error.message, /is not an allowed file type/);
  assert.ok(error.message.includes(name));
};

describe("upload limits", () => {
  it("are 5 MB and 5 files", () => {
    assert.equal(MAX_FILE_SIZE, 5 * 1024 * 1024);
    assert.equal(MAX_FILES, 5);
  });
});

describe("fileFilter", () => {
  it("allows every listed extension + MIME pair", () => {
    for (const [extension, types] of Object.entries(ALLOWED)) {
      for (const mime of types) {
        expectAllowed(`file${extension}`, mime);
      }
    }
  });

  it("is case-insensitive on the extension", () => {
    expectAllowed("PHOTO.PNG", "image/png");
    expectAllowed("Report.Pdf", "application/pdf");
  });

  it("blocks SVG and HTML", () => {
    expectBlocked("logo.svg", "image/svg+xml");
    expectBlocked("page.html", "text/html");
  });

  it("blocks a mismatched MIME type", () => {
    expectBlocked("x.png", "text/html");
    expectBlocked("x.pdf", "image/png");
    expectBlocked("x.jpg", "image/png");
  });

  it("blocks unknown extensions and files without one", () => {
    expectBlocked("setup.exe", "application/octet-stream");
    expectBlocked("script.js", "text/javascript");
    expectBlocked("README", "text/plain");
    expectBlocked("archive.zip", "application/zip");
  });

  it("only looks at the last extension", () => {
    expectBlocked("photo.png.exe", "image/png");
    expectAllowed("notes.exe.txt", "text/plain");
  });
});

// ---------- file signatures ----------
const { contentMatchesType } = require("../src/middleware/uploadMiddleware");

describe("contentMatchesType", () => {
  it("accepts files whose bytes match their type", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    const pdf = Buffer.from("%PDF-1.7");
    assert.equal(contentMatchesType({ mimetype: "image/png", buffer: png }), true);
    assert.equal(contentMatchesType({ mimetype: "application/pdf", buffer: pdf }), true);
  });

  it("rejects a script renamed to .png", () => {
    const html = Buffer.from("<script>alert(1)</script>");
    assert.equal(contentMatchesType({ mimetype: "image/png", buffer: html }), false);
  });

  it("lets plain text types through (no signature)", () => {
    assert.equal(contentMatchesType({ mimetype: "text/plain", buffer: Buffer.from("hello") }), true);
  });
});
