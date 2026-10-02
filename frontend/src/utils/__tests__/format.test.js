import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDuration, initials, timeAgo } from "../format";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("timeAgo", () => {
  const now = new Date("2026-06-15T12:00:00Z").getTime();

  // Freeze the clock so the buckets are exact
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const ago = (ms) => timeAgo(new Date(now - ms).toISOString());

  it("returns a dash for falsy values", () => {
    expect(timeAgo(null)).toBe("—");
    expect(timeAgo(undefined)).toBe("—");
    expect(timeAgo("")).toBe("—");
  });

  it("says Just now under a minute", () => {
    expect(ago(0)).toBe("Just now");
    expect(ago(59 * SECOND)).toBe("Just now");
  });

  it("counts minutes", () => {
    expect(ago(MINUTE)).toBe("1m ago");
    expect(ago(59 * MINUTE)).toBe("59m ago");
  });

  it("counts hours", () => {
    expect(ago(HOUR)).toBe("1h ago");
    expect(ago(23 * HOUR + 59 * MINUTE)).toBe("23h ago");
  });

  it("counts days", () => {
    expect(ago(DAY)).toBe("1d ago");
    expect(ago(29 * DAY)).toBe("29d ago");
  });

  it("shows a date after 30 days", () => {
    const date = new Date(now - 45 * DAY);
    expect(timeAgo(date)).toBe(date.toLocaleDateString());
  });

  it("accepts Date objects and timestamps", () => {
    expect(timeAgo(new Date(now - 5 * MINUTE))).toBe("5m ago");
    expect(timeAgo(now - 2 * HOUR)).toBe("2h ago");
  });
});

describe("initials", () => {
  it("takes the first letters of the first two words", () => {
    expect(initials("Asif Ghaus")).toBe("AG");
    expect(initials("mary jane watson")).toBe("MJ");
  });

  it("handles one word and extra spaces", () => {
    expect(initials("asif")).toBe("A");
    expect(initials("  Asif   Ghaus  ")).toBe("AG");
  });

  it("falls back to ? for empty names", () => {
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
    expect(initials()).toBe("?");
  });
});

describe("formatDuration", () => {
  it("returns a dash for null and NaN", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(NaN)).toBe("—");
    expect(formatDuration(undefined)).toBe("—");
  });

  it("shows minutes under an hour (at least 1 min)", () => {
    expect(formatDuration(0)).toBe("1 min");
    expect(formatDuration(10 * SECOND)).toBe("1 min");
    expect(formatDuration(45 * MINUTE)).toBe("45 min");
  });

  it("shows hours under 48 h", () => {
    expect(formatDuration(HOUR)).toBe("1.0 h");
    expect(formatDuration(5.5 * HOUR)).toBe("5.5 h");
    expect(formatDuration(12 * HOUR)).toBe("12 h");
    expect(formatDuration(47 * HOUR)).toBe("47 h");
  });

  it("shows days from 48 h", () => {
    expect(formatDuration(48 * HOUR)).toBe("2.0 days");
    expect(formatDuration(2.3 * DAY)).toBe("2.3 days");
    expect(formatDuration(15 * DAY)).toBe("15 days");
  });
});
