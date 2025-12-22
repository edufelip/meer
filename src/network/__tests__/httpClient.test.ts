import { ensureDebugApiBaseUrlLoaded, getApiBaseUrlSync } from "../apiBaseUrl";
import { HttpError, request } from "../httpClient";

jest.mock("../apiBaseUrl", () => ({
  ensureDebugApiBaseUrlLoaded: jest.fn().mockResolvedValue(undefined),
  getApiBaseUrlSync: jest.fn().mockReturnValue("https://api.example.com")
}));

class FakeFormData {}

describe("httpClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (global as any).FormData = FakeFormData;

    (global as any).AbortController = class {
      signal = { aborted: false } as any;
      abort() {
        this.signal.aborted = true;
      }
    };

    (global as any).fetch = jest.fn();
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.example.com";
  });

  it("sends JSON by default and sets content type", async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true })
    });

    const result = await request({ path: "/ping", method: "POST", body: { hello: "world" } });

    expect(result).toEqual({ ok: true });
    expect(ensureDebugApiBaseUrlLoaded).toHaveBeenCalledTimes(1);
    expect(getApiBaseUrlSync).toHaveBeenCalledTimes(1);
    expect((global as any).fetch).toHaveBeenCalledWith(
      "https://api.example.com/ping",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({ hello: "world" })
      })
    );
  });

  it("respects provided content type", async () => {
    (global as any).fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    await request({
      path: "/upload",
      method: "POST",
      body: { raw: true },
      headers: { "Content-Type": "application/custom" }
    });

    const call = (global as any).fetch.mock.calls[0][1];
    expect(call.headers["Content-Type"]).toBe("application/custom");
  });

  it("handles FormData without JSON serialization", async () => {
    (global as any).fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    const form = new FakeFormData();
    await request({ path: "/form", method: "POST", body: form as any });

    const call = (global as any).fetch.mock.calls[0][1];
    expect(call.body).toBe(form);
    expect(call.headers["Content-Type"]).toBeUndefined();
  });

  it("returns undefined on 204", async () => {
    (global as any).fetch.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });

    const result = await request({ path: "/empty" });

    expect(result).toBeUndefined();
  });

  it("throws HttpError with response message", async () => {
    (global as any).fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Bad" })
    });

    await expect(request({ path: "/bad" })).rejects.toBeInstanceOf(HttpError);
    await expect(request({ path: "/bad" })).rejects.toMatchObject({ status: 400, message: "Bad" });
  });

  it("throws HttpError with default message when response JSON fails", async () => {
    (global as any).fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("invalid json");
      }
    });

    await expect(request({ path: "/error" })).rejects.toMatchObject({ status: 500 });
  });
});
