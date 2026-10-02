import { z } from "zod";
// The Anthropic SDK's structured-output helper is typed against zod v4, which
// zod 3.25 ships under this subpath.
import { z as z4 } from "zod/v4";

export const MAX_RECAP_MESSAGES = 200;
export const MAX_RECAP_MESSAGE_LENGTH = 2000;
export const MIN_RECAP_MESSAGES = 2;

export const recapInputSchema = z.object({
  companionId: z.string().min(1).max(100),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(MAX_RECAP_MESSAGE_LENGTH),
      })
    )
    .max(MAX_RECAP_MESSAGES),
});

// Shape the model is asked to return. Kept free of min/max constraints so it
// stays valid for structured outputs; `recapSchema` below enforces the limits.
export const recapOutputSchema = z4.object({
  summary: z4.string(),
  key_points: z4.array(z4.string()),
  quiz: z4.array(
    z4.object({
      question: z4.string(),
      options: z4.array(z4.string()),
      answer_index: z4.number().int(),
      explanation: z4.string(),
    })
  ),
});

export const recapSchema = z.object({
  summary: z.string().min(1).max(1200),
  key_points: z.array(z.string().min(1).max(300)).min(1).max(6),
  quiz: z
    .array(
      z
        .object({
          question: z.string().min(1).max(400),
          options: z.array(z.string().min(1).max(200)).length(4),
          answer_index: z.number().int().min(0).max(3),
          explanation: z.string().min(1).max(500),
        })
    )
    .min(1)
    .max(5),
});

export type SessionRecap = z.infer<typeof recapSchema>;
export type RecapInput = z.infer<typeof recapInputSchema>;

export type RecapResult =
  | { status: "ok"; recap: SessionRecap; saved: boolean }
  | {
      status: "too_short" | "unavailable" | "error";
      message: string;
    };
