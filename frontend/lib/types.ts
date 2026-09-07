/**
 * Types mirror the FastAPI responses in backend/app/api/ exactly.
 * Nothing here is aspirational — if a field is not returned by the backend,
 * it does not appear below.
 */

export type Role = "user" | "assistant";

/** GET /health */
export interface Health {
  status: string;
  service: string;
}

/** POST /api/conversations, and each item of GET /api/conversations */
export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

/** messages[] of GET /api/conversations/{id} */
export interface ApiMessage {
  id: string;
  role: Role;
  content: string;
  created_at: string;
  file_ids: string[];
}

/** artifacts[] of GET /api/conversations/{id} */
export interface ApiArtifact {
  id: string;
  filename: string;
  file_type: string | null;
  created_at: string;
}

/** GET /api/conversations/{id} */
export interface ConversationDetail extends ConversationSummary {
  messages: ApiMessage[];
  artifacts: ApiArtifact[];
}

/** POST /api/conversations/{id}/messages */
export interface SendMessageResult {
  message_id: string;
  run_id: string;
  response: string;
  artifact_ids: string[];
  status: string;
}

/** POST /api/files/upload */
export interface UploadedFile {
  id: string;
  original_filename: string;
  mime_type: string | null;
  size: number | null;
}

/**
 * A message as rendered. Server messages are ApiMessage; a message still
 * in flight (or one whose agent run failed) exists only on the client.
 */
export interface ThreadMessage {
  id: string;
  role: Role;
  content: string;
  created_at: string;
  file_ids: string[];
  /** Set while the agent run for this turn is in flight. */
  pending?: boolean;
  /** Set when POST /messages returned non-2xx for this turn. */
  error?: string;
  /** artifact_ids from this turn's POST response; session-only. */
  artifactIds?: string[];
}
