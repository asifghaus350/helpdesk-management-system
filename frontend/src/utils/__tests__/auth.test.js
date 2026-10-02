import { beforeEach, describe, expect, it } from "vitest";
import {
  canAssignToSelf,
  canDeleteTicket,
  canEditTicket,
  getStoredUser,
  isAssignedToUser,
  isTokenExpired,
  isUnassignedTicket,
} from "../auth";

// Minimal in-memory localStorage (tests run in the node environment)
const memoryStorage = () => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

globalThis.localStorage = memoryStorage();

// Builds an unsigned JWT with a base64url payload
const base64Url = (value) =>
  btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const makeToken = (payload) =>
  `${base64Url({ alg: "HS256", typ: "JWT" })}.${base64Url(payload)}.signature`;

const nowSeconds = () => Math.floor(Date.now() / 1000);

describe("isTokenExpired", () => {
  it("is false for a token that expires later", () => {
    expect(isTokenExpired(makeToken({ id: "1", exp: nowSeconds() + 3600 }))).toBe(false);
  });

  it("is true for an expired token", () => {
    expect(isTokenExpired(makeToken({ id: "1", exp: nowSeconds() - 10 }))).toBe(true);
  });

  it("is true when there is no exp claim", () => {
    expect(isTokenExpired(makeToken({ id: "1" }))).toBe(true);
  });

  it("is true for malformed tokens", () => {
    expect(isTokenExpired("not-a-token")).toBe(true);
    expect(isTokenExpired("a.%%%.c")).toBe(true);
    expect(isTokenExpired(`a.${btoa("not json")}.c`)).toBe(true);
    expect(isTokenExpired("")).toBe(true);
    expect(isTokenExpired(null)).toBe(true);
    expect(isTokenExpired(undefined)).toBe(true);
  });

  it("decodes base64url payloads with - and _", () => {
    // "~~~" / "???" force + and / in plain base64
    const token = makeToken({ note: "~~~???>>>", exp: nowSeconds() + 3600 });
    expect(token.split(".")[1]).toMatch(/[-_]/);
    expect(isTokenExpired(token)).toBe(false);
  });
});

describe("getStoredUser", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null with nothing stored or bad JSON", () => {
    expect(getStoredUser()).toBe(null);
    localStorage.setItem("user", "{broken");
    expect(getStoredUser()).toBe(null);
  });

  it("merges the separately stored photo", () => {
    localStorage.setItem("user", JSON.stringify({ name: "Asif" }));
    expect(getStoredUser()).toEqual({ name: "Asif", profilePhoto: "" });

    localStorage.setItem("userPhoto", "data:image/png;base64,abc");
    expect(getStoredUser().profilePhoto).toBe("data:image/png;base64,abc");
  });
});

const admin = { id: "a1", name: "Admin Person", role: "Admin" };
const engineer = { id: "e1", name: "Sara Khan", role: "Engineer" };
const otherEngineer = { id: "e2", name: "Ali Raza", role: "Engineer" };
const user = { id: "u1", name: "Plain User", role: "User" };

const unassigned = { _id: "t1", engineerId: null, engineer: "" };
const assignedById = { _id: "t2", engineerId: "e1", engineer: "Sara Khan" };
const assignedByPopulatedId = { _id: "t3", engineerId: { _id: "e1", name: "Sara Khan" } };
const assignedByLegacyName = { _id: "t4", engineer: "  sara khan " };

describe("isUnassignedTicket", () => {
  it("is true with no engineer", () => {
    expect(isUnassignedTicket(unassigned)).toBe(true);
    expect(isUnassignedTicket({})).toBe(true);
    expect(isUnassignedTicket(null)).toBe(true);
  });

  it("is false when assigned by id or legacy name", () => {
    expect(isUnassignedTicket(assignedById)).toBe(false);
    expect(isUnassignedTicket(assignedByLegacyName)).toBe(false);
  });
});

describe("isAssignedToUser", () => {
  it("matches by engineerId (string or populated)", () => {
    expect(isAssignedToUser(assignedById, engineer)).toBe(true);
    expect(isAssignedToUser(assignedByPopulatedId, engineer)).toBe(true);
    expect(isAssignedToUser(assignedById, otherEngineer)).toBe(false);
  });

  it("accepts users with _id instead of id", () => {
    expect(isAssignedToUser(assignedById, { _id: "e1", role: "Engineer" })).toBe(true);
  });

  it("prefers engineerId over the legacy name", () => {
    const ticket = { engineerId: "e2", engineer: "Sara Khan" };
    expect(isAssignedToUser(ticket, engineer)).toBe(false);
  });

  it("matches the legacy name ignoring case and spaces", () => {
    expect(isAssignedToUser(assignedByLegacyName, engineer)).toBe(true);
    expect(isAssignedToUser(assignedByLegacyName, otherEngineer)).toBe(false);
  });

  it("is false for missing ticket, user or engineer", () => {
    expect(isAssignedToUser(null, engineer)).toBe(false);
    expect(isAssignedToUser(assignedById, null)).toBe(false);
    expect(isAssignedToUser(unassigned, engineer)).toBe(false);
    expect(isAssignedToUser(unassigned, { id: "x" })).toBe(false);
  });
});

describe("canEditTicket", () => {
  it("lets an Admin edit any ticket", () => {
    expect(canEditTicket(unassigned, admin)).toBe(true);
    expect(canEditTicket(assignedById, admin)).toBe(true);
  });

  it("lets the assigned Engineer edit", () => {
    expect(canEditTicket(assignedById, engineer)).toBe(true);
    expect(canEditTicket(assignedByLegacyName, engineer)).toBe(true);
  });

  it("blocks other Engineers and unassigned tickets", () => {
    expect(canEditTicket(assignedById, otherEngineer)).toBe(false);
    expect(canEditTicket(unassigned, engineer)).toBe(false);
  });

  it("blocks Users and logged-out visitors", () => {
    expect(canEditTicket(assignedById, user)).toBe(false);
    expect(canEditTicket(assignedById, null)).toBe(false);
  });
});

describe("canDeleteTicket", () => {
  it("is Admin only", () => {
    expect(canDeleteTicket(admin)).toBe(true);
    expect(canDeleteTicket(engineer)).toBe(false);
    expect(canDeleteTicket(user)).toBe(false);
    expect(canDeleteTicket(null)).toBe(false);
  });
});

describe("canAssignToSelf", () => {
  it("lets Engineers pick up unassigned tickets only", () => {
    expect(canAssignToSelf(unassigned, engineer)).toBe(true);
    expect(canAssignToSelf(assignedById, engineer)).toBe(false);
    expect(canAssignToSelf(assignedById, otherEngineer)).toBe(false);
  });

  it("is false for Admins and Users", () => {
    expect(canAssignToSelf(unassigned, admin)).toBe(false);
    expect(canAssignToSelf(unassigned, user)).toBe(false);
    expect(canAssignToSelf(unassigned, null)).toBe(false);
  });
});
