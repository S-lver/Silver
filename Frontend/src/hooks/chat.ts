export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  role: Role;
  content: string;
}

/** A message as rendered in the UI — richer than what we send to the API. */
export interface UIMessage {
  id: string;
  role: "user" | "bot";
  content: string;   // raw text (accumulates during streaming)
  html?: string;     // final sanitized markdown HTML (when done)
  streaming?: boolean;
  error?: boolean;
}