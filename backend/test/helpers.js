// =========================
// TEST HELPERS
// =========================
// Tiny stand-ins for Express req/res/next so middleware can be
// tested without a server.

const mockRes = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

// next() spy that records how many times it was called
const mockNext = () => {
  const next = () => {
    next.calls += 1;
  };
  next.calls = 0;
  return next;
};

module.exports = { mockRes, mockNext };
