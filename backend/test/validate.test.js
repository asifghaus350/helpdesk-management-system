const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  validateBody,
  validateObjectId,
  rules,
  required,
} = require("../src/middleware/validate");
const { mockRes, mockNext } = require("./helpers");

// Runs a validateBody middleware against a body
const run = (ruleSet, body) => {
  const res = mockRes();
  const next = mockNext();
  validateBody(ruleSet)({ body }, res, next);
  return { res, next };
};

// Asserts the request was rejected with a 400 for this field
const expectRejected = ({ res, next }, field, message) => {
  assert.equal(next.calls, 0);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.field, field);
  if (message) assert.equal(res.body.message, message);
};

const expectPassed = ({ res, next }) => {
  assert.equal(next.calls, 1);
  assert.equal(res.body, undefined);
};

describe("validateBody: required", () => {
  const ruleSet = { name: required(rules.name) };

  it("rejects a missing required field", () => {
    expectRejected(run(ruleSet, {}), "name", "Name is required.");
  });

  it("rejects null and blank strings", () => {
    expectRejected(run(ruleSet, { name: null }), "name", "Name is required.");
    expectRejected(run(ruleSet, { name: "   " }), "name", "Name is required.");
  });

  it("passes when present", () => {
    expectPassed(run(ruleSet, { name: "Asif" }));
  });

  it("skips optional fields that are missing", () => {
    expectPassed(run({ name: rules.name }, {}));
  });

  it("treats a missing body as empty", () => {
    expectRejected(run(ruleSet, undefined), "name");
    expectPassed(run({ name: rules.name }, undefined));
  });

  it("uses the field key when no label is given", () => {
    expectRejected(
      run({ nickname: { type: "string", required: true } }, {}),
      "nickname",
      "nickname is required."
    );
  });
});

describe("validateBody: string", () => {
  it("rejects numbers, booleans and arrays", () => {
    for (const value of [42, true, ["a"]]) {
      expectRejected(
        run({ name: rules.name }, { name: value }),
        "name",
        "Name must be text."
      );
    }
  });

  it("rejects operator objects like {$gt: \"\"}", () => {
    expectRejected(
      run({ email: required(rules.email) }, { email: { $gt: "" } }),
      "email",
      "Email must be text."
    );
    expectRejected(
      run({ password: rules.password }, { password: { $ne: null } }),
      "password",
      "Password must be text."
    );
  });

  it("enforces min length after trimming", () => {
    expectRejected(
      run({ password: rules.password }, { password: "  abc  " }),
      "password",
      "Password must be at least 6 characters."
    );
    expectPassed(run({ password: rules.password }, { password: "abcdef" }));
  });

  it("enforces max length", () => {
    expectRejected(
      run({ name: rules.name }, { name: "a".repeat(81) }),
      "name",
      "Name must be 80 characters or fewer."
    );
    expectPassed(run({ name: rules.name }, { name: "a".repeat(80) }));
  });

  it("allowEmpty lets an optional field be cleared with \"\"", () => {
    expectPassed(run({ department: rules.department }, { department: "" }));
    expectPassed(run({ department: rules.department }, { department: "  " }));
  });

  it("without allowEmpty, a blank optional field still fails length rules", () => {
    expectRejected(
      run({ password: rules.password }, { password: "" }),
      "password",
      "Password must be at least 6 characters."
    );
  });
});

describe("validateBody: email", () => {
  const ruleSet = { email: rules.email };

  it("accepts a valid email", () => {
    expectPassed(run(ruleSet, { email: "user@example.com" }));
    expectPassed(run(ruleSet, { email: "  user@example.com  " }));
  });

  it("rejects malformed emails", () => {
    for (const email of ["user", "user@", "user@example", "a b@c.com", "u@e.c"]) {
      expectRejected(
        run(ruleSet, { email }),
        "email",
        "Please enter a valid email address."
      );
    }
  });
});

describe("validateBody: enum", () => {
  const ruleSet = { role: rules.role };

  it("accepts allowed values", () => {
    for (const role of ["Admin", "Engineer", "User"]) {
      expectPassed(run(ruleSet, { role }));
    }
  });

  it("rejects other values, wrong case and objects", () => {
    for (const role of ["Owner", "admin", { $ne: "User" }, 1]) {
      expectRejected(
        run(ruleSet, { role }),
        "role",
        "Role must be one of: Admin, Engineer, User."
      );
    }
  });
});

describe("validateBody: boolean", () => {
  const ruleSet = { active: { label: "Active", type: "boolean" } };

  it("accepts true and false", () => {
    expectPassed(run(ruleSet, { active: true }));
    expectPassed(run(ruleSet, { active: false }));
  });

  it("rejects strings and numbers", () => {
    for (const active of ["true", 1, 0]) {
      expectRejected(
        run(ruleSet, { active }),
        "active",
        "Active must be true or false."
      );
    }
  });
});

describe("validateBody: phone", () => {
  const ruleSet = { phone: rules.phone };

  it("accepts common phone formats and empty", () => {
    for (const phone of ["+92 300 1234567", "(555) 123-4567", "123456", ""]) {
      expectPassed(run(ruleSet, { phone }));
    }
  });

  it("rejects letters, too short and too long", () => {
    for (const phone of ["call me", "12345", "1".repeat(21)]) {
      expectRejected(
        run(ruleSet, { phone }),
        "phone",
        "Please enter a valid phone number."
      );
    }
  });

  it("rejects a numeric phone value", () => {
    expectRejected(run(ruleSet, { phone: 3001234567 }), "phone", "Phone must be text.");
  });
});

describe("validateBody: multiple fields", () => {
  it("reports the first failing field", () => {
    const ruleSet = {
      title: required(rules.title),
      priority: required(rules.priority),
    };

    expectRejected(run(ruleSet, { title: "Broken" }), "priority", "Priority is required.");
    expectPassed(run(ruleSet, { title: "Broken", priority: "High" }));
  });
});

describe("validateObjectId", () => {
  const check = (params, param) => {
    const res = mockRes();
    const next = mockNext();
    validateObjectId(param)({ params }, res, next);
    return { res, next };
  };

  it("passes a valid ObjectId", () => {
    const { res, next } = check({ id: "507f1f77bcf86cd799439011" });
    assert.equal(next.calls, 1);
    assert.equal(res.body, undefined);
  });

  it("rejects invalid ids with 400", () => {
    for (const id of ["123", "not-an-id", "507f1f77bcf86cd79943901z", undefined]) {
      const { res, next } = check({ id });
      assert.equal(next.calls, 0);
      assert.equal(res.statusCode, 400);
      assert.deepEqual(res.body, { success: false, message: "Invalid ID format" });
    }
  });

  it("checks a custom param name", () => {
    assert.equal(check({ ticketId: "507f1f77bcf86cd799439011" }, "ticketId").next.calls, 1);
    assert.equal(check({ ticketId: "bad" }, "ticketId").res.statusCode, 400);
  });
});
