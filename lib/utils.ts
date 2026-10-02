import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors, voices } from "@/constants";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getSubjectsColor(subject: string) {
  return subjectsColors[subject as keyof typeof subjectsColors];
}

// Formats a number of seconds as m:ss (e.g. 125 -> "2:05").
export const formatClock = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Escapes LIKE wildcards so user input is matched literally.
const escapeLikeValue = (value: string) => value.replace(/[\\%_]/g, "\\$&");

// Builds a contains-style ILIKE pattern from raw user input.
export const toIlikePattern = (value: string) => `%${escapeLikeValue(value)}%`;

// Quotes a PostgREST filter value so commas, parentheses and dots in user
// input cannot break out of an `.or()` filter expression.
export const quoteFilterValue = (value: string) =>
  `"${value.replace(/[\\"]/g, "\\$&")}"`;

const FALLBACK_VOICE_ID = "sarah";

export const configureAssistant = (
  voice: string,
  style: string,
  duration?: number
) => {
  const voiceId =
    voices[voice as keyof typeof voices]?.[
      style as keyof (typeof voices)[keyof typeof voices]
    ] || FALLBACK_VOICE_ID;

  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    // Hard-stop the call at the companion's configured length.
    ...(duration && duration > 0
      ? { maxDurationSeconds: Math.max(10, Math.round(duration * 60)) }
      : {}),
    firstMessage:
      "Hello, let's start the session. Today we'll be talking about {{topic}}.", // {{topic}} is filled in from the call's variableValues
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 1,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a highly knowledgeable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.

                    Tutor Guidelines:
                    Stick to the given topic - {{ topic }} and subject - {{ subject }} and teach the student about it.
                    Keep the conversation flowing smoothly while maintaining control.
                    From time to time make sure that the student is following you and understands you.
                    Break down the topic into smaller parts and teach the student one part at a time.
                    Keep your style of conversation {{ style }}.
                    Keep your responses short, like in a real voice conversation.
                    Do not include any special characters in your responses - this is a voice conversation.
              `,
        },
      ],
    },

    // clientMessages: [],
    // serverMessages: [],
  };
  return vapiAssistant;
};
