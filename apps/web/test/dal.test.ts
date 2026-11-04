import { describe, expect, it, vi } from "vitest";

// Mock auth before importing dal
vi.mock("../auth", () => ({
  auth: vi.fn(),
}));

import { assertNotSelfModification, HttpError } from "../lib/dal";

describe("Data Access Layer Security Controls", () => {
  it("HttpError stores correct status code and message", () => {
    const err = new HttpError(403, "Forbidden resource");
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("Forbidden resource");
    expect(err.name).toBe("HttpError");
  });

  it("prevents self-modification of administrative privileges", () => {
    expect(() => {
      assertNotSelfModification("user_123", "user_123");
    }).toThrow(HttpError);

    expect(() => {
      assertNotSelfModification("user_123", "user_456");
    }).not.toThrow();
  });
});
