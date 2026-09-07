import type {
  ConversationDetail,
  ConversationSummary,
  Health,
  SendMessageResult,
  UploadedFile,
} from "./types";

/**
 * Requests go to the same origin by default and are proxied to FastAPI by the
 * rewrites in next.config.ts. Point NEXT_PUBLIC_API_BASE_URL straight at
 * uvicorn only if the dev proxy ever drops a long agent run — doing so requires
 * adding CORSMiddleware to backend/app/main.py, which currently has none.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** FastAPI errors are `{ "detail": ... }`; anything else falls back to status text. */
async function toApiError(res: Response): Promise<ApiError> {
  let detail = res.statusText || `Request failed with ${res.status}`;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") {
      detail = body.detail;
    } else if (Array.isArray(body?.detail)) {
      // FastAPI validation errors
      detail = body.detail
        .map((d: { msg?: string }) => d?.msg)
        .filter(Boolean)
        .join("; ");
    }
  } catch {
    // Non-JSON body (e.g. an unhandled 500 traceback page) — keep statusText.
  }
  return new ApiError(res.status, detail);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    // The dataset is local and mutable; never serve a cached conversation.
    cache: "no-store",
    ...init,
  });
  if (!res.ok) throw await toApiError(res);
  return res.json() as Promise<T>;
}

/* ---------------- GET /health ---------------- */

export function getHealth(signal?: AbortSignal) {
  return request<Health>("/health", { signal });
}

/* ---------------- /api/conversations ---------------- */

export function listConversations(signal?: AbortSignal) {
  return request<ConversationSummary[]>("/api/conversations", { signal });
}

/** POST /api/conversations takes no body. */
export function createConversation() {
  return request<ConversationSummary>("/api/conversations", { method: "POST" });
}

export function getConversation(id: string, signal?: AbortSignal) {
  return request<ConversationDetail>(`/api/conversations/${id}`, { signal });
}

/* ---------------- messages ---------------- */

/**
 * Blocking by design: backend/app/api/messages.py runs the LangGraph agent
 * synchronously inside the request, so this promise stays open for the whole
 * Ollama run — deliberately no timeout and no AbortSignal.
 */
export function sendMessage(
  conversationId: string,
  content: string,
  fileIds: string[] = []
) {
  return request<SendMessageResult>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, file_ids: fileIds }),
    }
  );
}

/* ---------------- files ---------------- */

/**
 * The form field name must be `uploaded_file` — it is the parameter name in
 * backend/app/api/files.py; anything else is a 422.
 */
export function uploadFile(file: File, signal?: AbortSignal) {
  const form = new FormData();
  form.append("uploaded_file", file);
  return request<UploadedFile>("/api/files/upload", {
    method: "POST",
    body: form,
    signal,
  });
}

/* ---------------- artifacts ---------------- */

/** Plain URL — the browser downloads it directly via an anchor. */
export function artifactDownloadUrl(artifactId: string) {
  return `${BASE}/api/artifacts/${artifactId}/download`;
}
