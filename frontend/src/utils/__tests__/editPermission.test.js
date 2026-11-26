import { describe, expect, it } from "vitest";
import { canOpenEditPage } from "../auth";

// Mirrors the rules enforced by the backend on PUT /api/tickets/:id.
// The edit page calls this as soon as the ticket loads, before showing
// a form the user would not be allowed to save.

const admin = { id: "a1", role: "Admin" };
const engineer = { id: "e1", role: "Engineer" };
const otherEngineer = { id: "e2", role: "Engineer" };
const user = { id: "u1", role: "User" };

const unassigned = { _id: "t1", engineerId: null, engineer: "" };
const mine = { _id: "t2", engineerId: "e1", engineer: "Sara" };
const theirs = { _id: "t3", engineerId: "e2", engineer: "Ali" };

describe("canOpenEditPage", () => {
  it("lets an Admin open any ticket", () => {
    expect(canOpenEditPage(unassigned, admin)).toBe(true);
    expect(canOpenEditPage(theirs, admin)).toBe(true);
  });

  it("lets an Engineer open only tickets assigned to them", () => {
    expect(canOpenEditPage(mine, engineer)).toBe(true);
    expect(canOpenEditPage(theirs, engineer)).toBe(false);
    expect(canOpenEditPage(unassigned, engineer)).toBe(false);
  });

  it("never lets a plain User open the edit page", () => {
    expect(canOpenEditPage(mine, user)).toBe(false);
    expect(canOpenEditPage(unassigned, user)).toBe(false);
  });

  it("blocks missing tickets or users", () => {
    expect(canOpenEditPage(null, admin)).toBe(false);
    expect(canOpenEditPage(mine, null)).toBe(false);
    expect(canOpenEditPage(mine, undefined)).toBe(false);
  });

  it("matches by id even when engineerId is populated", () => {
    const populated = {
      _id: "t4",
      engineerId: { _id: "e1", name: "Sara" },
      engineer: "Sara",
    };

    expect(canOpenEditPage(populated, engineer)).toBe(true);
    expect(canOpenEditPage(populated, otherEngineer)).toBe(false);
  });
});
