"use client";

/**
 * Carries the very first message of a new conversation from the landing page
 * to the thread page.
 *
 * The backend has no draft state: a conversation must exist before a message
 * can be posted, and posting blocks for the entire agent run. Waiting for that
 * run on the landing page would leave the user on a static screen for minutes,
 * so the conversation is created, the handoff is stashed, and the thread page
 * starts the run itself — where the optimistic bubble and the elapsed clock
 * are already in place.
 *
 * A module-level map is enough: client-side navigation keeps the same JS
 * context, and the value is consumed on the thread page's first effect.
 */
const handoffs = new Map<string, { content: string; fileIds: string[] }>();

export function setHandoff(
  conversationId: string,
  payload: { content: string; fileIds: string[] }
) {
  handoffs.set(conversationId, payload);
}

/** Reads and removes in one step, so a double-invoked effect cannot resend. */
export function takeHandoff(conversationId: string) {
  const payload = handoffs.get(conversationId);
  handoffs.delete(conversationId);
  return payload;
}
