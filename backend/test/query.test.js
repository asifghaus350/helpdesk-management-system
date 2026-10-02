const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  parsePagination,
  buildPagination,
  searchRegex,
  pickAllowed,
  countsByKey,
} = require("../src/utils/query");

describe("parsePagination", () => {
  it("returns paginate:false when no page is given", () => {
    assert.deepEqual(parsePagination({}), { paginate: false });
    assert.deepEqual(parsePagination({ limit: "20" }), { paginate: false });
  });

  it("uses the default limit", () => {
    assert.deepEqual(parsePagination({ page: "1" }), {
      paginate: true,
      page: 1,
      limit: 10,
      skip: 0,
    });
    assert.equal(parsePagination({ page: "1" }, 25).limit, 25);
  });

  it("computes skip from page and limit", () => {
    assert.deepEqual(parsePagination({ page: "3", limit: "20" }), {
      paginate: true,
      page: 3,
      limit: 20,
      skip: 40,
    });
  });

  it("caps the limit at 100", () => {
    assert.equal(parsePagination({ page: "1", limit: "5000" }).limit, 100);
  });

  it("falls back for bad or too-small values", () => {
    const result = parsePagination({ page: "abc", limit: "xyz" });
    assert.equal(result.page, 1);
    assert.equal(result.limit, 10);

    assert.equal(parsePagination({ page: "-4" }).page, 1);
    assert.equal(parsePagination({ page: "1", limit: "-5" }).limit, 1);
    // 0 is falsy, so it falls back to the default
    assert.equal(parsePagination({ page: "0", limit: "0" }).page, 1);
    assert.equal(parsePagination({ page: "0", limit: "0" }).limit, 10);
  });
});

describe("buildPagination", () => {
  it("computes totalPages", () => {
    assert.deepEqual(buildPagination({ page: 2, limit: 10 }, 25), {
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
    assert.equal(buildPagination({ page: 1, limit: 10 }, 30).totalPages, 3);
  });

  it("reports at least one page when empty", () => {
    assert.equal(buildPagination({ page: 1, limit: 10 }, 0).totalPages, 1);
  });
});

describe("searchRegex", () => {
  it("returns null for empty or non-string input", () => {
    assert.equal(searchRegex(""), null);
    assert.equal(searchRegex("   "), null);
    assert.equal(searchRegex(undefined), null);
    assert.equal(searchRegex({ $ne: "" }), null);
    assert.equal(searchRegex(["a"]), null);
  });

  it("trims and makes a case-insensitive match", () => {
    assert.deepEqual(searchRegex("  printer  "), {
      $regex: "printer",
      $options: "i",
    });
  });

  it("escapes regex special characters", () => {
    const special = ".*+?^${}()|[]\\";
    const { $regex } = searchRegex(special);

    assert.equal($regex, "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");

    // The escaped pattern matches the literal text only
    const pattern = new RegExp($regex, "i");
    assert.ok(pattern.test(`abc ${special} xyz`));
    assert.ok(!pattern.test("abc"));
    assert.ok(new RegExp(searchRegex("a.b").$regex).test("a.b"));
    assert.ok(!new RegExp(searchRegex("a.b").$regex).test("axb"));
  });

  it("caps the search at 100 characters", () => {
    assert.equal(searchRegex("x".repeat(250)).$regex.length, 100);
  });
});

describe("pickAllowed", () => {
  const allowed = ["Open", "Closed"];

  it("returns allowed values", () => {
    assert.equal(pickAllowed("Open", allowed), "Open");
  });

  it("returns null for unknown or non-string values", () => {
    assert.equal(pickAllowed("open", allowed), null);
    assert.equal(pickAllowed(undefined, allowed), null);
    assert.equal(pickAllowed(["Open"], allowed), null);
    assert.equal(pickAllowed({ $ne: "Open" }, allowed), null);
  });
});

describe("countsByKey", () => {
  it("maps aggregation rows and fills missing keys with 0", () => {
    const rows = [
      { _id: "High", count: 3 },
      { _id: "Low", count: 1 },
      { _id: "Unknown", count: 9 },
    ];

    assert.deepEqual(countsByKey(rows, ["High", "Medium", "Low"]), {
      High: 3,
      Medium: 0,
      Low: 1,
    });
  });

  it("returns zeros for no rows", () => {
    assert.deepEqual(countsByKey([], ["A", "B"]), { A: 0, B: 0 });
  });
});
