import "server-only";
import OpenAI from "openai";

let client: OpenAI | null = null;

/** Lazily-constructed OpenAI client so importing this module doesn't blow up
 * builds/tests when OPENAI_API_KEY isn't set — it only throws once an AI
 * feature is actually invoked. */
export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/** Vision/document-capable model used for extraction. Override via env once
 * a newer model is available on your account. */
export const AI_EXTRACTION_MODEL = process.env.OPENAI_EXTRACTION_MODEL ?? "gpt-4o-2024-08-06";
