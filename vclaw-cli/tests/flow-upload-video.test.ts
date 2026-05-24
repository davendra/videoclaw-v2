import { describe, test, expect } from "bun:test";
import { UseApiClient } from "../src/backends/useapi/client";

describe("UseApiClient.uploadVideo", () => {
  test("uploadVideo is defined on the client", () => {
    const client = new UseApiClient({ apiToken: "t", accountEmail: "e@x.com" });
    expect(typeof client.uploadVideo).toBe("function");
  });
});
