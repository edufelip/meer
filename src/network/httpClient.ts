import { API_BASE_URL, DEFAULT_TIMEOUT_MS } from "./config";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions<TBody> {
  path: string;
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

interface HttpErrorPayload {
  status: number;
  message?: string;
}

export class HttpError extends Error {
  status: number;

  constructor({ status, message }: HttpErrorPayload) {
    super(message ?? `Request failed with status ${status}`);
    this.status = status;
  }
}

export async function request<TResponse = unknown, TBody = unknown>(options: RequestOptions<TBody>): Promise<TResponse> {
  const { path, method = "GET", body, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const hasBody = body !== undefined && body !== null;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const hasContentTypeHeader = Object.keys(headers).some((key) => key.toLowerCase() === "content-type");
    const resolvedBody = !hasBody ? undefined : isFormData ? (body as any) : JSON.stringify(body);

    const resolvedHeaders: Record<string, string> = {
      Accept: "application/json",
      ...(hasBody && !isFormData && !hasContentTypeHeader ? { "Content-Type": "application/json" } : {}),
      ...headers
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: resolvedHeaders,
      body: resolvedBody,
      signal: controller.signal
    });

    if (!response.ok) {
      const message = await safeReadErrorMessage(response);
      throw new HttpError({ status: response.status, message });
    }

    if (response.status === 204) return undefined as TResponse;
    const json = (await response.json()) as TResponse;
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

async function safeReadErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const data = await response.json();
    if (typeof data?.message === "string") return data.message;
  } catch {
    // ignore parse errors
  }
  return undefined;
}
