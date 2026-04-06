import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("courses.list", () => {
  it("returns courses list with pagination", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.courses.list({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("courses");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.courses)).toBe(true);
  }, 15000);

  it("filters by moduleType jupas", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.courses.list({ moduleType: "jupas", page: 1, pageSize: 5 });
    expect(result).toHaveProperty("courses");
    expect(Array.isArray(result.courses)).toBe(true);
  });
});

describe("courses.filterOptions", () => {
  it("returns distinct filter values", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.courses.filterOptions();
    expect(result).toHaveProperty("institutions");
    expect(result).toHaveProperty("degreeTypes");
  });
});
