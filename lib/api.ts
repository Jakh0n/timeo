const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type ApiOptions = Omit<RequestInit, "body" | "credentials"> & {
  body?: unknown;
};

function resolveApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export async function api<TResponse>(
  path: string,
  options: ApiOptions = {},
): Promise<TResponse> {
  const { body, headers, ...rest } = options;
  const hasBody = body !== undefined;

  const response = await fetch(resolveApiUrl(path), {
    ...rest,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = response.statusText || "Request failed";

    try {
      const payload: unknown = await response.json();
      if (
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
      ) {
        message = payload.message;
      }
    } catch {
      // Response body is not JSON.
    }

    throw new ApiError(response.status, message);
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
