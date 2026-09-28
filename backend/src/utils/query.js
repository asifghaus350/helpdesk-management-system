// =========================
// LIST QUERY HELPERS
// =========================

const MAX_LIMIT = 100;

// Reads ?page=&limit= . Returns paginate:false when no page
// is given, so older callers that expect the full list keep
// working.
const parsePagination = (query, defaultLimit = 10) => {
  if (query.page === undefined) {
    return { paginate: false };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || defaultLimit)
  );

  return {
    paginate: true,
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const buildPagination = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

// Makes user input safe to use inside a RegExp
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Case-insensitive "contains" match for ?search=
const searchRegex = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return {
    $regex: escapeRegex(value.trim().slice(0, 100)),
    $options: "i",
  };
};

// Only accept a query value from a known list
const pickAllowed = (value, allowed) =>
  typeof value === "string" && allowed.includes(value)
    ? value
    : null;

// { A: 3, B: 1 } from an aggregation grouped by a field
const countsByKey = (rows, keys) =>
  Object.fromEntries(
    keys.map((key) => [
      key,
      rows.find((row) => row._id === key)?.count || 0,
    ])
  );

module.exports = {
  parsePagination,
  buildPagination,
  searchRegex,
  pickAllowed,
  countsByKey,
};
