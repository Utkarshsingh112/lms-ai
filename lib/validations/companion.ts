import { z } from "zod";

import { subjects, voices } from "@/constants";

const voiceKeys = Object.keys(voices);
const styleKeys = Array.from(
  new Set(Object.values(voices).flatMap((styles) => Object.keys(styles)))
);

export const companionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Companion name is required." })
    .max(100, { message: "Companion name must be 100 characters or fewer." }),
  subject: z
    .string()
    .min(1, { message: "Subject is required." })
    .refine((value) => subjects.includes(value), {
      message: "Choose a valid subject.",
    }),
  topic: z
    .string()
    .trim()
    .min(1, { message: "Topic is required." })
    .max(300, { message: "Topic must be 300 characters or fewer." }),
  voice: z
    .string()
    .min(1, { message: "Voice is required." })
    .refine((value) => voiceKeys.includes(value), {
      message: "Choose a valid voice.",
    }),
  style: z
    .string()
    .min(1, { message: "Style is required." })
    .refine((value) => styleKeys.includes(value), {
      message: "Choose a valid style.",
    }),
  duration: z.coerce
    .number()
    .int({ message: "Duration must be a whole number." })
    .min(1, { message: "Duration is required." })
    .max(120, { message: "Duration must be 120 minutes or fewer." }),
});

export type CompanionFormValues = z.infer<typeof companionFormSchema>;
